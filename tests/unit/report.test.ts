import { describe, expect, it } from "vitest";
import { createMarkdownReport } from "../../src/report";

describe("report", () => {
  it("preserves evidence and the legal-responsiveness limitation", () => {
    const report = createMarkdownReport({
      status: "REVIEW",
      proposalName: "proposal.txt",
      addendumDocumentCount: 1,
      summary: "1 of 1 issued addenda need a human review.",
      limitation:
        "This checks visible identifier evidence only; it does not determine legal or bid responsiveness.",
      results: [
        {
          identifier: "2",
          canonicalIdentifier: "2",
          fileName: "addendum.txt",
          snippet: "Addendum 2",
          status: "REVIEW",
          proposalSnippet: null,
          reason: "Not found.",
          duplicateSource: false,
        },
      ],
    });
    expect(report).toContain("Addendum 2 — REVIEW");
    expect(report).toContain("does not determine legal or bid responsiveness");
    expect(report).not.toContain("FAIL");
  });
});
