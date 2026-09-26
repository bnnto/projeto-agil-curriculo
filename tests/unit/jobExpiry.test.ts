import { describe, expect, it } from "vitest";
import {
  JOB_EXPIRY_DAYS,
  computeExpiresAt,
  isJobExpired,
  renewalWindow,
  type JobLifecycleStatus,
} from "../../src/lib/jobExpiry";
import { renewJob, type ExpirableJob } from "../../src/lib/jobExpiry";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("R4 — prazo de expiração (S3-2)", () => {
  it("duração padrão é 30 dias", () => {
    expect(JOB_EXPIRY_DAYS).toBe(30);
  });

  it("expiresAt = publishedAt + 30d (CA 1)", () => {
    const publishedAt = Date.UTC(2026, 8, 1, 12, 0, 0); // 1/set/2026 12:00
    expect(computeExpiresAt(publishedAt)).toBe(publishedAt + 30 * DAY_MS);
  });

  it("é estável em bordas de mês (set → out)", () => {
    const publishedAt = Date.UTC(2026, 8, 20, 10, 30, 0);
    const expected = Date.UTC(2026, 9, 20, 10, 30, 0);
    expect(computeExpiresAt(publishedAt)).toBe(expected);
  });
});

describe("R4 — vencimento e status derivado (S3-2)", () => {
  const base: ExpirableJob = {
    status: "aberta",
    publishedAt: Date.UTC(2026, 8, 1),
    expiresAt: Date.UTC(2026, 9, 1),
  };

  it("vaga aberta dentro do prazo não está vencida", () => {
    const now = Date.UTC(2026, 8, 15);
    expect(isJobExpired(base, now)).toBe(false);
    expect(renewJob(base, now)).toEqual({
      ok: true,
      expired: false,
      expiresAt: now + 30 * DAY_MS,
    });
  });

  it("vaga aberta vencida deve ser encerrada pelo cron (CA 2)", () => {
    const now = Date.UTC(2026, 9, 2);
    expect(isJobExpired(base, now)).toBe(true);
    expect(renewJob(base, now)).toEqual({
      ok: false,
      reason: "expirada",
      nextStatus: "encerrada",
    });
  });

  it("vence exatamente no milissegundo do expiresAt (limite inclusivo)", () => {
    expect(isJobExpired(base, Date.UTC(2026, 9, 1))).toBe(true);
    expect(isJobExpired(base, Date.UTC(2026, 9, 1) - 1)).toBe(false);
  });

  it("vagas não abertas nunca são alvo do encerramento automático", () => {
    for (const status of ["fechada", "encerrada"] as JobLifecycleStatus[]) {
      expect(isJobExpired({ ...base, status }, Date.UTC(2026, 9, 2))).toBe(
        false,
      );
    }
  });

  it("renovação reativa o prazo de 30 dias a partir de agora (CA 3)", () => {
    const now = Date.UTC(2026, 8, 20);
    const result = renewJob(base, now);
    expect(result).toEqual({
      ok: true,
      expired: false,
      expiresAt: now + 30 * DAY_MS,
    });
  });

  it("renovação de vaga já encerrada é rejeitada (usa mudança de status)", () => {
    const result = renewJob({ ...base, status: "encerrada" }, Date.now());
    expect(result).toEqual({ ok: false, reason: "status_invalido" });
  });

  it("renovação de vaga fechada é permitida e reabre o prazo", () => {
    const now = Date.UTC(2026, 8, 25);
    const result = renewJob({ ...base, status: "fechada" }, now);
    expect(result).toEqual({
      ok: true,
      expired: false,
      expiresAt: now + 30 * DAY_MS,
      reopen: true,
    });
  });
});

describe("R4 — janela de aviso de expiração (S3-2)", () => {
  it("avisa nos últimos 5 dias de vida da vaga aberta", () => {
    const job: ExpirableJob = {
      status: "aberta",
      publishedAt: Date.UTC(2026, 8, 1),
      expiresAt: Date.UTC(2026, 9, 1),
    };
    const now = Date.UTC(2026, 8, 26); // 5 dias antes de 1/out
    const window = renewalWindow(job, now);
    expect(window.daysLeft).toBe(5);
    expect(window.expiring).toBe(true);
  });

  it("não avisa fora da janela e nem para vagas não abertas", () => {
    const job: ExpirableJob = {
      status: "aberta",
      publishedAt: Date.UTC(2026, 8, 1),
      expiresAt: Date.UTC(2026, 9, 1),
    };
    expect(renewalWindow(job, Date.UTC(2026, 8, 20)).expiring).toBe(false);
    expect(
      renewalWindow({ ...job, status: "encerrada" }, Date.UTC(2026, 8, 27))
        .expiring,
    ).toBe(false);
  });

  it("vaga vencida reporta dias restantes negativos", () => {
    const job: ExpirableJob = {
      status: "aberta",
      publishedAt: Date.UTC(2026, 8, 1),
      expiresAt: Date.UTC(2026, 9, 1),
    };
    const window = renewalWindow(job, Date.UTC(2026, 9, 3));
    expect(window.expired).toBe(true);
    expect(window.daysLeft).toBeLessThan(0);
  });
});
