# Addendum Echo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-screen, local-only browser app that checks whether one draft construction
proposal visibly names every issued addendum in the same file drop.

**Architecture:** Vite serves a static vanilla-JavaScript app. `files.js` extracts searchable text
from local PDF and text files without uploading bytes; `analyze.js` deterministically classifies
documents, extracts issued addendum identifiers, and matches them to explicit proposal evidence.
The UI renders only evidence presence and never makes a legal-responsiveness decision.

**Tech Stack:** JavaScript ES modules, Vite, PDF.js, Vitest, Playwright, axe-core, ESLint,
Prettier, TypeScript check-JS.

---

## File map

- `index.html` — one accessible screen, one multi-file input, one oversized primary action.
- `src/main.js` — file selection, progress, success, result, and recovery state orchestration.
- `src/analyze.js` — pure deterministic classification and acknowledgment analysis.
- `src/files.js` — local bounded PDF/text extraction.
- `src/report.js` — safe Markdown report serialization and browser download.
- `src/styles.css` — mobile-first layout, automatic light/dark tokens, interaction states.
- `tests/unit/analyze.test.js` — core success, ambiguity, and false-positive coverage.
- `tests/unit/report.test.js` — safe deterministic report output.
- `tests/e2e/workflow.spec.js` — real file workflow, recovery, keyboard, hard UX contract.
- `tests/e2e/visual.spec.js` — phone/tablet/desktop light/dark screenshots and axe checks.
- `tests/fixtures/` — clearly labeled local text fixtures.
- `scripts/audit.mjs` — license, secret-pattern, forbidden-UI, and required-doc checks.
- `docs/addendum-echo/` — completion evidence and validation receipt.
- `docs/product/` — architecture, decisions, privacy, and monetization hypothesis.
- `docs/handoffs/` — the required twelve-section continuation package.

### Task 1: Project tooling and failing analyzer contract

**Files:**

- Create: `package.json`
- Create: `vite.config.js`
- Create: `playwright.config.js`
- Create: `eslint.config.js`
- Create: `jsconfig.json`
- Create: `.gitignore`
- Test: `tests/unit/analyze.test.js`

- [ ] **Step 1: Define scripts and bounded dependencies**

`package.json` must expose:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "vite build",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "audit:project": "node scripts/audit.mjs",
    "validate": "npm run format:check && npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run audit:project"
  }
}
```

- [ ] **Step 2: Write the failing analyzer success test**

```js
import { describe, expect, it } from "vitest";
import { analyzeDocuments } from "../../src/analyze.js";

it("matches every issued addendum to explicit proposal evidence", () => {
  const result = analyzeDocuments([
    { name: "Addendum-01.txt", text: "ADDENDUM NO. 01\nIssued March 2, 2026" },
    { name: "Addendum-02.txt", text: "ADDENDUM NO. 02\nIssued March 7, 2026" },
    {
      name: "Bid-Proposal.txt",
      text: "We acknowledge Addendum No. 01 dated March 2 and Addendum No. 02 dated March 7.",
    },
  ]);
  expect(result.status).toBe("acknowledged");
  expect(result.items.map((item) => item.identifier)).toEqual(["01", "02"]);
});
```

- [ ] **Step 3: Run the focused test and confirm expected failure**

Run: `npm run test:unit -- tests/unit/analyze.test.js`

Expected: FAIL because `src/analyze.js` does not exist.

### Task 2: Deterministic acknowledgment analysis

**Files:**

- Create: `src/analyze.js`
- Modify: `tests/unit/analyze.test.js`

- [ ] **Step 1: Implement normalized identifier extraction**

The public API is:

```js
export function extractAddendumReferences(text) {
  const found = [];
  const pattern =
    /\b(?:addendum|addenda|amendment)\s*(?:no\.?|number|#)?\s*([a-z0-9][a-z0-9.-]{0,12})/gi;
  for (const match of text.normalize("NFKC").matchAll(pattern)) {
    found.push({
      identifier: normalizeIdentifier(match[1]),
      index: match.index ?? 0,
    });
  }
  return found;
}

export function analyzeDocuments(documents) {
  // Returns { status, proposal, addenda, items, summary }.
}
```

- [ ] **Step 2: Require exactly one proposal and at least one issued addendum**

Classify an issued addendum only when the filename or leading text contains an addendum label plus
an identifier. Treat the remaining readable document as the proposal. Return one stable
`needs_files` result when either side is absent.

- [ ] **Step 3: Preserve explicit evidence and reject generic-only language**

For every issued identifier, require the proposal to contain that identifier within the same
bounded sentence/snippet as `addendum`, `addenda`, or `amendment`. A proposal that says only
“all addenda acknowledged” must return `review`, never `acknowledged`.

- [ ] **Step 4: Add and pass edge-case tests**

Cover zero-padded equivalents (`1` and `01`), duplicate issued files, unrelated numbers, generic
acknowledgment, multiple proposal candidates, missing proposal, missing addenda, and empty text.

Run: `npm run test:unit -- tests/unit/analyze.test.js`

Expected: PASS.

### Task 3: Local file extraction

**Files:**

- Create: `src/files.js`
- Create: `tests/unit/files.test.js`

- [ ] **Step 1: Write the failing text-file test**

```js
it("reads a supported text file locally", async () => {
  const file = new File(["ADDENDUM NO. 3"], "Addendum-3.txt", {
    type: "text/plain",
  });
  await expect(readLocalFile(file)).resolves.toMatchObject({
    name: "Addendum-3.txt",
    text: "ADDENDUM NO. 3",
  });
});
```

- [ ] **Step 2: Implement bounded text and PDF extraction**

`readLocalFiles(files)` must enforce 20 files, 15 MiB per file, and 60 MiB total. Text uses
`file.text()`. PDF uses `pdfjs-dist` page text content, joining items with spaces and pages with
newlines. The module must not call `fetch` or any remote URL.

- [ ] **Step 3: Return stable friendly failure categories**

Use internal categories `unsupported_file`, `file_too_large`, `too_many_files`, `unreadable_pdf`,
and `empty_file`; UI copy stays outside the extraction module.

- [ ] **Step 4: Pass extraction tests**

Run: `npm run test:unit -- tests/unit/files.test.js`

Expected: PASS.

### Task 4: Single-screen workflow and result report

**Files:**

- Create: `index.html`
- Create: `src/main.js`
- Create: `src/report.js`
- Create: `src/styles.css`
- Test: `tests/unit/report.test.js`

- [ ] **Step 1: Build the only input surface**

`index.html` must include one `<input id="bid-files" type="file" multiple>` inside one large
keyboard-focusable drop label. It must not include `<select>`, settings, navigation, credentials,
login, signup, onboarding, or instruction panels.

- [ ] **Step 2: Build the only dominant action**

Use exactly one element with `data-primary-action`:

```html
<button id="check-button" data-primary-action type="button" disabled>
  Check acknowledgments
</button>
```

- [ ] **Step 3: Wire empty, progress, success, review, and error states**

`main.js` reads the selected files only after the primary action, disables double-submit, announces
progress through `role="status"`, renders per-addendum evidence, and restores focus to the result
heading. All visible errors are one plain sentence ending with one retry action.

- [ ] **Step 4: Add a subordinate Markdown download**

`report.js` serializes identifiers, statuses, source filenames, evidence snippets, and the legal
boundary. The download control appears only after a result and is visually subordinate to the
primary action.

- [ ] **Step 5: Pass unit, format, lint, and type checks**

Run: `npm run test:unit && npm run format:check && npm run lint && npm run typecheck`

Expected: PASS.

### Task 5: Automated hard-contract and accessibility proof

**Files:**

- Create: `tests/fixtures/Addendum-01.txt`
- Create: `tests/fixtures/Addendum-02.txt`
- Create: `tests/fixtures/Bid-Proposal-complete.txt`
- Create: `tests/fixtures/Bid-Proposal-missing.txt`
- Create: `tests/e2e/workflow.spec.js`
- Create: `tests/e2e/visual.spec.js`

- [ ] **Step 1: Prove the complete workflow**

Upload two issued addenda plus the complete proposal through `#bid-files`, activate
`[data-primary-action]`, and assert an acknowledged summary plus two source-linked rows.

- [ ] **Step 2: Prove the primary recovery workflow**

Upload the missing proposal fixture, assert one short recovery sentence and one review row, replace
the proposal, rerun, and assert success.

- [ ] **Step 3: Enforce the hard UI contract**

Assert one file input, one `[data-primary-action]`, zero selects, zero password inputs, zero
navigation elements, no horizontal overflow, and a primary-button bounding box larger than any
other button.

- [ ] **Step 4: Enforce keyboard and axe behavior**

Tab to the drop zone and action, initiate the workflow from the keyboard, and run
`AxeBuilder({ page }).analyze()`. Fail on serious or critical violations.

- [ ] **Step 5: Capture all six visual proof cells**

Capture light and dark screenshots at 390×844, 1024×768, and 1440×900 after a complete result.

Run: `npm run test:e2e`

Expected: PASS with six screenshots under `proof/screenshots/`.

### Task 6: Open-source, security, and completion documentation

**Files:**

- Create: `README.md`
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `docs/product/architecture.md`
- Create: `docs/product/decisions.md`
- Create: `docs/product/privacy-and-security.md`
- Create: `docs/product/monetization-hypothesis.md`
- Create: `docs/addendum-echo/2026-07-27-completion.md`
- Create: `docs/handoffs/2026-07-27-codex-addendum-echo.handoff.mdc`

- [ ] **Step 1: Document the exact user workflow**

README commands must be limited to actual install, run, test, build, and validation scripts.
Document PDF text-layer limits and the no-legal-advice boundary next to the result description.

- [ ] **Step 2: Document data and security boundaries**

State that files remain in browser memory, no network processing is implemented, dependencies are
bundled at build time, and an exposed dev server is unsupported.

- [ ] **Step 3: Record proof layers separately**

Completion documentation must use:

```text
Validation Environment:
Validation Scope:
Data Integrity Classification:
Mock/Fixture Usage:
Production Validation Status:
Localhost Validation Integrity:
Warning/Issue Triage:
Warning Suppression Status:
```

- [ ] **Step 4: Write the twelve-section handoff from the home template**

Read `/Users/fortunevieyra/.codex/rules/post-chat-handoff.md` immediately before producing the final
handoff; do not reconstruct the template from memory.

### Task 7: Release-readiness audits and proof inspection

**Files:**

- Create: `scripts/audit.mjs`
- Create: `docs/addendum-echo/validation-receipt.json`
- Create: `proof/screenshots/*.png`

- [ ] **Step 1: Implement the deterministic project audit**

The audit must verify MIT license text, required documents, no tracked `.env`, no credential-shaped
assignment, no forbidden UI controls, one primary action marker, and no Cypress E2E path.

- [ ] **Step 2: Run every local gate**

Run:

```text
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run audit:project
npm audit --audit-level=high
npm run test:e2e
npm pack --dry-run
```

Expected: every command exits zero.

- [ ] **Step 3: Inspect every screenshot**

Open all six PNGs with the local image viewer and check for blank state, exception overlay,
clipping, hidden actions, low contrast, misleading results, or broken responsive layout. Fix and
recapture any failed cell.

- [ ] **Step 4: Write the validation receipt**

Set `tests_passed`, `secret_scan_passed`, and `license_check_passed` to `true`;
`browser_proof.status` must be `passed`. Include commands and screenshot paths.

### Task 8: Commit, publication, registry, and lane closeout

**Files:**

- Modify: `docs/addendum-echo/2026-07-27-completion.md`
- Modify: `docs/handoffs/2026-07-27-codex-addendum-echo.handoff.mdc`
- Create outside app: completed-app registry record and refreshed Lane 13 handoff/memory

- [ ] **Step 1: Commit the validated app on main**

Stage exact app files, commit once the tree is clean, rerun the critical unit/build/audit smoke,
and record the local SHA plus committed paths.

- [ ] **Step 2: Publish through the scoped publisher**

Invoke `codex-ai-project-github-publish.py` with the exact app path, `addendum-echo`, the validation
receipt, and a concise description. Require public visibility, default branch `main`, and matching
local/remote SHA.

- [ ] **Step 3: Record and independently read back GitHub proof**

Call `codex-app-factory-state.py record-github`, then verify the repository API response and Git
remote main SHA without changing global CLI authentication.

- [ ] **Step 4: Write the immutable completed-app record**

Record the claim, workflow, tech stack, tests, audits, accessibility, screenshots, MIT license,
local SHA, public repository URL, and separate hosted/production/provider/payment/demand fields.

- [ ] **Step 5: Empty the tested queue and complete the lane**

Checkpoint only after all work is validated, call `complete-app`, and require state readback
`status=complete`, zero next steps, and `github_push_verified=true`.

- [ ] **Step 6: Run durable closeout**

Run self-learning post-run, update automation memory with the current run time, refresh the TOML
with at least twenty detailed next-cycle tasks, sync durable home automation mirrors, and complete
the final post-chat handoff.

## Self-review

- Spec coverage: every hard UX, local-first, test, documentation, publication, state, and proof
  requirement maps to a task above.
- Placeholder scan: no implementation step relies on TBD, TODO, or an unspecified edge case.
- Type consistency: `readLocalFiles` returns `{name, text}` records consumed by
  `analyzeDocuments`; results use `{status, proposal, addenda, items, summary}` throughout.
