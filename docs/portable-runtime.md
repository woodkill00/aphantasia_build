# Portable runtime rationale

Reviewed 2026-10-20. This is an engineering rationale, not proof of cross-browser compatibility. The current scene, separate snapshot-sequence and item-timeline modes require exact-artifact direct-file evidence; previous-version results do not establish a new version.

## Why one HTML file

Local-file origins can be opaque or implementation-dependent. Adjacent files are not a reliable same-origin resource set. That supports embedding runtime code, styles, and initial definitions rather than fetching nearby assets. [MDN: same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy#file_origins)

The portable artifact uses inline classic JavaScript, inline CSS, Canvas 2D, and semantic HTML. The scene model, pure sequence and item-timeline engines, and UI are assembled into the same HTML; playback does not load a remote library, fetch a scene, or require a server. Node is a development/test tool only. No runtime dependency installation, CDN, or account is needed by the design.

## Files are the persistence boundary

The user selects JSON through file inputs. Content is validated before acceptance; an extension is not validation. Static scene JSON, sequence JSON, and optional note JSON are separate documents and downloads:

- Scene files use `imagery-static-scene`, version 3, with validated version 1/2 migration. They retain item outline/shadow, fade timing and shared pulse-period metadata. Imported backgrounds are preserved.
- Sequence files use `imagery-field-sequence`, version 2, with validated version 1 migration, containing ordered immutable styled-object snapshots, per-step pulse-period metadata, snapshot timing, and one shared background. They omit playback position/state, notes, and unsupported executable/loop capabilities.
- Notes use `imagery-field-note`, version 1, and require their own exact preview and explicit selection. Notes are not imported.

Scene/sequence imports are bounded to 1 MiB UTF-8 and leave the field stopped/hidden. Failed or superseded reads must not replace accepted data or restore visibility. Export requests a local Blob download; the app cannot guarantee browser permission or a completed disk write. Check Downloads and keep the page open if the request fails.

The prototype deliberately avoids `localStorage`: behavior for `file:` documents is undefined and browser-dependent, and access can throw. Exported files are the explicit recovery mechanism. [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Closing/refreshing may lose unexported work. Browser restoration, extensions, backups, and cloud-folder syncing may still retain/copy content; closing is not secure deletion. Names and notes may contain personal text, so inspect files before sharing. No account, telemetry, backend, durable autosave, or hosted deployment is introduced.

## Playback remains local and cancelable

Only explicit **Play once** or **Play items once** starts its separate finite, windowed clock. Snapshot playback renders static full-opacity items and does not nest their pulse/fade schedules; item playback uses each item’s finite schedule. Static Live preview has no clock. Manual/static previews may use browser fullscreen, but entering/exiting it cancels and conceals. Background tabs, loss of focus, resize, suspension, restoration, and reduced-motion changes must stop/conceal rather than resume or catch up. Reduced-motion preference uses manual snapshot stepping and disables timed item playback; static Live preview remains available. The single main and offscreen canvas pair has a combined allocation cap; no remote asset or hidden persistence is needed for transitions.

Supported durations/counts and rendering caps are product capacities, not medical thresholds. No automatic replay, unrestricted strobe, independent pulse frequencies or contrast inversion is included. Optional finite item pulse uses the shared-clock opacity contract in [the item specification](item-timeline.md); its engineering bounds do not certify sensory safety. Effect-curve authoring and offscreen output-analysis proposals remain separate future work.

## Verification requirements

A successful HTTP development-server run does not establish direct-file behavior. Check the exact generated HTML using an actual `file:` URL and separately the ordinary operating-system opening workflow. Exercise scene/sequence imports, real scene/sequence/note downloads, network-disabled use, a moved/renamed copy, and playback interruptions. Controlled-clock browser sampling does not replace a natural scheduling check.

Phone-sized CSS and browser emulation cannot establish mobile file opening. Some mobile viewers only preview documents. Physical iOS/Android checks must record actual browser launch, JavaScript execution, chooser, download location, touch/keyboard behavior, and lifecycle handling before support is claimed.

Do not bypass a security warning, disable a sandbox, or change local-file security flags to meet a portability claim. A blocked platform is a documented limitation until tested through a permitted ordinary workflow.

Exact current and historical artifact results are identified in the [root README](../README.md) and test report. Earlier-version direct-file, offline, download and import evidence does not automatically verify later changes. Ordinary OS dialogs, physical phones, Safari, and complete manual accessibility remain unverified. See the [test report](../imagery-app/test-results/TEST-REPORT.md) for artifact hashes, versions, failed attempts, blockers, and remaining checks.
