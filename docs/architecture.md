# Architecture and data contract

Version 0.6 architecture, updated 2026-10-20. The [item-timeline specification](item-timeline.md) is authoritative for scene version 3, sequence version 2, appearance effects and finite item playback. The version 2/1 contracts below are historical migration inputs; their old closed-key lists must not be mistaken for the new export formats. Scoped live-edit source/native/rendered evidence and the separate CI gate are recorded in the test report. The [sequence contract](sequence-spec.md) remains authoritative for sequence presentation; historical passes do not verify new live behavior.

## Components and rendering

- `imagery-app/src/model.js`: closed static validation, canonical serialization, legacy migration, deterministic geometry, presets, and the existing visibility/history/import controller.
- `imagery-app/src/sequence-model.js`: closed sequence validation/parser/serializer, compiled timeline, deterministic frame sampling, and injected-clock playback state. It has no DOM, canvas, RAF, network, persistence, or visibility authority.
- `imagery-app/src/item-model.js`: pure finite per-item timeline compilation, sampling and playback state; it has no reveal or DOM authority.
- `imagery-app/src/app.js`: scene and sequence controls, atomic capture, object selection/placement, Canvas 2D compositing, scheduling, fullscreen/lifecycle handling, local file reads, and Blob downloads.
- `imagery-app/src/shell.html` and `style.css`: full-window field, compact Scene/Sequence section selection, one selected-step inspector, editor-only color samples, reachable Apply/capture actions, guidance, focus, and responsive rules.
- `imagery-app/src/assemble.cjs`: developer-only assembler producing the self-contained `index.html`.
- `imagery-app/tests/`: synthetic model, DOM/Canvas-double, static, CDP transport/fixture, and separately gated real-browser checks.

The runtime uses inline classic scripts/styles, system fonts, and no remote assets. Static/manual displays redraw on relevant events. Only an explicitly started, finite, single-pass snapshot sequence or item timeline schedules animation frames. The clocks never nest. At most one RAF is pending; no idle loop, autoplay or automatic replay is authorized. Optional item pulse uses the reviewed shared-clock opacity contract and ends with its item. The download-URL cleanup timer has no display authority.

Timed playback remains windowed so Pause and Stop are reachable. Static/manual previews may use clean fullscreen: normal workspace chrome is suppressed, a keyboard/touch Exit remains, and hidden fullscreen provides a separate explicit Show route. Fullscreen entry/exit/failure conceal. Editor toggles preserve an active live draft; other presentation modes conceal. Escape does not suppress native fullscreen exit. The decorative hidden-state circle is removed from the candidate source; hidden canvas pixels stay black behind ordinary interface text/controls.

Object centers use percentages of actual width and height. Size and outline width use the shorter side, preserving circles and squares on rectangular displays. Backing-store scaling compensates for rounded buffer dimensions; dimension caps remain 4,096 pixels and DPR at most 2. Main plus one offscreen canvas together must remain within 8,388,608 pixels, including resize allocations. No third full-size buffer is used. These are resource bounds, not display-quality or medical-safety guarantees.

For a transition, render opaque scene A on the main canvas and opaque scene B on the offscreen canvas, each against the same background; composite B over A at the sampled alpha. Reset transform, alpha, and compositing every frame. Never accumulate previous pixels or fade the combined output through an inserted black frame. A direct cut has no transition phase. Crossfades can contain 12 + 12 objects; the validated per-snapshot cap remains 12.

## Historical version 2 scene schema (migration input)

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

Migration preserves the name, gives the scene a black HSL background, and creates ordered `object-1`, `object-2`, … IDs. Each legacy dot becomes an independent dot at its fixed-offset center, with diameter `2 * dotRadius`; a contour keeps its shape, center, and size. Centers are rounded to two decimal places. Legacy slate/sage/sand colors become approximate whole-number HSL values `(208,11,48)`, `(126,8,49)`, and `(40,13,48)` respectively. The intermediate composition is validated under the original version 2 rules, then extended with disabled effects and default timing to the current version 3 document.

This preserves the logical composition, not a pixel-identical old screenshot: colors are approximated, and the full-window rectangular field maps center percentages across its actual dimensions while keeping shapes aspect-correct. Imports are accepted hidden. Current exports use scene version 3; the version 2 description here records the earlier migration stage. No legacy-version export is offered.

## Historical version 1 sequence schema (migration input)

This is separate from static scene version 1/2. The root has exactly `format: "imagery-field-sequence"`, `version: 1`, `sampler: "ordered-crossfade-1"`, and `sequence`. `sequence` has exactly `name`, `background`, and `steps`.

- Sequence name, step name, and step identifier use the existing nonblank 1–64-code-unit name restrictions, including control/bidi-character rejection. Step identifiers are unique within the sequence.
- `background` has the unchanged static HSL restrictions. It is shared by every step and remains constant during playback; valid nonblack backgrounds are supported.
- `steps` is an ordered dense array of 1–32 entries. Each entry has exactly `id`, `name`, `holdMs`, `transitionMs`, and `objects`.
- `objects` is a nonempty snapshot of 1–12 objects, validated through `ImageryModel.canonicalScene`. Object IDs must be unique within that snapshot, not across different steps. Static background-only scenes remain valid but cannot be sequence steps.
- `holdMs` is an integer from 1,000–600,000, in 500 ms increments. `transitionMs` is an integer from 0–60,000 in 500 ms increments for nonfinal steps; the final step's transition is exactly zero.
- The sum of all holds and outgoing transitions must be at most 3,600,000 ms. The default new hold is 3,000 ms; the default outgoing crossfade is 1,000 ms. Zero means a direct cut. These are supported engineering capacities, not medical thresholds, doses, or a recommended viewing schedule.

`ImagerySequence.canonicalSequence` validates and freezes an independent canonical document. `validateSequence` returns a success/error result; `parseSequence` rejects malformed text, decoded duplicate keys, and nesting deeper than 32; `serializeSequence` revalidates before writing JSON. Unknown fields, accessors, sparse/extended arrays, wrong scalar types, invalid totals, and unsupported capabilities are rejected. Canonical documents and input/output JSON remain bounded to 1 MiB UTF-8. Notes, playback state, URLs, callback names, expressions, loop flags, and hidden capabilities are not part of this format. Imported data is never executed or fetched.

## Editing and atomic capture

The existing controller owns accepted scene data, a draft, 40-entry scene-only history, visibility, and import tokens. UI state owns object selection, raw fields, placement, the accepted sequence, selected step, and sequence generation. Scene add/remove/move/size/shape/color/name changes and presets remain staged. **Apply changes** commits through validation; **Discard** restores the accepted scene. **Live preview** validates and reveals the current draft directly without applying. Subsequent valid manual object/background edits, selection, presets and placement redraw that draft synchronously without commits or new reveal requests. Invalid raw input stops/conceals; a correction remains hidden. Accepted scenes, history, and snapshots do not change from preview. Invalid raw input must be resolved before preview/export or timed Play. Undo/redo navigates accepted scenes and never changes sequence snapshots or notes.

Valid sequence name/timing edits commit immediately while stopped/hidden; there is no Apply sequence button. Invalid raw sequence fields retain accepted data and show a specific error. Play, sequence export, capture, and structural changes are blocked until the error is corrected or discarded. Steps are immutable copies: later scene edits do not silently modify them.

**Add scene as step** and **Replace selected step** combine scene application and snapshot capture when a draft exists. Preflight the static scene and the complete normalized sequence before committing either. A failure preserves both accepted documents and scene history, while canceling/concealing. The first capture seeds the shared background; later mismatched backgrounds are rejected. Loading a selected step into the scene editor copies it and blocks unresolved scene drafts.

Reorder/delete/append normalize only boundary transitions: the new final step gets zero; a former final moved earlier gets the default 1,000 ms; other values remain. Validate the whole candidate and announce adjustments. Reject atomically if the resulting total or another rule fails.

## Timeline and display authority

`compileTimeline` returns a frozen validated document, total duration, and half-open hold/transition phases. `frameAt` returns deterministic phase, source/destination indices, alpha, elapsed/remaining time, and completion. Zero-duration transitions have no phase or gap. The injected-clock `createTimeline` API exposes `start`, `tick`, `markPainted`, `pause`, `resume`, `stop`, and `getState`; it does not schedule work or reveal a display. Stale/unissued frames cannot be acknowledged as painted.

The exact 11-second reference is circle hold [0,3), circle→square crossfade [3,4), square hold [4,7), square→triangle crossfade [7,8), triangle hold [8,11), then hidden. Half-open boundaries mean 4 seconds is square hold and 11 seconds is complete. Halfway blends are sampled at 3.5 and 7.5 seconds. These values define an editable test/example timeline, not an exposure regimen.

One existing scene visibility gate controls explicit draft preview, manual Show step, and timed Play, including the 3,000 ms repeat-action guard. The field begins hidden; no draft edit, import, selection, frame callback, or delayed completion can call Show on the user's behalf. A blocked explicit reveal never queues a future reveal. The guard is an engineering restriction, not a recovery interval. Manual edits while already hidden still invalidate pending imports and stale display work, but do not extend the reveal deadline. An interruption of a visible display conceals and extends the guard; explicit Hide retains its lock even when already hidden. Existing recent deadlines remain in force. This avoids postponing an explicit preview after every hidden numeric edit without letting edits reveal content.

Play needs a valid sequence and resolved static/sequence fields, runs only in the window, and requires an explicit action. A callback may paint only if the captured scene epoch and sequence generation still match, the visibility gate is open, and playback remains running. It cannot reveal content. Pause cancels pending scheduling and freezes the last frame acknowledged as actually painted, including its exact elapsed position; it does not resample at click time and leaves the image visible. Resume is explicit and rebases the clock without catch-up.

Stop/Hide/End/Escape, invalid scene input, sequence edits, imports, sequence selection/mode changes, fullscreen changes, resize, blur, hidden tabs, freeze, pagehide, restoration, and reduced-motion changes invalidate generation and cancel RAF before concealing synchronously. Completion conceals to black and resets elapsed time without replay. Reduced-motion preference permits manual stepping rather than replacing fades with automatic cuts. Preference changes never automatically resume.

Static placement uses one click/tap with numeric alternatives; it retains an already active live preview, otherwise stays hidden. Small labeled color samples update directly from draft color sliders without touching the visibility gate. Untrusted names/statuses use text/value sinks; status text is bounded to 300 code units. Actual event delivery, composited pixels, and control reachability require independent browser checks.

`stageLive` validates and updates the draft while preserving only an already-visible gate; it cannot reveal. `previewDraft` is called only by the explicit Live preview action and obeys the same reveal guard. Both invalidate pending imports without modifying accepted data/history. Live updates have no RAF, timer or queued repaint; each input synchronously paints a complete validated draft. Stop/lifecycle events therefore cannot be followed by a delayed live reveal. The main canvas occupies an unobscured responsive region while editing, then returns to the whole field when the editor closes. Canvas geometry uses its current actual rectangle, keeping shapes proportional.

## Files, notes, and privacy

The accepted scene and sequence are separately exported/imported JSON documents. Static drafts must be applied/discarded before static export; invalid sequence fields must be resolved before sequence export. Imports stop and conceal, and stale reads cannot replace newer accepted state. Downloads are requested, not confirmed as durable disk writes. There is no autosave, browser storage, backend, account, telemetry, or runtime network dependency; refreshing/closing can lose unexported scenes, sequences, and notes.

Notes are independent of scene/sequence editing and imports, and scene history. Their separate export contains only `format: imagery-field-note`, `version: 1`, `category`, and `text`. Categories are `unsure`, `none`, `external-perception`, `residual-aftereffect`, `voluntary-imagery`, `conceptual-knowledge`, and `mixed`; text is at most 4,000 code units and cannot contain a null character. Export requires an exact preview and explicit selection; category/text changes invalidate that selection. Notes are never included in scene or sequence files and are not imported.

End viewing preserves data in the open page. Neither End nor closing the page is secure deletion: browser session restoration, extensions, device backups, and syncing may retain or copy content. Scene, sequence, and step names and notes can contain personal text; inspect exports before sharing. Public examples and tests use synthetic data.

## Verification and boundaries

The sequence candidate requires its own independent source, synthetic, native-browser, controlled-clock pixel, and real-scheduling evidence. A source implementation is not a verified pass. At minimum test malformed sequence data, immutable capture/replacement and rollback, final-transition normalization, maximum capacity, exact half-open boundaries, overlap and 12 + 12 compositing, direct cuts, exact painted-frame Pause, stale callbacks, every cancellation route, reduced motion, fullscreen interruption, and independent scene/sequence/note exports.

The separate v0.3 artifact passed 241 non-browser checks and 54 native-browser groups in [CI run 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905), Chrome 155.0.8059.39, source head `57b8f2c2811dc246abca55d9630c0581551d448d`. The [root README](../README.md) identifies its exact HTML hash and historical v0.1/v0.2 results. Two independent scripted journeys and 14 inspected frames informed the layout changes; these are not human-study results or sequence acceptance.

Physical devices, Safari, ordinary OS dialogs, complete manual accessibility, and qualified sensory/content review remain separate gates. See the [plan](plan.md) and [test report](../imagery-app/test-results/TEST-REPORT.md). Software checks do not establish safety or efficacy.

Authorized timed displays are the separate finite snapshot sequence and [per-item timeline](item-timeline.md), including the bounded shared-clock opacity pulse. Arbitrary groups/freeform paths, textures/shaders, unrestricted effect curves, strobe or independent-frequency modulation, durable storage, diagnostics, participant systems, and efficacy measures remain outside the implemented scope. Broader effect-curve authoring and offscreen output analysis are future proposals, not an implemented capability or medical clearance. Hosted deployment is not part of this increment.
