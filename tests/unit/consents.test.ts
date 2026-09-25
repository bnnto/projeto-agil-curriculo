import { describe, expect, it } from "vitest";
import {
  CONSENT_TERM,
  CONSENT_TERM_VERSION,
  CONSENT_TERM_CHANGELOG,
  consentSummary,
  isCurrentTerm,
} from "../../src/lib/consentTerm";
import {
  hasActiveConsent,
  latestConsentFor,
  type ConsentRecord,
} from "../../src/lib/consents";
import { CONSENT_TERMS, CURRENT_TERM_VERSION } from "../../convex/consentTerms";

describe("termo de consentimento versionado (S1-2, R7)", () => {
  it("expõe versão e corpo do termo vigente", () => {
    expect(CONSENT_TERM_VERSION).toMatch(/^v\d+\.\d+$/);
    expect(CONSENT_TERM.length).toBeGreaterThan(200);
    expect(CONSENT_TERM).toContain("LGPD");
    expect(CONSENT_TERM).toContain("Lei nº 13.709");
    expect(CONSENT_TERM).toContain("Direitos do titular");
    expect(CONSENT_TERM).toContain("revogação");
  });

  it("histórico registra a criação da versão vigente", () => {
    expect(CONSENT_TERM_CHANGELOG.length).toBeGreaterThan(0);
    expect(
      CONSENT_TERM_CHANGELOG.some((c) => c.version === CONSENT_TERM_VERSION),
    ).toBe(true);
  });

  it("resumo é legível e citável na UI", () => {
    const resumo = consentSummary();
    expect(resumo.length).toBeLessThan(CONSENT_TERM.length);
    expect(resumo).toContain(CONSENT_TERM_VERSION);
  });

  it("isCurrentTerm aceita só a versão vigente", () => {
    expect(isCurrentTerm(CONSENT_TERM_VERSION)).toBe(true);
    expect(isCurrentTerm("v0.1")).toBe(false);
    expect(isCurrentTerm("")).toBe(false);
  });

  it("catálogo do backend espelha a versão vigente do frontend", () => {
    expect(CURRENT_TERM_VERSION).toBe(CONSENT_TERM_VERSION);
    expect(CONSENT_TERMS.get(CONSENT_TERM_VERSION)).toBe(CONSENT_TERM);
  });
});

describe("regras de consentimento — hasActiveConsent (S1-2, R7)", () => {
  const NOW = Date.parse("2026-09-25T12:00:00Z");
  const terms: ConsentRecord[] = [
    { termVersion: "v0.9", acceptedAt: Date.parse("2026-01-01T10:00:00Z") },
    {
      termVersion: CONSENT_TERM_VERSION,
      acceptedAt: Date.parse("2026-09-01T09:00:00Z"),
    },
  ];

  it("true com aceite vigente registrado", () => {
    expect(hasActiveConsent(terms, CONSENT_TERM_VERSION, NOW)).toBe(true);
  });

  it("false sem nenhum aceite", () => {
    expect(hasActiveConsent([], CONSENT_TERM_VERSION, NOW)).toBe(false);
  });

  it("false quando só há aceite de versão antiga", () => {
    const antigos: ConsentRecord[] = [
      { termVersion: "v0.9", acceptedAt: Date.parse("2026-01-01T10:00:00Z") },
    ];
    expect(hasActiveConsent(antigos, CONSENT_TERM_VERSION, NOW)).toBe(false);
  });

  it("false com versão em branco ou inválida", () => {
    expect(hasActiveConsent(terms, "", NOW)).toBe(false);
    expect(hasActiveConsent(terms, "   ", NOW)).toBe(false);
  });

  it("consentimento futuro (clock do cliente adiantado) ainda é válido", () => {
    const futuro: ConsentRecord[] = [
      { termVersion: CONSENT_TERM_VERSION, acceptedAt: NOW + 1000 },
    ];
    expect(hasActiveConsent(futuro, CONSENT_TERM_VERSION, NOW)).toBe(true);
  });

  it("latestConsentFor pega o aceite mais recente por versão", () => {
    const historico: ConsentRecord[] = [
      ...terms,
      {
        termVersion: CONSENT_TERM_VERSION,
        acceptedAt: Date.parse("2026-09-10T08:00:00Z"),
      },
    ];
    const latest = latestConsentFor(historico, CONSENT_TERM_VERSION);
    expect(latest?.acceptedAt).toBe(Date.parse("2026-09-10T08:00:00Z"));
  });
});
