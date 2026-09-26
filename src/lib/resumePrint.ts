/**
 * Geração e download do Currículo Vitae em PDF (issue [S2-2]) — sem libs
 * pesadas: o documento é montado pela regra pura `buildResumeDocument`
 * (src/lib/resumeDocument.ts), renderizado num template imprimível com
 * identidade UNICAP e o PDF sai do próprio navegador (`window.print()`).
 * A folha `.unicap-resume-doc` serve de prévia na tela e de documento A4
 * na impressão — o restante da aplicação fica oculto via `@media print`.
 */

/** Folha A4 com identidade bordô/dourado; aplicação fica intocada na tela. */
export const RESUME_PRINT_CSS = `
@media print {
  @page {
    size: A4;
    margin: 18mm 16mm;
  }
  body > *:not(#unicap-resume-print-root) {
    display: none !important;
  }
  #unicap-resume-print-root {
    display: block !important;
  }
  .unicap-resume-doc {
    border: none !important;
    box-shadow: none !important;
    max-width: none !important;
    padding: 0 !important;
  }
}
#unicap-resume-print-root {
  display: none;
}
.unicap-resume-doc {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-family: "Plus Jakarta Sans", system-ui, sans-serif;
  font-size: 12.5px;
  line-height: 1.55;
  margin: 0 auto;
  max-width: 210mm;
  padding: 10mm;
}
.unicap-resume-doc .unicap-resume-header {
  align-items: flex-end;
  border-bottom: 2.5px solid #6b1426;
  display: flex;
  justify-content: space-between;
  padding-bottom: 10px;
}
.unicap-resume-doc .unicap-resume-brand {
  color: #6b1426;
  font-family: Merriweather, Georgia, serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0;
}
.unicap-resume-doc .unicap-resume-doc-title {
  color: #c89d3c;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 2px 0 0;
  text-transform: uppercase;
}
.unicap-resume-doc .unicap-resume-name {
  color: #6b1426;
  font-family: Merriweather, Georgia, serif;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  margin: 14px 0 4px;
}
.unicap-resume-doc .unicap-resume-headline {
  color: #475569;
  font-size: 13px;
  margin: 0 0 6px;
}
.unicap-resume-doc .unicap-resume-acronym {
  color: #c89d3c;
  font-family: Merriweather, Georgia, serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
}
.unicap-resume-doc .unicap-resume-contacts {
  color: #64748b;
  font-size: 11px;
  margin: 2px 0 0;
}
.unicap-resume-doc .unicap-resume-contacts a {
  color: #6b1426;
  text-decoration: underline;
}
.unicap-resume-doc .unicap-resume-meta {
  color: #64748b;
  font-size: 11px;
  margin: 0;
}
.unicap-resume-doc .unicap-resume-section {
  margin-top: 14px;
}
.unicap-resume-doc .unicap-resume-section-title {
  border-bottom: 1px solid #c89d3c;
  color: #6b1426;
  font-family: Merriweather, Georgia, serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 0 0 7px;
  padding-bottom: 3px;
  text-transform: uppercase;
}
.unicap-resume-doc .unicap-resume-summary {
  margin: 0;
  white-space: pre-line;
}
.unicap-resume-doc .unicap-resume-item {
  margin-bottom: 8px;
}
.unicap-resume-doc .unicap-resume-item:last-child {
  margin-bottom: 0;
}
.unicap-resume-doc .unicap-resume-item-title {
  font-weight: 700;
  margin: 0;
}
.unicap-resume-doc .unicap-resume-item-sub {
  color: #64748b;
  font-size: 11px;
  margin: 1px 0 3px;
}
.unicap-resume-doc .unicap-resume-item-desc {
  margin: 0;
}
.unicap-resume-doc .unicap-resume-list {
  list-style: disc;
  margin: 0;
  padding-left: 16px;
}
.unicap-resume-doc .unicap-resume-list li {
  margin-bottom: 3px;
}
.unicap-resume-doc .unicap-resume-list li:last-child {
  margin-bottom: 0;
}
.unicap-resume-doc .unicap-resume-footer {
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 9.5px;
  margin-top: 18px;
  padding-top: 6px;
}
`;

const STYLE_ID = "unicap-resume-print-style";
const CONTAINER_ID = "unicap-resume-print-root";

export type ResumePrintWindow = Pick<Window, "document" | "print">;

/** Injeta o CSS de impressão uma única vez (idempotente). */
export function injectResumePrintStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = RESUME_PRINT_CSS;
  doc.head.appendChild(style);
}

/**
 * Renderiza `markup` dentro do container dedicado à impressão (oculto na
 * tela, exibido via `@media print`). Chamado antes de window.print().
 */
export function renderResumeIntoPrintContainer(
  doc: Document,
  markup: string,
): HTMLElement {
  injectResumePrintStyle(doc);
  let container = doc.getElementById(CONTAINER_ID);
  if (container === null) {
    container = doc.createElement("div");
    container.id = CONTAINER_ID;
    doc.body.appendChild(container);
  }
  container.innerHTML = markup;
  return container;
}

/** Limpa o container de impressão (usado ao desmontar o preview). */
export function clearResumePrintContainer(doc: Document): void {
  doc.getElementById(CONTAINER_ID)?.remove();
}

/**
 * Dispara a impressão/PDF: renderiza o template e chama window.print(),
 * onde o usuário escolhe "Salvar como PDF" com o nome de arquivo correto.
 */
export function printResumeDocument(
  markup: string,
  win: ResumePrintWindow = window,
): void {
  renderResumeIntoPrintContainer(win.document, markup);
  win.print();
}
