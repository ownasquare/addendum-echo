# Security policy

## Supported version

The current `main` branch is supported for security fixes.

## Data boundary

Addendum Echo reads selected files inside the local browser process. The shipped application has no
API endpoint, analytics, account, telemetry, remote storage, payment, or provider integration.

The downloadable Markdown report can contain snippets from the selected files. Treat it with the
same confidentiality as the bid package. Avoid real confidential bid data on shared or untrusted
computers.

## Input controls

- Accepted formats are searchable PDF, UTF-8 text, and Markdown.
- The app limits file count, individual size, and total size before extraction.
- Text is rendered with DOM text nodes, not raw HTML.
- PDF parsing uses the locked `pdfjs-dist` dependency in the browser sandbox.
- No file content is executed.

## Reporting a vulnerability

Open a private GitHub security advisory in this repository. Include:

- the affected commit,
- reproduction steps using synthetic data,
- observed and expected behavior, and
- likely impact.

Do not include confidential bid files, credentials, personal data, or proprietary documents.
Please allow maintainers time to investigate before public disclosure.

## Non-security limitations

A `REVIEW` or `ACKNOWLEDGED` result is evidence assistance, not a legal, procurement, compliance,
or bid-responsiveness determination.
