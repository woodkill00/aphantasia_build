# Specification: atomic multi-selection arrangement

Feature 013 · 20 October 2026 · Bounded IF-050 increment. This is the promoted design contract, not implemented functionality, implementation acceptance, a new public work register, or permission to publish. Flat session groups belong to a separate Feature 014, not this increment.

Follow [repository guidance](../../AGENTS.md), the [constitution](../../.specify/memory/constitution.md), [clarifications](clarifications.md), [plan](plan.md), [tasks](tasks.md), [analysis](analysis.md), and [reference review](research.md). Only [project-queue.json](../../project-queue.json) owns live status and evidence. Specification completion cannot be used as a runtime, browser, physical-device, accessibility, sensory, or research acceptance result.

## 1. Scope, baseline and implementation boundary

This refines roadmap 008 US2 and supersedes the historical arrangement proposal's claim that reordering preserves canonical scene bytes. Selection-only session changes preserve canonical bytes; a real layer reorder intentionally changes the exported object array and canonical bytes while preserving item records.

The specification is prepared against the frozen Feature 012 candidate: PR 15 final head prefix `e819df22`, exact tree `0f19c407632ea36765898f2a314b2e3624ce2412`. The locally verified equivalent base is commit `62f918345482a08aa1c645e18de857dad093bf8e` with that tree. At preparation, final-head workflow 39441769939 was reported running; no completed result or integrated-main identity is inferred. Feature 013 integration depends on verified Feature 012 main and reconciliation of this starting tree with it. Record that exact main commit/tree and result in the single queue before accepting integration; if the integrated tree differs, reconcile and rerun affected evidence.

The earlier accepted core was main `edc92d58f83c5ceb3c3233e338a8bad7a85b2d2a`, tree `a436707b99e5b62324f6d9ee6f4f585c6ed210be`; workflow 39428678423 passed 935 Node checks, 160 native groups, package and cleanup. Those historical counts do not verify Feature 012 changes or Feature 013. This feature has no implementation acceptance result at specification promotion.

Read the final base's AGENTS, constitution, 008 and 012 specifications, editor/model/geometry/app code and existing arrangement tests before implementation. The queue's existing IF-050 remains the stable parent; do not add a competing progress register.

### Included

- Session-only multiple selection with stable item IDs, explicit primary move anchor, semantic checklist, Select all/Clear, and existing single-item selection alternatives.
- Common translation by drag, tap placement, exact typed delta and nudges; existing independent snapping follows the primary item.
- Alignment to selected bounds; centering the whole multi-selection on the canvas; equal horizontal/vertical edge-gap distribution.
- Atomic batch duplicate, delete and one-step layer changes, using the same planner/history as one-item commands.
- One bounded 40-transaction draft arrangement history, separate from accepted scene history.

### Excluded

Groups/group metadata, nesting, bulk style/timing, resize/rotation transforms, lasso/marquee, selection-bound overlays, smart guides, custom rulers, equal-center distribution, entered gap sizes, key-object alignment, persistent settings, new file schemas and larger item budgets. Existing editor aids remain independently opted-in under Feature 012; this increment adds no new scene/overlay pixels merely to indicate selection.

Preserve the 12-item cap, current geometry/color/timing/buffer bounds, strict import/migration, static startup, finite separate presentation clocks and immediate Hide/Stop/End/Escape. No new timer/RAF loop, animation, storage, network, package, permission/security, hosting, telemetry, participant collection or medical/research claim. Software checks are not sensory safety or accessibility certification.

## 2. Selection and primary-anchor semantics

### 2.1 Canonical session state

Represent selection as `{ids: [...], primaryId}`:

- `ids` contains unique existing item IDs, ordered by current `scene.objects` draw order, back to front. It is not selection-click order or an index list. Recompute this order after a successful layer operation without rewriting IDs.
- `primaryId` is a selected ID, or null when selection is empty. It anchors snap/tap placement only; it is not the alignment reference or a hidden style-edit target.
- Existing item IDs never change during their lifetime. Moving, aligning, distributing and reordering leave them unchanged. Imports/history can reintroduce the same text ID only under the correct document/generation context.
- A monotonically advanced scene-generation token invalidates references across successful whole-scene replacement and accepted-history restoration. A separate external-interaction revision invalidates gestures/async work when selection, locks, preferences or independently authored draft content changes. A gesture's own validated provisional writes are identified by its ownership token and do not advance that external revision or self-cancel its next event. Both tokens must be captured and checked by late callbacks: an ID can be recycled after history is cleared or evicted without a whole-scene generation change. Every successful independent structural/coordinate edit advances the external interaction revision. A successful completed gesture also advances it after gesture ownership ends; provisional events do not. Generation alone is not identity protection. Neither token/revision is exported.

No groups are accepted in selection state. Pure validation rejects missing/duplicate IDs, unknown fields, wrong prototypes/accessors and a nonmember primary; UI reducers deliberately construct valid state rather than silently repair hostile input.

### 2.2 Semantic controls

Add a checklist of at most 12 native checkboxes in layer order. Each label includes layer number, shape, stable ID and “locked” when applicable. Provide a selected count, an explicit primary-anchor name, Select all and Clear selection. Native Tab/Space and a single tap on the label provide complete selection without modifiers or dragging. Preserve 44 CSS-pixel actionable row targets and visible focus. These controls are the primary selection feedback because no selection outlines are added. Use the existing inspector scroll surface rather than adding a second nested scroller unless a reviewed layout need justifies it. All 12 complete labels, selected count, primary/lock status and Move anchor must remain discoverable and reachable in narrow/short layouts. Refresh keyed controls in place where possible; preserve focus by stable item ID/control role through checklist selection and reorder. If a focused item is deleted, move focus to the documented nearest survivor or selection summary. Do not scroll/reflow the canvas during pointer capture.

Keep the existing object select, explicitly labeled **Select only this item**. Its actual item option values remain stable IDs. When selection is multiple or empty, display a neutral placeholder with the reserved empty value, never the primary ID; with a singleton display its sole ID. Choosing any actual item, including the previous primary, creates a singleton selection. The neutral option is not an item and cannot mutate selection. Without this placeholder, choosing an already-displayed primary might fire no native change event and the advertised selection route would fail. Timeline-track selection and existing overlap cycling also select only one item, rather than silently replacing one member inside a larger set. Timeline `aria-pressed` reflects membership for every track, not only the primary; multiple tracks can therefore be pressed until a track action deliberately selects one. Add a small **Move anchor** select containing only selected IDs when multiple items are selected; keyboard/touch users can change the primary without toggling membership. Changing primary cancels captured work, moves nothing and adds no history.

Reducer rules:

| Action | IDs | Primary |
| --- | --- | --- |
| Select only item | Singleton | That item. |
| Check an unselected checklist item | Add then reorder by scene draw order | Newly added item. |
| Uncheck a selected item | Remove | Keep existing primary if still selected; otherwise choose frontmost remaining ID, or null. |
| Select all | All IDs in draw order | Keep current primary if valid; otherwise frontmost item. |
| Clear selection | Empty | Null. |
| Change Move anchor | Unchanged | Chosen selected ID. |
| Successful duplicate | New copy IDs in their draw order | Copy corresponding to prior primary. |
| Successful delete | Singleton nearest surviving item at the first removed layer index, or empty | That survivor or null. |

Ordinary selection-only changes do not change scene dirty state, provenance identity, Apply/accepted history, draft history or locks. They invalidate stale gesture/overlap candidates as appropriate. They do not reveal a hidden field or enable aids. If current raw scene fields are invalid, refuse a selection/primary transition that would discard those fields: leave selection and raw text intact, restore the checkbox/select's displayed value, conceal under existing policy and focus/report the invalid input. Do not use selection as a way to erase malformed input silently.

### 2.3 Pointer selection

- Keep current topmost hit testing, hollow-interior tolerance, tiny-item/touch tolerance, shadow exclusion, letterbox exclusion and non-primary-input policy.
- Plain pointer-down on an unselected item selects only that item. On an already selected item it preserves membership and makes that item primary, so a drag can move the entire selected set.
- Shift+pointer selection toggles one hit, uses the same checklist reducer, and is selection-only for that gesture; it cannot also start a drag. No new Ctrl/Cmd global shortcuts are introduced.
- Background/letterbox clicks retain the established no-op policy. Clear selection is explicit.
- A topmost locked hit remains selectable and never clicks through. If the resulting selected set contains any lock, drag cannot begin; report the specific all-or-nothing policy.
- Preserve the existing 4 CSS-pixel drag threshold, pointer capture, grab offset and deferred inspector expansion. Zero/subthreshold input that has not begun a drag never invokes snapping or normalizes coordinates, regardless of snap preference. Do not resize/reflow the preview while the pointer is captured.

The gesture's rollback selection is the selection resolved at its initiating pointer-down, matching the current behavior of retaining the selected target after a canceled move. Any later explicit selection action cancels/rolls back the gesture before applying the new selection. It cannot be overwritten by the old pointerup.

### 2.4 Inspector meaning

With one item selected, existing property controls retain their meaning. With multiple or zero items selected, disable single-item shape/size/position/color/effect/timing fields, Start after previous and Lock selected item, with “Select one item to edit its properties.” Enforce this in handlers, not only disabled flags. `readFields()` and selected-item helpers must read/write individual fields only for a true singleton. With multiple or no selected items, construct a candidate from the canonical item records plus allowed global edits, never from disabled stale inspector values or an implicit primary. A directly invoked/tampered single-item handler rejects without changing any member. Unlock all remains available. No control silently edits the primary's individual properties while its label appears to apply to the whole set.

Selection-level movement/arrangement controls remain distinct. Changing global background/shared period/canvas ratio is still allowed under the current lock contract, subject to validation and history clearing. Add-object keeps its existing behavior, selects the new item only, and clears arrangement history as an ordinary structural edit outside this command set.

## 3. One atomic command pipeline

All affected singleton/batch handlers must share one pure planner and one app commit path. Commands cannot mutate `working`, selected IDs or history in preparation and then discover a lock/validation error afterward.

1. Before cancellation can refresh any control, preserve the latest user-authored raw edits in a bounded per-field channel: exact text/value, invalid state and edit revision, including precision companions. Distinguish these edits from values merely painted into inputs by a provisional drag. Cancel/roll back captured canonical state and invalidate asynchronous import/image/export previews according to existing rules, but do not use `fillSelected()`/`fillFields()` or clear the raw channel as part of that rollback.
2. Build a fresh validation candidate from the rolled-back canonical base plus the still-pending user-authored edits. Do not replay every stale DOM value, which could accidentally reapply the provisional move that was just canceled. Validate before changing selection, planner state, history or raw control contents. On invalid input retain the exact raw text and invalid indication, keep focus/recovery available, and conceal. The UI must still indicate pending invalid/dirty input even if canonical rollback restored a previously clean scene.
3. Validate selection, command kind/arguments, IDs, generation/revision and command-specific lock policy. Validate viewport and derived geometry only for commands that need geometry, as specified below. Compute the whole candidate without mutating input.
4. Canonical-validate the complete output, preflight all defensive lock snapshots through the existing lock guard, validate command-specific final geometry/postconditions and compare the expected document/generation/interaction revision with the current state. After all applicable policy checks, a complete no-op returns without controller staging or history publication.
5. For a completed explicit command or pointerup finalization, stage the one fully planned final candidate once using existing controller authority; only on success publish the completed document, selection and history transaction together. Controller-stage rejection preserves the prior canonical session state and consumes no history entry. Refresh UI only after successful publication.
6. A valid already-visible static Live draft may repaint. Hidden stays hidden. If a raster/UI failure occurs after successful final staging and completed-command publication, conceal and retain one complete committed hidden edit, including its corresponding history transition. Do not report it as an atomic rejection or leave document and history half-published. Preserve a truthful failure/recovery message such as “Draft updated; preview unavailable and hidden”; never overwrite it with “Live draft updated” visible-success wording. Safety concealment is never rolled back to preserve an apparently successful UI operation.

Before successful final staging and completed-command publication, rejection leaves the accepted scene, canonical draft, sequence, selected IDs/primary, locks, completed history, and ID reservation unchanged. A post-publication paint/UI failure is instead the committed-but-hidden outcome above. Provisional gesture staging is not completed-command publication and follows the rollback rule below. Existing gesture rollback, concealment, async invalidation and a bounded status message are the explicit exceptions. A no-op changes no document/history and must not clear redo. Do not call generic `fillFields()` or the current `cancelDirectGesture()` path unchanged before validation: `fillFields()` clears move history, and the existing cancellation calls `fillSelected()`, which can erase freshly invalid raw text/precision state. Split canonical rollback from form refresh. Only a successful validated edit or an explicit user discard/replacement may deliberately replace the corresponding raw fields; rejection or Hide must not normalize or erase them.

A gesture has a separate, explicit commit point. Pointermove stages only an owner-token provisional preview and never publishes a completed history transaction. Before successful pointerup finalization publishes the final document, selection and one history entry together, any preview-stage/render/UI failure cancels the gesture, conceals, restores the exact pre-gesture canonical snapshot and preserves both completed-history stacks. It must not turn an intermediate pointer position into an implicit hidden edit. At finalization, controller-stage failure still rolls back to that starting snapshot; only after successful final publication may a later paint/UI failure retain the complete hidden transaction. A final zero/subquantum return to origin restores the exact starting payload and publishes no transaction.

### 3.1 Command-specific viewport requirements

| Command | Canvas geometry requirement |
| --- | --- |
| Duplicate, delete, reorder, selection, and stored-snapshot Undo/Redo | None. Validate the document, arguments, locks and identities without requesting arrangement bounds. |
| Exact normalized delta/nudge | None. Use canonical `objectExtent()` and normalized lattice limits, not CSS geometry. Preserve the singleton helper behavior. |
| Singleton X/Y/both position centering | None. Retain existing exact X/Y=50 semantics. |
| Edge/center alignment, equal-gap distribution and multi-item union centering | Positive finite actual viewport and valid finite derived arrangement geometry. |
| Pointer hit testing, drag and tap placement | Positive finite actual canvas/content rectangles and finite input/derived coordinates. |

For geometry-dependent commands, positive finite input dimensions alone are insufficient. Reject any overflow, underflow-to-zero, nonfinite derived content rectangle, nonpositive content width/height or scale, nonfinite body/stroke bound, or nonfinite normalized conversion. Do not substitute a guessed rectangle. These checks never widen canonical insets or buffer limits. For geometry-independent commands, viewport may be absent and must not become an unrelated rejection cause. A canvas/context/render failure conceals but does not globally disable otherwise valid document controls; selection, exact data edits, duplicate/delete/reorder, singleton centering, downloads and Hide remain available under their ordinary policies.

### 3.2 Pending invalid edits and history compatibility

This increment deliberately refactors the baseline's eager `edited()`/`stageWorking()` history clearing only as required for atomicity. A transient invalid raw edit remains pending and conceals; it does not change the canonical draft, selection or transaction stacks. Disable/reject draft Undo/Redo while raw input is invalid so history cannot erase the pending text. Correcting that input to the same canonical value retains the prior Undo/Redo stream and exact canonical payload; a successful valid different ordinary scene edit clears arrangement history after validation/staging. Correction alone never reveals. This applies at the ordinary input event itself, not just when an arrangement button is eventually pressed. Add object and successful explicit replacement keep their separately specified structural history rules.

## 4. Locked-item policy

For translate, align, distribute, canvas-center, delete and targeted layer reorder, **any selected locked item rejects the entire command**, including an operation where that selected member would be an unchanged endpoint. There is no “skip locked” or special locked-anchor mode. Check this before no-op optimization so a locked command reports consistently; selection and Hide are still allowed.

Duplicate is the exception: copies of locked items may be created as new unlocked records while all original records/locks remain unchanged. Other unselected locked items still require full-record equality at commit. Existing locks protect stored records, not absolute compositing order: an unlocked selected item may cross an unselected locked item during a layer command, as before.

Batch locking is not added. Select only a member to lock/unlock it, or use Unlock all. Lock/unlock changes cancel captured movement and create no arrangement-history entry. Accepted scene Undo/Redo remains unavailable while any lock exists.

Draft Undo/Redo checks current locks against its concrete target before consuming an entry. Additionally, reversing/replaying a targeted reorder is forbidden if any transaction-targeted item is now locked, even when item records are byte-identical; array-order changes otherwise bypass the stored-record lock guard. Undoing duplicate must fail if a new copy has since been locked, because the target would remove it. No lock is silently released by history.

## 5. Common translation and snapping

### 5.1 Feasible common delta

For every selected item, derive the same validated center min/max used by current placement, including inward hundredth-unit rounding and the floating-point endpoint correction from `E.place()`. Do not weaken `M.objectExtent()` or replace its conservative envelope with apparent visual bounds.

The existing validator accepts some numbers infinitesimally away from an exact hundredth and preserves them. Do not tighten it or normalize existing canonical/imported payloads. Define the planning lattice only as `Q(value) = Math.round(value * 100)`; `Q` is a computation, not permission to write the scene.

For each affected axis, compute original lattice centers `q_i = Q(original_i)` and inward limits in integer hundredths, then intersect all selected members' permitted lattice-delta intervals:

`minDelta = max(itemMinHundredths - q_i)` and `maxDelta = min(itemMaxHundredths - q_i)`.

The complete feasible set for a multi-item axis is **`{0, preserving every original raw axis payload}` union the nonzero integer deltas in that intersection**. Do not assume that zero belongs to the rounded-origin lattice interval: the accepted origin can be valid only because of tolerated floating residue while its rounded value violates a strict inset. If the intersection is empty, zero may be the only feasible delta. The zero branch writes nothing and still preserves exact payloads after lock/policy validation; it is not permission to relax an inset or normalize the origin. A nonzero exact delta outside the ordinary lattice intersection rejects in full.

Only a successful explicit multi-item coordinate command may write a changed affected-axis coordinate as `(q_i + deltaHundredths) / 100`. A common translation preserves all pairwise offsets **exactly in integer-hundredth lattice space**, not necessarily the subtraction of the original floating-point payloads. Never run independently clamped `E.place()` calls on each member, which would collapse spacing at the edge. Validate the final full scene anyway. Keep the established singleton helpers/rounding/placement behavior unchanged.

### 5.1a No implicit normalization

The new lattice-based coordinate-write and no-op rules below govern multi-item commands. Session-only actions, imports and rejected operations preserve payloads at every selection size. Existing singleton coordinate helper behavior remains the explicit compatibility exception; assert its original output rather than silently changing its rounding or unaffected-axis behavior as part of this increment.

- Preserve every valid imported/canonical numeric value exactly until an authorized successful command genuinely changes that item-axis on the lattice. This concerns the canonical payload, not original JSON whitespace/key formatting, which existing parsing already canonicalizes.
- No-op, zero/subquantum delta, selection/primary, lock/unlock, snap/aids preference, inspection, rejected command and cancellation do not rewrite coordinates. Determine no-op against lattice targets before assigning rounded numbers; tiny raw differences alone are not a scene edit. A complete no-op preserves the original canonical bytes, provenance input and both history stacks, including redo.
- A real X-only command may write X for its changed selected items but must preserve their Y numeric payloads exactly. Unselected items, unchanged item-axes and all other fields remain byte-identical. For alignment/distribution, if one member's target lattice coordinate equals its original lattice coordinate, retain that member-axis's original payload, even while other members move.
- Pointer motion that returns to zero lattice delta restores the exact starting canonical payload, not a rounded approximation. If pointerup ends there, add no history. Undo after a real move restores the exact pre-command payload including tolerated fractional residues; redo restores the exact accepted after snapshot.
- Duplicate copies coordinates exactly from its source, including tolerated residues; reorder/delete do not normalize surviving records. These are not coordinate-edit permission.

Required fixture: X values `[41.23000000001, 48.34000000003]` are accepted unchanged by the current model. Their raw gap is approximately `7.110000000020001`; the lattice centers are `[4123, 4834]`, with gap 711 hundredths. A successful multi-item +1 X command may yield `[42.23, 49.34]`; assert lattice difference 711, not exact JavaScript floating subtraction equality to 7.11. Their Y values and untouched items remain exact. Zero/subquantum/no-op/rejected commands must keep the original X payloads unchanged.

Required inward-edge fixture: authored 1:1 dot with size/geometry height 1, enabled outline width 1.3 and X `2.80000000001` is canonical-valid with extent 1.8, while rounded X 2.8 violates the strict inset and the inward lattice minimum is 2.81. With this item and another interior item selected, a zero/subquantum or leftward unsnapped request must retain the exact starting payload, not move right by 0.01. For the opposite-bound fixture, pair that first outlined size-1 dot at X `2.80000000001` with an ordinary filled size-2 dot at X 98 (extent 1). The first allows ordinary integer deltas at least +1 hundredth, while the second allows at most 0, so the nonzero common lattice intersection is empty and zero is the only feasible X delta. No exact nonzero X move is allowed. A snapped active placement anchored by the first dot has no eligible X candidate because 2.8 is not a 1/5/10 grid point and must reject. With the second dot as primary, zero qualifies for step 1 because its lattice X is 98 and preserves both original X payloads, while exact `(0,0)` and a subthreshold no-gesture remain unconditional payload-preserving no-ops after policy checks. Run mirrored Y cases. Keep the original singleton `E.place()` behavior unchanged even though it rounds this first X inward to 2.81.

### 5.2 Pointer drag and tap placement

Capture canonical pre-gesture document, resolved selected IDs/primary, dirty state, interaction revision, scene generation, and actual canvas/content rectangles. Compute intended normalized movement from pointer displacement with the primary's original grab offset preserved. Use the exact starting snapshot on every event, not accumulated rounded increments or an eagerly normalized copy. Accept the active gesture's own provisional writes under its ownership token without advancing the external-invalidation revision; an external edit still cancels atomically.

For unsnapped pointer movement, quantize the requested common delta to hundredths and choose the nearest delta from the complete feasible set, including its exact-payload zero branch, using the existing `Math.round` delta quantization without a new bias; do not use an interval-only clamp that can force motion on a zero or outward request. With snap 1/5/10, filter that complete set by `(Q(primary) + deltaHundredths)` landing on a whole selected-step grid index, round the desired primary grid index with the existing `Math.round` behavior, then choose the nearest feasible primary grid index. Retain the existing ordinary half-step behavior rather than adding a new tie/epsilon bias. The zero candidate qualifies only if the primary's existing lattice target itself satisfies the grid condition, and it then retains all original raw payloads. Derive the common nonzero delta from the primary's lattice center, not its unrounded raw value. Do not clamp a snapped center to an off-grid edge. Other members retain their integer-hundredth lattice offsets and may remain off-grid; write only axes with a nonzero intended lattice change. A zero lattice snap result preserves the original accepted floating payload rather than cleaning it up. If no grid-qualified candidate remains for the selected set on an axis, reject/cancel the gesture rather than distort the selection or silently disable snap.

Tap placement uses the primary center as the requested target. Label it **Place selection using move anchor** for multi-selection; the existing singleton label remains acceptable. The common feasible/snap rule applies. Reject authored letterbox taps. Hidden placement remains hidden and does not show editor aids. Closing/reopening the inspector follows existing placement behavior.

Lost capture, pointercancel, another pointer, invalid raw input, Hide/Stop/End/Escape, bounds/viewport change, selection/primary/lock/snap change, replacement or lifecycle interruption rolls back the complete gesture and invalidates late releases. One successful pointerup produces one history entry if an intended lattice coordinate actually changed; intermediate events produce none. A gesture that returns to its starting lattice position restores the exact original payload and records nothing.

### 5.3 Exact alternatives

Add labeled horizontal/vertical delta inputs and **Move selection** for the selected set, plus existing directional buttons. Inputs use normalized content units, up to two decimals, finite and bounded to -100..100; they never set absolute positions for one hidden member. Applying (0,0) is a payload-preserving no-op after policy validation regardless of snap/aids preferences or whether the rounded origin would fit the ordinary nonzero lattice interval.

Focused-preview arrows use 1 unit; Shift+arrows use 0.1. No global interception and no change to text-field arrow/Delete/Space behavior. For multiple selected items these exact alternatives reject a requested out-of-bounds delta in full, rather than shortening the step. They are always unsnapped. Preserve established singleton edge-clamping behavior; disclose the multi-item “all items must fit” policy in the selection help. This deliberate difference avoids quietly changing existing one-item authoring.

## 6. Arrangement bounds and alignment

Maintain two distinct bounds:

- **Validation envelope:** existing canonical inset/effect rules, unchanged and authoritative for every final candidate.
- **Arrangement bounds:** axis-aligned rendered body plus enabled outline/contour stroke, excluding shadows. Blurred shadows have no finite visible edge; help says “Aligns shapes and outlines, not shadows.”

Derive body bounds from shared `M.geometry(scene, width, height)`. Dispatch on the returned `geometry.kind`, not the authored shape name: returned `dot`/`circle` records use center/radius, and returned `polygon` records use their shared transformed points. Authored circle/dot shapes currently return polygon geometry, so do not assume a radius field exists for those authored names. A filled body expands by enabled outline width; a contour expands by half its line width plus enabled outline width. Do not apply a second outline expansion or include shadow offsets/blur. Convert CSS bounds into normalized content coordinates using the same content rectangle.

Use the current actual preview aspect ratio for legacy viewport scenes, including while hidden. For these geometry-dependent commands, reject zero/nonfinite dimensions or any invalid derived geometry from §3.1 with no data change; this is not a precondition for data-only commands. Freeze it for the command/gesture. Authored scenes of the same ratio yield equivalent normalized results at different viewport scales. Explain that legacy edge-based arrangement is relative to the current preview proportions; later resize does not rearrange stored coordinates.

For at least two selected items, provide:

- **Align left/right/top/bottom:** translate each selected item's corresponding arrangement edge to the pre-command selected union's edge.
- **Align horizontal/vertical centers:** translate each item's arrangement-bound midpoint to the pre-command selected union's corresponding midpoint.

All targets are derived once from the original scene. Primary/selection-click order does not affect alignment. Change only the requested axis, preserve the orthogonal coordinate's exact numeric payload and every other item property/ID, and preserve full draw order. Follow the no-normalization contract: only a member-axis with a changed intended lattice target is rounded/written. Never clamp individual alignment results or choose another target to obtain validity.

### 6.1 Alignment tolerance and idempotence

Use a single fixed comparison-only floating-noise allowance `EPS = 1e-9` normalized units throughout alignment, centering and distribution. It must never accumulate across operations, bias `Math.round`, widen canonical inset validation or serve as an extra geometric repair range. After canonical validation and lock checks, compute the relevant requested edges or midpoints. If their maximum-minus-minimum spread is at most `0.01 + EPS`, the requested alignment is already satisfied and is a complete no-op: preserve raw payloads, history and redo. Do this before recomputing/writing rounded targets. This rule applies equally to left/right/top/bottom and horizontal/vertical center alignment.

Otherwise plan against the original selected-union target, quantize changed centers once, and validate all final bounds. A newly computed mutating alignment must leave every requested edge/midpoint within `0.005 + EPS` of that original target and the final edge-to-edge/midpoint-to-midpoint spread at most `0.01 + EPS`. The 0.005 target-error condition applies only to newly computed mutating results, not to the already-satisfied no-op branch: an existing edge spread of 0.009 can be a no-op even though one edge is more than 0.005 from the union-edge target. If either mutating-result condition or the canonical validator fails, reject the whole command. Repeating a successful alignment must therefore hit the same no-op predicate and cannot creep, change coordinates, create another history entry or discard redo.

Regression fixture: authored 1:1 triangle contours, size 20, rotations `[17, 37, 71]`, X `[40, 55, 70]`, Y `[30, 50, 70]`. A naive rounded-union Align left produces first X `[40, 41.52, 40.22]`, then `[40, 41.51, 40.22]`, then `[39.99, 41.51, 40.22]` and continues drifting. The contract requires the first valid result to satisfy the tolerance and every repeated Align left thereafter to retain exactly that first accepted result. Mirror/rotate suitable fixtures for all six alignment modes; do not replace this source-grounded case with only symmetric shapes.

### 6.2 Multi-item canvas centering

For multiple selected items, existing center-on-canvas controls become **Center selection bounds horizontally/vertically/both**. After validation/locks, an axis whose union midpoint is already within `0.005 + EPS` of 50 is satisfied: leave that entire axis's original payloads untouched. For another requested axis, round one common desired delta to integer hundredths and apply it to the selected lattice centers; preserve pairwise lattice offsets. Final union midpoint must be within `0.005 + EPS` of 50, not promised exactly 50. If bounds/precision prevent that, reject the entire command. When both axes are requested, one already-satisfied axis stays byte-identical while the other may move; rejection of either prevents all writes. Repetition must be a no-op.

These commands do not stack all centers at (50,50). For a singleton preserve the existing exact X/Y=50 helper semantics and label it **Center item position**; asymmetrical rotated shapes need not have a body-bound midpoint at their stored center. This makes the compatibility boundary explicit.

## 7. Distribution: equal edge gaps, not equal centers

Only **Equal horizontal gaps** and **Equal vertical gaps** are included, requiring at least three selected items. Equal-center distribution is not an alternate hidden interpretation or a second mode in this increment.

For one axis, first complete canonical/selection/command/cardinality/lock/viewport/derived-geometry validation, then apply this idempotence precheck: sort by the same original leading-edge rule below, measure the actual adjacent edge gaps, and if every gap is at least `-EPS` and their maximum-minus-minimum spread is at most `0.02 + EPS`, return a complete payload-preserving no-op. Comparison-only noise may classify a gap in `[-EPS, 0]` as zero for this precheck. Preserve every endpoint and interior numeric payload, history and redo. Do not recompute a new span and make a second micro-adjustment to an already accepted result. This does not relax canonical validation or authorize new overlapping output.

Otherwise compute a mutating result for one axis:

1. Compute each original arrangement interval `[leading, trailing]`, its width and the selected union span `[L, R]`.
2. Sort by leading edge, then by original draw-order index on an exact tie. Sort order affects placement but never changes layer order or stored IDs.
3. Compute `gap = (R - L - sum(widths)) / (n - 1)`.
4. Reject a materially negative gap. The same fixed comparison-only normalized `EPS = 1e-9` may classify floating-point residue around zero only; it must not permit visible overlap or serve as an extra coordinate range. Treat a value within that tolerance of zero as zero.
5. Place the first leading edge at L, then each successive item after the previous width plus gap. The last ideal trailing edge ends at R. Move only this axis.
6. Convert to lattice center targets, write only actually changed item-axes under the no-normalization contract, then remeasure the final arrangement bounds and canonical-validate the whole scene. If rounded placement produces a gap below `-1e-9`, reject the command. Do not silently create overlap, push one endpoint, shrink a shape or increase the outer span to repair it.

Coordinate quantization can shift either endpoint by up to 0.005 normalized units and cause at most 0.02 units of difference between final neighboring gaps, plus the fixed floating tolerance. A newly planned candidate must still pass the existing non-overlap comparison (no gap below `-EPS`) and unchanged strict canonical inset validator; the idempotence precheck is not an extra repair allowance. Tests must enforce these bounds and that every first success satisfies the same no-op predicate, so repetition preserves exact canonical bytes. These are engineering rounding tolerances, not claims of geometrically exact or calibrated spacing. This is a coordinate precision limit, not a pixel-perfect physical measurement. An ideal zero/small positive gap can be infeasible after rounding; report “Equal gaps do not fit at the current coordinate precision” and leave everything unchanged.

The fixed reference is the original **outer span**, not a promise that both originally sorted endpoint items stay put. With nested/overlapping unequal shapes, the last-by-leading-edge item may not originally own the farthest trailing edge and can move to it. Document this rather than silently switch algorithms.

Example on normalized X: widths 10, 20, 10 and selected outer span 10–90 give a 20-unit gap, leading edges 10, 40, 80 and centers 15, 50, 85. An equal-center algorithm would produce a different answer with uneven widths and must fail this acceptance fixture.

Repeated-distribution fixture: authored 1:1 filled axis-aligned squares with body widths `[10, 20, 10]`, no outline/shadow, X `[20.00000000001, 47.23, 80.00000000001]` and valid Y positions. Equal horizontal gaps changes only the middle X to 50, leaves both tolerated endpoint X payloads and every Y byte-identical, and yields 15-unit gaps within the fixed noise tolerance. Run 100 repeats and require exact first-result serialization, no further transaction and retained redo. Mirror for Y; additionally use rotated unequal shapes whose first output rounds an endpoint, asserting that the second command is still a complete no-op.

## 8. Structural commands and identity allocation

### Duplicate selection

Preflight `currentCount + selectedCount <= 12` before allocating or mutating anything. Copy exact style/geometry/timing/position of selected sources in source draw order, assign new IDs, append them as one topmost block and select all copies; primary maps to its copy. No automatic offset or timing change. Originals and their relative order/locks are unchanged; copies are unlocked.

Keep the existing validator's `object-1` through `object-999999` format. Do not widen it. Allocate the smallest unused positive suffixes from a temporary reservation set including the current scene, all retained draft-history before/after documents and already planned copies. A set with at most `12 + 40*24 + 12 = 984` reservations can find the required free suffixes within a bounded scan; no million-element array or new persistent ID ledger is needed. Publish only the resulting canonical candidate on success. No failed command consumes IDs. IDs are fresh relative to current and retained transaction identities, not a globally unique identifier scheme. Scene generation plus external interaction revision invalidation prevents a discarded past identity's matching text ID from receiving a late action. History eviction/clearing can permit ID reuse within the same generation, so every delayed action must check the captured revision as well; no text-ID-only callback is valid.

### Delete selection

Reject any selected lock; remove the whole selected set at once. Static zero-item/background-only scenes remain valid, while sequence capture still rejects an empty snapshot. Select the nearest survivor at the first removed array index, capped to the final last index, or clear selection if none. Restore the exact removed IDs/properties/order on undo only after full preflight.

### One layer forward/back

Do not gather a noncontiguous selection into an adjacent block. Forward scans indices from `length-2` down to 0, swapping selected item i with unselected item i+1. Backward scans from 1 upward, swapping selected i with unselected i-1. Thus each selected item crosses at most one unselected neighbor, selected/nonselected relative orders remain stable, and an entire selected run moves one neighbor step without reversal. Boundary/no-op adds no history. No bring-to-front/send-to-back command is added.

Array order remains the rendering order. No transaction renumbers items or modifies stored geometry/style merely to reorder them.

## 9. One bounded draft arrangement history

Generalize `moveUndo/moveRedo` into one **Undo arrangement / Redo arrangement** stream, capped at **40 total transactions across undo plus redo**, separate from accepted scene Undo/Redo. Do not add one stack for each command. Include completed moves, alignment/distribution, canvas-center, reorder, duplicate and delete, for both single and multiple selection.

Each entry defensively stores exact before/after canonical documents (including accepted fractional residues), before/after selection, scene generation, command kind and immutable targeted IDs. No group fields, lock snapshots, pointer trails, viewport bitmap or arbitrary event log. Locks are independent current protection, not something history restores.

- One completed gesture/explicit command is one transaction; intermediate pointer positions are not. A no-op, subquantum change, already-tolerance-satisfied alignment/centering/distribution, or gesture returning to its original lattice position adds none, preserves exact payloads and preserves redo.
- After undo, a successful new scene-changing arrangement command clears redo. When necessary evict only the oldest undo transaction to retain the 40 total cap.
- Selection/primary changes, lock/unlock, snap and editor-aid preferences create no entries and do not clear completed arrangement history.
- A successful valid different ordinary field edit or Add object clears draft arrangement history, never accepted history. Pending invalid raw edits and correction to the same canonical value preserve the stacks under §3.2; do not copy the baseline eager-clear behavior. Apply and snapshot capture clear draft history after success and retain current valid selection/locks. Do not clear stacks before a rejected operation.
- Undo/Redo first rejects pending invalid raw input without erasing it, then validates the concrete target/current lock policy and checks that the current canonical document plus generation matches the expected endpoint. **Do not require live selection equality**: selecting another item after a move must not invalidate undo. Restore the transaction's saved selection only after successful history application.
- A lock rejection leaves both stacks and live selection untouched. An actual unexpected intervening document change invalidates the incompatible draft stream with a clear explanation, rather than applying history to a different scene.
- Successful Undo/Redo conceals and disarms aids through existing policy, leaves accepted scene/sequence unchanged, and does not reset aid-affected provenance suppression or reveal. Redo preserves the original assigned IDs and ordering.

The existing history button labels/accessibility names and native tests must be updated consistently. Older tests asserting one gesture/40 moves remain substantive regressions, not candidates for deletion just because the labels broadened.

## 10. Replacement, cancellation and provenance lifecycle

| Boundary | Required selection/history result | Visibility, locks and provenance |
| --- | --- | --- |
| Successful Apply or Add/Replace capture | Retain valid selection/primary; clear draft arrangement history only after success. | Existing concealment and lock retention. Captures retain flat ordinary items, never selection. |
| Successful valid different ordinary field/global edit or Add object | Clear arrangement history after successful staging; retain valid selection except new object becomes singleton. | Existing lock validation/repaint/conceal authority; real displayed edits invalidate provenance normally. |
| Invalid ordinary raw edit or correction to the same canonical value | Invalid text remains pending with canonical draft and stacks unchanged; reject Undo/Redo until valid. Same-value correction retains history. | Conceal; no correction-triggered reveal or provenance latch reset. |
| Selection/primary/lock/snap/aids change | Cancel captured work; apply valid session transition; preserve completed history. | No reveal; Feature 012 aid/provenance behavior unchanged. |
| Hide/End/Escape/fullscreen/lifecycle/playback transition | Roll back captured gesture; preserve stable selection and completed history. | Always conceal as existing route requires; aids disarm. |
| Successful draft Undo/Redo | Restore saved document/selection atomically; move one stack entry. | Concrete current-lock preflight; conceal; no provenance latch reset. |
| Successful Discard or accepted-scene Undo/Redo | Clear draft history, advance scene generation, choose valid singleton (first item), or empty. | Current Discard lock preflight and any-lock accepted-history prohibition remain; conceal. |
| Successful New/Convert/preset/gallery/scene import/Load step/image Use/image-replacement Undo | After full validation, clear history, advance generation, choose first-item singleton or empty; no old selection survives just because IDs match. | Existing successful-only lock clearing; disarm aids. Preserve each route's existing Live/hidden authority, not blanket new concealment. Replacement does not reset marked-view provenance suppression. |
| Failed/canceled/stale replacement | Preserve prior stable selection, canonical state, locks and completed history; old captured work may already have been rolled back. | Existing concealment/failure policy; no callback restoration or new reveal. |
| Sequence-only import | Retain editor selection and history unless an independent scene edit occurred; invalidate captured interaction. | Existing concealment; locks retained. Loading a step is the separate replacement boundary. |
| Scene/sequence export | No selection/history mutation beyond existing export/concealment policy. | Always usable with locks; no session metadata or aid pixels included. |
| Close/reload | Session selection/history is lost; no persistence. | Existing no-autosave warning; no hidden restoration work. |

Selection alone does not change canonical identity or create a provenance interval. A real reorder changes ordinary object-array serialization and canonical identity even though each item record stays exact. Actual document changes reuse current displayed-edit identity logic. Existing aid-visible/aid-affected exclusion remains latched; neither arrangement/history nor replacement is a successful fresh explicit clean view. No new overlay is added to complicate that contract.

## 11. File formats and implementation interfaces

No scene/sequence/journal version bump, tolerance tightening, eager coordinate normalization or migration change. Legacy v1/v2 scenes are still validated under original rules before migration; viewport v3/authored v4 and corresponding sequence v2/v3 keep current meaning. Canonical files contain ordinary items/layer order only. Selection/primary/history/generation are absent from captures/downloads. Unknown imported selection/group/guide fields still fail closed; never strip them silently. Session groups remain a later separate specification, not dormant fields in this implementation.

Suggested pure interfaces in an arrangement model or a bounded editor-model extension:

- `canonicalSelection(scene, selection)` validates IDs/primary and returns draw-ordered defensive selection.
- `reduceSelection(scene, selection, action)` handles only closed semantic selection actions; no scene mutation or visibility.
- `arrangementBounds(scene, viewport)` returns shared body/outline intervals by ID and validated content rectangle; no independent geometry renderer.
- `planArrangement(scene, selection, command, {viewport, lockedIds, reservedIds})` returns a complete `{scene, selection, kind, targetedIds, changed}` candidate or bounded structured error. Its command union is closed: pointer/exact translation, align, canvas-center, equal-gap distribution, duplicate, delete, reorder. Snap is explicit input only to pointer/placement translation. `viewport` is optional for geometry-independent commands and required/derived-validated only for the command kinds in §3.1; never obtain geometry unconditionally.
- `prepareHistoryTarget(direction, currentDoc, generation, locks)` returns a fully checked target without popping history. App completion moves the stack only after successful stage.
- `commitArrangement(plan, expectedRevision, expectedGeneration)` owns the app-only canonical/lock preflight, controller staging, history, dirty-state, UI and current provenance interaction. It cannot call a reveal/start method.

Keep singleton delegates until parity tests prove equivalent; do not rewrite shape/timing/render modules. Audit every existing selection entry point, disabled-control handler, layer/duplicate/delete action, placement/drag/nudge/center operation, generic refresh, Apply/capture/replacement and image-undo route. Do not implement batch behavior by looping existing mutating UI handlers.

Implement in three internal work packages, not three competing registries: (A) pure selection/planner/history plus regressions; (B) app/semantic controls and cancellation; (C) exact-source native/visual/performance and integration review. The whole bounded feature needs acceptance; partially wired batch controls are not completion.

## 12. Success and verification

The complete numbered acceptance cases and mandatory precision subcases are preserved in [the fixed task and acceptance map](tasks.md). They cover pure/adversarial planning; exact snapshots and raw-input integration; distinct provisional/final failure phases; locks/history/identity; trusted mouse, keyboard and touch-emulated interactions; actual raster/export/geometry checks and inspected responsive captures; bounded resources and same-runner performance; complete source/package/integrity checks, independent review and green exact-head CI. The [review checklist](checklists/requirements.md) is not a progress register.

Success requires the entire increment, including every existing singleton route that now shares the pipeline. Partial batch controls, a prepared test, a passing mock, or an accepted design calculation are not implementation acceptance. Source repairs invalidate relevant earlier evidence until rerun. Physical-device, assistive-technology, cross-engine, zoom, sensory/research, release publication and hosting outcomes remain separate and honestly labeled.

### Coverage-driven CI duration proposal

The prepared native plan preserves all 178 existing groups and adds 22, for 200 prepared groups. The earlier group-count-only projection was superseded when independent review required actual batch geometry captures across all authored ratios and legacy wide/tall layouts, plus a frozen-baseline comparison. Recorded Feature 012 duration is 795.126 seconds. Conservative added-work estimates are up to 160 seconds for the initial new checks, 55 seconds for ratio visuals, and 100 seconds for six alternating baseline/candidate pairs, totaling approximately 1110.126 seconds. A proposed 1380-second (23-minute) native limit provides approximately 24% headroom; another 180 seconds gives a 1560-second (26-minute) limit for the same single job. Independent review is required before application. This is a coverage estimate, not measured Feature 013 performance. Current Feature 012 CI, required assertions, sandbox, read-only permissions, cleanup and packaging remain unchanged.

This is a review-required proposal, not a measured Feature 013 result, an applied timeout change, permission for retries or weakened assertions, or a performance acceptance criterion. Current Feature 012 CI remains unchanged. The >50 ms arrangement-work/first-Hide investigation requirement remains independent; increasing a timeout cannot cure a performance failure. Record independent review before applying the bounded Feature 013 limit.

## 13. Frozen product decisions

The reviewed contract is promoted with these conservative decisions; they are not open permission requests or hidden implementation choices:

1. **Mixed locks:** all selected mutating commands reject if any target is locked, with duplicate as the explicit exception. No skip-locked or special locked-anchor behavior.
2. **Distribution and precision:** equal edge gaps only; reject rounding-induced overlap rather than repairing it. Preserve exact accepted payloads unless an affected item-axis genuinely changes on the lattice. Keep comparison-only no-drift predicates, explicit endpoint/outer-span tolerances, and invalid-raw-input atomicity. Equal centers is out of scope.
3. **Singleton compatibility:** retain exact existing one-item center/nudge helpers; multi-selection uses union-bound centering and exact all-or-nothing nudge. Labels expose the distinction. Unifying those behaviors is a later deliberate scope change, not incidental refactoring.
4. **No selection outlines:** semantic checklist and summary provide selection feedback. Feature 012 grid/center guides remain separate and opted in. No selection overlay is automatically painted.

No schema, group, persistence, timer, network, collection, release, or hosting authority is added. The accepted design is only the starting contract; the verified Feature 012 integration and exact-source Feature 013 implementation gates remain required.
