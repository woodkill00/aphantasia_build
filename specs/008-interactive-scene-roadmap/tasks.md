# Task and acceptance map

This is the fixed Spec-Kit execution map, not a second live task register. Implementation status, attempts and evidence belong only in [project-queue.json](../../project-queue.json). IDs remain stable through repairs. Every claimed pass must name the exact source/artifact and command or inspected capture. A dependency listed here is not permission to bypass an external gate.

| ID | Deliverable and dependency | Required acceptance evidence |
| --- | --- | --- |
| IF-045 | Specification, clarifications, constitution, plan, research mapping and analysis | All 64 proposal codes mapped; local links valid; independent scope/consistency review; unresolved gates explicit |
| IF-046 | Existing-shape select/drag state machine and draft gesture history; after IF-045 | Pure hit/coordinate tests; click-versus-drag, grab offset, primary pointer/capture, cancel rollback, one undo unit, stale callback and hidden-state tests; native pointer interaction |
| IF-047 | Equivalent numeric/tap/nudge/keyboard controls and inspector/layout behavior; after IF-046 | Text-field shortcuts unaffected; same canonical coordinates; semantic selection/focus; no canvas jump; narrow/short/focus captures inspected |
| IF-048 | Freeze scene-v4/sequence-v3 and authored-ratio contract; after IF-045 | Closed-key/range document; unchanged legacy fixtures; explicit migration/round-trip; capture preserves metadata or rejects unsupported input; letterbox mapping/resize tests |
| IF-049 | Bounded shape registry and family controls; after IF-048 | Every family validates/renders/hit-tests/describes/serializes; dimensions/rotation/fill/stroke bounds; invalid/nonfinite/unknown inputs rejected; existing timing/effects intact |
| IF-050 | Layers/locks/overlap selection, optional arrangement helpers and original preset gallery; after IF-047 and IF-049 | Reorder/lock/duplicate/snap tests; preset IDs/revisions/provenance; all built-ins validate; static accessible thumbnails; old presets unchanged |
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
