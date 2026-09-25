import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "../../src/components/ui/badge";

describe("Badge — semântica de status (DESIGN.md)", () => {
  it.each([
    ["aprovado", "bg-emerald-50", "text-emerald-800"],
    ["triagem", "bg-amber-50", "text-amber-800"],
    ["reprovado", "bg-red-50", "text-red-800"],
    ["andamento", "bg-blue-50", "text-blue-800"],
  ] as const)(
    "variante %s usa o par de cores institucional",
    (variant, bg, text) => {
      render(<Badge variant={variant}>Status</Badge>);
      const el = screen.getByText("Status");
      expect(el.className).toContain(bg);
      expect(el.className).toContain(text);
    },
  );

  it("renderiza como elemento inline com texto do status", () => {
    render(<Badge variant="aprovado">Aprovado</Badge>);
    expect(screen.getByText("Aprovado").tagName).toBe("SPAN");
  });
});
