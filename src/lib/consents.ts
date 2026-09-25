/**
 * Regras puras de consentimento LGPD (issue [S1-2], R7).
 * Usadas pelo backend (queries/mutations) e pelo frontend (gate).
 * O registro de aceite persistido no Convex é `{ termVersion, acceptedAt }`.
 */

export type ConsentRecord = {
  termVersion: string;
  acceptedAt: number;
};

/**
 * Indica se a lista de aceites contém a versão vigente do termo.
 * `now` é parâmetro (função pura, determinística para testes); um aceite
 * registrado "no futuro" só ocorre por defasagem de relógio e é aceito.
 */
export function hasActiveConsent(
  consents: readonly ConsentRecord[],
  currentVersion: string,
  now: number,
): boolean {
  const version = currentVersion.trim();
  if (version.length === 0) return false;
  return consents.some(
    (c) => c.termVersion === version && c.acceptedAt <= now + 60_000,
  );
}

/** Aceite mais recente registrado para uma versão específica (ou null). */
export function latestConsentFor(
  consents: readonly ConsentRecord[],
  termVersion: string,
): ConsentRecord | null {
  let latest: ConsentRecord | null = null;
  for (const c of consents) {
    if (c.termVersion !== termVersion) continue;
    if (latest === null || c.acceptedAt > latest.acceptedAt) {
      latest = c;
    }
  }
  return latest;
}
