type CardProps = {
  title: string;
  accent?: "primary" | "secondary";
  children: React.ReactNode;
};

/**
 * Card de superfície nível 1 (DESIGN.md): borda sutil, sombra level1 e
 * acento institucional bordô/dourado na borda esquerda.
 */
export function Card({ title, accent, children }: CardProps) {
  const accentClass =
    accent === "primary"
      ? "border-l-primary"
      : accent === "secondary"
        ? "border-l-secondary"
        : "";

  return (
    <section
      data-testid="card"
      className={`rounded-lg border border-slate-200 bg-white shadow-level1 ${accentClass ? `border-l-4 ${accentClass}` : ""}`}
    >
      <h3 className="font-serif text-lg font-bold text-primary">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}
