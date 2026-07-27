# Architecture and product decisions

## ADR-001: visible evidence, not responsiveness

Decision: report only whether the proposal visibly names issued identifiers.

Reason: legal responsiveness depends on jurisdiction, solicitation language, timing, signatures,
and owner discretion. A broader status would overstate the evidence.

## ADR-002: local deterministic rules

Decision: use explicit rules and local PDF/text extraction rather than an AI model or hosted API.

Reason: the narrow identifier task is deterministic, reproducible, fast, and credential-free. Local
processing also avoids a new bid-data transmission path.

## ADR-003: one proposal by evidence score

Decision: identify one strongest proposal candidate and stop on an equal-score tie.

Reason: adding a selector would violate the one-input contract; guessing would make evidence
unreliable. The recovery action is to keep or rename one final proposal.

## ADR-004: generic language remains review

Decision: “all addenda acknowledged” without visible identifiers stays `REVIEW`.

Reason: the product promise is exact visible-identifier evidence. Upgrading generic language would
erase the distinction the app exists to surface.

## ADR-005: no OCR in version 1

Decision: image-only scans receive a friendly searchable-copy recovery message.

Reason: OCR adds large dependencies, variable accuracy, latency, and a second confidence system.
It is not required for the smallest complete product.

## ADR-006: screenshots are validation artifacts, not product assets

Decision: responsive proof is written to a temporary validation directory, not committed.

Reason: screenshots can drift from source and bloat the open-source repository. The repeatable
Playwright specification is the durable proof mechanism.
