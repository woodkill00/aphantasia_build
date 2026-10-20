# Requirements quality and acceptance checklist

This is a review checklist, not a completion register. Live status/evidence belongs only to [project-queue.json](../../../project-queue.json). [Tasks](../tasks.md) are the fixed execution/acceptance map.

## Specification quality

- Is the increment limited to opt-in grid/center guides, with multi-selection/groups/persistence explicitly deferred?
- Are grid defaults, independent snap, exact per-axis thinning, hidden-state configuration and fresh arming observable and unambiguous?
- Are canvas bytes versus screen composite distinguished, and is marked-view provenance exclusion explicit without a schema/version bump?
- Are common concealment, editor/mode/fullscreen/lifecycle/import and failed/stale-callback paths covered?
- Are strict options, nonfinite derived values, 200-line/230-element bounds and no new canvas/timer/storage/network authority specified?
- Are keyboard/touch equivalents, pointer pass-through, actual focused-control/Hide reachability and no-layout-shift requirements explicit?
- Are accepted baseline source/tree/runtime/main-run evidence separated from unperformed new-feature tests?

## Implementation and evidence review

- Pure model is deterministic, closed, input-immutable and bounded for all ratios and adversarial dimensions/options.
- Aid settings without active gestures preserve scene/selection/locks/dirty/history/export state; active cancellation rolls back and rejects late releases.
- Overlay is a separate bounded DOM/CSS sibling, clipped to content; no aid paint reaches either presentation canvas or black letterbox bars.
- Show eligibility is enforced in handlers as well as disabled flags. Every interruption clears/disarms; correction/restore/Show does not rearm.
- Hide/Stop/End/Escape/Exit still work if overlay cleanup/rendering fails. No late callback can mutate or reveal superseded state.
- Provenance stops before marks, journal status and data both say unavailable, prior clean records are not substituted, and pending export previews are invalidated.
- Only a successful fresh clean explicit display start resets suppression; aid-off, digest, opt-in, failed Show and Pause/Resume do not.
- Existing saved records/closed schema/legacy imports, 12-item cap, 40-entry move history, buffer limits and finite playback remain unchanged.
- Full exact-source Node/native/package checks actually run; actual affected screenshots and trusted interactions are inspected, not merely prepared.
- Dense/thinned grid, all ratios/letterboxes, narrow/short/focus/fullscreen/hidden states and underlying raster-versus-composite comparisons are covered.
- Resource counts, repeated-toggle growth and same-runner performance/first-Hide evidence are recorded without universal-device claims.
- Exact source/tree/runtime hashes, versions, commands, failures and actual inspected-capture scope are reported. Emulated/physical/AT/zoom/sensory evidence stays separate.
- Independent review and green exact-head CI precede integration; release/hosting/security/research authority is not inferred.

Use PASS, FAIL, BLOCKED or NOT RUN for executed procedures only. A completed specification is not implemented functionality; a passing scanner is not accessibility conformance; software evidence is not sensory or clinical clearance.
