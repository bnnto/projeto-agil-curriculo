import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Esquema da iteração S1 — Autenticação e Perfis (LGPD), issue [S1-1].
 * `authTables` (Convex Auth) fornece users/sessions/accounts/refresh tokens etc.
 * As demais tabelas de domínio (students, jobs, applications, extensionProjects)
 * serão adicionadas issue a issue conforme SPRINTS.md. Referência: CEREBRO.md §4.1.
 */
export default defineSchema({
  ...authTables,

  /**
   * Usuário da aplicação, com papel único e ativação (R7).
   * O documento `users` do Convex Auth é estendido com `role` e `active`.
   */
  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(
        v.literal("aluno"),
        v.literal("recrutador"),
        v.literal("gestor"),
        v.literal("empresa"),
      ),
    ),
    active: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  /**
   * Consentimento LGPD versionado (R7) — o aceite é registrado na [S1-2];
   * a tabela já nasce aqui para que o cadastro possa gravá-la atomicamente.
   */
  consents: defineTable({
    userId: v.id("users"),
    termVersion: v.string(),
    acceptedAt: v.number(),
  }).index("by_user", ["userId"]),

  /**
   * Perfil do aluno/egresso (issue [S1-3], R1).
   * Um perfil por usuário (índice by_user único na prática).
   * `enrollment` normalizado (só dígitos) para unicidade da matrícula;
   * `status` alimenta a regra de vínculo (R1) nas buscas de talentos.
   * Visibilidade e contato (R2/R6) chegam na [S1-4] com defaults seguros.
   */
  students: defineTable({
    userId: v.id("users"),
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
  })
    .index("by_user", ["userId"])
    .index("by_enrollment", ["enrollment"])
    .index("by_status_course", ["status", "course"]),
});
