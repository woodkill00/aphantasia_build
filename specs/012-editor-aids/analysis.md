# Consistency and failure-mode analysis

20 October 2026. This is a preimplementation analysis, not a test outcome. [The queue](../../project-queue.json) records implementation/evidence status. The [spec](spec.md), [clarifications](clarifications.md), [plan](plan.md) and [task map](tasks.md) constrain this increment.

## Requirements coverage

| Requirement | Implementation boundary | Required evidence |
| --- | --- | --- |
| US1/FR-01–03: optional bounded references | Pure model plus separate DOM/CSS sibling | Model cases 1–4; DOM 5/8/9/12; actual raster/composite and ratio captures 13–15. |
| US2: independent snap and equivalent controls | Existing edit semantics retained; semantic aid controls | DOM 5/6/8/9; trusted native/keyboard/touch 13/15/17. |
| US3/FR-04–05: concealment authority | Common clear/disarm and eligibility gate | Lifecycle/stale/failure cases 6–8/16; no callback restoration. |
| US4: correct provenance association | Existing edit stop; app-only suppression and gated journal callbacks | Late digest and success-only clean-start cases 10–11. |
| FR-06–07: closed formats/resources | No schema/cap/clock expansion | Serialization/adversarial/no-API cases 4/9/11/12; performance/integrity 18–20. |

## Concrete integration risks

1. **Unchanged scene hash is not unchanged viewing.** DOM marks modify the screen composite even when canvas bytes match. A simple hash-equality test is insufficient. Stop before marks, suppress the current association, and test screenshot difference plus main-raster equality.
2. **Current draw/provenance ordering.** `app.js` calls `recordVisibleDisplay(state)` at the end of `draw()`. If the overlay flag is applied only later, a new clean interval can start during the same marked render. Establish suppression before draw and preserve it through aid-off; reset only on successful explicit clean starts.
3. **Status-only digest callbacks.** `provenance-model.js` can settle a digest after the interval ended. Its app callback refreshes the journal, whose status and `getProvenance()` currently read the tracker directly. Gate both paths; otherwise status may say ready or a previous clean interval may attach to a marked action. No need to widen the closed journal schema.
4. **Common cancellation has multiple callers.** `cancelPlayback()` is used by concealment and explicit display starts. Disarming belongs on both paths, but resetting provenance suppression does not. Rejected start attempts cannot clear suppression. Audit every successful Live/static-step/new-playback path and Pause/Resume separately. Existing synchronous New/Convert/preset replacement can preserve Live visibility; disarm aids without newly concealing those paths, and never treat replacement as a clean explicit start.
5. **Overlay layout/hit interception.** The canvas changes between absolute/full-window and responsive grid layouts; border and content coordinates must remain consistent. A wrapper or variable-height status can move a captured viewport. Use a sibling, stable labels/status and actual rectangle checks; inspect narrow and short apertures.
6. **Dense grid or unbounded work.** Pixel-driven loops can explode on extreme dimensions; subpixel lines can create dense patterns. Iterate only normalized indices, enforce 200-line/230-element bounds and disclose axis-specific thinning. Reject nonfinite derived numbers. Visual acceptance remains necessary; these are engineering limits only.
7. **Gesture/history regression.** Generic `fillFields()` clears move history; existing drag cancellation also restores a starting draft. Aid settings must not use field refresh or clear completed history. Distinguish allowed rollback from otherwise byte-identical toggles. Retest first-tap touch Undo/Unlock behavior.
8. **Hidden stale overlay.** A CSS-only eligibility class can leave an armed flag alive for restoration after fullscreen, resize or async imports. Explicitly clear and disarm; later successful Show remains clean. Renderers and delayed work never grant visibility.
9. **Exceptions blocking Hide.** Clear/remove code can fail. Concealment must not depend on successful overlay DOM work; remove/hide its ancestor if possible and preserve the controller's concealment even if cleanup throws. No timer retry may redraw stale marks.
10. **Scope leakage.** Visible grids do not authorize selection outlines, guides as data, group transforms, new scene fields, timers, dependencies or empirical/research claims. Keep later arrangement increments separate and document their continued deferral.

## Constitution review

User control, canonical validation, session-only local scope, no unsupported scientific conclusions, accessible equivalents, bounded work, exact-source evidence and the single queue all remain applicable. No exception is requested. Existing 008 wording that no grid was introduced describes the accepted fourth increment; feature 012 explicitly specifies the later overlay without rewriting that historical acceptance or its no-grid test results. Tests must distinguish unchanged baseline requirements from the new opted-in editor surface.

## Open implementation choices and stopping conditions

The product decisions are frozen in clarifications. Freeze exact return field names and neutral styling between writers, and measure the baseline timing budget before acceptance. Those choices do not justify feature expansion. Stop and request a scope decision if implementation would need a new file schema, storage/network/permission, third full-size canvas, new timer, changed renderer/geometry rules, persistent groups, or research collection. A failed native/visual gate remains a failure; do not relax tests/security/CI to pass it.
