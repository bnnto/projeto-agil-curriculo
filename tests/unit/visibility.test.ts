import { describe, expect, it } from "vitest";
import {
  VISIBILITY_OPTIONS,
  canRecruiterSeeProfile,
  canRecruiterSeeContact,
  recruiterProjection,
  type StudentVisibility,
} from "../../src/lib/visibility";

type Base = {
  status: "ativo" | "egresso" | "inativo";
  visibility: StudentVisibility;
  showContactToRecruiters: boolean;
  contactReleasedTo: readonly string[];
};

const base: Base = {
  status: "ativo",
  visibility: "publico",
  showContactToRecruiters: true,
  contactReleasedTo: [],
};

const JOB_ID = "job123" as const;
const OTHER_JOB = "job999" as const;

describe("R2 — visibilidade do perfil na busca (S1-4)", () => {
  it("VISIBILITY_OPTIONS contém só as duas opções do requisito", () => {
    expect(VISIBILITY_OPTIONS).toEqual(["publico", "somente_candidaturas"]);
  });

  it("ativo público aparece para recrutadores", () => {
    expect(canRecruiterSeeProfile(base, JOB_ID)).toBe(true);
  });

  it("somente_candidaturas não aparece na busca geral ( jobId=null )", () => {
    expect(
      canRecruiterSeeProfile(
        { ...base, visibility: "somente_candidaturas" },
        null,
      ),
    ).toBe(false);
  });

  it("somente_candidaturas aparece apenas para vaga onde há candidatura ativa", () => {
    const aluno: Base = {
      ...base,
      visibility: "somente_candidaturas",
      contactReleasedTo: [JOB_ID],
    };
    expect(canRecruiterSeeProfile(aluno, JOB_ID)).toBe(true);
    expect(canRecruiterSeeProfile(aluno, OTHER_JOB)).toBe(false);
  });

  it("R1: inativo nunca aparece, mesmo público", () => {
    expect(canRecruiterSeeProfile({ ...base, status: "inativo" }, JOB_ID)).toBe(
      false,
    );
  });
});

describe("R6 — contato do aluno (S1-4)", () => {
  it("com showContactToRecruiters, contato visível na busca", () => {
    expect(canRecruiterSeeContact(base, JOB_ID)).toBe(true);
  });

  it("sem autorização geral, contato só se liberou contato naquela vaga", () => {
    const aluno: Base = {
      ...base,
      showContactToRecruiters: false,
      contactReleasedTo: [JOB_ID],
    };
    expect(canRecruiterSeeContact(aluno, JOB_ID)).toBe(true);
    expect(canRecruiterSeeContact(aluno, OTHER_JOB)).toBe(false);
    expect(canRecruiterSeeContact(aluno, null)).toBe(false);
  });

  it("sem nenhuma autorização, contato oculto (default seguro)", () => {
    expect(
      canRecruiterSeeContact(
        { ...base, showContactToRecruiters: false, contactReleasedTo: [] },
        JOB_ID,
      ),
    ).toBe(false);
  });

  it("R2 bloqueia contato quando perfil não é visível ao recrutador", () => {
    const aluno: Base = {
      ...base,
      visibility: "somente_candidaturas",
      contactReleasedTo: [],
    };
    // Sem candidatura: nem perfil nem contato.
    expect(canRecruiterSeeContact(aluno, JOB_ID)).toBe(false);
  });
});

describe("projeção segura para o cliente (S1-4, R6)", () => {
  it("omite e-mail/telefone quando contato não autorizado", () => {
    const view = recruiterProjection(
      {
        ...base,
        showContactToRecruiters: false,
        contactReleasedTo: [],
        fullName: "Maria da Silva",
        course: "CC",
        email: "maria@unicap.br",
      },
      JOB_ID,
    );
    expect(view).not.toBeNull();
    expect(view?.email).toBeUndefined();
    expect(view?.fullName).toBe("Maria da Silva");
  });

  it("expõe contato somente quando autorizado", () => {
    const view = recruiterProjection(
      {
        ...base,
        fullName: "Maria",
        course: "CC",
        email: "maria@unicap.br",
      },
      JOB_ID,
    );
    expect(view?.email).toBe("maria@unicap.br");
  });

  it("perfil invisível vira null (nem dados básicos vazam)", () => {
    const view = recruiterProjection(
      {
        ...base,
        visibility: "somente_candidaturas",
        contactReleasedTo: [],
        fullName: "Maria",
        course: "CC",
      },
      JOB_ID,
    );
    expect(view).toBeNull();
  });
});
