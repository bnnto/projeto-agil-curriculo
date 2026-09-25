import { describe, expect, it } from "vitest";
import {
  MAX_EXPERIENCES,
  MAX_ACADEMIC,
  validateResumeData,
  type ResumeDataInput,
} from "../../src/lib/resume";

const valid: ResumeDataInput = {
  headline: "Estudante de Ciência da Computação focado em backend",
  summary:
    "Aluno do 8º semestre com experiência em estágio de desenvolvimento web e projetos de extensão em dados.",
  experiences: [
    {
      company: "Acme Ltda",
      role: "Estagiário de Desenvolvimento",
      period: "2024.2 - 2025.1",
      description: "Manutenção de APIs internas em Node.js.",
    },
  ],
  academicHistory: [
    { item: "Ingresso no curso de CC", year: 2021 },
    { item: "Premiação na maratona de programação", year: 2023 },
  ],
};

describe("validação de Currículo Vitae (S2-1)", () => {
  it("aceita currículo completo válido", () => {
    const result = validateResumeData(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized).toEqual(valid);
    }
  });

  it("headline é obrigatória (mín. 10, máx. 120 caracteres)", () => {
    expect(validateResumeData({ ...valid, headline: "curto" }).ok).toBe(false);
    expect(validateResumeData({ ...valid, headline: "x".repeat(121) }).ok).toBe(
      false,
    );
    expect(validateResumeData({ ...valid, headline: "x".repeat(10) }).ok).toBe(
      true,
    );
  });

  it("resumo é obrigatório (mín. 30, máx. 1000 caracteres)", () => {
    expect(validateResumeData({ ...valid, summary: "muito curto" }).ok).toBe(
      false,
    );
    expect(validateResumeData({ ...valid, summary: "x".repeat(30) }).ok).toBe(
      true,
    );
  });

  it("experiências: campos obrigatórios por item", () => {
    const result = validateResumeData({
      ...valid,
      experiences: [
        { company: "", role: "Dev", period: "2024", description: "desc" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("Empresa"))).toBe(true);
    }
  });

  it("limite máximo de experiências", () => {
    const many = Array.from({ length: MAX_EXPERIENCES + 1 }, () => ({
      company: "Acme",
      role: "Dev",
      period: "2024",
      description: "desc",
    }));
    expect(validateResumeData({ ...valid, experiences: many }).ok).toBe(false);
  });

  it("histórico acadêmico: item obrigatório e ano plausível", () => {
    const badItem = validateResumeData({
      ...valid,
      academicHistory: [{ item: "  ", year: 2021 }],
    });
    expect(badItem.ok).toBe(false);

    const badYear = validateResumeData({
      ...valid,
      academicHistory: [{ item: "Formatura", year: 1990 }],
    });
    expect(badYear.ok).toBe(false);
  });

  it("limite máximo de itens no histórico", () => {
    const many = Array.from({ length: MAX_ACADEMIC + 1 }, (_, i) => ({
      item: `Evento ${i}`,
      year: 2022,
    }));
    expect(validateResumeData({ ...valid, academicHistory: many }).ok).toBe(
      false,
    );
  });

  it("agrega múltiplos erros", () => {
    const result = validateResumeData({
      ...valid,
      headline: "",
      summary: "curto",
      experiences: [{ company: "x", role: "", period: "", description: "" }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    }
  });
});
