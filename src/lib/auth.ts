/**
 * Helpers puros de autenticação (issue [S1-1]).
 * Sem I/O — testáveis isoladamente (CEREBRO.md §6.2).
 * Hash de senha vive em `src/lib/password.ts` (node:crypto, uso exclusivo do backend).
 */

/** Normaliza o e-mail para busca case-insensitive (único no sistema). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validação simples de formato de e-mail (sem regex catastrófica). */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (normalized.length === 0 || /\s/.test(normalized)) return false;
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (domain.includes("@") || !domain.includes(".")) return false;
  return local.length > 0 && domain.split(".").every((p) => p.length > 0);
}
