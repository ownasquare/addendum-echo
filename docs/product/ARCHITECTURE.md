# Architecture

## Flow

```text
operator-selected local files
  -> count/type/byte validation
  -> local text or PDF.js extraction
  -> deterministic proposal scoring
  -> issued addendum identifier extraction
  -> contextual proposal evidence matching
  -> ACKNOWLEDGED or REVIEW result
  -> DOM-rendered cards and local Markdown download
```

No application server, database, account, provider, remote storage, or paid credential participates.

## Modules

- `src/files.ts`: format detection, size/count bounds, local text and PDF extraction, progress, and
  stable recovery messages.
- `src/analyze.ts`: pure normalization, identifier extraction, proposal classification, duplicate
  detection, contextual matching, and aggregate status.
- `src/report.ts`: deterministic Markdown evidence rendering.
- `src/main.ts`: selection, drag/drop, progress, accessible status, result DOM, and report download.
- `src/styles.css`: mobile-first layout and automatic light/dark tokens.

## Trust boundaries

- Files are untrusted input.
- Input bytes are bounded before parsing.
- PDF.js extracts text but no PDF script is executed by application code.
- Source text reaches the page only through `textContent`.
- Report content is generated as plain Markdown.
- Generated Blob URLs are revoked before replacement.

## Classification boundaries

Proposal selection is a deterministic score based on proposal/bid text and filename hints.
Equal top scores stop with a friendly ambiguity message instead of guessing.

Addendum IDs are canonicalized only for comparison; original display forms and source snippets are
retained. Generic “all addenda” language is never upgraded to exact evidence.

## Performance bounds

The app caps input at 20 files, 15 MB per file, and 60 MB total. PDF pages are processed
sequentially to keep progress predictable. The complete transformation is client-side; perceived
latency depends on file size and PDF complexity, not a provider call.
