# Specification: opt-in editor grid and center guides

Feature 012 · 20 October 2026 · Specification for the next bounded IF-050 increment. Implementation and exact-source acceptance are separate; this document does not claim either is complete.

## Purpose and authority

Help an author place existing shapes against an optional visible reference while preserving the distinction between the editor and the displayed scene. This implements only editor-only grid/center guides from [roadmap US2](../008-interactive-scene-roadmap/spec.md#us2--edit-without-dragging-and-arrange-layers-p1p2). Multi-selection, distribution, group lifecycle and persistent settings remain separate deferred increments.

The approved roadmap authorizes staged implementation and automated/native/visual testing. It does not authorize deployment, publication, new permissions, package installation, storage, collection, or research claims. Follow [repository guidance](../../AGENTS.md), the [constitution](../../.specify/memory/constitution.md), [clarifications](clarifications.md), [plan](plan.md), [tasks](tasks.md), and [analysis](analysis.md). Only [project-queue.json](../../project-queue.json) owns live status. [Research and baseline references](research.md) distinguish the accepted core from this new work.

## User stories and acceptance scenarios

### US1 — See optional editor references

As an author, I can deliberately show a static grid and optional horizontal/vertical center guides while editing a valid visible static Live draft.

- Initially the grid spacing preference is 5 normalized content units, center guides are off, and Show editor aids is off. Static startup remains unchanged and does not display aids or start timing.
- Show editor aids is enabled only when the current draft is valid and visible in static Live mode, the Scene editor is open, the document is foreground, and fullscreen is inactive. Enabling it shows the grid without moving an item or changing dirty state, history, accepted data, or exports.
- The spacing choices are 1, 5, and 10 units. Center guides at X=50 and Y=50 are independently selectable. Both are editor references, not scene objects.
- Grid and guide positions use the actual authored content rectangle; black letterbox bars never receive marks. Legacy viewport scenes keep their existing layout semantics.
- At small sizes the grid displays a disclosed subset of its base lines, keeping at least 8 CSS pixels between painted grid lines on each axis. The editor reports the actual X/Y painted intervals when they differ from the selected base step. This is a legibility rule, not a sensory-safety claim.
- Setting changes without an active gesture leave canonical scene bytes, scene-canvas pixels, accepted history, draft move history, selection and item locks unchanged. If a captured gesture exists, the setting change first cancels/rolls it back using existing policy; the late release cannot commit.

### US2 — Keep snapping independent and retain equivalent controls

As a keyboard, touch or precision user, I can configure aids with semantic controls and continue using the established editing methods without changed coordinate rules.

- Show editor aids is a labeled native checkbox whose checked state reflects explicit arming; spacing is a labeled native select and center guides a labeled native checkbox. Show editor aids is unchecked initially and after disarming. All have keyboard and single-tap equivalents, visible focus, and reachable controls at narrow/short sizes.
- Existing Snap centers remains Off/1/5/10 and applies only to drag/tap placement. Showing a grid does not enable snapping; changing snap does not show a grid. Grid thinning never changes snap positions.
- Typed coordinates, nudges, focused-preview arrows/Shift+arrows and centering keep their current exact/unsnapped behavior. Existing item selection and lock semantics are unchanged.
- The overlay has no pointer targets, focusable descendants, or accessibility-tree content. Semantic controls and text provide its equivalent explanation; overlay marks cannot intercept a drag or Hide.
- Hide, Stop, End, Escape and fullscreen Exit remain usable regardless of aid state, invalid settings, locks, or rendering failure. Text-input keyboard behavior is unchanged.

### US3 — Keep viewing clean after an interruption

As a user, I can hide or change modes knowing that editor references cannot return by themselves.

- Hide/Stop/End/Escape, invalid draft input, import initiation, visibility loss, pagehide, effective resize, fullscreen request/change/failure, and existing lifecycle cancellation immediately clear/disarm aids and preserve their existing concealment behavior.
- Closing the editor, leaving the Scene section, or leaving static Live mode also clears/disarms aids. Clean fullscreen, manual snapshot viewing, item playback and sequence playback contain no aids, including paused frames.
- Successful scene replacement clears/disarms aids before its replacement render while preserving that route's existing visibility authority. Some synchronous New/Convert/preset paths may preserve an already active Live preview; this increment must not newly conceal those paths. Already-concealing imports remain concealed. Failure, cancellation or stale completion cannot restore aids or clear provenance suppression. Harmless spacing/center-guide preferences may remain in memory, but arming does not survive the interruption.
- A later explicit Resume Live/Show action displays only the valid scene through its existing visibility gate. Aids require a separate fresh Show editor aids action. Correction, callbacks and restoration cannot reveal either surface.
- Configuration while hidden may change session preferences but never draws the scene/aids, starts timing, or adds history. No browser persistence is added.

### US4 — Do not mislabel marked viewing as scene-only provenance

As a user of optional reflection provenance, I can distinguish a clean scene display from an editor composite containing guides.

- Although aid toggles preserve the main canvas and canonical document, they change the visible screen composite. On enabling aids, end any current tracked interval with the existing `edit` reason before marks can appear and invalidate the caller-owned display identity.
- Suppress new scene-only provenance while aids are visible and for the rest of that aid-affected viewing action. The journal callback returns unavailable scene/exposure fields, never substitutes the preceding clean interval, and explains why. Existing saved journal records remain unchanged.
- Turning aids off, opting into tracking, a settled digest, a corrected field, a rerender, a failed/blocked Show attempt, or Pause/Resume does not clear this suppression.
- A successful fresh explicit clean display start can clear suppression: Resume Live, Show scene/step, or an explicitly started finite one-pass item/sequence presentation, with aids disarmed. This does not give aids any authority to start such a display or timer.
- Preserve the existing journal schema and end-reason enum; use `edit`, not a new exported aid-specific field. Delayed digest callbacks may update internal bookkeeping only, not reveal or make the aid-affected interval available.

## Functional and resource requirements

FR-01. Use a bounded application-created DOM/CSS overlay separate from the main and existing offscreen canvases. Do not paint aid pixels into either, copy scene pixels, or allocate a third full-size canvas.

FR-02. The pure layout model accepts a canonical scene, finite positive viewport dimensions, and a closed optional-subset options record with defaults. It returns only validated numeric layout data, at most 200 line positions, and actual painted intervals using the agreed interface in the plan. The complete DOM subtree is at most 230 elements. No input mutation or unbounded append-per-event behavior is allowed.

FR-03. Position/clip the overlay from the same actual canvas rectangle and `contentRect` used by the app. Do not reparent/wrap the canvas in a way that changes its established layout. Controls and status text cannot shift a captured viewport.

FR-04. Eligibility is derived from authoritative controller/display state and explicit session arming. The model/overlay renderer has no reveal, storage, clock, history, canonical-scene mutation, or import authority.

FR-05. A bad option/candidate does not change scene/sequence/selection/locks/history or valid preferences. Roll back an active gesture and conceal where existing safety policy requires. Remove the overlay on failure; if correct registration/clearing is uncertain, conceal. Hide must remain independent of overlay success.

FR-06. No format bump: scene-v3/v4, sequence-v2/v3 and journal contracts remain unchanged. Strict legacy migration and closed-key rejection remain. Aid/grid/snap/lock metadata is absent from scene/sequence captures, imports and downloads; unknown imported aid fields are rejected, not stripped.

FR-07. Preserve the 12-item cap, 40-entry draft move history, current buffer caps, finite separate playback clocks, static startup, closed validators and self-contained portable runtime. No new timer, RAF loop, animation, transition, network, storage, account, remote asset, package, security change, deployment or submission route.

## Non-goals

No multi-selection, selection bounds, alignment/distribution expansion, groups, draggable rulers/guides, magnetic alignment, persistent preferences, new shape geometry, raw SVG/HTML import, camera/telemetry, clinical/efficacy claims, physical calibration, exposure guidance or research activation. A grid is not certified as comfortable or medically safe. All these boundaries remain after a software PASS.

## Success and verification

Success means exact-source model/DOM regressions, trusted native interaction, actual inspected captures, no-overlay underlying raster/export equivalence, provenance exclusion, resource bounds and independent review pass. [The task map](tasks.md) defines acceptance gates. Mocks are not a browser, emulation is not physical-device testing, screenshot inspection is not accessibility conformance, and baseline passes do not accept new source.
