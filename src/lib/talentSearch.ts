/**
 * Banco de Talentos — regras puras de busca com filtros avançados
 * (issue [S2-3]). Compartilhadas entre a query Convex (`students.searchTalent`)
 * e a UI reativa. R1 (apenas ativo/egresso) e R2 (apenas `publico`) são
 * aplicados aqui e re-verificados no servidor — TDD, sem I/O.
 */
import type { LanguageLevel } from "./skills";
import type { Availability, EnrollmentStatus } from "./studentProfile";

/** Tamanho da página da busca paginada (CA 2). */
export const TALENT_PAGE_SIZE = 10;

const LEVEL_ORDER: Record<LanguageLevel, number> = {
  basico: 1,
  intermediario: 2,
  avancado: 3,
  fluente: 4,
  nativo: 5,
};

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ativo: "Aluno ativo",
  egresso: "Egresso",
  inativo: "Inativo",
};

export type TalentCandidate = {
  id: string;
  fullName: string;
  course: string;
  status: EnrollmentStatus;
  /** R2 — apenas "publico" participa do banco de talentos. */
  visibility: "publico" | "somente_candidaturas";
  graduationYear: number;
  semester: number | null;
  location: string | null;
  availability: Availability;
  skills: readonly string[];
  languages: ReadonlyArray<{ name: string; level: LanguageLevel }>;
};

export type TalentFilters = {
  /** Busca textual: nome, curso, competências e localização. */
  query?: string;
  course?: string;
  status?: EnrollmentStatus;
  availability?: Availability;
  location?: string;
  skill?: string;
  language?: string;
  /** Nível mínimo exigido do idioma informado (aceita superiores). */
  languageLevel?: LanguageLevel;
  /** Página atual (0-based). */
  page?: number;
};

export type TalentSearchResult = {
  items: TalentCandidate[];
  total: number;
  page: number;
  pageCount: number;
  hasNext: boolean;
  hasPrev: boolean;
};

/** Texto minúsculo e sem acentos, para comparações tolerantes. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * R1 + R2 — elegibilidade para aparecer no Banco de Talentos:
 * vínculo válido (R1: ativo/egresso) e escolha do aluno (R2: público).
 * Inativo nunca aparece, mesmo com visibilidade pública.
 */
export function canAppearInTalentBank(
  candidate: Pick<TalentCandidate, "status" | "visibility">,
): boolean {
  // R1 — regra de vínculo avaliada primeiro.
  if (candidate.status === "inativo") return false;
  // R2 — o aluno opta por se expor, nunca o contrário.
  return candidate.visibility === "publico";
}

function matchesTextFilters(
  candidate: TalentCandidate,
  filters: TalentFilters,
): boolean {
  const course = filters.course ?? "";
  if (course.length > 0) {
    if (
      !normalizeForSearch(candidate.course).includes(normalizeForSearch(course))
    )
      return false;
  }

  if (filters.status !== undefined && candidate.status !== filters.status)
    return false;

  if (
    filters.availability !== undefined &&
    candidate.availability !== filters.availability
  )
    return false;

  const location = filters.location ?? "";
  if (location.length > 0) {
    const candidateLocation = normalizeForSearch(candidate.location ?? "");
    if (!candidateLocation.includes(normalizeForSearch(location))) return false;
  }

  const skill = filters.skill ?? "";
  if (skill.length > 0) {
    const wanted = normalizeForSearch(skill);
    const has = candidate.skills.some((s) =>
      normalizeForSearch(s).includes(wanted),
    );
    if (!has) return false;
  }

  const language = filters.language ?? "";
  if (language.length > 0) {
    const wanted = normalizeForSearch(language);
    const minLevel = filters.languageLevel;
    const has = candidate.languages.some((l) => {
      if (!normalizeForSearch(l.name).includes(wanted)) return false;
      if (minLevel === undefined) return true;
      return LEVEL_ORDER[l.level] >= LEVEL_ORDER[minLevel];
    });
    if (!has) return false;
  }

  const query = filters.query ?? "";
  if (query.length > 0) {
    const q = normalizeForSearch(query);
    const haystack = [
      candidate.fullName,
      candidate.course,
      candidate.location ?? "",
      ...candidate.skills,
    ]
      .map(normalizeForSearch)
      .join(" ");
    if (!haystack.includes(q)) return false;
  }

  return true;
}

/**
 * Aplica filtros combináveis (E lógico entre categorias), mantendo apenas
 * candidatos elegíveis (R1/R2) e paginando o resultado.
 */
export function filterTalentCandidates(
  candidates: readonly TalentCandidate[],
  filters: TalentFilters,
): TalentSearchResult {
  const eligible = candidates.filter((c) => canAppearInTalentBank(c));
  const matching = eligible.filter((c) => matchesTextFilters(c, filters));

  const total = matching.length;
  const pageCount = Math.max(1, Math.ceil(total / TALENT_PAGE_SIZE));
  const requestedPage = filters.page ?? 0;
  const page = Math.min(Math.max(0, Math.floor(requestedPage)), pageCount - 1);
  const start = page * TALENT_PAGE_SIZE;

  return {
    items: matching.slice(start, start + TALENT_PAGE_SIZE),
    total,
    page,
    pageCount,
    hasNext: page < pageCount - 1,
    hasPrev: page > 0,
  };
}

/** Linha de resumo do card (Design System: contraste AA, sem jargão). */
export function formatTalentSummary(input: {
  status: EnrollmentStatus;
  course: string;
  graduationYear: number;
  semester: number | null;
}): string {
  const detail =
    input.semester !== null
      ? `${input.semester}º semestre (conclusão ${input.graduationYear})`
      : `conclusão ${input.graduationYear}`;
  return [STATUS_LABELS[input.status], input.course, detail].join(" · ");
}
