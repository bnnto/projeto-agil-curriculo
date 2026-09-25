import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AVAILABILITY,
  ENROLLMENT_STATUS,
  validateStudentProfile,
  type Availability,
  type EnrollmentStatus,
} from "../../lib/studentProfile";

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ativo: "Aluno ativo",
  egresso: "Egresso (formado)",
  inativo: "Inativo",
};

const AVAILABILITY_LABELS: Record<Availability, string> = {
  estagio: "Estágio",
  integral: "Integral",
  meio_periodo: "Meio período",
  freelancer: "Freelancer",
};

type FormState = {
  fullName: string;
  enrollment: string;
  status: EnrollmentStatus;
  course: string;
  graduationYear: string;
  semester: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
  availability: Availability;
};

const EMPTY_FORM: FormState = {
  fullName: "",
  enrollment: "",
  status: "ativo",
  course: "",
  graduationYear: "",
  semester: "",
  location: "",
  linkedinUrl: "",
  portfolioUrl: "",
  availability: "estagio",
};

/**
 * Cadastro/perfil do aluno (issue [S1-3]): dados pessoais, curso,
 * semestre/ano, matrícula única e status de vínculo (R1).
 * Validação com a mesma regra pura do servidor; salvamento via
 * `students.upsertProfile` (exige consentimento vigente, R7).
 */
export function StudentProfileForm() {
  const profile: Doc<"students"> | null | undefined = useQuery(
    api.students.myProfile,
    {},
  );
  const upsert = useMutation(api.students.upsertProfile);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Pré-preenche com o perfil existente (upsert idempotente).
  useEffect(() => {
    if (profile !== undefined && profile !== null && !loaded) {
      setForm({
        fullName: profile.fullName,
        enrollment: profile.enrollment,
        status: profile.status,
        course: profile.course,
        graduationYear: String(profile.graduationYear),
        semester:
          profile.semester !== undefined ? String(profile.semester) : "",
        location: profile.location ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
        availability: profile.availability,
      });
      setLoaded(true);
    }
  }, [profile, loaded]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setErrors([]);
    setNotice(null);

    const graduationYear = Number.parseInt(form.graduationYear, 10);
    if (!Number.isFinite(graduationYear)) {
      setErrors(["Informe o ano de formação."]);
      return;
    }
    const semesterRaw = form.semester.trim();
    const semester =
      semesterRaw.length > 0 ? Number.parseInt(semesterRaw, 10) : undefined;
    if (semesterRaw.length > 0 && !Number.isFinite(semester)) {
      setErrors(["Semestre deve ser um número."]);
      return;
    }

    const validation = validateStudentProfile({
      fullName: form.fullName,
      enrollment: form.enrollment,
      status: form.status,
      course: form.course,
      graduationYear,
      semester,
      location: form.location,
      linkedinUrl: form.linkedinUrl,
      portfolioUrl: form.portfolioUrl,
      availability: form.availability,
    });
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }

    setPending(true);
    try {
      const result = await upsert({ ...validation.normalized });
      setNotice(
        result.created
          ? "Perfil criado com sucesso."
          : "Perfil atualizado com sucesso.",
      );
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : "Falha ao salvar o perfil.",
      ]);
    } finally {
      setPending(false);
    }
  }

  if (profile === undefined) {
    return (
      <p className="text-sm text-slate-500" role="status" aria-live="polite">
        Carregando perfil…
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(e);
      }}
      className="flex flex-col gap-4"
      aria-label="Formulário de perfil do aluno"
    >
      {notice !== null ? (
        <p
          role="status"
          className="rounded border border-success bg-white px-3 py-2 text-sm font-medium text-success"
        >
          {notice}
        </p>
      ) : null}

      {errors.length > 0 ? (
        <div
          role="alert"
          className="rounded border border-danger bg-white px-3 py-2"
        >
          <p className="text-sm font-semibold text-danger">
            Corrija os pontos abaixo:
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-danger">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome completo"
          required
          value={form.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Matrícula"
          required
          inputMode="numeric"
          value={form.enrollment}
          onChange={(e) => set("enrollment", e.target.value)}
          hint="6 a 12 dígitos"
        />
        <Input
          label="Curso"
          required
          value={form.course}
          onChange={(e) => set("course", e.target.value)}
        />
        <Input
          label="Ano de formação"
          required
          inputMode="numeric"
          value={form.graduationYear}
          onChange={(e) => set("graduationYear", e.target.value)}
        />
        <Input
          label="Semestre atual (opcional)"
          inputMode="numeric"
          value={form.semester}
          onChange={(e) => set("semester", e.target.value)}
        />
        <Input
          label="Cidade/UF (opcional)"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-slate-700">
          Status de vínculo
        </legend>
        <div className="flex flex-wrap gap-2">
          {ENROLLMENT_STATUS.map((status) => (
            <label
              key={status}
              className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                form.status === status
                  ? "border-primary bg-[#FDF2F4] font-semibold text-primary"
                  : "border-slate-300 bg-white text-slate-700 hover:border-primary"
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={form.status === status}
                onChange={() => set("status", status)}
                className="accent-primary"
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-slate-700">
          Disponibilidade
        </legend>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map((availability) => (
            <label
              key={availability}
              className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm transition-colors ${
                form.availability === availability
                  ? "border-primary bg-[#FDF2F4] font-semibold text-primary"
                  : "border-slate-300 bg-white text-slate-700 hover:border-primary"
              }`}
            >
              <input
                type="radio"
                name="availability"
                value={availability}
                checked={form.availability === availability}
                onChange={() => set("availability", availability)}
                className="accent-primary"
              />
              {AVAILABILITY_LABELS[availability]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="LinkedIn (opcional)"
          type="url"
          placeholder="https://www.linkedin.com/in/…"
          value={form.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
        />
        <Input
          label="GitHub / Portfólio (opcional)"
          type="url"
          placeholder="https://github.com/…"
          value={form.portfolioUrl}
          onChange={(e) => set("portfolioUrl", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
        <p className="text-xs text-slate-500">
          Alunos com status “Inativo” não aparecem nas buscas de recrutadores
          (regra de vínculo).
        </p>
      </div>
    </form>
  );
}
