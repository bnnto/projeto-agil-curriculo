import { describe, expect, it } from "vitest";
import { formatPercentage, formatCurrencyBRL } from "../../src/lib/formatters";

describe("formatPercentage", () => {
  it.each([
    [85, "85%"],
    [85.4, "85%"],
    [49.5, "50%"],
    [0, "0%"],
    [100, "100%"],
    [-5, "0%"], // clamp inferior
    [150, "100%"], // clamp superior
  ])("formata %d como %s", (input, expected) => {
    expect(formatPercentage(input)).toBe(expected);
  });
});

describe("formatCurrencyBRL", () => {
  it.each([
    [0, "R$\u00a00,00"],
    [1500, "R$\u00a01.500,00"],
    [1500.5, "R$\u00a01.500,50"],
    [1234567.89, "R$\u00a01.234.567,89"],
  ])("formata %d como %s", (input, expected) => {
    expect(formatCurrencyBRL(input)).toBe(expected);
  });
});
