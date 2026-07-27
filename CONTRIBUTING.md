# Contributing

Addendum Echo is intentionally small. Contributions should preserve one outcome, one screen, one
multi-file input, exactly one dominant action, local processing, deterministic results, and
explicit evidence limitations.

## Development

```bash
npm install
npm run dev
```

Use synthetic documents only. Never commit real bids, personal information, secrets, tokens,
credentials, customer data, or provider exports.

## Required checks

```bash
npm run validate
```

The repository policy is:

- Vitest for unit and module tests.
- Playwright exclusively for E2E.
- No Cypress E2E.
- Automated axe checks plus inspected phone, tablet, and desktop light/dark screenshots for
  visible changes.
- No ignored warning or suppressed failing gate.

## Change rules

- Add focused tests for every rule or recovery-path change.
- Prefer explicit pure functions in `src/analyze.ts`.
- Preserve file-count and byte limits in `src/files.ts`.
- Keep source snippets rendered as text.
- Do not add authentication, settings, credentials, paid providers, network upload, hosted
  storage, bidder scoring, or legal conclusions without a fresh qualification decision.
- Update `CHANGELOG.md`, product documentation, completion documentation, and the handoff for
  material changes.

## Pull requests

Explain the user-visible change, proof commands, fixture classification, and remaining limitations.
Keep unrelated refactors out of the same change.
