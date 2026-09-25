/**
 * Formatters puros — sem I/O, determinísticos (CEREBRO.md §4.3).
 * Usados em métricas de vagas, salários e matching %.
 */

/** Formata um valor 0–100 como percentual inteiro, com clamp nas bordas. */
export function formatPercentage(value: number): string {
  const clamped = Math.min(100, Math.max(0, value));
  return `${Math.round(clamped)}%`;
}

/** Formata um valor monetário em Real brasileiro (padrão pt-BR). */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
