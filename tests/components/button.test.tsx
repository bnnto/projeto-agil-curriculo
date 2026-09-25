import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/ui/button";

describe("Button", () => {
  it("renderiza o rótulo e é clicável", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Publicar vaga</Button>);
    await userEvent.click(
      screen.getByRole("button", { name: "Publicar vaga" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("variante primary usa bordô e texto branco", () => {
    render(<Button variant="primary">Primário</Button>);
    const el = screen.getByRole("button");
    expect(el.className).toContain("bg-primary");
    expect(el.className).toContain("text-white");
  });

  it("variante secondary é contorno bordô sobre branco", () => {
    render(<Button variant="secondary">Secundário</Button>);
    const el = screen.getByRole("button");
    expect(el.className).toContain("border-primary");
    expect(el.className).toContain("text-primary");
    expect(el.className).toContain("bg-white");
  });

  it("variante accent usa dourado com texto escuro (contraste AA)", () => {
    render(<Button variant="accent">Acento</Button>);
    const el = screen.getByRole("button");
    expect(el.className).toContain("bg-secondary");
    expect(el.className).toContain("text-slate-900");
  });

  it("disabled não dispara clique", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Bloqueado
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("respeita o atributo type", () => {
    render(<Button type="submit">Enviar</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
