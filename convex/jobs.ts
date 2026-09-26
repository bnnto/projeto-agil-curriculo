import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { CURRENT_TERM_VERSION } from "./consentTerms";
import {
  validateJob,
  type JobInput,
  type JobPrerequisite,
} from "../src/lib/job";

/**
 * Vagas do recrutador (issue [S3-1]).
 * Toda operação exige consentimento vigente (R7) e papel de recrutador/
 * gestor/empresa. A validação usa a mesma regra pura do formulário
 * (src/lib/job.ts) — erros claros no servidor, não apenas na UI.
 */

/** Papéis autorizados a publicar/gerenciar vagas. */
function canManageJobs(
  role: string | null | undefined,
): role is "recrutador" | "gestor" | "empresa" {
  return role === "recrutador" || role === "gestor" || role === "empresa";
}

/** Guard comum (R7 + papel): usuário autenticado com consentimento vigente. */
async function requireRecruiter(ctx: QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) throw new Error("Não autenticado.");
  const email = identity.email ?? identity.tokenIdentifier;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (user === null) throw new Error("Usuário não encontrado.");
  const consents = await ctx.db
    .query("consents")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  const active = consents.some((c) => c.termVersion === CURRENT_TERM_VERSION);
  if (!active) {
    throw new Error("Aceite o Termo de Consentimento LGPD vigente.");
  }
  if (!canManageJobs(user.role)) {
    throw new Error(
      "Apenas recrutadores e gestores publicam e gerenciam vagas.",
    );
  }
  return user;
}

/** Converte os argumentos crus da mutation para o formato da regra pura. */
function toJobInput(args: {
  title: string;
  description: string;
  prerequisites: JobPrerequisite[];
  contractType: JobInput["contractType"];
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
}): JobInput {
  return {
    title: args.title,
    description: args.description,
    prerequisites: args.prerequisites,
    contractType: args.contractType,
    salaryMin: args.salaryMin,
    salaryMax: args.salaryMax,
    location: args.location,
  };
}

/**
 * Cria ou atualiza uma vaga do recrutador autenticado (CA 1).
 * Validação completa no servidor (CA 2) — faixa salarial consistente,
 * campos obrigatórios e pré-requisitos com flag obrigatório/opcional
 * (CA 3, base para R3/R8).
 */
export const upsertJob = mutation({
  args: {
    jobId: v.optional(v.id("jobs")),
    title: v.string(),
    description: v.string(),
    prerequisites: v.array(
      v.object({ item: v.string(), required: v.boolean() }),
    ),
    contractType: v.union(
      v.literal("estagio"),
      v.literal("clt"),
      v.literal("pj"),
      v.literal("temporario"),
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRecruiter(ctx);

    const validation = validateJob(toJobInput(args));
    if (!validation.ok) {
      throw new Error(validation.errors.join(" "));
    }
    const job = validation.normalized;

    if (args.jobId !== undefined) {
      const existing = await ctx.db.get(args.jobId);
      if (existing === null) throw new Error("Vaga não encontrada.");
      if (existing.recruiterId !== user._id) {
        throw new Error("Você só pode editar as suas próprias vagas.");
      }
      await ctx.db.patch(args.jobId, { ...job });
      return { jobId: args.jobId, created: false as const };
    }

    const jobId = await ctx.db.insert("jobs", {
      recruiterId: user._id,
      ...job,
      status: "aberta",
    });
    return { jobId, created: true as const };
  },
});

/** Vagas do recrutador autenticado, mais recentes primeiro (painel). */
export const myJobs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRecruiter(ctx);
    return ctx.db
      .query("jobs")
      .withIndex("by_recruiter", (q) => q.eq("recruiterId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Detalhe de uma vaga para edição — apenas o recrutador dono a lê aqui.
 */
export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const user = await requireRecruiter(ctx);
    const job = await ctx.db.get(jobId);
    if (job === null) return null;
    if (job.recruiterId !== user._id) return null;
    return job;
  },
});

/** Abre/fecha/encerra uma vaga própria (ciclo de vida do CA 1). */
export const setJobStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("aberta"),
      v.literal("fechada"),
      v.literal("encerrada"),
    ),
  },
  handler: async (ctx, { jobId, status }) => {
    const user = await requireRecruiter(ctx);
    const job = await ctx.db.get(jobId);
    if (job === null) throw new Error("Vaga não encontrada.");
    if (job.recruiterId !== user._id) {
      throw new Error("Você só pode alterar as suas próprias vagas.");
    }
    await ctx.db.patch(jobId, { status });
    return { ok: true as const, status };
  },
});
