# Requirements quality and acceptance checklist

Feature 014. This is a design/acceptance review checklist, not a completion register. [The queue](../../../project-queue.json) owns live status and evidence; [tasks](../tasks.md) preserve all 30 required acceptance cases. A reviewed requirement is not an executed implementation test.

## Specification quality and scope

- Is the exact accepted draft digest preserved, with local preparation commit/tree, attributed pending Feature 013 run, accepted Feature 012 prerequisite and separately required verified Feature 013 main?
- Is the complete normative contract retained without shortening any of the 30 precision, fault, native, export, lifecycle or resource cases?
- Are only flat disjoint session groups of 2–12 items and at most six groups added within the unchanged 12-item cap?
- Are names, nesting, merging, member isolation, transforms, persistence, workspace/scene/sequence/journal schema changes and automatic outlines explicitly excluded?
- Are pure validation/planner/history group-closure preconditions distinct from explicit UI reducer expansion?
- Are source/candidate identity, design review, model/DOM tests, native interaction, actual visual review, measurements and physical/AT/research outcomes clearly distinct?
- Does IF-050 remain the sole live register with no new status board or incidental release/hosting/collection/security/CI authority?

## Pure metadata, selection and identity

- Closed group records and dense ordinary arrays reject unknown fields, wrong prototypes, getters/setters, sparse/side-property arrays, malformed or duplicate IDs, foreign members, overlap, singleton/empty groups and excess bounds before accessing hostile values.
- Scene and group data validate separately, then references cross-check; invalid metadata cannot be silently dropped, repaired, merged or passed into the scene validator.
- Numeric group/member suffix order is stable across layer reorder, including 2 versus 10; member/unit layer order is derived independently.
- Selection retains unique current item IDs in draw order and actual chosen/hit primary. Empty/null is valid; partial groups reject at pure/planner/history boundaries.
- Checklist, native selector, timeline, overlap, pointer/toggle, Select all/Clear, Move anchor and delete fallback all enforce the specified closure and primary rules.
- Native Select item or group uses the neutral placeholder for every multi-item/empty selection, including a single group; choosing the prior primary from mixed selection selects only its unit.
- Group selected ungrouped items creates one group; exact already-selected group is no-op; grouped-plus-anything rejects; insufficient ungrouped selection is ineligible and directly dispatched handlers agree.
- Ungroup selected groups dissolves all at once, preserves selected members/primary/items/order and ungrouped selections, and is a complete no-op when none is selected.
- Current, both retained history endpoints and already planned IDs reserve allocation before branching. Bounds remain 492 group IDs and 984 item IDs; no failure consumes an ID or adds persistent state.
- History clearing/eviction permits safe ID reuse only with generation plus external revision checks. Old callbacks cannot target a new group sharing text ID.
- Allocation failure leaves state unchanged and does not block Ungroup, otherwise allowed deletion/selection, Hide, Unlock all or exports.

## Rigid units, precision and structural commands

- Units are complete groups plus ungrouped singletons, ordered by earliest member layer index; exact leading-edge ties use that index, never primary or group-ID order.
- Shared returned-kind body/outline bounds exclude shadows and include internal empty space; authored polygon-returning dot/circle and legacy aspect rules remain covered.
- Align requires two units and equal gaps three; one multi-member group cannot rearrange its own members. A lone group centers its union; only ungrouped singleton uses original helper outputs.
- Drag/tap/exact/nudge use the inherited common selected-set delta and primary snap. Align/distribute use one rounded delta per unit-axis, never independent member clamping/rounding.
- Exact-payload zero remains independently feasible, including near-inset outlined-dot plus opposite-bound zero-only group; active snap zero qualification, outward/subthreshold/no-feasible cases and mirrored axes are tested.
- Unchanged axes, tolerated residues, unselected records, metadata/no-op/rejected commands, copies and history preserve exact payloads. Real unit moves preserve integer-hundredth internal offsets.
- All six alignments, X/Y/both centering and both equal-gap commands use inherited branch-specific comparison tolerances, final canonical validation and atomic rejection. EPS never widens insets or biases rounding.
- Widths 10/20/10 in span 10–90 produce unit leading edges 10/40/80, with at least one multi-member group retaining a common internal delta; equal-center/member-scattering outputs fail.
- Internal-empty-space, uneven/nested/rotated/outlined bounds, negative/infeasible gaps and rounding overlap reject safely; no packing/endpoint/shape repair.
- One hundred repeats preserve exact first-result document/groups/history/redo, including already-near-tolerance payloads and untouched axes.
- Any selected lock rejects whole document-changing commands including stationary endpoints and no-op branches; source-locked duplicate remains the explicit unlocked-copy exception.
- Duplicate preserves source/copy numeric payloads, appends item copies in source draw order, allocates copy groups in source-unit order, remaps primary/membership and leaves ungrouped copies ungrouped. Cap/group/ID failure commits nothing.
- Delete removes all selected members/group records and expands nearest surviving layer fallback with that actual item primary. Empty static result remains valid; empty capture remains invalid.
- Noncontiguous grouped A/B in `[A,X,B,Y]` becomes `[X,A,Y,B]` and reverses without gathering/reversal. Group bytes remain exact; array bytes change intentionally.

## Raw safety, atomicity, history and locks

- Group/Ungroup validates raw candidate equality with the stable canonical draft. Valid different pending ordinary edits are neither bundled nor auto-staged; they finish through their own gateway first.
- Fresh invalid user-authored text survives rollback of grouped provisional movement, selection/Group/Ungroup/history rejection and Hide. Exact origin/groups/resolved selection/stacks return without replaying stale DOM values.
- Metadata-only publication is a single complete groups/selection/history transition with external revision, no identical-scene controller stage, canvas repaint, dirty/hash/provenance interval mutation, accepted-history change or sequence change.
- Document-changing publication retains one final controller stage and complete scene/groups/selection/history transition. Complete no-op stages/publishes/allocates nothing and preserves redo.
- Before-stage rejection, provisional paint/UI failure, final document-stage failure, post-final-publication paint failure and metadata-publication UI failure have distinct tested rollback/hidden-commit outcomes and truthful status.
- Directly dispatched metadata commands cannot bypass fullscreen/manual-step/running-or-paused-playback eligibility. Hide remains unconditional; hidden static editing remains hidden.
- One 40-total undo-plus-redo stream contains exact before/after document/group/closed-selection snapshots, generation, kind and immutable targeted IDs, but no locks, bitmaps or second group history.
- Real Group after Undo clears redo despite equal scene bytes; exact-group/Ungroup-none no-ops preserve it. Evict only oldest undo when needed.
- History compares current document/groups/generation with the expected endpoint, not live selection; saved target groups/selection validate without expansion or repair.
- Ordinary raw/policy/lock/candidate rejection preserves stacks/current groups/selection/raw text; genuine incompatible endpoint separately invalidates the unusable stream with an explanation.
- Metadata-only history remains allowed under locks; document history retains full-record and targeted-reorder checks. No history action restores/releases locks.
- The real UI copy-lock sequence is covered: Ungroup copies, select/lock one copy, Undo metadata-only Ungroup, then reject duplicate Undo without losing group/stacks; Unlock all permits the same target.
- Gesture ownership allows multiple provisional moves without self-cancel; membership/selection/lock/snap/external revision change cancels and late release cannot commit.

## Lifecycle, formats, UI and native evidence

- Every specification lifecycle-table row executes, including Apply/capture retention; ordinary/global edit; Add item; invalid/same-canonical correction; safety/mode/lifecycle; draft history; Discard/accepted history; every successful replacement; rejected/canceled/stale replacement; sequence-only import; Load step; export and reload.
- Discard preserves a still-valid prior singleton only when no groups exist. Any group anywhere clears all groups and selects the first accepted item or empty; rejected Discard preserves prior groups/selection/history.
- Identical-byte/same-ID replacement clears groups by route on success, while Apply retains them. Successful-only lock clearing/current-history lock rules remain intact; stale completion cannot clear/restore metadata.
- Group-only Undo/Redo conceals/disarms without changing scene identity. Membership does not create/end an interval by itself; aid-affected provenance remains latched and aids never rearm incidentally.
- Individual fields, Start after previous and Lock selected item are disabled and handler/readFields-enforced for groups. Ungroup keeps multi-selection; explicit singleton selection is needed to edit a member. Unlock all and permitted globals remain available.
- Groups never appear in canonical scene/sequence/journal exports, captures, accepted history or provenance hash. Unknown imported group/selection fields fail strict validation; reload/import does not reconstruct membership.
- Session-only warning appears beside controls and in the guide; Apply/downloads are not described as saving groups. Reset notice is bounded and scene dirty semantics unchanged.
- Trusted keyboard, mouse and touch-emulated create/select/anchor/move/align/distribute/duplicate/history/Ungroup paths verify exact numeric output and separate group state, not export-only metadata claims or screenshot similarity.
- Grouped drag/tap retains grab offset/snap and one-gesture history. Shift toggle is selection-only, topmost lock never clicks through, rapid first Undo/Unlock and cancel/lost-capture regressions remain.
- Actual before/after captures show uneven/rotated/internal-empty-space and noncontiguous groups with real scene/controls. Existing ratio/legacy/forced-colors/reduced-motion evidence remains substantive.
- Actual 1280×800, 320×760, 640×360 and 320×280 captures show discoverable complete 12-row labels, item/unit counts, group/lock/loss explanations, Move anchor and Group/Ungroup, with 44 CSS-pixel targets and focused/corner-hit reachability in the existing aperture.
- Group/Ungroup keeps activating button focus; stable item/control focus survives refresh/reorder; deleted focus uses nearest survivor/summary. No unnecessary second scroller or captured-canvas reflow.
- Canvas failure, group failure and locks do not block ordinary exports, Unlock all or Hide. Metadata/data-only commands do not demand unrelated viewport geometry.

## Resources, evidence and integration

- Work is bounded to 12 items, six groups, small deterministic sorts and necessary full validation passes. No validation/security weakening, added storage/network/timers/RAF/buffers/render primitives/schema fields/custom names or automatic outlines.
- Memory ledger includes at most 40 pairs of document/group/selection endpoints and both ID reservation sets; repeated Group/Ungroup/Undo/Redo creates no retained DOM/history growth.
- Same-runner metadata and grouped-arrangement synchronous handler-plus-layout and first-Hide median/p95/max are measured with instrumentation limits. Attributable >50 ms work is investigated, not concealed by timeouts or called calibrated display latency.
- Exact assembled source runs complete Node/native/package/docs/integrity/whitespace gates. Record source/tree/runtime hash/bytes, commands, versions, counts, failures and actual inspected captures.
- No prerequisite count/run, prepared case or algorithmic bound is mislabeled as a Feature 014 pass or measurement. Source repairs rerun affected cases and final aggregate evidence.
- Verified Feature 013 main, reconciled source, independent exact-tree/visual review and required green exact-head CI precede integration. Physical-device, actual AT, cross-engine, zoom, OS file, sensory/research, release and hosting remain separate.

Use PASS, FAIL, BLOCKED or NOT RUN only for real executed procedures and actual outcomes. Native emulation is not a physical device; a scanner is not accessibility conformance; software results are not sensory or clinical clearance.
