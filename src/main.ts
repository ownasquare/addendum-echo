import "./styles.css";
import { AnalysisInputError, analyzeDocuments } from "./analyze";
import { FileInputError, extractFiles } from "./files";
import { createMarkdownReport } from "./report";

const input = document.querySelector<HTMLInputElement>("#file-input")!;
const dropZone = document.querySelector<HTMLLabelElement>("#drop-zone")!;
const selection = document.querySelector<HTMLDivElement>("#selection")!;
const action = document.querySelector<HTMLButtonElement>("#check-button")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const result = document.querySelector<HTMLDivElement>("#result")!;

let selectedFiles: File[] = [];
let reportUrl: string | null = null;

function releaseReport(): void {
  if (reportUrl) URL.revokeObjectURL(reportUrl);
  reportUrl = null;
}

function renderSelection(): void {
  if (selectedFiles.length === 0) {
    selection.textContent = "Add issued addenda plus one final proposal.";
    action.disabled = true;
    return;
  }
  selection.textContent = `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} ready: ${selectedFiles.map((file) => file.name).join(", ")}`;
  action.disabled = selectedFiles.length < 2;
  status.textContent = "";
  result.hidden = true;
  result.replaceChildren();
  releaseReport();
}

function setFiles(files: File[]): void {
  selectedFiles = files;
  renderSelection();
}

input.addEventListener("change", () => {
  setFiles(Array.from(input.files ?? []));
});

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const transfer = event as DragEvent;
  setFiles(Array.from(transfer.dataTransfer?.files ?? []));
});

function resultCard(
  item: ReturnType<typeof analyzeDocuments>["results"][number],
): HTMLElement {
  const article = document.createElement("article");
  article.className = `evidence-card evidence-${item.status.toLowerCase()}`;

  const heading = document.createElement("h3");
  heading.textContent = `Addendum ${item.identifier}`;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = item.status;
  heading.append(badge);

  const reason = document.createElement("p");
  reason.textContent = item.reason;

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Show source evidence";
  const source = document.createElement("p");
  source.className = "snippet";
  source.textContent = `Issued — ${item.fileName}: “${item.snippet}”`;
  const proposal = document.createElement("p");
  proposal.className = "snippet";
  proposal.textContent = item.proposalSnippet
    ? `Proposal: “${item.proposalSnippet}”`
    : "Proposal: no matching identifier evidence found.";
  details.append(summary, source, proposal);
  article.append(heading, reason, details);
  return article;
}

action.addEventListener("click", async () => {
  action.disabled = true;
  action.textContent = "Checking…";
  status.className = "status";
  status.textContent = "Reading files locally…";
  result.hidden = true;
  result.replaceChildren();
  releaseReport();

  try {
    const documents = await extractFiles(selectedFiles, (complete, total) => {
      status.textContent = `Reading file ${complete} of ${total}…`;
    });
    status.textContent = "Comparing visible addendum identifiers…";
    const analysis = analyzeDocuments(documents);

    const header = document.createElement("div");
    header.className = `result-header result-${analysis.status.toLowerCase()}`;
    const kicker = document.createElement("div");
    kicker.className = "result-kicker";
    kicker.textContent = analysis.status;
    const title = document.createElement("h2");
    title.textContent = analysis.summary;
    const proposal = document.createElement("p");
    proposal.textContent = `Final proposal: ${analysis.proposalName}`;
    header.append(kicker, title, proposal);

    const cards = document.createElement("div");
    cards.className = "evidence-list";
    cards.append(...analysis.results.map(resultCard));

    const limit = document.createElement("p");
    limit.className = "limitation";
    limit.textContent = analysis.limitation;

    const report = createMarkdownReport(analysis);
    reportUrl = URL.createObjectURL(
      new Blob([report], { type: "text/markdown" }),
    );
    const download = document.createElement("a");
    download.className = "download-link";
    download.href = reportUrl;
    download.download = "addendum-echo-report.md";
    download.textContent = "Download evidence report";

    result.append(header, cards, limit, download);
    result.hidden = false;
    status.textContent = "Check complete.";
    result.querySelector<HTMLElement>("h2")?.focus();
  } catch (error) {
    status.className = "status error";
    status.textContent =
      error instanceof FileInputError || error instanceof AnalysisInputError
        ? error.message
        : "The files could not be checked; choose searchable copies and try again.";
    dropZone.focus();
  } finally {
    action.disabled = selectedFiles.length < 2;
    action.textContent = "Check the proposal";
  }
});
