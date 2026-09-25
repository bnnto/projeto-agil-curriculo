import { useState, type FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { RoleSelect } from "./RoleSelect";
import { ROLES, ROLE_LABELS, type Role } from "../../lib/roles";

/**
 * Página de autenticação (issue [S1-1]): entrada única com abas Entrar/Criar
 * conta. O cadastro exige nome e papel (aluno, recrutador, gestor, empresa).
 * Identidade UNICAP: bordô primário, dourado no destaque (DESIGN.md).
 */
export function AuthPage() {
  const authActions = useAuthActions();
  const signIn = authActions?.signIn;
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("aluno");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setError(null);
    setPending(true);
    if (signIn === undefined) {
      setError("Autenticação indisponível nesta tela.");
      setPending(false);
      return;
    }
    try {
      if (mode === "signUp") {
        await signIn("credentials-email", {
          email,
          password,
          name,
          role,
          flow: "signUp",
        });
      } else {
        await signIn("credentials-email", { email, password, flow: "signIn" });
      }
      // Sucesso: o ConvexAuthProvider reage e a UI troca para o painel.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="font-serif text-xs uppercase tracking-widest text-secondary">
            Universidade Católica de Pernambuco
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-primary">
            Portal de Carreiras
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Acesso ao Portal de Carreiras e ao Setor de Extensão
          </p>
        </header>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-level2">
          <div
            role="tablist"
            aria-label="Modo de autenticação"
            className="mb-6 grid grid-cols-2 gap-1 rounded border border-slate-200 bg-canvas p-1"
          >
            {(["signIn", "signUp"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                type="button"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:text-primary"
                }`}
              >
                {m === "signIn" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(e);
            }}
            className="flex flex-col gap-4"
          >
            {mode === "signUp" ? (
              <>
                <Input
                  label="Nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
                <RoleSelect
                  label="Perfil de acesso"
                  value={role}
                  onChange={setRole}
                  required
                />
              </>
            ) : null}

            <Input
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signUp" ? "new-password" : "current-password"
              }
              error={error ?? undefined}
            />

            {mode === "signUp" ? (
              <p className="text-xs leading-relaxed text-slate-500">
                Ao criar sua conta você concorda com o tratamento dos seus dados
                pessoais conforme a LGPD. O termo de consentimento detalhado
                será apresentado no próximo passo (issue [S1-2]).
              </p>
            ) : null}

            <Button type="submit" variant="primary" disabled={pending}>
              {pending
                ? "Processando…"
                : mode === "signIn"
                  ? "Entrar"
                  : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {" "}
          {ROLES.map((r) => ROLE_LABELS[r]).join(" · ")}
        </p>
      </div>
    </div>
  );
}
