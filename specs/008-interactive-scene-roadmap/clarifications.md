# Clarifications and bounded design decisions

20 October 2026. These decisions resolve implementation ambiguity conservatively; they are not evidence of completed code. Changes require an updated rationale and affected tests.

1. **Direct editing means live draft editing.** Preserve accepted-scene Apply/export and snapshot isolation. Gesture history is explicitly draft-scoped and bounded, distinct from accepted-scene Undo/Redo. No silent auto-commit is inferred.
2. **Startup versus playback.** The requested preview remains visible statically at startup. Direct interaction never starts pulse/fade clocks; Hide remains persistent until explicit resume.
3. **All shapes means families.** An exhaustive geometric inventory is impossible. Implement finite parameterized families with validated ranges and extension contracts; do not accept arbitrary executable shape definitions.
4. **Schema expansion is explicit.** P1 can use current scene-v3 coordinates. P2 uses scene-v4 and sequence-v3, strict old-version validation, and migration tests. Sequence capture must preserve canvas metadata and reject mismatched snapshot canvases; until the corresponding sequence contract is implemented, capture of unsupported new-format scenes must fail explicitly rather than drop fields. Exact field names are frozen during IF-048 before dependent implementation, not guessed in UI code.
5. **Authored canvas is opt-in.** Preserve legacy viewport-relative semantics. New fixed-ratio scenes use explicit content-rectangle mapping and letterboxing, with a preview of conversion. The new-canvas UI offers common ratios, with square as the default for explicitly created fixed-ratio scenes; supported ratios and their exact bounds are frozen with IF-048. Existing starter/legacy scenes are not silently converted. No silent crop/stretch or physical calibration claim.
6. **Counts and resource caps stay bounded.** Preserve 12 items and existing canvas allocation limits until measured evidence and review justify a change. New path/image budgets must have boundary tests and a documented rationale; they are not safety thresholds.
7. **Initial photo mode is local abstraction.** No third-party model/API, remote URL input or original-image export. Filled approximation waits for compatible geometry. A sparse sketch may be benchmarked earlier but is not promised as photo recreation.
8. **Journal persistence is not inferred.** Initial optional journal is session memory with explicit separate export and clear loss-on-close notice. No localStorage/IndexedDB or hidden autosave. Durable storage needs a later explicit decision.
9. **Research goal is not assumed.** Initial software supports usability/preference/tolerability reflection, not demonstrated imagery change. A future study must choose its primary question, outcomes and meaningful effect before collecting reports.
10. **Submissions stay disabled.** Implementing a contract/mock does not enable collection. Operator, hosting/security, jurisdictions, ethics, instrument rights, retention and statistical design are external prerequisites, not TODOs that code can satisfy.
11. **Verification wording is scoped.** Automated Linux Chrome, emulated mobile, inspected screenshots, physical devices, assistive technology, qualified content review and participant research have separate evidence states. “Fully tested” cannot mean all browsers/devices or clinical efficacy without evidence.
12. **Single status source.** Only [project-queue.json](../../project-queue.json) records live completion. [tasks.md](tasks.md) is a fixed execution and acceptance map, not a duplicate checkbox board.

## Decisions awaiting measured implementation or qualified authority

- Exact expanded schema/family parameter bounds and authored ratios: IF-048/IF-049 design review before implementation.
- Image byte/pixel/memory/iteration budgets and minimum useful quality: IF-051/IF-052 measurements; do not invent universal performance promises.
- Public research operator, approved protocol, retention/withdrawal and consent text: IF-057 external gate; no real submission while unresolved.
- Physical-device and assistive-technology coverage: IF-059; record unavailable tests as NOT RUN, never substitute mocks.
