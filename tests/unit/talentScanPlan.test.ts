import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  chooseTalentScanPlan,
  TALENT_SCAN_SCHEMA,
} from "../../src/lib/talentSearch";

const SCHEMA = readFileSync("convex/schema.ts", "utf8");
const STUDENTS = readFileSync("convex/students.ts", "utf8");

describe("plano de varredura do Banco de Talentos (S2-4)", () => {
  it("usa o índice por visibilidade+status quando não há filtro de disponibilidade", () => {
    const plan = chooseTalentScanPlan(undefined);
    expect(plan.index).toBe("by_visibility_status");
    expect(plan.statuses).toEqual(["ativo", "egresso"]);
  });

  it("troca para o índice por status+disponibilidade ao filtrar disponibilidade", () => {
    const plan = chooseTalentScanPlan("estagio");
    expect(plan.index).toBe("by_status_availability");
    expect(plan.statuses).toEqual(["ativo", "egresso"]);
  });

  it("declara exatamente os dois índices do plano (schema enxuto)", () => {
    expect(Object.keys(TALENT_SCAN_SCHEMA).sort()).toEqual([
      "by_status_availability",
      "by_visibility_status",
    ]);
  });

  it("aceita disponibilidade vazia como ausência de filtro", () => {
    expect(chooseTalentScanPlan("").index).toBe("by_visibility_status");
    expect(chooseTalentScanPlan("estagio").index).toBe(
      "by_status_availability",
    );
  });
});

describe("fitness test: índices declarados no schema (S2-4, CA 1)", () => {
  it("students tem os índices do plano de busca", () => {
    expect(SCHEMA).toContain('by_visibility_status", ["visibility", "status"]');
    expect(SCHEMA).toContain(
      'by_status_availability", ["status", "availability"]',
    );
  });

  it("preserva os índices anteriores (nenhuma regressão de índice)", () => {
    for (const expected of [
      'by_user", ["userId"]',
      'by_enrollment", ["enrollment"]',
      'by_status_course", ["status", "course"]',
    ]) {
      expect(SCHEMA).toContain(expected);
    }
  });

  it("searchTalent ancora as varreduras em withIndex e não faz full-scan", () => {
    expect(STUDENTS).toContain('withIndex("by_visibility_status"');
    expect(STUDENTS).toContain('withIndex("by_status_availability"');
    // Padrão de full-scan (query sem withIndex) não pode existir.
    expect(STUDENTS).not.toMatch(
      /db\s*\.\s*query\(\s*"students"\s*\)\s*;?\s*\n(?!\s*\.)/,
    );
  });
});
