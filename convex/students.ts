import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  validateStudentProfile,
  type StudentProfileInput,
} from "../src/lib/studentProfile";
import { recruiterProjection } from "../src/lib/visibility";

/**
 * Perfil do aluno/egresso (issues [S1-3]/[S1-4], R1/R2/R6).
 * Toda mutação exige consentimento vigente (R7, issue [S1-2]) — checado no
 * servidor via `requireActiveConsent`, não apenas na UI.
 */

function toProfileArgs(raw: {
  fullName: string;
  enrollment: string;
  status: "ativo" | "egresso" | "inativo";
  course: string;
  graduationYear: number;
  semester?: number;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  availability: "estagio" | "integral" | "meio_periodo" | "freelancer";
}): StudentProfileInput {
  return {
    fullName: raw.fullName,
    enrollment: raw.enrollment,
    status: raw.status,
    course: raw.course,
    graduationYear: raw.graduationYear,
    semester: raw.semester,
    location: raw.location,
    linkedinUrl: raw.linkedinUrl,
    portfolioUrl: raw.portfolioUrl,
    availability: raw.availability,
  };
}

/** Perfil do aluno autenticado (ou null). */
export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;
    const email = identity.email ?? identity.tokenIdentifier;
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (user === null) return null;
    return (
      (await ctx.db
        .query("students")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique()) ?? null
    );
  },
});

/**
 * Upsert do perfil completo do aluno autenticado (CA 1 de [S1-3]).
 * Valida no servidor (mesma regra pura do formulário) e garante matrícula
 * única (CA 2 de [S1-3]). Preserva `visibility`/`showContactToRecruiters`
 * (S1-4) — essas flags têm mutation própria.
 */
export const upsertProfile = mutation({
  args: {
    fullName: v.string(),
    enrollment: v.string(),
    status: v.union(
      v.literal("ativo"),
      v.literal("egresso"),
      v.literal("inativo"),
    ),
    course: v.string(),
    graduationYear: v.number(),
    semester: v.optional(v.number()),
    location: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
    availability: v.union(
      v.literal("estagio"),
      v.literal("integral"),
      v.literal("meio_periodo"),
      v.literal("freelancer"),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ studentId: Id<"students">; created: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Não autenticado.");
    }
    const email = identity.email ?? identity.tokenIdentifier;

    // R7 — uso do portal bloqueado sem aceite vigente do termo LGPD.
    const consent = (await ctx.runQuery(
      internal.consents.requireActiveConsent,
      { email },
    )) as {
      ok: boolean;
      reason?: string;
      userId?: Id<"users">;
      role?: string | null;
    };
    if (!consent.ok || consent.userId === undefined) {
      throw new Error(
        consent.reason === "usuario_inexistente"
          ? "Usuário não encontrado."
          : "Aceite o Termo de Consentimento LGPD vigente para continuar.",
      );
    }
    const studentUserId = consent.userId;

    // Papel: apenas alunos editam o próprio perfil (gestor usa outra rota).
    if (consent.role !== "aluno") {
      throw new Error("Apenas alunos podem editar o perfil de estudante.");
    }

    const validation = validateStudentProfile(toProfileArgs(args));
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }
    const profile = validation.normalized;

    // CA 2 — matrícula única: mesma matrícula em outro usuário bloqueia.
    const enrollmentOwner = await ctx.db
      .query("students")
      .withIndex("by_enrollment", (q) => q.eq("enrollment", profile.enrollment))
      .unique();
    const existing = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", studentUserId))
      .unique();

    if (
      enrollmentOwner !== null &&
      (existing === null || enrollmentOwner._id !== existing._id)
    ) {
      throw new Error("Esta matrícula já está cadastrada para outro aluno.");
    }

    if (existing !== null) {
      await ctx.db.patch(existing._id, {
        fullName: profile.fullName,
        enrollment: profile.enrollment,
        status: profile.status,
        course: profile.course,
        graduationYear: profile.graduationYear,
        semester: profile.semester,
        location: profile.location,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl,
        availability: profile.availability,
      });
      return { studentId: existing._id, created: false as const };
    }

    const studentId: Id<"students"> = await ctx.db.insert("students", {
      userId: studentUserId,
      fullName: profile.fullName,
      enrollment: profile.enrollment,
      status: profile.status,
      course: profile.course,
      graduationYear: profile.graduationYear,
      semester: profile.semester,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      portfolioUrl: profile.portfolioUrl,
      availability: profile.availability,
      // S1-4 — defaults seguros: privado até o aluno escolher expor-se.
      visibility: "somente_candidaturas",
      showContactToRecruiters: false,
    });
    return { studentId, created: true as const };
  },
});

/**
 * R2 (issue [S1-4]) — toggle "Visível para recrutadores" ×
 * "apenas candidaturas ativas". Persistido no perfil do aluno.
 */
export const setVisibility = mutation({
  args: {
    visibility: v.union(
      v.literal("publico"),
      v.literal("somente_candidaturas"),
    ),
  },
  handler: async (ctx, { visibility }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Não autenticado.");
    const email = identity.email ?? identity.tokenIdentifier;
    const consent = (await ctx.runQuery(
      internal.consents.requireActiveConsent,
      { email },
    )) as { ok: boolean; userId?: Id<"users">; role?: string | null };
    if (!consent.ok || consent.userId === undefined) {
      throw new Error("Aceite o Termo de Consentimento LGPD vigente.");
    }
    const studentUserId = consent.userId;
    if (consent.role !== "aluno") {
      throw new Error("Apenas alunos alteram a própria visibilidade.");
    }
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", studentUserId))
      .unique();
    if (student === null) {
      throw new Error(
        "Complete o cadastro do perfil antes de alterar a visibilidade.",
      );
    }
    await ctx.db.patch(student._id, { visibility });
    return { ok: true as const, visibility };
  },
});

/**
 * R6 (issue [S1-4]) — autorização geral de contato para recrutadores.
 * Default seguro: false; o aluno autoriza, nunca o contrário.
 */
export const setContactConsent = mutation({
  args: { allow: v.boolean() },
  handler: async (ctx, { allow }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) throw new Error("Não autenticado.");
    const email = identity.email ?? identity.tokenIdentifier;
    const consent = (await ctx.runQuery(
      internal.consents.requireActiveConsent,
      { email },
    )) as { ok: boolean; userId?: Id<"users">; role?: string | null };
    if (!consent.ok || consent.userId === undefined) {
      throw new Error("Aceite o Termo de Consentimento LGPD vigente.");
    }
    const studentUserId = consent.userId;
    if (consent.role !== "aluno") {
      throw new Error(
        "Apenas alunos alteram a própria autorização de contato.",
      );
    }
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", studentUserId))
      .unique();
    if (student === null) {
      throw new Error(
        "Complete o cadastro do perfil antes de autorizar contato.",
      );
    }
    await ctx.db.patch(student._id, { showContactToRecruiters: allow });
    return { ok: true as const, allow };
  },
});

/**
 * Perfil público (R2) — o que um recrutador/visitante pode ver de um aluno.
 * Projeção no SERVIDOR: contato (R6) omitido quando não autorizado e perfil
 * inteiro oculto quando a regra R2 não permite a visualização.
 * `jobId` opcional: quando informado, avalia visibilidade no contexto da vaga.
 */
export const publicProfile = query({
  args: {
    studentId: v.id("students"),
    jobId: v.optional(v.id("jobs")),
  },
  handler: async (ctx, { studentId, jobId }) => {
    const student = await ctx.db.get(studentId);
    if (student === null) return null;
    // R1 — inativo não participa. R2 — avaliação de visibilidade.
    const view = recruiterProjection(
      {
        status: student.status,
        visibility: student.visibility ?? "somente_candidaturas",
        showContactToRecruiters: student.showContactToRecruiters ?? false,
        contactReleasedTo: [], // candidaturas ativas chegam na [S3-4]
        fullName: student.fullName,
        course: student.course,
      },
      jobId ?? null,
    );
    if (view === null) return null;
    // Enriquecimento público (sem contato): links e dados acadêmicos gerais.
    return {
      ...view,
      graduationYear: student.graduationYear,
      location: student.location ?? null,
      linkedinUrl:
        view.email !== undefined ? (student.linkedinUrl ?? null) : null,
      portfolioUrl:
        view.email !== undefined ? (student.portfolioUrl ?? null) : null,
      availability: student.availability,
    };
  },
});

/**
 * Guard interno: resolve o estudante a partir do e-mail autenticado.
 * Consumido por issues futuras (currículo S2, candidaturas S3).
 */
export const resolveStudent = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (user === null)
      return { ok: false as const, reason: "usuario_inexistente" as const };
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return {
      ok: true as const,
      userId: user._id,
      role: user.role ?? null,
      student:
        student !== null
          ? {
              studentId: student._id,
              status: student.status,
              enrollment: student.enrollment,
              visibility: student.visibility ?? "somente_candidaturas",
              showContactToRecruiters: student.showContactToRecruiters ?? false,
            }
          : null,
    };
  },
});
