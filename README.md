# Addendum Echo

Addendum Echo checks whether one final bid proposal visibly names every issued addendum identifier.
Drop searchable PDF or text files into one local browser screen, press one button, and review
source-linked `ACKNOWLEDGED` or `REVIEW` evidence.

The app checks visible identifier evidence only. It does **not** determine whether a bid is legally
responsive, complete, timely, or acceptable to an owner.

## Why this is narrow

Public-works bid packages often require bidders to acknowledge issued addenda. Teams still describe
last-minute addenda, manual checklists, and rejected bids after an acknowledgment was missed.
Addendum Echo addresses only the final visible-identifier check; it is not bid-management or
procurement software.

## Ten-second workflow

1. Drop one final proposal plus one or more issued addenda.
2. Press **Check the proposal**.
3. Review the result or download its Markdown evidence report.

There is one screen, one multi-file input, and one dominant action. There are no accounts,
credentials, settings, uploads, or provider calls.

## Supported files and limits

- Searchable PDF, UTF-8 text, and Markdown files.
- 2–20 files.
- 15 MB per file and 60 MB for the full set.
- Exactly one file must look like the final bid/proposal.
- Issued addenda must contain readable identifiers such as `Addendum No. 2`.

Image-only scans are not OCR-processed. Use a searchable copy.

## Local use

Requirements:

- Node.js 20.19 or newer.
- npm 10 or compatible.

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). File bytes stay in the browser
process; the app has no network submission path.

## Validation

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run audit:project
npm audit --audit-level=high
npm run test:e2e
```

`npm run validate` runs the complete sequence. Vitest owns module tests. Playwright exclusively
owns E2E and rendered browser validation.

## How the result is formed

1. PDF.js extracts searchable text locally.
2. Deterministic rules identify the strongest proposal candidate.
3. Issued files supply addendum identifiers and source snippets.
4. The proposal is searched for identifiers next to addendum language.
5. Exact visible evidence becomes `ACKNOWLEDGED`; missing, generic, ambiguous, or duplicate
   evidence becomes `REVIEW`.

No AI model decides the result. The same text produces the same classification.

## Proof boundaries

| Layer                     | Status                              |
| ------------------------- | ----------------------------------- |
| Local source and workflow | Tested with invented fixtures       |
| Public source repository  | Recorded after the publication gate |
| Hosted application        | Not deployed                        |
| Production application    | Not deployed                        |
| Provider/dashboard        | Not used                            |
| Payment or revenue        | Not connected or proven             |
| Buyer, usage, or demand   | Not proven                          |

Public pain evidence supports the experiment; it does not prove demand or product-market fit.

## Security and privacy

See [SECURITY.md](SECURITY.md). Do not use real confidential bid data on a shared or untrusted
computer. Generated reports can repeat source snippets and should be handled like the source files.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep the product one-screen and deterministic unless a new
qualification explicitly authorizes a different scope.

## License

MIT. See [LICENSE](LICENSE).
