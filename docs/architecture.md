# Architecture and data contract

Status: implemented narrow prototype, version 0.1.0. Updated 2026-10-19.

## Components

- `imagery-app/src/model.js`: pure validation, canonical serialization, deterministic geometry, presets, and an interaction controller.
- `imagery-app/src/app.js`: semantic-control bindings, Canvas 2D drawing, lifecycle handling, local file reading, and Blob downloads.
- `imagery-app/src/shell.html` and `style.css`: interface structure, guidance, focus and responsive-layout rules.
- `imagery-app/src/assemble.cjs`: developer-only assembler producing the committed self-contained `index.html`.
- `imagery-app/tests/`: synthetic model, DOM/Canvas-double, static, CDP transport/fixture, and separately gated real-browser checks.

The runtime uses inline classic scripts and styles, with system fonts and no remote assets. It redraws on relevant events; it has no animation loop or periodic progression. The only timeout in the current UI performs download-object cleanup.

## Scene schema

A scene file has exactly `format`, `version`, `sampler`, and `scene` keys. The supported values are `imagery-static-scene`, `1`, and `sparse-fixed-1`. The nested scene has exactly `name`, `shape`, `x`, `y`, `size`, `dotCount`, `dotRadius`, and `palette`.

- Shape: sparse dots, one circle, one square, or one triangle contour.
- Position: integer x/y from 25 to 75 in the logical field.
- Size: integer 14 to 28; dot count: 1 to 5; dot radius: 1 to 2.
- Palette: slate, sage, or sand.
- Name: 1 to 64 characters, nonblank and without the rejected control/bidirectional-control characters.
- Dot offsets are fixed by the sampler version; no runtime randomness is used.

`canonicalScene` is the source of truth for exact checks. It verifies geometry after generation. Unknown fields/versions/samplers, arrays, extra nesting, decoded duplicate keys, accessors, and invalid scalar values are rejected. Imports are bounded to 1 MiB of UTF-8 JSON. These are format/resource bounds, not health thresholds.

## State and visibility

Accepted data, draft edits, undo/redo history, visibility, and import tokens are controlled together. History is limited to 40 entries. A valid edit can be staged, applied, or discarded. Applying edits, choosing a preset, importing, undoing, and redoing leave the scene hidden.

Show is explicit and synchronous; it does not queue an eventual reveal. Hide and End conceal immediately and invalidate pending import work. A 3,000 ms anti-repeat guard is an engineering control only, never a suggested viewing or recovery interval. Lifecycle handlers hide on blur, hidden-tab, resize, pagehide, freeze, and restoration paths. A browser/device that does not deliver these events still requires real testing.

Late file-read results cannot overwrite state after a newer invalidating action. Validation failure retains the prior accepted scene. UI status is bounded, and untrusted text reaches text/value sinks.

## Persistence and privacy

The accepted scene can be exported as JSON, then imported into a later session. Downloads are requested, not confirmed as durable disk writes. There is no autosave or browser-storage dependency; closing or refreshing can discard unexported work.

Optional notes use a separate export schema and are never included in a scene export. Export requires reviewing the exact preview and explicitly selecting the note. Edits invalidate that selection. Notes are not imported. Browser session restoration, extensions, device backups, and syncing may retain or copy content outside the app's control. Closing the page is not secure deletion.

## Boundaries and deferred features

The current model cannot represent arbitrary groups, dense pattern arrays, external textures, custom shaders, complex objects, or scenes. There is no timed research protocol, diagnostic classifier, efficacy endpoint, participant system, account, or service. Expanded capability requires separate specification and review.

Real-browser, physical-device, accessibility, and qualified sensory/content checks remain distinct from source-level correctness. See the [verification plan](plan.md).
