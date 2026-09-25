import type { ReactNode } from "react";
import { useAuthState } from "./authContext";
import type { Role } from "../../lib/roles";

type RequireAuthProps = {
  children: ReactNode;
  /** Papéis autorizados; ausente = qualquer autenticado. */
  roles?: Role[];
  /** UI exibida para visitantes (ex.: link para /entrar). */
  fallback?: ReactNode;
};

/**
 * Guard de rota (issue [S1-1]): exige sessão ativa e, opcionalmente, um dos
 * papéis informados. Enquanto carrega, evita flicker de conteúdo protegido.
 */
export function RequireAuth({ children, roles, fallback }: RequireAuthProps) {
  const { isLoading, isAuthenticated, role } = useAuthState();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-canvas"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm text-slate-500">Carregando…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback ?? null}</>;
  }

  if (roles && (role === null || !roles.includes(role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="rounded-lg border border-danger bg-white p-6 text-center shadow-level1">
          <h1 className="font-serif text-lg font-bold text-danger">
            Acesso não autorizado
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Seu papel não tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
