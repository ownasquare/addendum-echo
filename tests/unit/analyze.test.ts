import { describe, expect, it } from "vitest";
import {
  AnalysisInputError,
  analyzeDocuments,
  canonicalizeIdentifier,
  extractAddendumReferences,
  type ExtractedDocument,
} from "../../src/analyze";

const document = (
  name: string,
  text: string,
  kind: ExtractedDocument["kind"] = "text",
): ExtractedDocument => ({ name, text, kind });

describe("identifier normalization", () => {
  it("matches punctuation and leading-zero variants deterministically", () => {
    expect(canonicalizeIdentifier("01")).toBe("1");
    expect(canonicalizeIdentifier("A-1")).toBe("A1");
  });

  it("retains source snippets with each extracted identifier", () => {
    const references = extractAddendumReferences(
      document(
        "issued.txt",
        "Project note. Addendum No. 2 changes the concrete detail.",
      ),
    );
    expect(references).toHaveLength(1);
    expect(references[0]).toMatchObject({
      identifier: "2",
      canonicalIdentifier: "2",
      fileName: "issued.txt",
    });
    expect(references[0]?.snippet).toContain("concrete detail");
  });
});

describe("document analysis", () => {
  it("acknowledges exact visible identifier evidence", () => {
    const result = analyzeDocuments([
      document("addendum-1.txt", "Issued Addendum No. 1 revises sheet A4."),
      document(
        "final-proposal.txt",
        "Bid Proposal Form. We acknowledge receipt of Addendum No. 01. Total Bid $10.",
      ),
    ]);
    expect(result.status).toBe("ACKNOWLEDGED");
    expect(result.results[0]).toMatchObject({
      status: "ACKNOWLEDGED",
      identifier: "1",
    });
  });

  it("flags a missing exact identifier without calling it a failure", () => {
    const result = analyzeDocuments([
      document(
        "addendum-2.txt",
        "Addendum Number 2 changes the finish schedule.",
      ),
      document(
        "final-bid.txt",
        "Form of Bid. Total Bid $12. Signature: Builder.",
      ),
    ]);
    expect(result.status).toBe("REVIEW");
    expect(result.results[0]?.reason).toContain("not found");
  });

  it("does not treat generic all-addenda language as exact evidence", () => {
    const result = analyzeDocuments([
      document("addendum-3.txt", "Addendum #3 changes the deadline."),
      document(
        "proposal.txt",
        "Proposal Form. The bidder acknowledges all issued addenda. Total Bid $20.",
      ),
    ]);
    expect(result.results[0]).toMatchObject({
      status: "REVIEW",
      proposalSnippet: null,
    });
    expect(result.results[0]?.reason).toContain("general");
  });

  it("flags duplicate issued identifiers for source review", () => {
    const result = analyzeDocuments([
      document("addendum-4-a.txt", "Addendum No. 4 changes the door."),
      document("addendum-4-b.txt", "Addendum #4 changes the door again."),
      document("proposal.txt", "Bid Proposal. Acknowledged Addendum Number 4."),
    ]);
    expect(result.status).toBe("REVIEW");
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.duplicateSource).toBe(true);
  });

  it("rejects ambiguous proposal candidates", () => {
    expect(() =>
      analyzeDocuments([
        document("addendum-5.txt", "Addendum No. 5 changes the date."),
        document("proposal-one.txt", "Proposal Form. Total Bid 10."),
        document("proposal-two.txt", "Proposal Form. Total Bid 11."),
      ]),
    ).toThrow(AnalysisInputError);
  });

  it("rejects a source set without readable addendum identifiers", () => {
    expect(() =>
      analyzeDocuments([
        document("issued-note.txt", "The schedule changed."),
        document("proposal.txt", "Bid Proposal. Total Bid 10."),
      ]),
    ).toThrow("No addendum number was readable");
  });
});
