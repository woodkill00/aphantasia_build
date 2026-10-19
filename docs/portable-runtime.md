# Portable runtime rationale

Reviewed 2026-10-19. This is an engineering rationale, not proof of cross-browser compatibility.

## Why one HTML file

Local-file origins can be opaque or implementation-dependent. Adjacent files are not a reliable same-origin resource set. That supports embedding the runtime code, styles, and initial definitions rather than fetching nearby assets. [MDN: same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy#file_origins)

The portable artifact therefore uses inline classic JavaScript, inline CSS, Canvas 2D, and semantic HTML. Node is a development/test tool only. No runtime dependency installation, server, CDN, or account is needed by the design.

## Files are the persistence boundary

The user selects JSON through a file input. Content is validated before acceptance; a file extension is not validation. Export creates a local Blob download request. The app cannot guarantee that browser settings allow the download or that the requested file reaches disk.

The prototype deliberately avoids `localStorage`: its behavior for `file:` documents is undefined and browser-dependent, and access can throw. Exported files are the explicit recovery mechanism. [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Verification requirements

A successful HTTP development-server run does not establish direct-file behavior. Check the exact generated HTML using the real operating-system opening workflow and an actual `file:` URL. Exercise imports, real downloads, network-disabled use, and a moved/renamed copy.

Phone-sized CSS and browser emulation cannot establish mobile file opening. Some mobile file viewers only preview documents. Physical iOS and Android checks must record the actual browser launch, JavaScript execution, chooser, download location, and touch/keyboard behavior before support is claimed.

Do not bypass a security warning, disable a sandbox, or change local-file security flags to meet a portability claim. A blocked platform is a documented limitation until tested through a permitted ordinary workflow.

The current sandbox-enabled headless Chrome run passed file-URL launch, offline request observation, actual downloads, and file-input round trips for the tested artifact. This is browser evidence for that environment, not verification of ordinary OS dialogs or physical phones. The exact artifact, versions, and remaining checks are in the [software test report](../imagery-app/test-results/TEST-REPORT.md).
