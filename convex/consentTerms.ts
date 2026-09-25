/**
 * Catálogo de versões de termo aceitáveis pelo backend (issue [S1-2], R7).
 * Espelha `src/lib/consentTerm.ts` — o texto vive no frontend e o backend
 * valida apenas a versão gravada no aceite (auditoria por versão).
 * Publicar termo novo: nova versão em ambos os arquivos.
 */
import { CONSENT_TERM, CONSENT_TERM_VERSION } from "../src/lib/consentTerm";

export const CURRENT_TERM_VERSION: string = CONSENT_TERM_VERSION;

export const CONSENT_TERMS: ReadonlyMap<string, string> = new Map([
  [CONSENT_TERM_VERSION, CONSENT_TERM],
]);

export function isKnownTermVersion(version: string): boolean {
  return CONSENT_TERMS.has(version);
}
