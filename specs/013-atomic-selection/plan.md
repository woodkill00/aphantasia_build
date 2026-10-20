# Implementation plan: atomic selection and arrangement

## Baseline and ordering

Feature 013 is the next bounded IF-050 increment after Feature 012. Prepare against frozen PR 15 candidate tree `0f19c407632ea36765898f2a314b2e3624ce2412`, locally verified at `62f918345482a08aa1c645e18de857dad093bf8e`. The supplied final head prefix is `e819df22`; its workflow 39441769939 was running at specification preparation. Do not invent a pass, full SHA or merged-main identity. Integration depends on verifying actual Feature 012 main/tree and reconciling this branch with it. [Research](research.md) separates accepted historical core, frozen candidate and future feature evidence.

[Specification](spec.md) → [clarifications](clarifications.md) → [reference review](research.md) → this plan → [fixed tasks](tasks.md) → [analysis](analysis.md) → implementation and exact-source verification. [The queue](../../project-queue.json) is the only live register; keep IF-050 stable. Groups belong to a separately specified Feature 014. There is no new schema, package, installation, storage, network, timer, security/CI permission, deployment or collection step.

## Architecture and interfaces

### A. Pure selection, planner and history preparation

Use a bounded arrangement-model module or a clearly separated editor-model extension. Preserve the existing shared canonical model, returned shape geometry, validator envelope and singleton helpers. Freeze actual function/result names between model and app writers before wiring; the required responsibilities are:

- `canonicalSelection(scene, selection)`: closed validation and defensive draw-order selection, with a valid primary or empty/null.
- `reduceSelection(scene, selection, action)`: closed semantic actions for select-only, toggle, all, clear and primary; no visibility or scene-write authority.
- `arrangementBounds(scene, viewport)`: validated actual content rectangle plus ID-keyed body/outline bounds derived from shared geometry and dispatched on returned `kind`. No independent shape renderer and no shadow extent.
- `planArrangement(scene, selection, command, {viewport, lockedIds, reservedIds})`: closed command union for pointer/exact translation, align, canvas-center, equal-gap distribute, duplicate, delete and reorder. Return a complete immutable `{scene, selection, kind, targetedIds, changed}` or bounded structured error. Obtain viewport geometry only for commands requiring it. Lock/policy validation precedes no-op. Snap is explicit pointer/placement input, never inferred from guide visibility.
- `prepareHistoryTarget(direction, currentDoc, generation, locks)`: verify exact expected endpoint and current concrete lock policy before stack movement. Selection equality is not a precondition. Return an immutable checked target and transaction transition; stage rejection leaves both stacks untouched.

Keep planning in integer hundredths without changing accepted input numbers. Implement the zero-preserving branch separately from nonzero interval intersection, preserve current endpoint rounding correction, and test the zero-only fixture before pointer integration. Write only actually changed axes. Freeze comparison-only EPS and alignment/centering/distribution no-op/postcondition checks before optimizing. One full candidate and one atomic final stage do not mean one validator call; bounded input/output/lock/controller and geometry canonicalization passes are required.

Reserve duplicate IDs in a temporary set drawn only from current scene, retained exact history documents and the planned block. At most 984 reservations and schema suffixes 1–999999 permit bounded smallest-free scanning without a million-entry allocation. History is 40 total transactions across both stacks. Entries own defensive exact snapshots, selections, generation, command kind and targeted IDs. Do not retain pointer events, bitmaps, locks or new persistent ledgers.

### B. App state and atomic publication

Introduce explicit canonical document, selection, scene generation, external interaction revision and gesture ownership roles. No text-ID-only late callback is valid. Whole replacement/accepted history advances generation; independent edits/session changes advance external revision; owner-token provisional writes do not. On completed gesture publication end ownership, then advance revision so old input cannot act on recycled IDs.

Add a bounded field-keyed raw-edit channel that records exact user-authored text/value, validity and edit revision, including precision companions. A form repaint from provisional movement must not appear as a new user edit. Refactor cancellation into canonical rollback/invalidation and optional successful-publication UI refresh. Do not use baseline `cancelDirectGesture()`/`fillSelected()` unchanged on the validation path, and do not eagerly clear history in `edited()` or `stageWorking()` when the raw edit is invalid or same-canonical.

The shared `commitArrangement(plan, expectedRevision, expectedGeneration)` path performs fresh raw/canonical/selection/lock checks, output/postcondition checks, identity comparison, one final controller stage and atomic completed document/selection/history publication. It never calls reveal/start. The accepted scene and sequence are not draft-history state. A complete no-op preserves redo, exact payload and provenance input.

Treat pointermove staging as provisional only. Capture exact starting document/selection/dirty state and rectangles; derive each move from that snapshot, not accumulated rounded positions. An event's own provisional writes retain ownership. Pre-final preview-stage/UI/raster failure restores the full starting canonical snapshot and both completed stacks. Pointerup final-stage failure does likewise. Post-final-publication failure retains the complete hidden transaction and honest recovery status. Inject these separate phases in regressions rather than asserting one generic failure outcome.

Ordinary input integration is part of this feature: invalid raw text conceals but leaves canonical/history state intact from the input event; same-value correction retains history and exact payload; different valid edits clear draft arrangement history only after successful stage. Add-object stays an ordinary structural route selecting its new singleton. Explicit discard/replacement may intentionally replace fields under their existing successful-only contracts.

### C. Semantic selection and controls

Add at most 12 keyed native checklist rows in back-to-front order, each with full layer/shape/ID/lock label and 44 CSS-pixel target. Reuse the established inspector scroll surface. Add selection count, primary explanation, Select all/Clear and Move anchor containing selected IDs only. Keep single-item select labeled Select only this item, with neutral empty value for zero/multiple membership. Preserve focused stable item/control role on reorder/refresh; after delete use the nearest survivor or summary. Long status text must not shift the canvas during capture.

Audit timeline pressed state and actions, overlap cycling, pointer hit selection, placement and all property/lock handlers. Multi/empty selection has no implicit primary inspector. Enforce singleton checks in handlers and `readFields()`, not only disabled attributes. Allow global edits through canonical item records. Add exact normalized delta controls and Move selection; labels distinguish singleton position-centering from union-bound centering and primary-based tap placement. Preserve text-field keys and expose every operation without dragging or canvas-only shortcuts.

Keep existing hit-testing tolerances, 4-pixel threshold, lock/select semantics, pointer capture and tap-suppression/no-fling fixes. Shift toggle cannot begin drag. Multiple selected locks reject move as a whole. Avoid reflow or inspector expansion until existing gesture rules permit it.

### D. Lifecycle, provenance and compatibility

Audit every existing select/lock/snap/aids entry point, direct/typed/nudge/center/align/duplicate/delete/layer action, generic form refresh, Apply/capture/discard/accepted history, import/Load step, gallery/preset/New/Convert and image replacement/undo path. Map each to specification §10. Failures never consume state. Successful scene replacement resets selection despite matching ID text; sequence-only import is not scene replacement. Current successful-only lock clearing and any-lock accepted-history prohibition remain.

Arrangement history conceals and disarms aids, but never resets marked-view provenance suppression. Selection-only changes preserve hash/raster/dirty/provenance identity; real arrangement edits use existing edit invalidation. Layer order intentionally changes canonical serialization. Hidden commands remain hidden. Canvas failure cannot remove data-only controls, downloads or Hide. Fullscreen/manual-step/timed playback cannot be edited in place. No new overlay, timer or reveal path exists.

## Verification sequence

1. Add regression cases for closed selection, precision, returned-kind geometry, zero feasibility, all lock/no-op branches, structural commands, identity recycling and 40-total history before claiming model completion. Preserve source-grounded near-hundredth, outlined-dot, unequal-width distribution and rotated-triangle fixtures.
2. Add app/DOM regressions for input-event history preservation, fresh invalid raw text during a provisional move, stale DOM replay prevention, singleton guards, neutral Select only, focus identity and every failure/publication phase. Preserve old singleton behavior and arrangement regressions rather than deleting tests for renamed controls.
3. Assemble from source with `node imagery-app/src/assemble.cjs`. Run complete dependency-free Node, documentation, whitespace, integrity/package and native gates using repository commands. Inspect the current scripts before naming commands or interpreting counts; record exact versions/source/tree/runtime hash/bytes and actual outputs.
4. Use trusted native mouse, keyboard and touch-emulated input. Assert coordinates, exact untouched payloads, history stacks, raster and export, including repeated no-drift and rapid-release first Undo/Unlock. Inspect real captures for all five authored ratios/letterboxes and legacy wide/tall geometry, unequal shapes, invalid/locked/hidden/failure states, forced colors and reduced motion.
5. Inspect 1280×800, 320×760, 640×360 and 320×280 layouts. Reach all 12 longest checklist labels, primary/locks/deltas and full focused rows inside the actual inspector scroll-client aperture. Perform corner/center hit tests; retain Hide/Stop and stable viewport. CSS arithmetic or an uninspected emitted image is not visual acceptance.
6. Establish same-runner baseline/candidate planning/handler-plus-layout and first-Hide intervals for maximum 12-item/effect scenes, common drag and equal gaps. Report median/p95/max, bounded geometry/validation work and transaction/ID/node memory ledger. Investigate unexplained >50 ms arrangement work or delayed first Hide; a timeout increase cannot satisfy that performance gate. Instrumentation is not calibrated screen latency and adds no runtime timer.
7. Independent exact-tree review, completed exact-head required CI and verified Feature 012 main are integration gates. After repair rerun relevant and aggregate evidence. Update user documentation and the single IF-050 record accurately. No release/hosting/collection follows implicitly.

## Proposed coverage-driven CI duration

The prepared native plan preserves all 178 existing groups and adds 22, for 200 prepared groups. The earlier group-count-only projection was superseded when independent review required actual batch geometry captures across all authored ratios and legacy wide/tall layouts, plus a frozen-baseline comparison. Recorded Feature 012 duration is 795.126 seconds. Conservative added-work estimates are up to 160 seconds for the initial new checks, 55 seconds for ratio visuals, and 100 seconds for six alternating baseline/candidate pairs, totaling approximately 1110.126 seconds. A proposed 1380-second (23-minute) native limit provides approximately 24% headroom; another 180 seconds gives a 1560-second (26-minute) limit for the same single job. Independent review is required before application. This is a coverage estimate, not measured Feature 013 performance. Current Feature 012 CI, required assertions, sandbox, read-only permissions, cleanup and packaging remain unchanged.

This estimate is not measured candidate performance, an already-applied change, retries, reduced assertions or permission to absorb unbounded runtime growth. Obtain independent review before applying the Feature 013 budget; retain the measured planning/handler/first-Hide gates and investigate slow work independently. Record actual candidate counts and duration when executed rather than treating 200 prepared groups as 200 passes.

## Stopping conditions

Stop the affected action and request a scope decision if it requires changing validation tolerance/envelopes, singleton authoring behavior beyond the frozen exception, file formats, item/buffer limits, grouping, storage/network, packages, permissions, CI budgets beyond the separately reviewed bounded proposal, new timing, deployment or collection. Preserve failures as failures. Physical-device, cross-engine, actual zoom, OS file, assistive-technology and qualified sensory/research outcomes stay independently PASS/FAIL/BLOCKED/NOT RUN; engineering completion cannot substitute for them.
