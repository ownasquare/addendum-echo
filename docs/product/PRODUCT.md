# Product contract

## User and job

The primary user is a small public-works contractor estimator or bid coordinator. Immediately
before submission, they need to confirm the final proposal visibly names every issued addendum
without opening a bid-management system or sending bid files to a service.

## Trigger, input, transformation, outcome, surface

- Trigger: final bid-package review after issued addenda have been collected.
- Input: one final proposal and one or more issued addenda as local searchable PDF/text files.
- Transformation: deterministic local extraction, document classification, identifier discovery,
  contextual proposal matching, and snippet preservation.
- Outcome: source-linked `ACKNOWLEDGED` or `REVIEW` evidence plus a downloadable Markdown report.
- Surface: one responsive local browser screen.

## Hard simplicity contract

- One screen and no navigation.
- One multi-file drop zone.
- Exactly one oversized primary action.
- No account, login, setup, credentials, API key, dropdown, select, settings, or tutorial.
- Automatic light/dark appearance without a theme control.
- One short friendly recovery sentence for each expected failure class.

## Meaning of statuses

`ACKNOWLEDGED` means the final proposal contains the same canonical identifier next to addendum
language and the issued identifier is not duplicated across source files.

`REVIEW` means exact visible evidence was not found, the proposal uses only generic language, the
source identifier is duplicated, or a human needs to reconcile ambiguity.

Neither status determines legal responsiveness or owner acceptance.

## Deliberate exclusions

- OCR for image-only scans.
- Full bid-scope comparison.
- Addendum content-diff or compliance review.
- Deadline tracking, submission, signatures, bidder identity, procurement portals, or owner
  workflows.
- Hosted history, accounts, collaboration, telemetry, payments, or analytics.

Each excluded area would change the semantic fingerprint and requires new evidence and
qualification.
