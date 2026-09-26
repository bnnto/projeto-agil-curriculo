import { describe, expect, it } from "vitest";
import {
  RESUME_PRINT_CSS,
  clearResumePrintContainer,
  injectResumePrintStyle,
  printResumeDocument,
  renderResumeIntoPrintContainer,
  type ResumePrintWindow,
} from "../../src/lib/resumePrint";

const CSS = ` #unicap-resume-print-root `;
const MARKUP = `<div class="unicap-resume-doc" data-testid="doc"></div>`;

function makeWindow(): ResumePrintWindow & { printed: boolean } {
  let printed = false;
  return {
    document,
    print: () => {
      printed = true;
    },
    get printed() {
      return printed;
    },
  };
}

describe("CSS de impressão do currículo (S2-2)", () => {
  it("esconde a aplicação e mostra apenas o template A4 UNICAP", () => {
    expect(RESUME_PRINT_CSS).toContain("@media print");
    expect(RESUME_PRINT_CSS).toContain("@page");
    expect(RESUME_PRINT_CSS).toContain("size: A4");
    expect(RESUME_PRINT_CSS).toContain(CSS.trim());
    expect(RESUME_PRINT_CSS).toContain("display: none !important");
  });

  it("usa as cores institucionais bordô e dourado", () => {
    expect(RESUME_PRINT_CSS).toContain("#6b1426");
    expect(RESUME_PRINT_CSS).toContain("#c89d3c");
  });
});

describe("helpers de impressão do currículo (S2-2)", () => {
  it("injeta o CSS uma única vez (idempotente)", () => {
    injectResumePrintStyle(document);
    injectResumePrintStyle(document);
    expect(
      document.querySelectorAll("#unicap-resume-print-style"),
    ).toHaveLength(1);
  });

  it("renderiza o markup no container dedicado", () => {
    const container = renderResumeIntoPrintContainer(document, MARKUP);
    expect(container.id).toBe("unicap-resume-print-root");
    expect(container.querySelector('[data-testid="doc"]')).not.toBeNull();
  });

  it("substitui o conteúdo em renders sucessivos (sem duplicar)", () => {
    renderResumeIntoPrintContainer(document, MARKUP);
    renderResumeIntoPrintContainer(document, MARKUP);
    expect(
      document.querySelectorAll("#unicap-resume-print-root [data-testid=doc]"),
    ).toHaveLength(1);
  });

  it("limpa o container ao desmontar", () => {
    renderResumeIntoPrintContainer(document, MARKUP);
    clearResumePrintContainer(document);
    expect(document.getElementById("unicap-resume-print-root")).toBeNull();
  });

  it("printResumeDocument renderiza e chama window.print()", () => {
    const win = makeWindow();
    printResumeDocument(MARKUP, win);
    expect(win.printed).toBe(true);
    expect(
      document.querySelector("#unicap-resume-print-root .unicap-resume-doc"),
    ).not.toBeNull();
  });
});
