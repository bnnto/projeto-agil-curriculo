/**
 * Papéis do sistema (issue [S1-1], CEREBRO.md §4.1).
 * Fonte única compartilhada entre Convex e React (arquivo puro, sem I/O).
 */
export const ROLES = ["aluno", "recrutador", "gestor", "empresa"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  aluno: "Aluno",
  recrutador: "Recrutador",
  gestor: "Gestor",
  empresa: "Empresa / Recrutador",
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}
