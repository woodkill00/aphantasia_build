# Cross-artifact analysis

20 October 2026 · Design and implementation analysis for unreleased 0.8; not final runtime acceptance.

## Coverage and consistency

- The seven user stories cover direct movement/selection, equivalent interaction, broad shapes, presets, photo approximation, private reflection and a disabled future submission boundary.
- All 64 review proposals are mapped in [research.md](research.md) to stable IDs in [tasks.md](tasks.md) and the [single queue](../../project-queue.json). Overlaps intentionally share tasks.
- P1 preserves existing scene-v3 semantics. P2 explicitly requires scene-v4 and sequence-v3 to avoid losing authored-canvas metadata in snapshots.
- Gesture undo is draft-scoped; accepted Apply/history/export remains explicit. UI wording must prevent two unrelated Undo meanings from becoming ambiguous.
- A fixed authored ratio helps repeat composition but is not calibration. Legacy viewport-relative scenes are not silently transformed.
- The 12-item cap and current canvas buffers remain unless a measured/reviewed change justifies otherwise. This prevents photo quality ambitions from quietly expanding renderer resources.
- P4 is memory-only and optional; P5 has no operational submission path. Governance, instrument rights, recruitment and deployment are not automatically approved by feature implementation.
- The constitution preserves existing Hide/lifecycle/static-startup/finite-clock/import boundaries. No package or CI/security change is required by the specification.

## Risks and required mitigations

| Risk | Consequence | Mitigation and evidence |
| --- | --- | --- |
| Inspector reflow during drag | Pointer/item jump, incorrect stored coordinates | Defer layout-affecting change or freeze content rect; native drag geometry assertion and screenshots |
| Overlap/hollow geometry ambiguity | Wrong item selected | Document topmost/hollow/tolerance policy, list and overlap cycling; fixture matrix |
| Dual draft/accepted history | Lost work or unintended commit | Explicit labels and one transactional write path; apply/discard/undo interleaving tests |
| Silent old-file reinterpretation | Broken user files or incomparable scenes | Strict versioned validators/migration; golden legacy fixtures and capture metadata tests |
| Async conversion after Hide/edit | Unexpected scene reveal/replacement | Termination plus generation/revision rejection; injected late completion tests |
| Decode or worker memory amplification | Frozen or terminated browser | Encoded/decoded/work/output limits and total buffer ledger; malformed/oversized tests |
| Arbitrary SVG/metadata input | Injection or privacy leakage | Raster-only initial input, closed numeric output, no remote fetch; adversarial export tests |
| “Better reconstruction” treated as imagery gain | Misleading health/science claim | Separate quality, preference, comfort and imagery wording; no combined score |
| Repeated sessions treated as independent people | Biased future comparisons | No efficacy leaderboard; statistical protocol gate and synthetic analysis contract |
| Public experience export mistaken for anonymous | Disclosure of personal scene/notes | Explicit local preview, minimal fields, no automatic upload; qualified governance before submission |
| CSS math mistaken for visual acceptance | Unreachable controls on real layouts | Actual captures/interactions at documented dimensions and separate physical-device gaps |
| Old tests cited for new source | False completion claim | Reassemble/hash after each repair and rerun final exact-head gates |

## Open gates, not hidden assumptions

The authored contract and explicit engineering resource caps are now described in [architecture](../../docs/architecture.md). Limits are implemented bounds, not representative-device memory/latency measurements. IF-052 usefulness acceptance remains open: no held-out natural-image/correction-effort comparison establishes an advantage over manual authoring. IF-057 remains external: operator, ethics/privacy/security/instrument/statistical choices cannot be invented by developers. Physical devices, ordinary OS file workflows, assistive technology and qualified sensory/content review retain separate evidence states.

Not every roadmap requirement is implemented or accepted. The discrepancies below are explicit deferrals, not silently closed requirements. No 0.8 release, hosting or collection is claimed.


## Implemented candidate versus full roadmap

The candidate assembles direct editing, scene-v4 geometry/fixed ratios, compatible sequence-v3 capture, layer reordering, four original authored examples, experimental local PNG/JPEG fitting, optional private session journaling and disabled research information. [The feature guide](../../docs/roadmap-features.md) and [user guide](../../imagery-app/README.md) describe the actual controls. The [queue](../../project-queue.json), not this analysis, is the live acceptance register.

The implementation narrows several planned capabilities honestly:

- US2/IF-050: draw-order controls, duplicate and overlap selection exist; locks, snap, guides and align/distribute do not.
- US3/IF-048–049: ten bounded numeric families and five fixed ratios exist. Legacy v3 remains viewport-relative; old inputs retain original validation. Raw SVG, arbitrary curves/paths, line/arc/ring registries, text and 3D are not included.
- US4/IF-050: four original metadata-backed editable examples exist. A thumbnail/filterable gallery, full semantic composition catalog and exportable immutable stimulus provenance are not present.
- US5/IF-051–053: bounded seeded fitting, crop/palette controls, candidate description, explicit hidden draft staging and cancellation exist. The engine is cooperative main-thread work, not a worker. Actual browser decoder behavior still needs exact-source native acceptance. Natural-image/unsupported-silhouette tiers, manual anchors, representative-device performance and correction-effort/user-usefulness evidence remain open. Pixel-error reduction is not that evidence.
- US6/IF-054–055: optional 20-record session journal, neutral missingness, exact selected preview, single-use approval and clearing exist. The integrated UI writes unavailable scene/exposure references; no measured scene revision, intended/actual exposure or technical-interruption association is claimed. Model fields that could accept provenance do not establish runtime collection.
- US7/IF-056–057: disabled explanatory information and a closed local schema boundary exist. No operational consent/submission service, participant collection or statistical analysis exists. Governance cannot be completed by implementation tests.

These limits must remain visible in release decisions. Passing code tests does not close the empirical usefulness or external governance gates.

## Independent component review findings

The following summarizes recorded independent engineering reviews of component snapshots, not qualified scientific review or final acceptance of the moving integrated source. Counts below are review-local and must not be summed into a current whole-app test total. Exact artifacts, commands and later repairs belong in the [test report](../../imagery-app/test-results/TEST-REPORT.md).

- Direct-editor review found that mutable selection could redirect a gesture and that overlap candidates could survive geometry changes. The fixes bind the transaction to the captured item and invalidate stale overlap state, with targeted regressions. Native fullscreen/focus and baseline-check failures remain distinct from model acceptance; only the final exact-head rerun can close them.
- Geometry/model review found outward rounding at rotated edges. Placement/translation now use inward `ceil` minimum / `floor` maximum quantization before coordinate rounding. The component review reported 273 related checks; 15,000 legacy validation cases with 8,150 accepted and matching geometry across four viewports; 3,000 matching legacy-sequence cases; and 18,000 extreme translations across 3,000 seeded authored cases/five ratios. These synthetic comparisons protect legacy semantics and numeric bounds, not raster/device equivalence.
- Image-model review repaired typed-array length spoofing/getter behavior, slice/constructor callback risks and non-enumerable fields bypassing the closed contract. The scoped review reported 34 model checks and 120 seeded fuzz cases after repairs. These do not establish browser decoder security, peak process memory, natural-image quality or real-user correction effort.
- Journal UI/model review reported 54 scoped checks with no remaining component blocker at that snapshot. This covers synthetic state/export behavior, not instrument validation, assistive-technology acceptance or privacy-law compliance.
- Image UI/integration review found missing invalidation on End/import routes and overlapping decode work after cancellation. Cancellation was centralized with presentation invalidation, and a single intake lease now remains held until an outstanding read/decode settles and releases resources. The scoped review reported 75 checks after repairs. These use Node/mocks/adversarial fixtures, not completed native-browser performance or device evidence.

- Documentation/source reconciliation found that candidate staging could overwrite a prior staged draft without draft-level undo. The integrated UI now retains one prior valid draft/selection for explicit `Undo image draft replacement`, rejects replacement while existing fields are invalid, and keeps Apply/download separate. This latest repair still needs exact-source review/regression rather than inheriting the component counts above.

New integrated changes still require their own review and regression rerun. No review here is described as whole-candidate acceptance; exact-head native/visual gates remain pending. Existing failed/blocked attempts must be preserved, not overwritten by later success or changed assertions.

## Remaining acceptance boundary

Run the dependency-free suite, assemble source, identify the exact artifact and execute sandbox-enabled native tests including actual synthetic PNG decode, exact selected journal download, authored rendering/input, cancellation, keyboard/focus and narrow/short layouts. Inspect actual captures; source layout math and DOM doubles cannot satisfy visual acceptance. Physical-device touch/pen, cross-engine, OS dialogs, actual zoom, comprehensive assistive technology, qualified sensory/content review and all participant research remain separate PASS/FAIL/BLOCKED/NOT RUN gates.

No extra packages, hosted service, stronger permissions, weakened sandbox, new collection or release publication follow from this analysis. Clinical thresholds, diagnosis and efficacy remain unsupported.
