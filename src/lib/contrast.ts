/**
 * Cálculo de contraste WCAG 2.1 — usado pelos testes do Design System (S0-4)
 * e auditável nas issues de acessibilidade (S8-2). Funções puras, sem I/O.
 *
 * Fórmulas: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

/** Converte hex (#rgb ou #rrggbb) em canal linearizado WCAG. */
function hexToLinearChannel(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Hex inválido: ${hex}`);
  }

  const channels = [0, 2, 4].map((offset) => {
    const raw = Number.parseInt(full.slice(offset, offset + 2), 16) / 255;
    return raw <= 0.04045 ? raw / 12.92 : ((raw + 0.055) / 1.055) ** 2.4;
  });
  return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0];
}

/** Luminância relativa WCAG. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinearChannel(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste (1 a 21), independente da ordem das cores. */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA para texto normal: razão mínima 4.5:1. */
export function meetsWcagAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/** WCAG AA para texto grande (≥18pt ou ≥14pt bold): razão mínima 3:1. */
export function meetsWcagAALargeText(
  foreground: string,
  background: string,
): boolean {
  return getContrastRatio(foreground, background) >= 3;
}
