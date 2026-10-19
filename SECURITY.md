# Security and responsible reporting

## Private reporting setup is pending

The repository owner or administrator needs to enable and verify GitHub private vulnerability reporting. This file does not enable that setting, and its availability is not claimed. Follow [GitHub's private-reporting setup instructions](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

If the repository's Security → Advisories page offers **Report a vulnerability**, use that private route for security findings. If it is unavailable, do not put exploit details, secrets, or personal information in public issues; wait for a verified private reporting route. No security email address is designated here.

## Safe reproduction

- Use minimal synthetic scenes and synthetic note text only.
- Include the affected app version/hash, browser version, expected and actual behavior, and a reproducible test case.
- Do not submit medical observations, identities, real scene names/notes, credentials, tokens, or private URLs.
- Inspect screenshots, stack traces, downloads, and logs for personal text and machine paths before sharing.
- Do not test against other people's files, accounts, devices, or data.

## Security boundaries

The app has no accounts, backend, runtime credentials, telemetry, or remote assets. Scene imports are bounded, closed-schema JSON; they must never execute code, fetch URLs, or insert active markup. Optional notes are exported separately only after preview and explicit selection. These design restrictions do not constitute an independent security certification.

The application does not intentionally persist notes in browser storage. Browsers, extensions, session restoration, device backups, or syncing may retain or copy content. Closing the page is not secure deletion. Treat both scene names and note exports as potentially personal data.

Never commit real exports, secrets, unreviewed logs, or private screenshots. `.gitignore` is a convenience, not a privacy barrier: it does not remove already tracked files, scrub history, prevent forced additions, or redact CI output. Review the exact commit contents and generated artifacts before publication.

Use normal browser security and sandboxing. Do not disable security features to reproduce a test or work around an environment blocker. Any newly proposed networking, persistence, imported capabilities, or data collection needs a separate scope and security review.

## Project status

This is an engineering preview. Synthetic checks and the scoped sandbox-enabled headless Chrome CI suite pass; physical-device compatibility, OS-dialog workflows, and full accessibility review remain unverified. See the [test report](imagery-app/test-results/TEST-REPORT.md) for exact evidence. Security testing does not establish medical safety or efficacy. No support response time or security guarantee is promised.
