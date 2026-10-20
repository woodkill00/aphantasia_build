# Implementation plan: editor aids only

## Baseline and boundaries

Begin at merged main `edc92d58f83c5ceb3c3233e338a8bad7a85b2d2a`, exact tree `a436707b99e5b62324f6d9ee6f4f585c6ed210be`. The isolated branch is `feature/012-editor-aids`; its local source commit `1a0f839bbf73cb69b06b784c94d3f3851cce1fd7` has that same tree. [Research/reference evidence](research.md) records the main run and runtime hash. This accepted baseline does not establish a pass for changed source.

[Specification](spec.md) → [clarifications](clarifications.md) → [reference review](research.md) → this plan → [tasks](tasks.md) → [analysis](analysis.md) → implementation and verification. Keep IF-050 as the stable parent queue item. No competing live checklist or queue is created.

Do not change item/scene/sequence/journal schemas, geometry/render algorithms, lock/history policy, timers, buffer budgets or CI/security/deployment permissions. The existing native step budget remains 900 seconds; no timeout change is proposed. This is not the multi-selection/group transaction rewrite. Use synthetic fixtures and no packages.

## Architecture and interfaces

### Pure model

Add `imagery-app/src/editor-aids-model.js`, following the current dependency-free CommonJS/browser module pattern and depending only on the canonical model. Proposed interface:

`ImageryEditorAids.guideLayout(scene, {width, height}, {gridStep: 5, centerGuides: false})`

Validate scene through `M.canonicalScene`; viewport dimensions must be finite positive numbers; options are an ordinary closed optional-subset record with `gridStep` in 1/5/10 and Boolean `centerGuides`. Omitted options/fields default to step 5 and centers false. Reject accessors, extra keys, unsupported values and nonfinite derived dimensions without coercion or mutation. Use `M.contentRect` and the exact thinning rule in clarifications.

The agreed defensive return record is `{contentRect, grid: {x, y}, center: {x, y}, effectiveInterval: {x, y}, count: {grid, center, total}}`. The four line arrays contain content-local CSS positions, effective intervals use normalized units, and counts bound all returned positions. The model/UI writers have agreed these field names. No DOM, visibility, clock, callback, storage, network, scene mutation or hash authority belongs here. Generation remains bounded by normalized grid indices, not viewport pixel counts.

### Overlay and control integration

Use a small renderer module or app-local renderer, with explicit `render(layout)` and `clear()` boundaries. It mounts one bounded sibling of the main canvas with a clipped content child. No imported markup, extra canvas, raw HTML insertion or focusable mark. Position using the actual canvas rectangle and authoritative layout; account for canvas borders without shifting the content model. Do not wrap/reparent the canvas or alter its existing grid placement. Measure layout after existing control rows settle, as `render()` already does before sizing/drawing.

Add an Editor aids section with labeled native Show editor aids and Center guides checkboxes, a labeled native Grid spacing select, and concise status/help. Show editor aids uses its native checked state to reflect arming and is unchecked initially and after disarming. Reuse shared responsive tokens and semantic existing controls. Keep status height stable, labels complete, 44 CSS-pixel actionable targets and persistent Hide. Settings may be edited while hidden without drawing; the arm action is guarded as well as disabled.

The app owns `aidPreferences`, `aidsArmed` and `aidAffectedProvenance`. Initial preferences are step 5/centers false; both state flags are false. Derive eligibility from controller visibility, valid current draft, Live mode, Scene section, open editor, foreground and not fullscreen. The renderer never decides eligibility.

### Concealment and callback ordering

Audit `conceal`, `cancelPlayback`, `hide`, End, invalid-input failure, fullscreen request/change/failure, visibilitychange/pagehide/effective resize, import/replacement handlers, editor-toggle and section/mode transitions. Clear/disarm before later rendering or callbacks. Existing `cancelPlayback()` is also called during a new explicit Live start; clearing aids there is correct but must not accidentally reset the provenance suppression latch. Reset that latch only once a new eligible clean display action succeeds.

Disarm successful synchronous New/Convert/preset replacements before their replacement render without adding concealment to paths that currently preserve a valid active Live preview. Already-concealing imports stay concealed. Replacements cannot clear the provenance suppression latch. Reuse existing gesture rollback and asynchronous invalidation. Aid setting changes do not call generic field refresh or clear move history. Late pointer release, import, image result or digest cannot restore an old aid generation. Preserve existing successful-only lock replacement rules unchanged.

### Provenance and journal boundary

Before visible aid rendering, call the existing stop path with `edit`, advance provenance identity and invalidate any pending journal export preview. Gate `recordVisibleDisplay()` on clean eligibility. Gate both journal getters so the status and saved scene/exposure association agree that an aid-affected viewing action is unavailable; preserve existing records. Provide the user-visible reason in editor/journal text without adding exported enum/schema fields.

Clear suppression only on a successful explicit clean Live/Show/new one-pass start with aids disarmed. Failed/blocked actions, corrected input, aid-off, tracking-toggle, normal repaint and Pause/Resume must not reset it. Existing `draw()` invokes `recordVisibleDisplay()` immediately after painting; suppression/clean-reset ordering must be established before that call. A settled hash callback only refreshes status and must not bypass gated journal getters.

## Implementation sequence

1. Freeze model/UI return fields and write pure layout boundary tests first.
2. Implement/test pure layout, including all ratios, dense/thinned cases, empty interior grid, centers, nonfinite inputs and adversarial option records.
3. Add bounded overlay plus semantic controls. Prove no scene/canvas/history/selection/lock mutation and no intercepted hit targets.
4. Integrate common disarming, cancel/rollback and stale-work coverage. Add rejection/failure tests before reporting a fix.
5. Integrate provenance suppression and success-only clean reset; exercise all clean-start routes and late digest/export cases.
6. Assemble from source, run complete dependency-free tests, native/visual/performance/package gates, then independent review and exact-head CI. Documentation/evidence must name the actual tested source and inspected captures.

Ownership can be split among the pure model, UI integration, and tests/review, with one writer per source file. The model worker owns only its module and pure tests; app integration owns app/shell/style/assembly wiring; tests/review can add separate files. Coordinate interfaces before coding. Do not overwrite another writer's work or run assembly while source changes are unsettled.

## Verification and performance

Follow [tasks](tasks.md) and [requirements checklist](checklists/requirements.md). Before claiming changed-source acceptance, run `node imagery-app/src/assemble.cjs`, the full `node --test imagery-app/tests/*.test.cjs`, offline docs check and exact artifact/manifest verification through established scripts. Run native Chrome using the normal sandbox and inspect the actual affected screenshots. Preserve prior failures, do not increase timeouts or drop assertions to hide regressions.

Measure a fixed synthetic 12-item maximum-geometry/effect case using paired trusted center-guide-setting events with aids off and on in the same artifact/runner. Measure the synchronous handler-plus-layout interval and first Hide handler interval, not calibrated screen latency. Report median/p95/max, versions, DOM counts and repeated-toggle stability; separate pure-model timings if collected. Timing instrumentation belongs in tests, not a new runtime RAF/timer. Structural bounds are hard gates: 200 lines, 230 DOM elements, no extra presentation buffer, no idle work/new timer, no growth across repeated toggles. Freeze any regression timing budget from measured baseline before acceptance; an unexplained aid-attributable task over 50 ms or delayed first Hide is an investigation blocker, not a universal device guarantee.

Implementation completion, native acceptance, inspected visuals, physical devices, other engines, actual zoom/OS workflows, assistive technology, qualified sensory review and governed research remain distinct. Mark unavailable procedures NOT RUN/BLOCKED, not implied by emulation. Publication, merge and release are not authorized by the existence of these planning files.
