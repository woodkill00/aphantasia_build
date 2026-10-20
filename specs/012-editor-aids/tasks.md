# Fixed execution and acceptance map

Feature 012 refines existing **IF-050** only. The labels below are document references, not new queue IDs or a live progress board. Live status/evidence belongs to [project-queue.json](../../project-queue.json). Every requirement refers to [spec](spec.md), [clarifications](clarifications.md), [plan](plan.md) and [analysis](analysis.md); this map does not claim implementation/test completion.

| Work package | Dependency | Deliverable and acceptance |
| --- | --- | --- |
| Specify and analyze bounded aids | Accepted exact-main baseline | Frozen grid/thinning, disarm, provenance, no-format/no-timer decisions; source and main-run provenance; no multi-selection/group scope. |
| Pure content-relative layout | Frozen model/UI interface | Closed validated options; M canonical/contentRect; all ratios and legacy cases; ≤200 numeric line records; no mutation/DOM/clock authority. |
| Semantic controls and separate overlay | Pure model | Labeled native Show editor aids and Center guides checkboxes, native spacing select, checked-state/arming consistency, independent snap, stable layout, content clipping, pointer-events none, aria-hidden, ≤230 elements, no new canvas. |
| Disarm/cancellation integration | Overlay | All common concealment/mode/lifecycle/import paths; gesture rollback, stale callbacks, safe failure, hidden preference changes and fresh opt-in. |
| Provenance isolation | Overlay and disarm | Existing edit stop reason; identity/export invalidation; gated summary/status; suppression through aid-off/digest; success-only explicit clean reset. |
| Aggregate verification and documentation | Implemented source | Full Node/native/package gates, measured resource/performance comparison, inspected exact-artifact captures, accurate guide and evidence updates; prior failures retained. |
| Independent integration review | Aggregate evidence | Exact-tree review and required green exact-head CI before protected integration. No release/hosting or research activation. |

## Pure-model acceptance cases

1. Grid 1/5/10, centers off/on, all five authored ratios plus legacy, wide/tall/narrow dimensions; exact content-local line mapping, letterbox exclusion and deterministic output.
2. Per-axis stride `max(1, ceil(8/projectedBaseSpacing))`; X and Y can differ. Large stride may yield no interior grid lines. Center lines remain at 50. Confirm disclosed intervals and ≤200 records; duplicate center/grid lines may be deduplicated with guide precedence.
3. Omitted options/known fields use step 5/centers false defaults. Unknown option keys, accessors, null/array/custom-prototype options, unsupported steps, strings/booleans as numeric values, invalid scenes, nonpositive/nonfinite viewport and nonfinite derived layout reject without coercion, input mutation or unbounded work. Verify the agreed return field names, arrays, intervals and counts.
4. No scene-field rewrite, imports, geometry expansion, ID change, timer, callback, storage/network or DOM dependency. Layout-only changes do not alter canonical serialization or hash input.

## DOM/integration acceptance cases

5. Initial static Live remains clean; default step 5, centers off, aids off. Hidden setting changes do not reveal, dirty data, add/clear move history, change locks/selection or schedule work.
6. Show eligibility is guarded even under programmatically dispatched disabled-control events. Settings cancel/roll back an active gesture/placement; delayed pointerup cannot commit. Rejected settings preserve valid preference/state, except required rollback/concealment.
7. Arm/disarm and every lifecycle-matrix event in clarifications, including failed/canceled/stale imports/image replacements, matching scene IDs after replacement, fullscreen failure, effective resize, invalid raw fields, editor close/section changes, Apply/capture/history/export and paused playback. Correction or callbacks cannot restore aids. Successful synchronous replacement disarms without changing its existing Live/conceal authority; replacement cannot reset provenance suppression.
8. Overlay controls do not move the canvas, intercept hits, create keyboard tab stops or obscure Hide. The content child clips all marks. Renderer failure clears aids and conceals if registration/clear is uncertain; Hide remains usable even if overlay operations throw.
9. Aids use no main/offscreen paint operations and no third canvas. Main raster and scene/sequence export bytes are unchanged by settings/arming alone. Snap retains independent Off/1/5/10 semantics and exact typed/nudge/center behavior.
10. Stop current provenance with `edit` before marks. Journal status/getter report unavailable, old clean interval is not substituted, existing records remain unchanged and pending export preview is invalidated. Test digest resolution before/after Hide, aid-off, new clean start, opt-out and re-opt-in.
11. Only successful new explicit clean Live/Show/item-start/sequence-start resets suppression; failed/blocked starts, aid-off, correction, normal render and Pause/Resume do not. No aid-related fields/end reasons enter scene/sequence/journal formats; unknown import fields still fail closed.
12. Instrumented DOM/model tests prove no added timer/RAF loop/network/storage APIs, idle work, unbounded append or changed scene/history cap. At most 230 aid DOM elements after repeated toggles/renders.

## Native and inspected-visual acceptance cases

13. Trusted mouse/keyboard/touch-emulated enable/settings/disable flows and existing select/drag/tap-place/nudge/lock/snap routes with aids on. Assert coordinates, actual raster, ordinary input behavior and exports, not only DOM labels. Retest rapid touch release followed by the first trusted Undo/Unlock action; preserve existing fling regressions.
14. Capture actual visible grid/center guides and a separate aid-off comparison; compare underlying canvas raster while screenshots prove the visible composite differs. Capture content edges/letterbox bars for all ratios plus legacy wide/tall scenes, a dense thinned grid, no-interior-lines case and rejected setting/failure state.
15. Desktop 1280×800, narrow 320×760, short 640×360 and 320×280 captures: complete labels/focused controls inside real scroll-client aperture, 44 CSS-pixel action targets, corner/center hit tests, stable canvas, no overlay/control occlusion, reachable Hide/Stop. Inspect images rather than accepting CSS arithmetic.
16. Fullscreen hidden and explicitly shown states have no aids/editor tab stops; accessible Exit and native Escape work. Lifecycle hide/restore and failed fullscreen never restore marks. Paused item/sequence/manual-step display also contains no aids.
17. Keyboard-only configuration/field editing, forced colors and reduced motion. Actual browser zoom, physical touch/pen, cross-engine and assistive-technology procedures are separate PASS/BLOCKED/NOT RUN; emulation does not satisfy them.

## Performance, source identity and completion gates

18. Maximum synthetic 12-item/effect case: paired trusted center-guide-setting events with aids off/on in the same artifact/runner, synchronous handler-plus-layout and first Hide handler intervals, median/p95/max, DOM count and repeated-toggle allocation stability. This is not calibrated screen latency. The paired regression budget, declared publicly on PR 15 at 14:16 UTC before corrected-run results, is on p95 minus off p95 ≤10 ms per device. Keep on maximum and first Hide below 50 ms as separate long-task investigation ceilings, not regression budgets. These thresholds apply only to the synthetic synchronous handler/layout workload. No runtime RAF/timer or CI timeout change is added. No new full-size buffer or idle callback is permitted.
19. Assemble from source; complete dependency-free Node, documentation, whitespace, integrity/package and native checks. Record commands/versions, source/tree/runtime hash/bytes, actual counts/outcomes and the exact captures inspected. Prepared tests do not count as executed evidence; baseline counts are not new-feature passes.
20. Independent final review and required exact-head CI. After any source repair rerun affected evidence and final aggregate checks. User docs must describe aids as editor-only and provenance exclusion honestly; multi-selection/groups/persistence remain deferred. No claim of release, hosting, universal accessibility or sensory/clinical acceptance.
