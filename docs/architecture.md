# Architecture and data contract

Version 0.8 **unreleased development candidate**, updated 20 October 2026. This document describes implemented source contracts; exact-source native and scoped arrangement visual acceptance are recorded below, separately from final documentation-head CI and integration. The [roadmap feature guide](roadmap-features.md) distinguishes implemented behavior and deferred requirements; the [public work register](../project-queue.json) owns live status.

The [item-timeline specification](item-timeline.md) remains authoritative for legacy scene-v3/sequence-v2 effects and finite item timing. Those viewport-relative formats remain supported without silent conversion. Explicit authored scenes add scene-v4/sequence-v3 as specified below. The historical scene-v1/v2 and sequence-v1 sections preserve migration inputs; do not mistake their closed-key lists for current export formats.

## Direct-editor transactions

`editor-model.js` supplies pure shared-geometry hit testing and validated translation. The UI captures an immutable item ID, starting draft and canvas rectangle, preserving the grab offset. Pointer motion below 4 CSS pixels selects without moving. A completed drag adds one operation to the separate 40-entry draft move history; it does not Apply or change accepted history. Numeric, tap-place and nudge routes use the same canonical coordinates. Arrow keys act only on the focused preview, not text fields; Shift uses 0.1 rather than 1 position unit.

Hit testing chooses the last-drawn eligible item first, includes hollow interiors and a 6 CSS-pixel tolerance (12 for touch), and excludes shadows and letterbox bars. Semantic item selection and overlap cycling remain available. Non-primary input cannot start a drag; another pointer during a gesture cancels it. The inspector opens after the gesture rather than moving the active viewport. Lost capture, pointer cancellation, changed canvas geometry, Hide/Escape, imports and lifecycle interruption roll back the starting draft and invalidate stale work. Direct editing is disabled during timed/fullscreen viewing.

`Undo move` / `Redo move` conceal and operate only on draft moves. Other edits clear that history and invalidate cached overlap candidates. Accepted-scene `Undo` / `Redo` and Apply remain distinct. Layer controls reorder ordinary items. The fourth increment's lock/snap/centering contract below is implemented and has passed its recorded scoped software acceptance. Visible editor-only grids/guides, grouping and distribution remain deferred.

### Session lock and arrangement contract

Session locks use a bounded map of item IDs to defensive, complete canonical item snapshots, at most the existing 12-item cap. Candidate writes compare against those snapshots before changing state, selection or history, including routes that mutate a working copy before staging. Protect the stored shape, geometry, X/Y, size, colors, effects and own timing/pulse fields. Global background, canvas ratio, shared pulse period and other items are outside this invariant; a lock is not a promise of identical rendered pixels or absolute overlap order.

Locked selection remains available through the semantic list, hit testing, overlap cycling and timing tracks. A locked topmost hit selects without drag or click-through. Targeted layer reordering and deletion are refused. Duplicate may create a new unlocked record with a fresh ID while preserving its source. `readFields` must preserve locked records rather than accept altered disabled values. Guard handlers as well as disabled flags, and apply the final policy after geometry, timing and precision-companion disabling so inapplicable controls are not accidentally enabled.

Lock/unlock/snap changes first cancel and roll back captured gestures and placement, then invalidate stale imports/editing work. Lock creation requires a valid draft. None of these controls has Apply, reveal or scheduling authority. Unlock all, Hide, Stop, End, Escape and normal export cannot be blocked by locks.

Apply and atomic Add/Replace snapshot capture retain locks. Accepted-scene Undo/Redo remain disabled with a nearby explanation until all items are unlocked. Draft move Undo/Redo and Discard preflight their concrete candidate against locks before touching history stacks. Rejecting a conflict leaves history intact. Do not clear locks in generic field refresh.

Clear locks with a visible notice only after successful explicit scene replacement: New fixed-ratio scene, legacy Convert, either preset selector, gallery Use, scene import, Load step into scene editor, image Use or image-replacement Undo. Failed/canceled/stale replacements retain the previous scene and locks. Separate sequence import retains editor locks; successful step loading replaces the scene and clears them.

Snap is Off initially, with 1/5/10 normalized content-unit choices, only for drag/placement. Use the actual `contentRect`, preserved grab offset and the existing conservative geometry/effect inset. Quantize the intended center to the nearest feasible grid index, constraining the index before converting back; do not clamp a snapped center to an off-grid edge. Reject letterbox taps, retain finite two-decimal canonical coordinates and avoid input mutation. Selector changes alone do not move items.

Typed coordinates, button/keyboard nudges and alignment remain unsnapped, including Shift+arrow's 0.1-unit alternative. Center X/Y/both sets the intended axes to 50 for the selected unlocked item through validation. A real change is one existing bounded draft-move operation; a no-op adds none. Accepted history remains separate; hidden output stays hidden and only an already visible valid static preview can repaint.

No schema bump, exported lock/snap metadata, browser storage, timer, rendered grid, distribution or group capability is introduced. Lock/snap toggles with no active gesture must not alter canonical scene identity, provenance hash or scene pixels. Full mutation/replacement, adversarial disabled-control, native coordinate/raster and actual-aperture focus evidence is required by [IF-050's acceptance matrix](../specs/008-interactive-scene-roadmap/tasks.md#if-050-fourth-increment-acceptance-matrix). The recorded arrangement run and independent review satisfy the bounded source/native/visual scope; each final head must pass required CI before protected integration; consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome.

## Components and rendering

- `imagery-app/src/geometry-model.js`: closed authored geometry registry, parameter bounds, transformed vertices, effect-aware extent inputs and authored content-rectangle mapping.
- `imagery-app/src/model.js`: closed scene-v1–v4 validation, serialization, strict legacy migration, explicit authored conversion, geometry, legacy presets and the visibility/history/import controller.
- `imagery-app/src/editor-model.js`: pure hit testing and quantized, inset-clamped translation; no reveal authority.
- `imagery-app/src/preset-model.js`: twelve original versioned authored examples, descriptive metadata and provenance, mapped through the scene validator.
- `imagery-app/src/gallery-ui.js`: text-first metadata filters and explicit static thumbnail opt-in; bounded small canvases and draft-only callbacks, without main-scene or timing authority.
- `imagery-app/src/provenance-model.js`: initially disabled, bounded latest-display bookkeeping with an injected SHA-256 provider and monotonic time; no display, storage or network authority.
- `imagery-app/src/image-file.js`, `image-model.js`, `image-ui.js`: raster header preflight, pure bounded fitting, and an explicitly opened local intake/candidate panel. Only the app callback can stage a validated scene draft.
- `imagery-app/src/journal-model.js`, `journal-ui.js`: independent closed reflection records, exact selected export authorization and optional session-memory controls. No scene, clock, storage, network or research authority.
- `imagery-app/src/sequence-model.js`: closed sequence validation/parser/serializer, compiled timeline, deterministic frame sampling, and injected-clock playback state. It has no DOM, canvas, RAF, network, persistence, or visibility authority.
- `imagery-app/src/item-model.js`: pure finite per-item timeline compilation, sampling and playback state; it has no reveal or DOM authority.
- `imagery-app/src/app.js`: scene and sequence controls, atomic capture, object selection/placement, Canvas 2D compositing, scheduling, fullscreen/lifecycle handling, local file reads, and Blob downloads.
- `imagery-app/src/shell.html` and `style.css`: full-window field, compact Scene/Sequence section selection, one selected-step inspector, editor-only color samples, reachable Apply/capture actions, guidance, focus, and responsive rules.
- `imagery-app/src/assemble.cjs`: developer-only assembler producing the self-contained `index.html`.
- `imagery-app/tests/`: synthetic model, DOM/Canvas-double, static, CDP transport/fixture, and separately gated real-browser checks.

The runtime uses inline classic scripts/styles, system fonts, and no remote assets. Static/manual displays redraw on relevant events. Only an explicitly started, finite, single-pass snapshot sequence or item timeline schedules display animation frames. Image fitting uses bounded cooperative timeout slices that cannot reveal or schedule a presentation. The clocks never nest. At most one RAF is pending; no idle loop, timed autoplay or automatic replay is authorized. The valid starter draft receives one static startup render; this never starts a presentation clock. Optional item pulse uses the reviewed shared-clock opacity contract and ends with its item. The download-URL cleanup timer has no display authority.

Timed playback remains windowed so Pause and Stop are reachable. Static/manual previews may use clean fullscreen: normal workspace chrome is suppressed, a keyboard/touch Exit remains, and hidden fullscreen provides a separate explicit Show route. Fullscreen entry/exit/failure conceal. Editor toggles preserve an active live draft; other presentation modes conceal. Escape does not suppress native fullscreen exit. The decorative hidden-state circle is removed from the candidate source; hidden canvas pixels stay black behind ordinary interface text/controls.

Legacy object centers use percentages of the actual field width and height. Their size and outline width use its shorter side. Authored coordinates and sizes instead use the fitted content rectangle described below. Backing-store scaling compensates for rounded buffer dimensions; dimension caps remain 4,096 pixels and DPR at most 2. Main plus one offscreen canvas together must remain within 8,388,608 pixels, including resize allocations. No third full-size buffer is used. These are resource bounds, not display-quality or medical-safety guarantees.

For a transition, render opaque scene A on the main canvas and opaque scene B on the offscreen canvas, each against the same background; composite B over A at the sampled alpha. Reset transform, alpha, and compositing every frame. Never accumulate previous pixels or fade the combined output through an inserted black frame. A direct cut has no transition phase. Crossfades can contain 12 + 12 objects; the validated per-snapshot cap remains 12.

## Current background and responsive layout

Scene-v3/v4 and sequence-v2/v3 documents accept background hue 0–359, saturation 0–100 and lightness 0–40, with new-scene default 4/60/4. Item/effect color bounds are unchanged. Legacy scene-v2/sequence-v1 inputs retain their original saturation maximum of 60 before migration. Older app versions cannot load new current-format documents with background saturation above that former maximum.

The visible preview and inspector share responsive sizing/gap tokens. Derive remaining space using CSS calc() with min/max/clamp and shrinking grid tracks rather than independent conflicting width/height constants. Narrow and short layouts must retain an unobscured preview, complete focused numeric controls and reachable concealment controls. Source layout arithmetic is a design aid; actual screenshots and interaction checks are the acceptance evidence.

## Authored scene-v4 and sequence-v3 contract

The scene root still has exactly `format`, `version`, `sampler`, `scene`: `imagery-static-scene`, `4`, `authored-objects-4`, and a closed scene record. Scene fields are exactly `name`, `background`, `pulsePeriodMs`, `objects`, `canvas`. Existing name, HSL, timing, identifier, 12-item and 1 MiB import limits remain. `canvas` is exactly `{mode: "fixed", ratio: ...}`; ratios are `1:1`, `4:3`, `3:4`, `16:9`, `9:16`.

Each item retains `id`, `shape`, `x`, `y`, `size`, `color`, `outline`, `shadow`, `timing` and adds `geometry`. Closed geometry fields are `height`, `rotation`, `fill`, plus only the family's applicable fields:

| Family | Bounds and extra fields |
| --- | --- |
| dot, pixel | Width (`size`) and height 1–8 whole units; equal dimensions; `fill: true`. |
| circle, square | Width/height 1–28 whole units; equal dimensions; fill or contour. |
| triangle, ellipse, rectangle | Width/height 1–28 whole units; independently sized; fill or contour. |
| rounded-rectangle | Independent 1–28 dimensions; `cornerRadius` 0–0.50, at most two decimals. |
| polygon | Independent 1–28 dimensions; `sides` integer 3–32. |
| star | Independent 1–28 dimensions; `sides` integer 3–16; `innerRatio` 0.20–0.80, at most two decimals. |

All families accept whole-degree rotation 0–359 and a Boolean fill choice except the permanently filled dot/pixel. Width/height use the content rectangle's shorter side, while centers are percentages of its separate axes. Authored curves use bounded polygonal geometry (64 vertices for circular/elliptical bodies); legacy rendering is not changed to that approximation. Rendering, bounds, descriptions and hit tests consume the same validated numeric geometry, never raw SVG.

Validation reserves a conservative normalized inset using the rotated geometry extent plus enabled outline and shadow envelope (maximum absolute offset plus three times blur). This is an engineering envelope, not mathematically finite blur support, calibrated physical dimensions or safety clearance. Quantized placement/translation rounds the minimum inward with `ceil` and maximum inward with `floor`, then rounds coordinates to two decimals. Invalid imported geometry is rejected, not clamped or repaired.

`contentRect` contains the authored ratio inside the available field, centered with black letterboxing. Bars are not selectable or placeable scene content. `upgradeScene` is invoked by explicit New/Convert actions, never legacy import. New fixed-ratio scenes start square with a single point; Convert retains existing items but can change their layout. Both remain reviewable drafts; Apply and download remain separate.

Sequence-v3 has `format: "imagery-field-sequence"`, `version: 3`, `sampler: "ordered-crossfade-3"`. Its `sequence` adds `canvas` to `name`, `background`, `steps`; each step adds the same `canvas` to the sequence-v2 fields (`id`, `name`, `holdMs`, `transitionMs`, `pulsePeriodMs`, `objects`). Every snapshot validates as scene-v4 and must match the shared canvas exactly. A mixed legacy/authored capture or ratio mismatch fails before either scene or sequence commits. Legacy scene-v1/v2 migrate to v3; legacy sequence-v1 migrates to v2. V3 viewport scenes and v2 sequences remain those formats until an explicit compatible operation, not automatic authored upgrades.

## Original preset boundary

The authored catalog has twelve revision-1 entries: `balanced-contours`, `symmetric-points`, `sequential-shapes`, `mixed-steady-pulse`, `spatial-triplet`, `symmetric-pair`, `displaced-pair`, `overlapping-contours`, `simple-house`, `simple-tree`, `simple-boat` and `still-life`. All are original repository-authored geometric compositions with MIT license/provenance. Every created scene passes `canonicalScene`; the original four scene payloads are preserved. Catalog metadata adds item count, distinct item-color count, vertical-reflection classification, geometric overlap and timing type, plus the validator result. Color count excludes background/disabled effects; geometric overlap includes containment. Filters do not rank efficacy.

The gallery starts text-only. An explicit Show static thumbnails action paints canonical model geometry at full static opacity, ignoring item timing. At most twelve lazy, reused 64×48 backing stores total 36,864 pixels (147,456 RGBA bytes), without DPR scaling. These are separately bounded small previews, not a third full-size scene buffer. Hide/End/Escape, filters, imports, edits, fullscreen/lifecycle interruption and `invalidate`/`disablePreviews` conceal all thumbnails and reset each allocated backing store to 1×1. No timer, callback or filter restores them; another explicit opt-in is needed. Canvas failure leaves text browsing available and all previews concealed. No raw SVG/markup, remote assets, decode or animation is accepted.

Use draft calls the app's concealment callback before supplying a freshly validated scene. It stages only: Apply, download and Live/timed preview remain distinct. Catalog identity is deliberately not embedded in editable exports, so a derivative cannot falsely retain an unchanged experimental stimulus ID. Existing legacy presets remain viewport-relative; no preset selection starts timed playback.

## Local image resource and cancellation contract

`image-file.js` accepts only still PNG/JPEG bytes, verifies header dimensions and rejects animation markers in PNG before invoking the browser decoder. Input MIME, when present, must match its supported header. A valid header is not a complete decode: `createImageBitmap` must still succeed, with orientation applied, and decoded dimensions are checked again. SVG, GIF, remote URLs and executable image content are not accepted.

| Allocation / work | Explicit bound |
| --- | --- |
| Selected encoded file | 8,388,608 bytes (8 MiB). |
| Header and decoded image | At most 4096 on either side; at most 8,388,608 pixels total. A four-byte RGBA representation alone could use 32 MiB; decoder internals are browser-dependent. |
| Retained source thumbnail | At most 128×128 RGBA pixels, 65,536 typed-array bytes. The intake scratch canvas is shrunk after sampling; the decoder bitmap is closed. |
| Fitting target/current buffers | Chosen aspect ratio with longest side 48; two RGB buffers, at most 13,824 bytes together. |
| Region search scratch | At most 2304 visited bytes and 4608 queue bytes. Model/source typed-array ledger: at most 86,272 bytes. |
| Result | At most the selected 3, 6 or 12 ordinary items. Filled rectangle, ellipse or triangle only; no source bytes/metadata in scene data. |
| Search | At most 384 candidates per item, at most 4608 total. UI runs 16 candidates per cooperative timeout slice; pure API permits up to 32 per step. |
| Presentation buffers | Existing main + offscreen total remains 8,388,608 pixels, separate from decode/thumbnail allocations; no third full-size presentation buffer. |

The ledger is not an RSS or peak-browser-memory guarantee: file copies, object overhead, canvases, decode intermediates and browser/OS management are not fully measurable from this contract. Limits bound work, not wall-clock latency or universal device suitability. No worker thread or installed library is used; UI fitting yields cooperatively on the main thread. Representative performance/correction-effort and held-out natural-image benchmarks remain pending.

The repository-authored `seeded-region-primitives` algorithm (version 1) starts from a dark background, contains the selected crop without stretch and composites transparency against that background. It proposes only bounded filled primitives and accepts pixel-error improvements. Source colors are constrained to scene HSL bounds; the alternative palette is muted slate/sage/sand. Seed, crop, palette, work dimension and candidate count identify reproducible model input, not equivalent decoding across browsers. Normalized RGB error is not semantic quality, preference, imagery improvement or clinical evidence.

File reading and browser decoding cannot be interrupted by a generation token. A single intake lease stays held until the outstanding read/decode settles and its bitmap is closed, even after cancellation. New intake cannot overlap it. Search cancellation clears the scheduled slice/job and candidate; generation/revision checks reject stale completion. Shared app cancellation covers Hide/End, imports, edits and lifecycle interruptions. All conceal source thumbnails; no asynchronous completion obtains reveal or Apply authority.

Generate produces only a candidate description. `Use editable draft` validates both the existing raw fields and the candidate, then stages a hidden draft while retaining the prior valid draft/selection for one-step `Undo image draft replacement`. Invalid existing fields block replacement. The replacement undo restores a hidden draft, without applying; subsequent scene edits clear it. This is distinct from move and accepted-scene history. Apply and scene download remain separate. Original bytes, filenames and image metadata do not enter the exported scene; derived shapes may still reveal content. Clear source discards retained pixels, but neither clearing nor closing promises forensic deletion by the browser/OS.

## Optional journal and disabled research contract

The journal is initially disabled and creates no record until `Add reflection to session`. It holds at most 20 immutable records, at most 2,000 code units per note, and at most 131,072 UTF-8 bytes per selected export. The export root is exactly `format: "imagery-private-journal"`, `version: 2`, `purpose: "private-exploratory-reflection"`, `entries`. Entries contain an ID and a closed reflection record, not a scene export.

Reflection fields are `scene`, `exposure`, `experiences`, `comfort`, `symptoms`, `stoppedEarly`, `preference`, `easeOfUse`, `note`. Experiences separately identify perception, afterimage, voluntary imagery and nonvisual memory. Missingness is explicit: not-asked, skipped, none and uncertain are not interchangeable. Comfort, symptom/early-stop, preference and ease choices have their own closed enums. All answers start skipped. No validated instrument or combined score is supplied.

A separate initially unchecked display-provenance option can add a bounded latest-display summary under the contract below. Otherwise `scene` and `exposure` remain exactly `{status: "unavailable"}`. Journal-v2 permits both static-scene and whole-sequence references; `canonicalRecordV1` retains the original closed static-only record validator. The UI has no journal import or silent legacy-file rewrite. The export contains no timestamp/epoch, original picture, full personal scene, internal generation token or device identifier.

Selected entries generate exact JSON bytes. A preview is bound to current state, a separately unchecked approval, and a single download. Editing, selection changes and relevant app changes invalidate it; export consumes approval. The UI requests a local Blob download and cannot verify a durable disk write. Records are excluded from scene/sequence/note files, have no import or autosave, and persist only in page memory. Turning participation off resets unfinished answers, not existing entries; Clear removes records/answers and preview state, not prior downloads.

The disabled research information is not a consent workflow or submission simulator with real records. No endpoint, Send action, upload queue, statistics or collection is present. `SUBMISSION.enabled` is false and lists external governance prerequisites. Actual research needs an identified operator, jurisdiction/population determination, applicable ethics/privacy/security/instrument/statistical review, retention/withdrawal/incidents rules and separate authorization. One-report, longitudinal linkage and recontact would need distinct consent scopes. Pseudonymity is not anonymity; irreversible anonymous aggregation may prevent individual deletion.

## Optional display provenance contract

Both reflections and display provenance default off; enabling reflections alone performs no hashing. The additional checkbox opts into subsequent successful foreground main-canvas renders only. `recordVisibleDisplay` runs after painting succeeds, never merely because data is staged, imported or selected. Startup before opt-in, hidden output, gallery thumbnails and local source thumbnails are not backfilled or measured.

The hash is SHA-256 of the canonical document's JSON bytes. Static/live/item mode references the actual scene; manually showing one sequence step references its canonical scene; timed sequence mode references the entire canonical sequence. Format/version and `rendererVersion: "0.8.0-dev.provenance1"` accompany the digest. The renderer label is a version identifier, not the application binary/artifact hash. A document digest is not a pixel fingerprint, proof of equivalent rendering or anonymity; known or guessable documents may be recognizable by hash.

`scene` available fields are exactly `status`, `format`, `version`, `sha256`, `rendererVersion`. `exposure` available fields are exactly `status`, `mode`, `plannedMs`, `visibleMs`, `interrupted`, `endedReason`. Modes are `static`, `items`, `sequence`; static `plannedMs` is null. End reasons are `user-stop`, `completed`, `hidden-tab`, `resize`, `edit`, `technical-failure`, `unknown`. An interrupted interval can still be the latest completed record; completed here means ended, not necessarily played to its planned end. Visible duration uses bounded monotonic elapsed milliseconds, not epoch time, capped at 3,600,000 ms. A paused frame stays visible and therefore continues counting; visible time can exceed planned duration. A displayed edit supersedes the prior interval instead of accumulating a session total.

Only the latest ended interval with a ready digest is eligible when Add reflection reads the summary. An active display, pending/unavailable digest, clock failure, unsupported descriptor or overlong interval produces unavailable fields, without falling back to an older result. Existing saved reflections are not retroactively populated when a digest later completes. Tracking has no reveal, playback, frame scheduling, persistence or transmission authority.

| Provenance resource | Bound and cancellation behavior |
| --- | --- |
| Interval bookkeeping | At most one active interval and one latest completed interval; metadata only, not an unbounded event log. |
| Hash concurrency | One non-cancellable digest in flight; at most one waiting latest canonical input. Newer inputs replace that waiting input. |
| Canonical input | Each in-flight/queued document is bounded to 1,048,576 UTF-8 bytes (1 MiB). This is an input bound, not a process-memory measurement; browser/JS allocations have overhead. |
| Opt-out and clear | Discard active/completed/queued state and revoke stale result tokens. A digest already handed to the browser may finish, but cannot reattach cleared data. The app clears its temporary encoded byte array when that operation settles. |

Unchecking tracking or turning reflections off disables and clears provenance. Clear session journal clears provenance and records; if the tracking checkbox remains checked, only a later display can create a new summary. No epoch/timestamp, raw picture, full scene content, internal identity token or device identifier enters the journal. Software-visible time is not gaze, attention, calibrated light dose, sensory safety or efficacy.

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

This preserves the logical composition, not a pixel-identical old screenshot: colors are approximated, and the full-window rectangular field maps center percentages across its actual dimensions while keeping shapes aspect-correct. Imports are accepted hidden. Legacy imports export as scene-v3 until the user explicitly creates/converts an authored scene-v4. The version 2 description here records the earlier migration stage. No downgrade export is offered.

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

**Add scene as step** and **Replace selected step** combine scene application and snapshot capture when a draft exists. Preflight the static scene and the complete normalized sequence before committing either. A failure preserves both accepted documents and scene history, while canceling/concealing. The first capture seeds the shared background and scene family. Later mismatched backgrounds, legacy/authored format families or authored ratios are rejected atomically. Loading a selected step into the scene editor copies it and blocks unresolved scene drafts.

Reorder/delete/append normalize only boundary transitions: the new final step gets zero; a former final moved earlier gets the default 1,000 ms; other values remain. Validate the whole candidate and announce adjustments. Reject atomically if the resulting total or another rule fails.

## Timeline and display authority

`compileTimeline` returns a frozen validated document, total duration, and half-open hold/transition phases. `frameAt` returns deterministic phase, source/destination indices, alpha, elapsed/remaining time, and completion. Zero-duration transitions have no phase or gap. The injected-clock `createTimeline` API exposes `start`, `tick`, `markPainted`, `pause`, `resume`, `stop`, and `getState`; it does not schedule work or reveal a display. Stale/unissued frames cannot be acknowledged as painted.

The exact 11-second reference is circle hold [0,3), circle→square crossfade [3,4), square hold [4,7), square→triangle crossfade [7,8), triangle hold [8,11), then hidden. Half-open boundaries mean 4 seconds is square hold and 11 seconds is complete. Halfway blends are sampled at 3.5 and 7.5 seconds. These values define an editable test/example timeline, not an exposure regimen.

One existing scene visibility gate controls explicit draft preview, manual Show step, and timed Play, including the 3,000 ms repeat-action guard. The valid starter draft is shown once during initial application setup, without a timer. After initialization, no draft edit, import, selection, frame callback, restoration, or delayed completion can reveal hidden output on the user's behalf. A blocked explicit reveal never queues a future reveal. The guard is an engineering restriction, not a recovery interval. Manual edits while already hidden still invalidate pending imports and stale display work, but do not extend the reveal deadline. An interruption of a visible display conceals and extends the guard; explicit Hide retains its lock even when already hidden. Existing recent deadlines remain in force. This avoids postponing an explicit preview after every hidden numeric edit without letting edits reveal content.

A single explicit **Play items once** action can transfer an already visible static live draft into its finite item timeline after validation. It invalidates prior playback/import work without a conceal-then-reveal cycle. This exception is limited to active static Live preview: hidden output still obeys the reveal guard, other display modes must stop first, and no timer or callback obtains new reveal authority.

Play needs a valid sequence and resolved static/sequence fields, runs only in the window, and requires an explicit action. A callback may paint only if the captured scene epoch and sequence generation still match, the visibility gate is open, and playback remains running. It cannot reveal content. Pause cancels pending scheduling and freezes the last frame acknowledged as actually painted, including its exact elapsed position; it does not resample at click time and leaves the image visible. Resume is explicit and rebases the clock without catch-up.

Stop/Hide/End/Escape, invalid scene input, sequence edits, imports, sequence selection/mode changes, fullscreen changes, resize, blur, hidden tabs, freeze, pagehide, restoration, and reduced-motion changes invalidate generation and cancel RAF before concealing synchronously. Completion conceals to black and resets elapsed time without replay. Reduced-motion preference permits manual stepping rather than replacing fades with automatic cuts. Preference changes never automatically resume.

Static placement uses one click/tap with numeric alternatives; it retains an already active live preview, otherwise stays hidden. Small labeled color samples update directly from draft color sliders without touching the visibility gate. Untrusted names/statuses use text/value sinks; status text is bounded to 300 code units. Actual event delivery, composited pixels, and control reachability require independent browser checks.

`stageLive` validates and updates the draft while preserving only an already-visible gate; it cannot reveal. `previewDraft` is permitted once for the valid static startup draft and subsequently only by an explicit live-preview action, obeying the same reveal guard. Both invalidate pending imports without modifying accepted data/history. Live updates have no RAF, timer or queued repaint; each input synchronously paints a complete validated draft. Stop/lifecycle events therefore cannot be followed by a delayed live reveal. The main canvas occupies an unobscured responsive region while editing, then returns to the whole field when the editor closes. Canvas geometry uses its current actual rectangle, keeping shapes proportional.

## Files, notes, and privacy

The accepted scene and sequence are separately exported/imported JSON documents. Static drafts must be applied/discarded before static export; invalid sequence fields must be resolved before sequence export. Imports stop and conceal, and stale reads cannot replace newer accepted state. Downloads are requested, not confirmed as durable disk writes. There is no autosave, browser storage, backend, account, telemetry, or runtime network dependency; refreshing/closing can lose unexported scenes, sequences, notes, journals and local image work.

Notes are independent of scene/sequence editing and imports, and scene history. Their separate export contains only `format: imagery-field-note`, `version: 1`, `category`, and `text`. Categories are `unsure`, `none`, `external-perception`, `residual-aftereffect`, `voluntary-imagery`, `conceptual-knowledge`, and `mixed`; text is at most 4,000 code units and cannot contain a null character. Export requires an exact preview and explicit selection; category/text changes invalidate that selection. Notes and journals are never included in scene or sequence files and are not imported. The journal is a second, independent optional format described below, not an extension that silently changes note exports.

End viewing preserves data in the open page. Neither End nor closing the page is secure deletion: browser session restoration, extensions, device backups, and syncing may retain or copy content. Scene, sequence, and step names and notes can contain personal text; inspect exports before sharing. Public examples and tests use synthetic data.

## Verification and boundaries

Version 0.8 has scoped pure-model, adversarial and DOM-double review evidence, summarized in [Spec-Kit analysis](../specs/008-interactive-scene-roadmap/analysis.md). The prior PR 13 source `65c96ebcae397884deb032d9bc430ddad61d68b7` also has inspected native evidence, but [run 39415125146](https://github.com/woodkill00/aphantasia_build/actions/runs/39415125146) failed one of 136 groups at immediate mobile drag-to-Undo. All 116 captures were hash-verified and inspected; packaging was skipped. [PR 14 run 39423486474](https://github.com/woodkill00/aphantasia_build/actions/runs/39423486474) passed 935 Node checks, all 160 native Chrome groups and the clean-checkout package gate on source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76`. Independent visual review accepted 26 actual SHA-verified captures: all 22 arrangement frames and four rapid-release/focused-Undo frames. The run emitted 142 captures; this is not a claim that all 142 were manually inspected. Each final head must pass required CI before protected integration; consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome. Version 0.8 is unreleased. Earlier v0.7 results are historical and identified in [compatibility](compatibility.md) and the [test report](../imagery-app/test-results/TEST-REPORT.md); neither old source verifies newly assembled code.

Required exact-source native regression includes actual synthetic PNG decoding, journal-v2 Blob download and optional real-browser digest/interval checks, text-only and explicitly enabled gallery states, authored geometry and letterboxes, direct input/capture, invalidation after Hide/import/edit/lifecycle interruption, keyboard/focus and narrow/short layouts. The fourth increment passed the lock/replacement/history and snap/center matrix above, including original/rapid Undo and rapid locked-selection/first-Unlock checks. Future changes still require exact-source execution rather than test-source inspection alone. Browser emulation is not a physical device; scanners and model tests do not establish accessibility conformance.

Physical devices, cross-engine/OS file workflows, assistive technology, actual zoom, qualified sensory/content review, natural-image/correction-effort studies and all participant research retain separate gates. The exact candidate has no clinical clearance, calibrated exposure, demonstrated efficacy or universal safety threshold. Do not relax read-only repository/integration permissions, sandboxing, package policy or CI scope to obtain evidence. Hosted deployment, release publication and real collection are not implied by implementation.

Session locks, drag/placement-only snap and centering are accepted within the recorded bounded software scope. Arbitrary SVG/paths, freeform curves/arcs/rings/lines, text, 3D/fractals, a complete mathematical-shape inventory, catalogs beyond the twelve examples, distribution/grids/guides/grouping, durable storage, unrestricted flash/strobe, independent-frequency modulation, diagnostics and efficacy measures remain outside it. Finite item timing and snapshot sequences remain separate explicit clocks, never autoplay or replay loops.
