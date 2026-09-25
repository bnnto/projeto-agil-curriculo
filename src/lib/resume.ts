/**
 * Validação pura do Currículo Vitae (issue [S2-1]).
 * Compartilhada entre o formulário e a mutation `saveResumeData` — TDD.
 */

export const MAX_EXPERIENCES = 10;
export const MAX_ACADEMIC = 15;
export const HEADLINE_MIN = 10;
export const HEADLINE_MAX = 120;
export const SUMMARY_MIN = 30;
export const SUMMARY_MAX = 1000;

const CURRENT_YEAR = new Date().getFullYear();

export type ExperienceEntry = {
  company: string;
  role: string;
  period: string;
  description: string;
};

export type AcademicEntry = {
  item: string;
  year: number;
};

export type ResumeDataInput = {
  headline: string;
  summary: string;
  experiences: ExperienceEntry[];
  academicHistory: AcademicEntry[];
};

export type ResumeValidation =
  { ok: true; normalized: ResumeDataInput } | { ok: false; errors: string[] };

/** Valida o CV completo e devolve versão normalizada (trim) ou erros. */
export function validateResumeData(input: ResumeDataInput): ResumeValidation {
  const errors: string[] = [];

  const headline = input.headline.trim();
  if (headline.length < HEADLINE_MIN || headline.length > HEADLINE_MAX) {
    errors.push(
      `Headline deve ter entre ${HEADLINE_MIN} e ${HEADLINE_MAX} caracteres.`,
    );
  }

  const summary = input.summary.trim();
  if (summary.length < SUMMARY_MIN || summary.length > SUMMARY_MAX) {
    errors.push(
      `Resumo deve ter entre ${SUMMARY_MIN} e ${SUMMARY_MAX} caracteres.`,
    );
  }

  if (input.experiences.length > MAX_EXPERIENCES) {
    errors.push(`Máximo de ${MAX_EXPERIENCES} experiências.`);
  }
  const experiences: ExperienceEntry[] = [];
  input.experiences.forEach((exp, i) => {
    const company = exp.company.trim();
    const role = exp.role.trim();
    const period = exp.period.trim();
    const description = exp.description.trim();
    if (company.length === 0) {
      errors.push(`Experiência ${i + 1}: informe a Empresa.`);
    }
    if (role.length === 0) {
      errors.push(`Experiência ${i + 1}: informe o Cargo.`);
    }
    if (period.length === 0) {
      errors.push(`Experiência ${i + 1}: informe o Período.`);
    }
    if (company.length > 0 && role.length > 0 && period.length > 0) {
      experiences.push({
        company,
        role,
        period,
        description: description.length > 0 ? description : "Sem descrição.",
      });
    }
  });

  if (input.academicHistory.length > MAX_ACADEMIC) {
    errors.push(`Máximo de ${MAX_ACADEMIC} itens no histórico acadêmico.`);
  }
  const academicHistory: AcademicEntry[] = [];
  input.academicHistory.forEach((entry, i) => {
    const item = entry.item.trim();
    const year = entry.year;
    if (item.length === 0) {
      errors.push(`Histórico ${i + 1}: informe o item.`);
    }
    if (!Number.isInteger(year) || year < 2000 || year > CURRENT_YEAR + 10) {
      errors.push(`Histórico ${i + 1}: ano fora do intervalo plausível.`);
    }
    if (
      item.length > 0 &&
      Number.isInteger(year) &&
      year >= 2000 &&
      year <= CURRENT_YEAR + 10
    ) {
      academicHistory.push({ item, year });
    }
  });

  return errors.length > 0
    ? { ok: false, errors }
    : {
        ok: true,
        normalized: { headline, summary, experiences, academicHistory },
      };
}
