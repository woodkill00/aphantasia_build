# Task and acceptance map

This is the fixed Spec-Kit execution map, not a second live task register. Implementation status, attempts and evidence belong only in [project-queue.json](../../project-queue.json). IDs remain stable through repairs. Every claimed pass must name the exact source/artifact and command or inspected capture. A dependency listed here is not permission to bypass an external gate.

| ID | Deliverable and dependency | Required acceptance evidence |
| --- | --- | --- |
| IF-045 | Specification, clarifications, constitution, plan, research mapping and analysis | All 64 proposal codes mapped; local links valid; independent scope/consistency review; unresolved gates explicit |
| IF-046 | Existing-shape select/drag state machine and draft gesture history; after IF-045 | Pure hit/coordinate tests; click-versus-drag, grab offset, primary pointer/capture, cancel rollback, one undo unit, stale callback and hidden-state tests; native pointer interaction |
| IF-047 | Equivalent numeric/tap/nudge/keyboard controls and inspector/layout behavior; after IF-046 | Text-field shortcuts unaffected; same canonical coordinates; semantic selection/focus; no canvas jump; narrow/short/focus captures inspected |
| IF-048 | Freeze scene-v4/sequence-v3 and authored-ratio contract; after IF-045 | Closed-key/range document; unchanged legacy fixtures; explicit migration/round-trip; capture preserves metadata or rejects unsupported input; letterbox mapping/resize tests |
| IF-049 | Bounded shape registry and family controls; after IF-048 | Every family validates/renders/hit-tests/describes/serializes; dimensions/rotation/fill/stroke bounds; invalid/nonfinite/unknown inputs rejected; existing timing/effects intact |
| IF-050 | Layers/locks/overlap selection, original preset gallery and the fourth session lock/snap/center increment; after IF-047 and IF-049 | Reorder/lock/duplicate/snap tests; defensive stored-item locks and replacement/history matrix below; preset IDs/revisions/provenance; all built-ins validate; static accessible thumbnails; old presets unchanged |
| IF-051 | Raster intake, resource budgets, cancellation and privacy foundation; after IF-048 and IF-049 | Byte/pixel/dimension/buffer/iteration budget ledger and tests; malformed/oversized/oriented input; no network/storage; release resources; supported portable worker behavior |
| IF-052 | Deterministic editable approximation and benchmark; after IF-051 | Supported synthetic scenes and held-out licensed tiers; seed fixtures; all outputs validate; resource/cancel metrics; correction-effort baseline; explicit no-go decision |
| IF-053 | Crop/palette/result review and atomic Apply/Discard; after IF-052 and IF-047 | Prior draft untouched until Apply; one undo; every output item editable; text/keyboard review; stale results after Hide/import/edit rejected; original image/metadata absent from exports |
| IF-054 | Separate neutral experience schema and justified provenance; after IF-045 and IF-048 | Closed schema/missingness fixtures; no diagnostic scoring; scene/version/exposure association; no fingerprint/raw traces; interruptions retained |
| IF-055 | Optional session-memory journal, preview/export/clear; after IF-054 | Editor works when declined; exact selected payload preview; separate exports; no autosave/network; clear and close limitations; synthetic test records only |
| IF-056 | Disabled submission contract and synthetic consent/payload demonstration; after IF-054 | No endpoint/Send/upload queue or real records; granular scopes documented; unexpected fields rejected; anonymity/deletion and missing-governance explanations |
| IF-057 | External research activation prerequisites; after IF-056 | Named operator; applicable ethics/privacy/security/statistics review; instrument rights; retention/withdrawal/incidents; explicit deployment/collection authorization. Not closed by software implementation |
| IF-058 | Cross-feature regression/security/composed-output review; after implemented IF-046–IF-056 tasks | Full Node suite, adversarial format/image tests, stale-result/lifecycle matrix, bounded allocations and no-network/storage checks; actual composed timing review; preserve failures |
| IF-059 | Native interaction, visual, accessibility and device evidence; after IF-058 | Sandbox-enabled native checks; inspected exact-artifact captures; narrow/short/zoom/focus/keyboard/touch/pen tests where available; physical/assistive tests separately PASS/BLOCKED/NOT RUN |
| IF-060 | User docs, architecture, examples and evidence reconciliation; after IF-059 | Current behavior accurately described; old evidence labelled historical; exact hashes/commands/versions; synthetic public files only; local links pass |
| IF-061 | Independent final review and protected integration; after IF-060 | Reviewed exact outgoing tree, required exact-head CI, no unresolved scoped code/visual blockers; preserved external gates; no implied release/hosting/collection |

## Execution rules

P1 can be integrated independently when its exact-source gates pass; P2–P4 follow reviewed increments rather than one unreviewable change. IF-048 precedes dependent geometry/conversion work. IF-057 is not a blocker to an offline editor release but blocks real collection. A failed converter usefulness gate cannot be relabeled as success; retain a clearly experimental prototype or defer shipping it.

Actual implementation should add unit/model, DOM-state and native tests alongside the feature, not postpone all tests to IF-058. IF-058–IF-061 are aggregate release gates, not substitutes for per-task evidence. No performance threshold is claimed before measured rationale and representative device testing.

## IF-050 fourth-increment acceptance matrix

These are ongoing acceptance requirements, not a second live status register. The public queue records completed scoped checks, final integration gates and remaining deferred/external work.

| Contract | Required evidence |
| --- | --- |
| Stored-item lock | Defensive full canonical records; 12-item bound; changed/missing locked records rejected before state, selection or history mutation; global background/canvas/shared-period changes permitted without promising unchanged composite pixels. |
| Selection and control policy | Locked items remain textually identified and selectable; no click-through/drag of the topmost locked hit. All shape, geometry, color, effects, own timing, precision, step, deletion and layer routes resist both ordinary and programmatically fired disabled-control events. Duplicate is an unlocked copy with unchanged source. |
| Session transitions | Lock/unlock/snap changes roll back captured gesture/placement and invalidate stale pointer releases/imports/results. No implicit reveal, Apply or clock. Unlock all, Hide, Stop, End, Escape and ordinary export remain usable. |
| History and capture | Apply/Add/Replace capture retain locks. Accepted Undo/Redo block with an explanation while any lock exists. Draft Undo/Redo and Discard validate the candidate before touching history; rejected operations preserve stacks and locked records. |
| Replacement matrix | Successful New/Convert, legacy/authored preset selection, gallery Use, scene import, Load step, image Use and image-replacement Undo clear locks with notice. Failed/canceled/stale replacements retain locks and prior data. Sequence-only import retains them; generic field refresh never clears them. |
| Snap mapping | Off/1/5/10; all five authored ratios plus legacy viewport; drag offset and letterbox exclusion; rotated/effected inset boundaries; nearest feasible grid index, finite two-decimal result, no input mutation. Selector change alone moves nothing. |
| Exact alternatives and centering | Typed X/Y, button nudges, focused-preview arrows and Shift+arrows remain unsnapped. Center X/Y/both changes only intended axes, validates, creates one bounded draft move, and has no history effect when unchanged. Text-field keys retain their native role. |
| Isolation | No serialized lock/snap fields, browser storage, network, new timer, visible grid or distribution. Lock/snap toggles with no active gesture preserve canonical document hash and rendered scene pixels; actual scene edits keep existing provenance invalidation. |
| Native/visual evidence | Trusted lock/select/drag-refusal/unlock/drag, real coordinates/pixels and exact local exports. Whole focused controls, text Range containment, actual scroll-client aperture and corner/center hit tests at 320 CSS pixels and short layouts; inspect captures. Record exact-source executed results and the actual captures inspected; expected counts or prepared tests are not acceptance. |
| Aggregate gates | Full exact-source Node/native checks and independent review after assembly. Preserve prior PR 11/12/13 failures. Physical devices, cross-engine/OS workflows, comprehensive assistive technology, qualified sensory review and participant governance remain separate. |
