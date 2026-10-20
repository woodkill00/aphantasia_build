# Specification: flat session groups

Feature 014 · 20 October 2026 · Bounded IF-050 increment. This is the promoted design contract, not implemented functionality, implementation acceptance, a new public work register, or permission to release or host the app.

Follow [repository guidance](../../AGENTS.md), the [constitution](../../.specify/memory/constitution.md), [clarifications](clarifications.md), [plan](plan.md), [tasks](tasks.md), [analysis](analysis.md), [reference review](research.md) and [requirements checklist](checklists/requirements.md). Only [project-queue.json](../../project-queue.json) owns live status and evidence. All 30 cases in §11 are requirements, not test results; the task map preserves them unchanged.

## 1. Scope and authoritative prerequisites

This is the separately specified flat-session-group continuation of roadmap 008 US2 and the existing IF-050 arrangement work. The approved contract has SHA-256 `e6ad88225e3b310d0246a5e96e4fb07ed7248b7eb30b6a00b2a2c855ac218678`. The [Feature 013 specification](../013-atomic-selection/spec.md) and [clarifications](../013-atomic-selection/clarifications.md) are the authoritative inherited precision, selection, raw-input, history, cancellation, singleton-compatibility and atomicity baseline. This feature replaces only their explicit no-group scope boundary and the specific selection-unit, metadata-transaction and history extensions below. It does not weaken any inherited validator, lock, cancellation, visibility or precision requirement.

The local preparation base is `c9a31520bcfb256cf940781d17923ae8867eae47`, tree `51f641ecbd13007028ff1b22d31088fe6f579ba7`. The integration owner identifies this as tree-equivalent to draft PR 16 head prefix `12c2b356`; [workflow 39447144887](https://github.com/woodkill00/aphantasia_build/actions/runs/39447144887) was native-pending at this preparation snapshot. The integration owner reports Feature 012 guides main prefix `d95fbdc0` accepted with [exact-main workflow 39444608463](https://github.com/woodkill00/aphantasia_build/actions/runs/39444608463). These identities distinguish the accepted prerequisite from the pending Feature 013 candidate; neither run accepts groups.

**Feature 014 integration depends on separately verified Feature 013 main.** Its exact integrated commit/tree and required CI are not yet accepted at specification promotion. Before integration, identify that base, re-read its code and specifications, reconcile every change from the local candidate, and rerun affected group and aggregate evidence. Matching a pending PR tree is not verified-main acceptance. The integration owner records current status in the sole queue, not in this fixed specification.

Read the final base's AGENTS, constitution, 008/012/013 specifications, shared geometry/model, `selection-model.js`, app/controller and current tests before implementing. Inherited exact singleton helper behavior, including the half-hundredth boundary clarified by Feature 013, remains applicable only to a selected ungrouped singleton; a one-unit group is still a multi-item selection.

Add only flat session groups to the inherited arrangement pipeline, with verified Feature 013 main required before integration:

- Group/Ungroup as metadata-only operations in the existing 40-transaction history.
- Complete-group selection, grouping-aware arrangement units, duplicate/delete and history restoration.
- Explicit session-only lifecycle and semantic controls with no single-member isolation editor.

Keep 12 total scene items, at most six disjoint groups, all existing geometry/timing/buffer bounds, immutable item IDs, strict canonical import validation, static startup, and the existing separate finite playback clocks. Hide/Stop/End/Escape and lifecycle concealment always win. No group may veto concealment.

Do not add persistence, auto-save, a workspace format, scene/sequence/journal fields or version bumps, group transforms, nesting, named group editing, aggregate appearance/timing, lasso, automatic selection outlines, a new aid option, storage, network, timers/RAF, animation, packages, permissions/security changes, hosting, telemetry, or research/medical/accessibility-certification claims. Grouping does not add a scene node, render container, transform parent, layer container or clock.

## 2. Bounded session model and identity

A group is a closed ordinary data record `{id, memberIds}`. The editor's group collection is a dense ordinary array of 0–6 records.

- Use session IDs `group-1` through `group-999999`, distinct from immutable item IDs `object-1` through `object-999999`. IDs are application-allocated, not names and not executable identifiers.
- Every group has 2–12 unique current item IDs. Each item belongs to at most one group. Members must be real scene items, not another group ID. Empty/singleton/overlapping/nested groups are invalid.
- Store group records ordered by numeric group-ID suffix, with each `memberIds` array ordered by numeric item-ID suffix. Use natural numeric suffix comparison, so group-2 precedes group-10 rather than lexicographic string ordering. This stable metadata order is independent of current draw order. Canonicalization may reorder a valid defensive copy; it must not silently drop, merge or repair invalid membership.
- Derive a group's member draw order from the current scene only when needed. Layer reorder must not incidentally rewrite group IDs/membership or gather members together.
- Validate closed keys, ordinary prototypes and data descriptors before reading values. Reject getters/setters, duplicate IDs, sparse arrays, array side properties, invalid strings, foreign members, oversized collections and unknown fields. No hostile value is interpreted as a request to repair the state.

Groups are never passed into the canonical scene validator, renderer, sequence model or provenance digest. Validate the canonical scene and group metadata separately, then their references together. An invalid group candidate leaves the prior canonical document, groups, selection, locks and history intact; never discard groups automatically to make another command succeed.

An active group ID is immutable. Ungroup deletes that session record; later grouping is a new identity unless an exact history restoration reintroduces the old record. Scene generation and external interaction revision are both required on delayed work. Matching ID text is insufficient: history clearing/eviction can release a group ID for reuse within the same generation.

## 3. Complete-group selection and semantic UI

### 3.1 Selection closure

The selection retains the prior `{ids, primaryId}` shape. IDs remain unique current item IDs in scene draw order; the primary is one selected item, not a group ID. A valid selection is group-closed: if it contains any member, it contains every member of that group. Empty selection remains valid.

Pure validation rejects a partial-group selection. Expansion is an explicit UI reducer behavior, never silent repair of malformed planner/history input. For an item `i`, define its selection unit as its complete group if grouped, otherwise `{i}`.

| User action | Membership result | Primary result |
| --- | --- | --- |
| Select an item/group through the object selector, timeline or overlap cycle | Replace with that item's complete selection unit. | The actual chosen/hit item. |
| Check an unselected item's checkbox | Add its complete unit, then sort all selected IDs in draw order. | The checked item. |
| Uncheck a selected item's checkbox | Remove its complete unit. | Preserve the current primary if it remains; otherwise frontmost remaining item, or null. |
| Plain pointerdown on an unselected hit | Replace with its complete unit. | The actual hit. |
| Plain pointerdown on an already selected member | Preserve the entire current expanded selection, including other units. | The actual hit. |
| Shift+pointer toggle | Add/remove the complete unit; no drag during that gesture. | Same add/remove rule as checklist. |
| Select all / Clear | All items / empty. | Prior valid primary, otherwise frontmost / null. |
| Move anchor select | No membership change. | Any chosen selected item, including any group member. |
| Delete fallback | Find the same nearest surviving layer item as the prior increment, then expand its complete unit. | That nearest survivor, not an arbitrary first group member. |

No route may isolate a group member by exploiting the old singleton selector, timeline, overlap cycle, keyboard focus, deletion fallback or an externally dispatched event. The clicked member still anchors pointer grab/snap, but is not a hidden property target. Locked hits remain selectable without clicking through.

All selection transitions retain the prior raw-input, gesture rollback, external-revision and stale-release rules. A transition that would discard invalid pending raw input rejects and restores displayed checkbox/select state without erasing that text. Safety Hide remains unconditional.

### 3.2 Labels, counts and focus

Rename the existing selector to **Select item or group**. Keep its item option values as stable item IDs; append a grouped item's bounded group label and member count. A multi-item/empty selection displays the same neutral placeholder as the prior increment, not the primary ID. Thus choosing any option, including the current primary from a mixed selection, fires the native route and selects only that unit. An ungrouped singleton displays its own option.

Retain the at-most-12 native checkbox rows, not a second nested group list. Every group member's row is checked together, never indeterminate, and labels include item ID, layer, shape, lock state and group label. Explain: “Selecting a grouped item selects its whole group.” All timeline `aria-pressed` states reflect expanded item membership. The Move anchor selector still lists selected item IDs, including their group label where applicable.

Show separate counts, for example “5 items selected, 3 arrangement units: 2 groups and 1 item.” Do not use “three selected” ambiguously. Add native **Group selected items** and **Ungroup selected groups** buttons with bounded status/help text. No custom group-name editor, shortcut-only action or automatic canvas outline is added.

Preserve focus by stable item ID/control role during grouping, ungrouping, checklist refresh and layer reorder. Group/Ungroup leaves focus on the activating button unless an explicit recovery focus is required. If a focused item is deleted, use the nearest survivor/selection-summary policy. Keep full labels, 44 CSS-pixel targets, Move anchor, grouping explanations and Hide reachable through the existing inspector aperture at narrow/short sizes. Avoid a second scroll surface; never move/reflow the preview during pointer capture.

## 4. Group/Ungroup and property editing

### Group selected items

After current canonical/raw/selection/group validation:

1. Two or more selected ungrouped items form one new group, up to the existing 12-item and six-group bounds. Preserve selection and primary, every item record and layer order.
2. If the selection is exactly one existing group, return a complete no-op after policy validation. Allocate no ID and preserve redo.
3. If selection contains an existing group plus anything else, reject with “Ungroup selected groups before combining them.” Do not merge, flatten, nest, or partially consume an existing group.
4. Fewer than two selected ungrouped items is ineligible. UI disabled state is informative; direct handlers enforce the same rule.

### Ungroup selected groups

Dissolve all fully selected groups in one transaction. Preserve all items, numeric payloads, draw order, selected item IDs and primary. Any selected ungrouped items remain selected and unchanged. No selected group is a complete no-op, including an empty selection; the UI may disable the inactive button. Never auto-ungroup as a side effect of another command or selection.

### Locks and single-item properties

Group/Ungroup are allowed even with locked members because canonical item records and layer order are unchanged. Full-record lock validation still runs; metadata permission does not permit a changed protected document. A group containing a lock remains selectable, but any selected lock rejects every scene-mutating move/align/distribute/center/delete/reorder for the whole expanded selection. Source-locked duplicate remains the established exception and creates unlocked copies.

There is no single-member isolation editor. Selecting a group selects at least two items and disables individual shape/geometry/position/color/effect/timing fields, Start after previous and Lock selected item. Handler/readFields guards must not edit the primary. Explain **Ungroup first to edit or lock/unlock one member**. After Ungroup, the former members remain multi-selected, so the user must then select one member explicitly. Unlock all remains available without ungrouping; it changes no group metadata and adds no history entry.

A valid global background/shared-period/canvas-ratio edit remains allowed under existing lock/validation rules, preserves valid memberships and clears arrangement history only after a genuinely different successful scene edit. A valid individual edit to an ungrouped item cannot affect unrelated groups. Add item creates one ungrouped item and selects it alone; it does not join a nearby/selected group.

## 5. Arrangement units, precision and structural commands

### 5.1 Counts and bounds

Build selected arrangement units from complete selected groups plus selected ungrouped items. A unit contains its member IDs, the earliest current member draw-order index, and, only when needed, the union of the shared rendered body-plus-outline bounds of its members. Dispatch on returned geometry kind and preserve shadow exclusion, viewport checks and finite-derived-geometry validation from the prior contract. Unit bounds include internal empty space; they are not a new renderer or a guarantee that members are contiguous.

Order units by earliest member draw-order index for deterministic presentation; equal leading-edge distribution ties use that same index. Primary choice affects snap/tap placement only, never unit ordering or alignment reference.

- Alignment requires at least **two arrangement units**, not two members.
- Equal horizontal/vertical edge gaps require at least **three arrangement units**, not three members.
- One group of three or twelve items cannot align/distribute its own members while grouped. Disable with a count-specific explanation rather than silently scattering them.
- A selected group, even the sole selected unit, contains multiple items and uses **Center selection bounds**. It must never enter the singleton exact X/Y=50 path. Only one selected ungrouped item retains singleton helper behavior.

Group bounding boxes can overlap or nest even when the visible shapes do not overlap. Equal gaps use the boxes, including their empty space; a negative/infeasible box gap rejects. Say “Arrange groups by their combined shape/outline bounds; internal empty space counts.” Do not add geometry-union packing or collision detection.

### 5.2 Common translation and unit alignment/distribution

Ordinary drag, tap placement, normalized exact delta and nudges move the complete expanded selection using one common delta. Preserve the established primary anchor, 4 CSS-pixel threshold, snap behavior and exact unsnapped alternatives. A changed X/Y axis is written on the planning lattice; zero retains exact raw payloads. Pairwise preservation is in integer-hundredth lattice space, not exact subtraction of tolerated floating residues.

For alignment/distribution, compute the target once for each unit from the original scene, then choose **one rounded integer-hundredth delta per affected unit-axis** and apply it to every member of that unit. Never independently round/clamp each member toward the target. The entire command rejects if any unit member fails its strict canonical inset, lock or final geometric postcondition. No group moves partially, shrinks, rotates or changes internal lattice offsets.

Use the prior complete per-axis feasible set: `{zero preserving original payloads}` union valid nonzero lattice-intersection deltas. This includes the near-inset raw-origin case where only zero is valid. Exact/unit-target nonzero movement outside the intersection rejects; only pointer placement uses nearest feasible behavior. No rule widens canonical inset validation or normalizes untouched member-axes.

Apply the reviewed tolerances and idempotence rules to **unit bounds**:

- Six alignments: existing edge/midpoint spread at most `0.01 + EPS` is a payload-preserving no-op; newly computed mutating output must be within `0.005 + EPS` of the original union target and have spread at most `0.01 + EPS`.
- Canvas center X/Y/both: a union midpoint already within `0.005 + EPS` of 50 leaves that entire axis exact. Otherwise use one common delta across all selected members; final midpoint is within that tolerance, not promised exactly 50.
- Equal gaps: the same original outer span and variable-unit-width cumulative algorithm; at least three units; actual adjacent gaps at least `-EPS` and spread at most `0.02 + EPS` is already satisfied. Newly planned outputs must satisfy the unchanged non-overlap, endpoint and canonical checks. A rounded result that cannot satisfy them rejects wholly.

`EPS = 1e-9` is fixed comparison-only normalized noise, never accumulated or used to bias rounding. Repeating a successful arrangement must retain exact first-result canonical bytes, groups, history and redo. No-op leaves all group metadata untouched. These are engineering precision rules, not calibrated geometric claims.

### 5.3 Duplicate, delete and layer order

**Duplicate:** use the already group-closed validated selection before preflighting `currentItemCount + selectedItemCount <= 12`. Make exact unlocked copies of all selected items in source draw order and append them as one topmost block, matching the prior increment. Allocate copied group IDs in source-unit order by earliest member draw-order index, independent of source group-ID order. Each fully selected source group produces a new independent group containing the corresponding copy IDs; selected ungrouped copies remain ungrouped. Original groups/items/locks stay exact. Preflight resulting group count and allocate both kinds of IDs before any publication. Select all copies and map the prior primary to its copy. Failure allocates/commits nothing. No offset, timing edit or new container is added.

**Delete:** delete the complete expanded selection and its group records in one document-plus-metadata transaction. Any selected lock rejects all deletion. No empty/singleton/dangling group may survive. Select the prior nearest-surviving-layer fallback, expanded to its complete group if needed. Static empty scene remains valid; empty snapshot capture remains invalid.

**One layer forward/back:** use the exact stable adjacent-crossing algorithm over expanded selected item IDs. Preserve selected/nonselected relative subsequences and all group records; do not gather a noncontiguous group into a block. For example, `[A, X, B, Y]` with grouped A/B selected moves forward to `[X, A, Y, B]`, not `[X, Y, A, B]`. Group membership is not a z-order container. Any selected locked member rejects; crossing an unselected locked record retains the existing stored-record lock semantics. Reorder changes canonical array bytes/provenance, unlike Group/Ungroup.

## 6. One transaction pipeline with a metadata-only branch

Extend, do not replace, the verified raw-input-safe cancellation and atomic planner. Before every group command, cancel/restore a captured gesture without erasing freshly authored invalid raw fields; invalidate delayed work using the established ownership/generation/revision rules. Invalid pending raw input conceals and rejects Group/Ungroup/history as applicable, preserving canonical state, groups and stacks. Correction to the same canonical scene retains history; a valid different ordinary edit clears it only after successful staging.

Preserve the existing static-editor eligibility gate: metadata-only does not permit Group/Ungroup during fullscreen, manual step display or running/paused playback, and cannot switch modes or reveal to make itself eligible. Normal hidden static draft editing remains available.

A metadata-only command additionally requires the validated raw scene candidate to equal the current stable canonical draft. If a valid but genuinely different ordinary field edit is still pending, refuse Group/Ungroup without committing either change and report that the field edit must finish through the ordinary-edit gateway first. Do not silently bundle that scene change into a metadata transaction, or auto-stage it before discovering grouping is invalid. In normal eager-valid-input handling this guard should not fire. Invalid text remains pending and exact; valid same-canonical correction follows the prior history-preserving policy.

Plan and fully validate canonical document, group metadata, closed selection, arguments, expected endpoint/revision, all locks, caps and ID reservations before publishing anything. Return separate `changedScene` and `changedGroups`; selection-only differences are not transactions. Comparing only `sameScene()` is no longer a sufficient no-op test.

- **Document-changing command:** retain one final controller stage and one atomic publication of document, groups, selection and history. Stage rejection preserves prior stable state. After successful final publication, paint/UI failure conceals but retains the one complete hidden transaction and truthful failure status.
- **Metadata-only Group/Ungroup:** after all checks, publish groups, selection and one transaction together without restaging an identical scene, changing scene dirty state, increasing provenance identity, ending/starting a scene interval, repainting the canvas or modifying accepted history/sequence. No canvas geometry is required. Metadata status/checkbox refresh is bounded. A post-publication UI failure conceals and retains the complete metadata transaction; it cannot leave groups and history inconsistent.
- **Complete no-op:** after validation return without stage/publication/allocation; preserve canonical/group bytes, dirty state and both stacks.

Successful membership publication and history restoration, including group-only changes, advance the external interaction revision, invalidates old group/selection candidates and cancels an active gesture. It grants no visibility authority. A metadata change during a valid visible static Live draft may leave that same scene visible; hidden stays hidden and aid arming/provenance exclusion remain unchanged. Required concealment due to rollback/failure is a separate safety effect, not proof that group metadata changed the scene.

The provisional-gesture distinction remains essential: pointermove previews do not create completed history. Any provisional stage/paint/UI failure or pre-finalization cancellation restores the exact starting document, groups and resolved selection with prior stacks intact. Only successful pointerup final publication establishes a completed transaction that may remain hidden after a later paint failure.

Group-only Undo/Redo remains subject to the existing explicit history concealment/disarm policy, even though ordinary Group/Ungroup need not conceal. Its scene bytes/hash/dirty state remain unchanged; ending a visible interval due to that explicit concealment is not a new scene identity. Neither group metadata, history, correction nor replacement resets Feature 012's aid-affected provenance latch.

## 7. History, lock distinctions and bounded allocation

Keep **40 total completed arrangement transactions across undo plus redo**, including moves, align/distribute, structural commands and Group/Ungroup. One operation means one entry, not one per member/group. Store defensive before/after canonical documents, before/after groups, before/after selection, generation, command kind and immutable targeted item/group IDs. No extra group history, persistent allocator, event trail or lock snapshot is introduced.

A real Group/Ungroup is a successful branch and clears redo even when scene JSON is identical. Repeating Group on exactly one selected group or Ungroup with none selected is a no-op and preserves redo. Evict only the oldest undo entry when needed. Selection/primary/preferences/lock transitions add no entry.

Before Undo/Redo, validate the concrete target and compare the current canonical document **and groups** with the expected endpoint plus generation. Do not compare live selection, since a later selection-only change must not invalidate undo. Validate the saved selection under the saved target groups and restore all three atomically; a target partial-group selection is corrupt, not permission to repair history. A genuine incompatible document/group endpoint invalidates the stream with a bounded explanation rather than applying it to unrelated identities.

Current locks are authoritative:

- Group-only Undo/Redo is allowed with locks because records/order are unchanged. Do not reuse targeted-reorder blocking for a metadata-only transaction.
- Document-changing history retains all full-record lock and targeted-reorder checks. Undo of duplicate rejects if a copied item is now locked because it would remove that record and its copy group. No group record is removed before that rejection.
- Restoring/deleting groups never restores/releases locks. Accepted-scene Undo/Redo retains the existing any-lock prohibition.
- Ordinary history rejection (invalid raw input, policy, lock or candidate failure) consumes no stack entry or ID and preserves current selection/groups/raw text. The separately identified incompatible document/group endpoint is the explicit exception: invalidate the unusable stream rather than pop/apply one entry. Both outcomes still allow Hide/Unlock all/export.

Allocate the smallest unused positive group suffix from a temporary reservation set containing current groups, every retained before/after group snapshot in both stacks, and groups already planned in this command. With six current groups, 40 pairs of at most six groups and six planned groups, at most `6 + 40*12 + 6 = 492` IDs are reserved. The unchanged item allocator remains bounded by its prior 984-reservation proof. A scan of at most `reservedCount + requestedCount` successive positive candidates is sufficient under a valid state; never allocate a million-element registry or keep lifetime-used IDs forever.

Fresh Group/Duplicate planning reserves against the **pre-command** retained undo and redo snapshots, even when success will discard redo. This prevents undo → new group from immediately recycling an identity still represented by the branch being abandoned. Failed validation/allocation consumes nothing. Undo/Redo restores exact IDs from snapshots; it never reallocates.

History clearing/eviction may release unused IDs, so all stale callbacks must check external revision as well as generation. An old group ID cannot act on a newly allocated unrelated group with the same text. Allocation exhaustion/hostile reservation input rejects new Group/Duplicate safely, with current state untouched; it cannot block Ungroup, deletion of otherwise unlocked items, selection, Hide, Unlock all or export. With the stated valid bounds, actual namespace exhaustion is unreachable, but the error path remains tested.

## 8. Replacement, accepted history, sequence and export lifecycle

| Boundary | Groups, selection and draft history | Scene/visibility/locks |
| --- | --- | --- |
| Successful Apply or Add/Replace capture | Keep valid groups and expanded selection; clear draft arrangement history only after success. | Saved/captured data contains flat ordinary items only. Existing concealment and lock retention. Apply does not save groups. |
| Valid different ordinary property/global edit | Preserve valid groups; clear history only after success. | Existing canonical/lock authority; no implicit group-member property path. |
| Add item | Existing groups unchanged; new item ungrouped and singleton-selected; clear history after success. | Existing cap/lock policy. |
| Invalid raw edit / same-canonical correction | Preserve groups, canonical draft and stacks; block history while invalid. | Conceal on invalid input; correction alone never reveals. |
| Group/Ungroup / selection / primary / snap / locks / aid setting | Cancel captured work first. Only real Group/Ungroup adds a transaction. | No metadata-driven reveal, scene dirty/hash change or provenance latch reset. Aid behavior remains independent. |
| Hide/End/Escape, fullscreen, mode/playback/lifecycle interruption | Restore provisional state if needed; retain stable groups/selection and completed history. | Preserve existing concealment, aid disarm and lock rules. Playback consumes ordinary scene items only. |
| Successful draft arrangement Undo/Redo | Restore document, groups and closed selection atomically; move one stack entry. | Current-lock checks; conceal/disarm, never reveal. |
| Successful Discard | If any group exists, clear all groups and choose the first accepted item or empty. With no groups, preserve the prior valid singleton; otherwise choose first or empty. Clear draft history and advance generation/revision in both cases. | Existing accepted-document lock preflight/retention and concealment. No group can survive merely because item IDs match. |
| Successful accepted-scene Undo/Redo | Clear groups and draft history, advance generation/revision, choose first singleton or empty. | Accepted history contains no session metadata; any-lock prohibition remains. |
| Successful New/Convert/preset/gallery Use/scene import/Load step/image Use/image-replacement Undo | Clear groups/history only after full validated replacement; advance generation/revision; select first singleton or empty. | Existing successful-only lock clearing and per-route Live/hidden authority. Disarm aids; replacement does not reset marked-view provenance. |
| Rejected/canceled/stale replacement | Preserve prior stable groups, selection, canonical state, locks and completed history. | Captured work may already be rolled back and failure may conceal; stale completion cannot clear/restore groups. |
| Sequence-only import | Keep current editor groups/selection/history unless another scene edit occurred. | Existing concealment/lock policy. Loading a step is the separate whole-scene replacement boundary. |
| Scene/sequence/journal export | Preserve session groups/history under existing export policy; no group data is emitted. | Export remains usable with groups/locks and follows the existing accepted-scene/preview rules. No implicit Apply. |
| Close/reload | Lose all groups, selection and draft history. | No persistence or new unload workflow. Existing no-auto-save warning remains. |

A document replacement that happens to contain identical canonical bytes or matching item IDs is still the replacement boundary and clears groups on success. Conversely, an Apply that leaves current items in place is not a replacement and retains groups. Distinguish route identity from byte equality.

Beside grouping controls and in the guide, disclose: **Groups are only for this editing session. Apply and downloads do not save them. Loading, Discard, accepted-scene history or reload clears them.** Successful resets give one bounded notice. Do not add a misleading “saved groups” badge or change the scene's existing dirty indicator to include group metadata.

## 9. Format and migration decision

No new scene, sequence, journal or editor-workspace format. Preserve original legacy validation/migration and current scene-v3/v4 and compatible sequence versions. Exports/captures contain the same ordinary item fields/order; actual group-guided movement changes only those normal coordinates, while metadata-only grouping leaves canonical bytes identical. Reorder intentionally changes array bytes.

Strict imports with `groups`, `groupId`, `members`, selection or similar unknown fields must fail closed, never be silently stripped or interpreted as session state. Group metadata cannot leak through hidden serialized fields, DOM-derived downloads, sequence steps, accepted history or provenance hashes. Loading an exported scene loses group membership by design; no reconstruction by matching item geometry/IDs is permitted.

Persistent groups, member isolation, nesting or group transforms would need a separately approved specification and migration/visibility/precision analysis. They cannot be introduced as a convenience fix for this increment.

## 10. Implementation seams and phased work

Extend the prior planner rather than looping mutating UI handlers:

- `canonicalGroups(scene, groups)` validates closed metadata and returns a defensive stable-ID-ordered collection.
- `canonicalSelection(scene, selection, groups)` verifies group closure and draw-ordered item IDs; it rejects partial groups.
- `reduceSelection(scene, selection, groups, action)` performs only the explicit UI expansion rules and retains the actual hit/chosen primary.
- `selectionUnits(scene, selection, groups)` returns bounded complete units and earliest-member layer indices without requiring canvas geometry.
- `arrangementUnitBounds(scene, units, viewport)` derives member bounds through the existing shared helper and unions them. It requests geometry only for commands that need it.
- `planArrangement(scene, {groups, selection}, command, context)` adds closed `group`/`ungroup` variants and grouping-aware existing variants. Return `{scene, groups, selection, kind, targetedIds, targetedGroupIds, changedScene, changedGroups}` plus prepared ID mappings when needed. No visibility, DOM, controller mutation or allocator side effect.
- Prepared history targets compare document/group endpoints, validate target selection and distinguish metadata-only versus document-changing lock policy before stack consumption.
- The app commit gateway adds a validated metadata-only publication branch; document-changing and provisional/finalization authority remain the prior pipeline. No reveal/start API is called.

Work in three internal packages, not separate public registers: (A) pure metadata/selection/unit planners/history with regressions; (B) semantic controls, all selection entry points and lifecycle wiring; (C) exact-source native/visual/performance, documentation and independent integration review. Do not expose half-wired group controls before all routes obey closure and atomicity.

## 11. Required acceptance and evidence

These are future acceptance cases, not results. Use synthetic fixtures. Record exact source/artifact identity, commands, versions, failures and PASS/FAIL/BLOCKED/NOT RUN. No physical-device, assistive-technology or sensory claim follows from automation.

### Pure model, precision and identity

1. Validate 0–6 groups and 2–12 members; reject singleton/empty/overlap/nesting-like keys, missing IDs, duplicate IDs, hostile prototypes/getters/sparse arrays and excess records without changing inputs.
2. Canonical group/member order is stable by ID across layer reorder. Group/Ungroup preserves exact canonical scene bytes, per-item records, selection/primary and locks; no coordinate normalization, even with accepted fractional residues.
3. Group selected ungrouped items; Group exactly the same group is a no-op; group-plus-item/group rejects without flattening. Ungroup multiple groups plus selected ungrouped items in one metadata transaction, preserving selection.
4. Reducers expand checkbox/select/timeline/overlap/pointer routes; uncheck removes the whole unit; selected pointer hit preserves other units; actual chosen member is primary. Partial-group pure/planner/history selection rejects rather than silently expands.
5. A one-unit three-member group cannot align or distribute; two units can align; three units can distribute. One group centers as a multi-item union, while one ungrouped item retains original singleton helper output.
6. Unit-common moves preserve all member lattice offsets; zero leaves exact raw payloads. Include the inherited near-inset outlined-dot + opposite-bound-dot fixture inside a group: ordinary nonzero interval can be empty while exact zero is valid. Snap primary qualification, outward/zero/subthreshold, finite-derived viewport and singleton compatibility regressions remain intact.
7. All six unit alignments, X/Y/both center and both equal-gap commands pass the inherited postconditions or reject atomically. Cover authored families/ratios, legacy wide/tall, rotated/outlined shapes, shadow exclusion, authored polygon-returning circle/dot and unit boxes containing internal empty space.
8. Concrete distribution fixture: three units have bounds of widths 10/20/10 over span 10–90; at least one is a two-member group with distinct internal centers. Expected unit leading edges are 10/40/80, with every member in the group receiving one common delta. Equal-center output or independently placed members fail.
9. Repeat successful unit alignment/centering/distribution 100 times: exact first-result document/groups, unchanged history/redo and no drift. Near-tolerance existing results remain payload-preserving no-ops, not forced normalizations. Newly planned precision overlap/inset failure rejects all units.
10. Mixed selected locks reject document-changing operations, including stationary endpoints; Group/Ungroup and their metadata-only undo remain allowed. Source-locked duplicate creates unlocked grouped copies and leaves originals exact.
11. Duplicate remaps each selected group's members and primary, preserves copied numeric payloads, appends in source draw order, and retains ungrouped copies. 6+6 items can succeed; cap/group/ID failure commits nothing.
12. Deleting a group deletes all members and its metadata; locked member rejects the whole operation. Surviving-group nearest-layer fallback expands that group with the actual nearest item as primary. Empty static result remains valid but empty capture does not.
13. Noncontiguous grouped A/B in `[A,X,B,Y]` moves forward to `[X,A,Y,B]` and reverses without gathering or reversing subsequences. Group records remain byte-identical, item array changes intentionally, and targeted-reorder lock history checks remain.
14. Forty mixed document/group transactions fit one total cap. Group after Undo clears redo despite unchanged scene JSON; no-op group does not. Later selection change does not prevent undo, but a genuinely different group endpoint cannot receive an old history entry.
15. Item/group allocator reservations include both stacks before branching. Undo → new Group receives a fresh reserved-safe ID. Clear/evict history, reuse a now-free text ID and prove old-revision callbacks cannot target it. Inject bounded allocation failure; Ungroup/Hide/export remain available and no ID is consumed.
16. Undo/Redo restores exact document/group/selection snapshots without reallocating. Locking a copy makes duplicate Undo reject without removing its group or popping a stack. For the real UI route: Ungroup the copies, select/lock one copy, undo that metadata-only Ungroup to restore the group while retaining the lock, then attempt duplicate Undo and require rejection; Unlock all permits the same target. Corrupt saved partial-group selection or foreign membership rejects safely.

### DOM, atomicity and lifecycle

17. Every grouped member property/Lock-selected path is disabled and handler-enforced; tampered events/readFields never edit the primary. After Ungroup the selection remains multi until the user selects one item. Global edits and unrelated ungrouped edits keep valid group metadata. Inject a valid but uncommitted different raw field candidate, then Group/Ungroup: neither scene nor metadata may commit until the ordinary field edit has completed through its own gateway.
18. Start a grouped drag, stage several owned previews, then enter invalid raw text and invoke Group/Ungroup/selection/Hide/history. Preserve fresh raw text, roll back exact canonical/groups/selection under existing ownership rules and retain prior stacks; late pointerup cannot commit.
19. Fault injection separates before-stage rejection, provisional paint failure, final document-stage failure, post-final-publication paint failure and metadata-publication UI failure. No half-published document/group/history state; failures conceal and keep truthful status. No metadata-only command restages/paints an identical scene. Directly dispatched Group/Ungroup during fullscreen or running/paused playback cannot bypass static-editor eligibility; Hide remains unconditional.
20. Metadata-only Group/Ungroup does not change canonical/provenance hash, scene dirty state, accepted history, sequence or visible canvas bytes, and does not create/end a provenance interval merely because metadata changed. Group-only Undo follows explicit history concealment without changing scene identity. Aid-affected suppression remains latched.
21. Execute every lifecycle-table row, including identical-byte/same-ID replacement, Discard, accepted history with/without locks, sequence-only import versus Load step, failed/stale image/import completion and Apply/capture retention. Replacement reset is successful-only and route-based. For Discard, verify both branches: no groups preserves a still-valid prior singleton; any existing group clears all groups and chooses the first accepted item or empty, even when the selected item is ungrouped.
22. Export/capture/sequence/journal inspection finds no group or selection metadata; round-trip restores ordinary items/order but no groups. Unknown imported group fields fail strict validation. Export and Hide stay usable under locks, group failure and canvas failure.
23. No new storage/network/timers/RAF/buffers, render primitives, schema fields, custom names or automatic selection outlines. Group/UI controls cannot start, resume or reveal playback. Counts and closed metadata bounds are enforced at every entry point.

### Trusted native, visual and performance

24. Keyboard-only create a group, select it via each member row, choose a different Move anchor, add another unit, move/align/distribute, duplicate, Undo/Redo and Ungroup; verify canonical outputs and exact memberships through trusted controls. Native select from a mixed selection choosing its current primary must select only that primary's unit, not fail due to an unchanged displayed value.
25. Mouse and touch-emulated grouped drag/tap placement retain grab offset, group closure, snap anchoring and one-gesture history. Shift-toggle is selection-only; locked topmost member never clicks through. First immediate Undo/Unlock after rapid release and capture-loss/cancel regressions remain.
26. Inspect 1280×800, 320×760, 640×360 and 320×280 actual captures. All 12 full checkbox labels, item/unit summary, group/lock explanation, Move anchor and Group/Ungroup controls are discoverable, have 44 CSS-pixel targets, and are fully focus/corner-hit reachable in the existing scroll aperture. No accidental nested scroller, canvas reflow or lost focus after grouping/reordering.
27. Inspect noncontiguous layers and uneven/rotated group boxes visually, including internal-empty-space distribution rejection. Show real before/after scene and controls, not diagrams as acceptance evidence. Repeated-command tests compare exported numeric state and separately inspected session group state, not visual similarity alone.
28. Hidden-state grouping/movement, foreground/lifecycle interruption, fullscreen and playback keep existing reveal/conceal boundaries. Aids remain separately opted in; grouping never adds selection pixels. Forced-colors/reduced-motion, cross-engine/zoom/OS-file and actual assistive/physical-device checks are separately labeled.
29. Bound work to at most 12 items, six group records, small deterministic sorts and the existing 40 before/after transactions. Include group metadata and both ID reservation sets in the memory ledger. Repeated Group/Ungroup/Undo/Redo creates no retained DOM/history growth. Preserve all input/output/lock/controller validation passes rather than weakening checks for speed.
30. Measure same-runner synchronous metadata-command and grouped-arrangement handler-plus-layout intervals plus first Hide, reporting median/p95/max and instrumentation limits. Investigate >50 ms attributable work, do not add runtime timers or raise CI timeouts reflexively, and do not claim calibrated display latency. Final Node/native/package/docs/integrity and actual visual review must run on the exact assembled integration; prerequisite evidence is not a substitute.

## 12. Frozen design choices, remaining risks and integration gate

The reviewed contract freezes these four conservative choices. They are approved design scope, not implementation, native, visual, performance or integration acceptance:

1. **Rigid unit arrangement:** grouped bounds are the alignment/distribution unit, including internal empty space; one group cannot rearrange its own members. This follows the original proposal. Any later alternative requires a separately revised contract rather than silently scattering members.
2. **No member isolation or group merging:** users Ungroup, explicitly select/edit a member, then Group again. Lock/unlock one member follows the same route; Unlock all remains available. This intentionally trades convenience for unambiguous authoring.
3. **Metadata-only publication:** direct Group/Ungroup does not restage identical scene data or change scene dirty/provenance identity, but creates an ordinary arrangement-history entry; explicit history Undo/Redo still conceals. This is the smallest exception needed to preserve metadata semantics without a second controller/history system.
4. **Stable labels and selectors:** use derived “Group N” labels and “Select item or group,” with no editable names or separate group-list UI. Canonical membership order uses stable numeric IDs, while layer/arrangement order remains derived from actual item order.

No unresolved product tradeoff currently requires a broader feature. The following concrete risks remain for separate peer review and implementation evidence, not silent scope expansion:

- **Prerequisite integration:** Feature 012 exact-main acceptance is supplied by the integration owner, while Feature 013 remains a candidate at this preparation snapshot. Verify its actual integrated main and reconcile all selection, raw-input, provisional rollback and history routes before accepting Feature 014 integration. A reviewed design or pending native run is not that proof.
- **Metadata atomicity:** the new no-restage path must still enforce raw-input equality, current locks, revision checks, prepared history and static-editor eligibility. An implementation that merely returns early on unchanged scene bytes would lose Group/Ungroup transactions; one that stages a different pending scene would violate metadata-only semantics.
- **Identity branch reuse:** pre-branch redo reservations, deterministic allocation and external-revision checks require adversarial coverage. A bounded allocation failure must not disable metadata removal or safety/data controls.
- **Unit-bound precision:** grouped raw residues and noncontiguous asymmetric bounds need final postcondition/no-drift testing, not an assumption that item-level tests automatically cover unit unions. Canonical inset/no-overlap failures remain atomic rejection, never a new tolerance or per-member clamp.
- **Discoverability and lost work:** groups intentionally do not set scene dirty and are absent from Apply/downloads. The session-only warning, explicit Ungroup-before-edit route, item-versus-unit counts and complete narrow-layout labels must survive real visual/keyboard review without adding persistence, isolation editing or outlines.

No remaining ambiguity authorizes persistence, transforms, new schemas or automatic outlines. This contract is now promoted as Feature 014, refining the existing IF-050 task without creating another live register. Implementation and exact-source verification are a separate increment. Feature 014 integration requires verified Feature 013 main, reconciliation of its exact tree, independent review and required exact-head CI. At specification promotion, group implementation/native/visual/performance acceptance remains **NOT RUN**. No prerequisite result substitutes for any group acceptance case.
