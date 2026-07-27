export type EvidenceStatus = "ACKNOWLEDGED" | "REVIEW";

export interface ExtractedDocument {
  name: string;
  text: string;
  kind: "pdf" | "text";
}

export interface SourceReference {
  identifier: string;
  canonicalIdentifier: string;
  fileName: string;
  snippet: string;
}

export interface AddendumResult extends SourceReference {
  status: EvidenceStatus;
  proposalSnippet: string | null;
  reason: string;
  duplicateSource: boolean;
}

export interface AnalysisResult {
  status: EvidenceStatus;
  proposalName: string;
  addendumDocumentCount: number;
  results: AddendumResult[];
  summary: string;
  limitation: string;
}

export class AnalysisInputError extends Error {}

const ADDENDUM_REFERENCE =
  /\baddend(?:um|a)\s*(?:no(?:\.|s\.)?|number(?:s)?|#)?\s*[:#-]?\s*([a-z]?\d+(?:[.-]\d+)*|[a-z](?=\s|[,.;:)]|$))/giu;
const PROPOSAL_HINT =
  /\b(bid\s+proposal|proposal\s+form|form\s+of\s+bid|bidder(?:'s)?\s+proposal|base\s+bid|total\s+bid)\b/iu;
const ACKNOWLEDGMENT_HINT =
  /\b(acknowledg(?:e|ed|ement|es|ing)|receipt|received|including|incorporat(?:e|ed|ing)|addenda\s+listed)\b/iu;

export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[–—−]/gu, "-")
    .replace(/\s+/gu, " ")
    .trim();
}

export function canonicalizeIdentifier(value: string): string {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/gu, "");
  if (/^\d+$/u.test(compact)) {
    return String(Number(compact));
  }
  return compact;
}

export function extractAddendumReferences(
  document: ExtractedDocument,
): SourceReference[] {
  const normalized = normalizeText(document.text);
  const references: SourceReference[] = [];

  for (const match of normalized.matchAll(ADDENDUM_REFERENCE)) {
    const identifier = match[1]?.toUpperCase();
    if (!identifier) continue;
    const start = Math.max(0, (match.index ?? 0) - 70);
    const end = Math.min(
      normalized.length,
      (match.index ?? 0) + match[0].length + 95,
    );
    references.push({
      identifier,
      canonicalIdentifier: canonicalizeIdentifier(identifier),
      fileName: document.name,
      snippet: normalized.slice(start, end),
    });
  }

  return references;
}

function proposalScore(document: ExtractedDocument): number {
  const text = normalizeText(document.text);
  let score = 0;
  if (PROPOSAL_HINT.test(text)) score += 3;
  if (/\b(proposal|bid)\b/iu.test(document.name)) score += 2;
  if (/\b(signature|bidder|total)\b/iu.test(text)) score += 1;
  if (/\baddend(?:um|a)\b/iu.test(document.name)) score -= 3;
  return score;
}

function proposalEvidence(
  proposalText: string,
  canonicalIdentifier: string,
): string | null {
  const normalized = normalizeText(proposalText);
  for (const match of normalized.matchAll(ADDENDUM_REFERENCE)) {
    const found = match[1];
    if (!found || canonicalizeIdentifier(found) !== canonicalIdentifier)
      continue;
    const start = Math.max(0, (match.index ?? 0) - 100);
    const end = Math.min(
      normalized.length,
      (match.index ?? 0) + match[0].length + 120,
    );
    return normalized.slice(start, end);
  }
  return null;
}

export function analyzeDocuments(
  documents: ExtractedDocument[],
): AnalysisResult {
  const readable = documents.filter(
    (document) => normalizeText(document.text).length > 0,
  );
  if (readable.length < 2) {
    throw new AnalysisInputError(
      "Add at least one issued addendum and one final proposal, then try again.",
    );
  }

  const scored = readable
    .map((document) => ({ document, score: proposalScore(document) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    throw new AnalysisInputError(
      "We could not identify the final proposal; rename it with “proposal” or “bid” and try again.",
    );
  }

  if (scored.length > 1 && scored[0]?.score === scored[1]?.score) {
    throw new AnalysisInputError(
      "More than one file looks like the final proposal; keep one proposal and try again.",
    );
  }

  const proposal = scored[0]!.document;
  const addendumDocuments = readable.filter(
    (document) => document !== proposal,
  );
  const references = addendumDocuments.flatMap(extractAddendumReferences);

  if (references.length === 0) {
    throw new AnalysisInputError(
      "No addendum number was readable; use searchable addendum files and try again.",
    );
  }

  const counts = new Map<string, number>();
  for (const reference of references) {
    counts.set(
      reference.canonicalIdentifier,
      (counts.get(reference.canonicalIdentifier) ?? 0) + 1,
    );
  }

  const unique = new Map<string, SourceReference>();
  for (const reference of references) {
    if (!unique.has(reference.canonicalIdentifier)) {
      unique.set(reference.canonicalIdentifier, reference);
    }
  }

  const proposalText = normalizeText(proposal.text);
  const genericAcknowledgment =
    /\b(all|any)\s+(issued\s+)?addenda\b/iu.test(proposalText) &&
    ACKNOWLEDGMENT_HINT.test(proposalText);

  const results: AddendumResult[] = [...unique.values()].map((reference) => {
    const snippet = proposalEvidence(
      proposalText,
      reference.canonicalIdentifier,
    );
    const duplicateSource =
      (counts.get(reference.canonicalIdentifier) ?? 0) > 1;
    if (snippet && !duplicateSource) {
      return {
        ...reference,
        status: "ACKNOWLEDGED",
        proposalSnippet: snippet,
        reason: "The final proposal visibly names this addendum identifier.",
        duplicateSource,
      };
    }
    return {
      ...reference,
      status: "REVIEW",
      proposalSnippet: snippet,
      reason: duplicateSource
        ? "This identifier appears in more than one issued file; confirm the source set."
        : genericAcknowledgment
          ? "The proposal uses general addenda language but does not visibly name this identifier."
          : "This identifier was not found next to addendum language in the final proposal.",
      duplicateSource,
    };
  });

  const reviewCount = results.filter(
    (result) => result.status === "REVIEW",
  ).length;
  return {
    status: reviewCount === 0 ? "ACKNOWLEDGED" : "REVIEW",
    proposalName: proposal.name,
    addendumDocumentCount: addendumDocuments.length,
    results,
    summary:
      reviewCount === 0
        ? `Visible identifier evidence found for all ${results.length} issued addenda.`
        : `${reviewCount} of ${results.length} issued addenda need a human review.`,
    limitation:
      "This checks visible identifier evidence only; it does not determine legal or bid responsiveness.",
  };
}
