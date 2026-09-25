import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Botão de encerrar sessão (issue [S1-1]).
 * Componente separado para que o acesso ao ConvexAuthActionsContext
 * (via useAuthActions) só aconteça em árvores autenticadas — renderizado
 * apenas quando `isAuthenticated` é verdadeiro.
 */
export function SignOutButton() {
  const { signOut } = useAuthActions();

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded border border-primary px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-[#FDF2F4]"
    >
      Sair
    </button>
  );
}
