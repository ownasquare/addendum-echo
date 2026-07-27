import type { AnalysisResult } from "./analyze";

export function createMarkdownReport(result: AnalysisResult): string {
  const lines = [
    "# Addendum Echo evidence check",
    "",
    `Overall: ${result.status}`,
    `Proposal: ${result.proposalName}`,
    `Issued files checked: ${result.addendumDocumentCount}`,
    "",
    result.summary,
    "",
    "## Identifier evidence",
    "",
  ];

  for (const item of result.results) {
    lines.push(
      `### Addendum ${item.identifier} — ${item.status}`,
      "",
      `- Issued source: ${item.fileName}`,
      `- Reason: ${item.reason}`,
      `- Issued snippet: “${item.snippet}”`,
      `- Proposal snippet: ${item.proposalSnippet ? `“${item.proposalSnippet}”` : "Not found"}`,
      "",
    );
  }

  lines.push("## Important limit", "", result.limitation, "");
  return lines.join("\n");
}
