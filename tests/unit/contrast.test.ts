import { describe, expect, it } from "vitest";
import {
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAALargeText,
} from "../../src/lib/contrast";

/** Tokens institucionais — DESIGN.md (stitch) e tailwind.config.ts */
const COLORS = {
  primary: "#6B1426", // Bordô
  "primary-hover": "#520F1D",
  secondary: "#C89D3C", // Dourado
  canvas: "#F8F9FA",
  white: "#FFFFFF",
  "slate-900": "#0F172A",
  "slate-600": "#475569",
  "slate-200": "#E2E8F0",
  success: "#047857", // esmeralda escura — AA com branco
  warning: "#B45309", // âmbar escuro — AA com branco
  danger: "#DC2626",
} as const;

describe("getContrastRatio", () => {
  it("branco sobre bordô (botão primário) tem contraste alto", () => {
    expect(getContrastRatio(COLORS.white, COLORS.primary)).toBeGreaterThan(7);
  });

  it("branco sobre dourado NÃO atinge AA em texto normal", () => {
    expect(getContrastRatio(COLORS.white, COLORS.secondary)).toBeLessThan(4.5);
  });

  it("calcula o mesmo valor independente da ordem das cores", () => {
    expect(getContrastRatio(COLORS.primary, COLORS.white)).toBe(
      getContrastRatio(COLORS.white, COLORS.primary),
    );
  });

  it("aceita hex de 3 dígitos", () => {
    expect(getContrastRatio("#fff", "#6B1426")).toBeGreaterThan(7);
  });
});

describe("meetsWcagAA — pares obrigatórios do Design System", () => {
  const pairs: Array<[string, string, string]> = [
    // [descrição, texto, fundo]
    ["texto branco sobre botão primário bordô", COLORS.white, COLORS.primary],
    [
      "texto branco sobre hover bordô",
      COLORS.white,
      COLORS["primary-hover"],
    ],
    [
      "título bordô sobre card branco",
      COLORS.primary,
      COLORS.white,
    ],
    [
      "corpo de texto slate-900 sobre canvas",
      COLORS["slate-900"],
      COLORS.canvas,
    ],
    [
      "texto secundário slate-600 sobre canvas",
      COLORS["slate-600"],
      COLORS.canvas,
    ],
    [
      "título bordô sobre canvas",
      COLORS.primary,
      COLORS.canvas,
    ],
    [
      "texto branco sobre success (badge aprovado)",
      COLORS.white,
      COLORS.success,
    ],
    [
      "texto branco sobre warning (badge triagem)",
      COLORS.white,
      COLORS.warning,
    ],
    [
      "texto branco sobre danger (badge reprovado)",
      COLORS.white,
      COLORS.danger,
    ],
  ];

  it.each(pairs)("%s atinge AA 4.5:1", (_desc, fg, bg) => {
    expect(meetsWcagAA(fg, bg)).toBe(true);
  });
});

describe("meetsWcagAALargeText — dourado apenas em contextos escuros", () => {
  it("dourado sobre branco é decorativo (nunca texto): < 3:1", () => {
    const ratio = getContrastRatio(COLORS.secondary, COLORS.white);
    expect(ratio).toBeLessThan(3);
  });

  it("dourado sobre bordô atinge AA normal (CTA/texto acento no primário)", () => {
    expect(meetsWcagAA(COLORS.secondary, COLORS.primary)).toBe(true);
  });

  it("slate-900 sobre dourado atinge AA normal (texto escuro sobre acento)", () => {
    expect(meetsWcagAA(COLORS["slate-900"], COLORS.secondary)).toBe(true);
  });

  it("branco sobre danger passa AA normal com folga (4.83:1)", () => {
    expect(meetsWcagAALargeText(COLORS.white, COLORS.danger)).toBe(true);
    expect(meetsWcagAA(COLORS.white, COLORS.danger)).toBe(true);
    expect(getContrastRatio(COLORS.white, COLORS.danger)).toBeCloseTo(4.829, 2);
  });
});
