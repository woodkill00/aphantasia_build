# Architecture and data contract

Version 0.2.0 implementation; non-browser checks passed, real-browser verification pending. Updated 2026-10-19. Historical version 0.1 results do not verify this redesign.

## Components and rendering

- `imagery-app/src/model.js`: closed validation, canonical serialization, legacy migration, deterministic geometry, presets, and the interaction controller.
- `imagery-app/src/app.js`: semantic controls, object selection/placement, Canvas 2D drawing, fullscreen/lifecycle handling, local file reading, and Blob downloads.
- `imagery-app/src/shell.html` and `style.css`: full-window layout, collapsible editor, guidance, focus, and responsive rules.
- `imagery-app/src/assemble.cjs`: developer-only assembler producing the self-contained `index.html`.
- `imagery-app/tests/`: synthetic model, DOM/Canvas-double, static, CDP transport/fixture, and separately gated real-browser checks.

The runtime uses inline classic scripts/styles, system fonts, and no remote assets. It redraws only for relevant events. There is no animation loop or periodic progression; the only UI timeout cleans up download URLs and cannot reveal a scene.

The canvas fills the window behind the editor and persistent viewing controls. Optional browser fullscreen targets their shared root so Hide/End remain inside it. Entry, exit, rejection, and fullscreen events conceal; unsupported or rejected fullscreen leaves the full-window layout available. Closing/opening the editor also conceals. The top **Viewing guidance** shortcut opens/focuses the guidance; the skip link opens/focuses scene controls. Fullscreen transitions focus the appropriate entry/exit control; Escape does not suppress the browser's own fullscreen exit.

Object centers use percentages of the actual width and height. Size and outline width use the shorter side, preserving circles and squares on rectangular displays. Backing-store scaling compensates for rounded buffer dimensions; it is capped at 4,096 pixels per dimension and 8,388,608 total pixels, with device-pixel ratio capped at 2. These are resource bounds, not display-quality or safety guarantees.

## Version 2 scene schema

A file has exactly `format`, `version`, `sampler`, and `scene` keys, with values `imagery-static-scene`, `2`, and `static-objects-2`. `scene` has exactly `name`, `background`, and `objects`.

- `name`: 1–64 JavaScript string code units, nonblank; `U+0000–001F`, `U+007F–009F`, `U+202A–202E`, and `U+2066–2069` are rejected. Names are not trimmed or interpreted as markup.
- `background`: exactly integer `h` (0–359), `s` (0–60), and `l` (0–40).
- `objects`: an ordered array of 0–12 objects. Zero objects is a valid background-only scene. Later objects draw over earlier ones; overlap is allowed.
- Each object has exactly `id`, `shape`, `x`, `y`, `size`, and `color`.
- `id`: unique within the scene, matching `object-[1-9][0-9]{0,5}`.
- `shape`: `dot` (filled circle), `pixel` (filled square), or `circle`, `square`, `triangle` (outlines).
- `x`, `y`: finite numbers from 0–100, with at most two decimal places, subject to the inset below.
- `size`: integer 1–8 for dots/pixels; 1–28 for outlines. It is the diameter or bounding-square side as a percentage of the shorter field dimension. Outline width is one such unit.
- `color`: exactly integer `h` (0–359), `s` (0–70), and `l` (10–70).

For each axis the validator requires `1 + extent <= position <= 99 - extent`, where `extent = size / 2` for filled shapes and `size / 2 + 0.5` for outlines. This is a conservative normalized geometry constraint on rectangular fields. Pointer placement clamps to the same inset; numeric/imported out-of-range values are rejected. The UI caps size at 8 when changing an outline into a dot/pixel.

HSL values describe CSS color, not calibrated luminance or hardware brightness. At background lightness 0 the background is black; at saturation 0 hue has no visible effect. Shape, color, count, and inset limits are engineering choices, not medically safe settings.

`canonicalScene` is the exact source of truth. Built-ins, edits, imports, history, and exports pass through it. Unexpected fields, versions, samplers, nonordinary objects, accessors, array holes/extra properties, invalid scalars, and duplicate IDs are rejected. The JSON reader also rejects decoded duplicate keys, including nested keys inside arrays, and nesting deeper than 32. Imports are bounded to 1 MiB of UTF-8 JSON. Unsupported content is never evaluated, inserted as executable markup, or fetched.

## Version 1 migration

Version 1 imports must first satisfy the original `sparse-fixed-1` schema and geometry checks: one legacy contour or 1–5 fixed-offset dots; integer x/y 25–75, size 14–28, radius 1–2, a supported palette, and the original inset/separation/coverage limits. Validation precedes migration; malformed legacy files receive no relaxed route.

Migration preserves the name, gives the scene a black HSL background, and creates ordered `object-1`, `object-2`, … IDs. Each legacy dot becomes an independent dot at its fixed-offset center, with diameter `2 * dotRadius`; a contour keeps its shape, center, and size. Centers are rounded to two decimal places. Legacy slate/sage/sand colors become approximate whole-number HSL values `(208,11,48)`, `(126,8,49)`, and `(40,13,48)` respectively. The migrated result is validated again as version 2.

This preserves the logical composition, not a pixel-identical old screenshot: colors are approximated, and the full-window rectangular field maps center percentages across its actual dimensions while keeping shapes aspect-correct. Imports are accepted hidden. All new exports use version 2; no version 1 export is offered.

## Editing, visibility, and asynchronous work

Accepted scene data, a draft, 40-entry session history, visibility, and import tokens live in the controller. Selection and form/placement state live in the UI. Add/remove/move/size/shape/color/name changes and presets are staged; **Apply changes** commits through validation and **Discard** restores accepted data. Selection keeps existing staged edits. Invalid input retains the last accepted scene and must be fixed or discarded before Show/export. Undo/redo navigate accepted scenes, not individual draft keystrokes.

The field starts hidden. Scene edits, selection, placement, apply/discard, presets, imports, history, fullscreen changes, and editor toggles conceal. Hidden rendering clears both objects and the chosen background to black; controls and the hidden-state message remain. Placement uses one click/tap while hidden, reopens the editor afterward, and has numeric position alternatives. There is no drag animation or live scene preview.

Show is explicit and synchronous, requires no pending draft, and never queues a future reveal. Hide/End/Escape conceal immediately and cancel placement/pending import work. A 3,000 ms anti-repeat guard blocks early reveal attempts; it is an engineering restriction, not a viewing/recovery interval. Holding a button activation key does not repeatedly activate it.

Blur, hidden-tab, resize, pagehide, freeze, fullscreen changes, and restored-page handlers conceal. No delayed file or fullscreen completion can reveal. Import tokens prevent stale reads from replacing state after a newer invalidating action. Validation errors keep accepted data. Untrusted text reaches text/value sinks; status text is capped at 300 code units. Actual event delivery and control usability still require browser/device testing.

## Files, notes, and privacy

The accepted scene is explicitly exported as JSON and can be imported later. Draft changes must be applied or discarded first. Downloads are requested, not confirmed as durable disk writes. There is no autosave, browser storage, backend, account, telemetry, or runtime network dependency; refreshing/closing can lose unexported work.

Notes are independent of scene editing/history/import. Their separate export contains only `format: imagery-field-note`, `version: 1`, `category`, and `text`. Categories are `unsure`, `none`, `external-perception`, `residual-aftereffect`, `voluntary-imagery`, `conceptual-knowledge`, and `mixed`; text is at most 4,000 code units and cannot contain a null character. Export requires an exact preview and explicit selection; category/text changes invalidate that selection. Notes are never included in scene files and are not imported.

End viewing preserves data in the open page. Neither End nor closing the page is secure deletion: browser session restoration, extensions, device backups, and syncing may retain or copy content. Scene names and notes can contain personal text; inspect exports before sharing. Public examples and tests use synthetic data.

## Verification and boundaries

The version 0.1 headless Chrome pass is historical only. Version 0.2 has 214 passing non-browser checks on the artifact identified in the [root README](../README.md); the 38 prepared real-browser groups remain NOT RUN because local browser launch is blocked. No passing version 0.2 CI run is recorded. Physical devices, ordinary OS dialogs, manual accessibility, and qualified sensory/content review remain separate gates. See the [plan](plan.md) and [test report](../imagery-app/test-results/TEST-REPORT.md).

Version 0.2 supports a small flat collection of simple objects. Arbitrary groups, freeform paths, textures, shaders, animation, durable storage, timed protocols, diagnostics, participant systems, and efficacy measures remain outside scope.
