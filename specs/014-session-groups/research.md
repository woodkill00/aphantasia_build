# Reference review, design evidence and baseline

Feature 014 · 20 October 2026. This feature requires repository-contract and engineering analysis, not new clinical research. It adds no efficacy, sensory-safety or viewing prescription claim. [Scientific limitations](../../docs/scientific-limitations.md) remain unchanged.

## Provenance of the promoted contract

The approved flat-session-group draft has SHA-256 `e6ad88225e3b310d0246a5e96e4fb07ed7248b7eb30b6a00b2a2c855ac218678`. The promoting task verified that exact digest before preserving its normative contract in [specification](spec.md) §§2–11 and all 30 numbered acceptance cases in both the specification and [fixed task map](tasks.md). Framing now identifies Feature 014, the preparation candidate and separately required verified-main integration. Companion clarifications/plan/analysis/checklist organize, not relax, those requirements.

The coordinating task reports the draft's peer findings resolved before promotion. The promoted contract preserves each resolution:

1. Pure planner/history inputs must already be group-closed; only the explicit UI reducer expands selection. Invalid partial membership is rejected, not repaired.
2. Native no-drift evidence compares exported ordinary numeric state and separately inspected in-session group metadata. Groups do not enter export for test convenience.
3. Ordinary history rejection preserves current state and stacks; genuine incompatible document/group endpoint is the separately identified stream-invalidation exception.

The approved conservative decisions are rigid arrangement units including internal empty space; no member isolation or merging; validated metadata-only publication without identical-scene restage; and derived stable “Group N” labels with existing item-based native controls. These are design decisions, not a runtime, browser, visual, performance or integration verdict.

## Starting source and distinct evidence classes

| Identity or source | Evidence and limit |
| --- | --- |
| Local preparation commit `c9a31520bcfb256cf940781d17923ae8867eae47` | `git rev-parse HEAD HEAD^{tree}` verified this commit and tree `51f641ecbd13007028ff1b22d31088fe6f579ba7` in the Feature 014 worktree. This is a local identity observation, not protected-main acceptance. |
| Draft Feature 013 PR 16 head prefix `12c2b356` | The integration owner supplied equivalence with the local tree and [workflow 39447144887](https://github.com/woodkill00/aphantasia_build/actions/runs/39447144887), native-pending at preparation. No full remote SHA, successful run or integrated Feature 013 main is inferred. |
| Feature 012 guides main prefix `d95fbdc0` | The integration owner reports accepted exact-main [workflow 39444608463](https://github.com/woodkill00/aphantasia_build/actions/runs/39444608463). This is prerequisite evidence supplied by that owner, not a new independent remote check or group acceptance. |
| Required Feature 013 main | Exact integrated commit/tree and required CI remain to be verified and reconciled before Feature 014 integration. The sole queue records updates; this preparation snapshot must not be read as live status. |
| Feature 014 runtime/native/visual/performance/package/CI | Not established by specification promotion. The documents describe future requirements; all implementation acceptance remains NOT RUN at this snapshot. |

No new runtime artifact was assembled or executed merely to promote the specification. Documentation integrity checks can verify preservation and links, not functional behavior. Historical failed attempts and future source repairs remain the integration owner's responsibility to preserve in the single evidence register.

## Repository references and implementation seams

| Reference | Finding used by Feature 014 |
| --- | --- |
| [AGENTS](../../AGENTS.md) and [constitution](../../.specify/memory/constitution.md) | Self-contained local editor, immediate concealment, closed canonical validation, bounded resources, native equivalents and exact-source evidence; no incidental packages/security/hosting/collection. |
| [008 specification](../008-interactive-scene-roadmap/spec.md) and [tasks](../008-interactive-scene-roadmap/tasks.md) | Staged IF-050 arrangement scope and one public work register; feature preparation is not release or research authority. |
| [012 specification](../012-editor-aids/spec.md) and [clarifications](../012-editor-aids/clarifications.md) | Aids remain independently opted in; visibility eligibility/disarming and aid-affected provenance suppression are unchanged. Groups cannot add selection pixels or reset the latch. |
| [013 specification](../013-atomic-selection/spec.md), [clarifications](../013-atomic-selection/clarifications.md), [tasks](../013-atomic-selection/tasks.md), [analysis](../013-atomic-selection/analysis.md) and [research](../013-atomic-selection/research.md) | Inherited precision, raw-input ownership, selection/primary, current-lock history, zero-plus-nonzero feasible sets, singleton compatibility, 40-total history and exact-source acceptance baseline. |
| [Architecture](../../docs/architecture.md), [plan](../../docs/plan.md) and [README](../../README.md) | Current controller/display/file ownership and historical evidence are separate from the pending newer arrangement source. Preserve accepted-scene Apply/export, independent clocks and no-autosave semantics; reconcile documentation after actual accepted implementation. |
| `imagery-app/src/selection-model.js` | Candidate pure API is `canonicalSelection`, `reduceSelection`, `arrangementBounds`, `plan`, `makeTransaction`, `recordHistory`, `planHistory`. Plans use `document`; transactions presently require scene change and document-only endpoints. Feature 014 must explicitly extend metadata/change/history semantics rather than assume the draft's conceptual names already exist. |
| `imagery-app/src/app.js` | Candidate `setSelection`/`changeSelection`, pointer and history routes use the selection model. `publishArrangement` currently stages a document and updates dirty/provenance handling; the metadata-only branch must not reuse that scene-restage path unchanged. Audit every route, not only new buttons. |
| `imagery-app/src/model.js`, `editor-model.js` and `geometry-model.js` | Canonical files and shared geometry remain authoritative; inherited tolerated coordinates, strict insets, returned polygon dot/circle, existing singleton helpers and independent lock policy are compatibility boundaries. |
| Existing Node/DOM/native/browser procedures and aggregate scripts | Preserve all substantive multi-selection/singleton regressions. Add distinct group metadata, raw-equality, unit-geometry, failure, lifecycle, actual-capture and resource cases; do not count prepared cases as executed passes. |

The source observations above identify seams on the local candidate only. They are not a complete implementation audit or acceptance of that candidate. Re-read and reconcile actual accepted Feature 013 main before relying on them for final integration.

## Engineering deductions and required proof

- Disjoint groups do not increase the 12-item scene cap. A group adds no renderer/container: combined bounds can include empty space and may be infeasible to distribute even when visible shapes seem separated. The specification deliberately chooses rigid unit boxes over member scattering or geometry packing.
- The inherited outlined-dot zero-only fixture remains necessary inside a group. One common nonzero interval can be empty while exact original payloads are valid; pure group metadata must never normalize coordinates. This is an inherited arithmetic requirement, not a new executed group calculation.
- Metadata-only state requires a separate publication branch, not a second history/controller. Group-after-Undo is a real branch with unchanged scene JSON; exact-group/no-selected-group no-ops are not. Document/group endpoints and target selection must be checked independently of the live selection.
- At most six current groups plus 40 pairs of six-group endpoints plus six planned groups gives the conservative 492 group-ID reservation bound. The item bound remains 984. History eviction can release an ID in the same generation, so revision checks are essential. These are cardinality proofs, not measured heap/performance evidence.
- Strict scene/sequence/journal serializers cannot carry session groups. Export and session inspection must remain separate evidence channels. Successful same-byte replacement must still clear groups by route identity; Apply retains them but cannot save them.

No native group interaction, real output raster, responsive layout, instrumented performance, physical device or assistive-technology outcome is deduced from these arguments.

## Deliberate deferrals and integration gate

Persistence/autosave/workspace formats, nesting, named groups, group merging, individual-member isolation, transforms, aggregate style/timing, group z-order containers, lasso, automatic selection outlines, smart guides, new schemas, resource increases, clocks, packages, network/security changes, collection, release and hosting remain outside Feature 014. Adding any as a convenience requires separate scope review, not a silent implementation adjustment.

The complete group acceptance map requires future exact-source Node/native/visual/performance/package/docs/integrity results and independent review. Verified Feature 013 main is an additional dependency, never satisfied by an accepted design draft or native-pending PR. Physical-device, actual assistive technology, zoom, cross-engine, OS file and qualified sensory/research checks stay separately labeled. No timeout estimate or inherited run count is presented as measured Feature 014 performance.

## 20 October 2026 implementation-preparation reconciliation

The promoted draft digest above identifies the original approved draft, not a digest of the later edited specification. The reviewed Feature 013 repair exposed an inherited singleton-Discard compatibility requirement. The normative lifecycle table and case 21 now explicitly preserve a valid prior singleton when no groups exist; any group anywhere still requires clearing all groups and first-accepted-item fallback. This clarifies the no-group compatibility boundary without relaxing group reset, lock, history or concealment rules.

Feature 013 first native [run 39447144887](https://github.com/woodkill00/aphantasia_build/actions/runs/39447144887) failed 6 of 200 groups. Its independently reviewed repaired runtime `df7dacc50172e624cca42f21dff34437b1ba2ec3f45122fcb232f0cfc1345db4` passed 1192 local Node tests; repaired native/visual/package checks were not yet run in the 15:53 UTC source-preparation snapshot. [PR 16 checks](https://github.com/woodkill00/aphantasia_build/pull/16/checks) supply subsequent exact-head outcomes; the pending statement in the promotion table is historical, not a current result. Accepted source repairs were narrowly reconciled into the group candidate, including native anchor-option retention, ordinary-input and return-to-origin draft intent, short hidden inspector aperture and the Discard exception. No whole-app overwrite or transfer of native acceptance occurred.

The exact group runtime and preparation results are recorded in the [test report](../../imagery-app/test-results/TEST-REPORT.md) and sole [queue](../../project-queue.json). Source/model/DOM passes are not native, actual visual, measured performance, clean-checkout package or required exact-head CI acceptance. Verified Feature 013 main remains a separate integration prerequisite.

## Feature 014 bounded execution allowance, 20 October 2026

Independent review accepted a 30-minute native ceiling inside the same 33-minute job. The complete accepted guides baseline was 795.126 seconds. Add the prior Feature 013 itemized 315-second projection rounded conservatively to 320, then the Feature 014 upper projection of 360 seconds: `795.126 + 320 + 360 = 1475.126` seconds. The 1800-second native ceiling leaves 324.874 seconds, approximately 22.023% projected headroom. The 33-minute same-job limit retains 180 seconds for non-native work, including the unchanged one-minute package step.

These are reviewed projections, not measured Feature 014 speed or a performance PASS. The failed first Feature 013 run took 1032.432 seconds but did not complete every tail and is not a complete baseline. Actual repaired Feature 013 and complete Feature 014 outcomes/durations must be reconciled before acceptance. The source still investigates attributable handler-plus-layout work above 50 ms. No additional job, retry policy, skipped assertion, package installation, permission expansion, sandbox change, credential retention, upload or publication step is introduced.

## Repair preparation after the first native attempt, 20 October 2026

[PR 17 run 39454651362](https://github.com/woodkill00/aphantasia_build/actions/runs/39454651362) is terminal FAIL, with package SKIPPED. Full-log transport failed; the retained 146 observed passes/three desktop failures and 198 verified capture payloads are partial, not complete native totals. Forty-five available desktop group images were inspected without another scoped blocker; mobile and missing images are not accepted. The report preserves the +12.4 ms paired-drag p95 regression against the unchanged +10 ms limit and independently confirmed stale-placement-rectangle/selection-before-provenance test-premise repairs.

Defensive A+B repair reduces full canonical calls on the synthetic empty-group singleton move from 38 to 28, compared with repaired Feature 013's 26, retaining 943 Canvas operations. This is local causal/count evidence only. Public closed validation and lock boundaries remain, Group/Ungroup/Duplicate and all nonempty-group paths are excluded from delegation, and unchanged native timing gates must be rerun. The 30/33-minute execution allowance is unchanged. The bounded lossless test-evidence transport source is now independently accepted and integrated, without changing workflow actions/settings/permissions, runtime or scenario assertions. Its retained-corpus 350-capture projections are 6,564,851 and 7,666,076 bytes; neither is a bound and the second exceeds the unchanged 7,350,000-byte native cap. Cap/spool/output/decode failures remain nonacceptance. Exact replay is not a native rerun or guarantee of whole-job connector delivery.


## Test-observer preparation after the complete second run, 20 October 2026

The second [PR 17 run](https://github.com/woodkill00/aphantasia_build/actions/runs/39463607041) decoded completely at 213/224 PASS with eleven failures, 341 captures and 1154.245 seconds. Ten failures arose from stale or missing test observations when the optimized runtime correctly stopped asking the presentation unit validator about empty groups; actual labels reflected the empty state. The candidate repair observes the already-current empty input of the existing history check, not a speculative history output, delegates once and retains real return/exception behavior. It must not add production validation merely to feed a test. Ten regression tests and independent source review are separate from native acceptance.

The additional mobile failure is later 70/60 placement that unexpectedly leaves zero objects, after its rapid drag and first trusted Undo passed. Its cause is unresolved at this preparation snapshot. Scoped paired timings and inspected images cannot erase this failure or accept the whole suite. A complete exact-head rerun remains required with unchanged runtime, assertions, timing thresholds, transport cap, sandbox and 30/33-minute budgets. The preceding dated report and JSON snapshots retain both failed runs and their different evidence limits.

Final observer/diagnostic source review is accepted: 47 targeted checks, including ten observer and three passive-diagnostic regressions. Passive placement diagnostics retain bounded event targets, hit-tests, geometry and genuine planner inputs without waits, retries or assertion changes. Collection/emission failure preserves the original interaction failure and fails closed when it is the only error. Geometry reads may perturb timing, so a future passing diagnostic case alone would not establish the original cause or a runtime repair. Full exact-head gates remain required.
