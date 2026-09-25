import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "../../src/components/ui/input";

describe("Input", () => {
  it("associa label ao campo via htmlFor/id", () => {
    render(<Input id="curso" label="Curso" />);
    expect(screen.getByLabelText("Curso")).toBeInTheDocument();
  });

  it("marca campo obrigatório com asterisco", () => {
    render(<Input id="titulo" label="Título" required />);
    const input = screen.getByLabelText(/Título/);
    expect(input).toBeRequired();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("exibe mensagem de erro associada via aria-describedby", () => {
    render(
      <Input id="email" label="E-mail" error="Informe um e-mail válido" />,
    );
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Informe um e-mail válido",
    );
  });

  it("aceita digitação controlada", async () => {
    render(<Input id="nome" label="Nome" />);
    const input = screen.getByLabelText("Nome");
    await userEvent.type(input, "Anna Beatriz");
    expect(input).toHaveValue("Anna Beatriz");
  });
});
