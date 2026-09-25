import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App";

describe("App (smoke test do scaffold)", () => {
  it("renderiza o título do portal", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /portal de carreiras/i }),
    ).toBeInTheDocument();
  });
});
