# Roadmap acceptance matrix draft

20 October 2026 · **Version 0.8 is unreleased. Final engineering acceptance is pending.**

Prior PR 12 run 39409429924 passed 737 Node and 117/118 native groups. All 98 captures were inspected and exposed narrow action-label clipping. Current pointer-release and wrapping repair candidates require fresh exact-head native evidence; prior passing groups do not establish repaired acceptance.

This is an evidence snapshot for the expanded candidate, not a claim that the full roadmap or all 64 proposals are done. It separates implemented and non-browser-tested behavior from deliberately deferred work, unperformed acceptance and governance-blocked collection. The [project queue](../../project-queue.json) remains the single live task/status register; this document does not replace it. The [fixed task map](tasks.md) defines the acceptance requirements, and [research traceability](research.md#all-64-proposals-mapped-to-the-single-queue) maps every E/S/I/R proposal to those IDs.

## Candidate and evidence identity

| Item | Recorded identity or outcome |
| --- | --- |
| Acceptance target | PR 12, frozen source head `198b0fcef2ee3919e556bb930f4afc778f543564`. |
| Locally inspected source snapshot | `b157ba3d2441561edf7e2864376173a946af1a44`. This is not asserted to be the PR head. The local HTML independently matches the runtime identity below; that match does not prove every source/test/document file is identical. |
| Runtime | `imagery-app/index.html`, 276,388 bytes. |
| Runtime SHA-256 | `eea540762d2925b157c2672d1077809e8419c0b582399bf670c9ddbb23e634fa`. |
| Recorded dependency-free regression | PASS: 737/737 Node checks, zero failed or skipped; Node 24.19.0; command `node --test imagery-app/tests/*.test.cjs`. This is non-browser evidence, as recorded in the [summary](../../imagery-app/test-results/summary.json). |
| Recorded documentation check before this matrix | PASS: 34 Markdown files and 220 local links/fragments, using `node scripts/check-docs.cjs`. This new document was not part of those counts. |
| Documentation check including this matrix | PASS: 35 Markdown files and 227 local links/fragments, using the same command on this documentation addition. This is an offline link/fragment check, not native acceptance. |
| Prepared native suite | 118 groups and 98 expected synthetic captures. These are planned counts, not successful execution or inspected-image totals. |
| Current native attempt | CI running; no completed exact-head native outcome is recorded in this draft. The acceptance placeholders below remain NOT RUN until actual evidence is reviewed. |
| Current-head visual acceptance | NOT RUN. No completed review of this head's 98 expected actual captures is claimed. |
| Separate direct-editor increment | P1/PR 11 has its own pending CI/review boundary. Its earlier results or repairs cannot accept the expanded PR 12 candidate. |
| Published distribution | The verified published package remains v0.7.0. It does not contain the new authored, image or journal features. No published v0.8 or hosted deployment is claimed. |

The [test report](../../imagery-app/test-results/TEST-REPORT.md) preserves component evidence, historical attempts and limitations. Independent model/DOM-double reviews and synthetic fuzz checks are useful, but not native rendering, browser decoding, physical-device, accessibility, empirical-usefulness or clinical evidence.

## Status meanings

- **Implemented / non-browser tested:** the bounded behavior exists in the candidate and falls within the recorded automated source/model/mock regression scope. It is not a final native or visual pass.
- **Partial / deliberately deferred:** a useful subset exists, but the full task acceptance requirement is not satisfied. The omitted capability remains visible rather than being counted complete.
- **Pending acceptance / NOT RUN:** required exact-source execution or inspection is not yet established. A prepared test or running CI attempt is not a pass.
- **Governance blocked:** software cannot authorize real research collection; external decisions and explicit activation are required.

## IF-045–061 acceptance matrix

Proposal families are summarized here for readability. The linked [64-proposal crosswalk](research.md#all-64-proposals-mapped-to-the-single-queue) is authoritative for individual codes; mapping a proposal is not implementing or accepting it.

| ID | Implemented and tested scope | Deliberately deferred or missing evidence | Acceptance disposition |
| --- | --- | --- | --- |
| IF-045 | Specification, clarifications, plan, constitution, 64-proposal traceability and cross-artifact analysis; local links checked. Covers planning across E/S/I/R families. | Final reconciliation against this exact expanded source/evidence is still required; 64 mapped ideas are not 64 completed features. | Planning artifacts implemented; final reconciliation pending. |
| IF-046 | Direct topmost selection, thresholded drag/grab offset, immutable gesture target, rollback, stale-work guard and bounded draft move history; pure/model/DOM regressions. E/R interaction families. | Actual pointer/capture behavior and all relevant current-head native scenarios must finish successfully. | Implemented / non-browser tested; native acceptance pending. |
| IF-047 | Semantic selection, numeric position, tap-place, nudge and focused-preview arrow keys; inspector defers layout-changing selection until gesture completion. E/R equivalent-control families. | Current-head rendered narrow/short/focus captures, actual touch/pen devices, actual zoom and assistive-technology workflows. | Implemented / non-browser tested; visual and broader accessibility acceptance pending. |
| IF-048 | Explicit scene-v4/sequence-v3 contracts, five fixed ratios, letterbox mapping, strict unchanged legacy validation and atomic incompatible capture rejection; round-trip/differential tests. E/S/R format and provenance families. | Exact-head native canvas/snapshot import/export and letterbox interaction; physical calibration is not a capability. | Implemented / non-browser tested; native acceptance pending. |
| IF-049 | Ten closed numeric shape families, dimensions, rotation, fill/contour, extents, shared rendering/hit-test geometry, descriptions and serialization. E/I/R geometry families. | Native raster/effect/composed-output inspection; arbitrary SVG/paths, curves/arcs/rings/lines, text, 3D/fractals and every possible shape are not implemented. | Bounded family set implemented / non-browser tested; expanded families deferred and raster acceptance pending. |
| IF-050 | One-layer reorder, duplicate and overlap cycling; four original revisioned MIT preset examples, validated through the shared model. E/I/R layers and catalog families. | Locks, snap, guides, align/distribute, groups, static thumbnail/filterable gallery and richer semantic house/tree/boat/still-life catalog. | Partial / deliberately deferred; existing subset still needs native/visual acceptance. |
| IF-051 | PNG/JPEG header/decode bounds, thumbnail/work budgets, cooperative cancellation, stale-result guards, single read/decode lease and local-only data path; malformed/adversarial/mock tests. E/I/R resources and privacy families. | Actual browser decode/orientation/resource release on the exact head; representative-device peak memory/latency. No worker-thread implementation or broader raster formats. | Bounded foundation implemented / non-browser tested; native/performance acceptance pending. |
| IF-052 | Repository-authored deterministic seeded rectangle/ellipse/triangle fitting with 3/6/12-item budgets, bounded search and canonical output; synthetic/fuzz fixtures. I/R approximation families. | Held-out licensed natural images, unsupported silhouettes, representative latency/cancellation metrics and a manual-authoring correction-effort/usefulness comparison. Pixel error alone cannot pass that gate. | Experimental prototype only; empirical usefulness NOT RUN, full task not accepted. |
| IF-053 | Numeric crop, palette/ratio/seed, explicit Generate, textual candidate review, hidden Use editable draft, one-step image-draft replacement undo and explicit Apply/download separation; stale candidate tests. I/R review and control families. | Actual synthetic-image decoder → draft → edit/undo/download browser journey and rendered source/result review. Manual anchors and empirical correction-effort validation are deferred. | Implemented bounded workflow / non-browser tested; native and empirical acceptance pending. |
| IF-054 | Closed neutral reflection schema and missingness distinctions with unavailable scene/exposure values; no scores, fingerprints or raw traces. S/E/R reflection/provenance families. | Integrated exact scene/render identity, planned/actual visible duration and technical-interruption attribution. Model support for available references is not a measurement implementation. | Partial: neutral schema tested; runtime provenance deliberately unavailable. |
| IF-055 | Initially off, optional session-only journal; 20-record limit, skipped defaults, exact selected preview, separate single-use approval/download, clear/delete and no storage/network; synthetic model/UI tests. S/R local-reflection families. | Exact-head native journal Blob download, focus/keyboard and responsive rendered workflows. Physical OS download usability and full accessibility. | Implemented / non-browser tested; native/visual acceptance pending. |
| IF-056 | Disabled research information, closed local data boundary, separate prospective consent scopes and anonymity/deletion caveats. S/R submission-boundary families. | No functional consent/submission service, endpoint, live participant payload, upload queue, statistical analysis or efficacy leaderboard. Real-record submission is not a demonstration route. | Disabled explanatory subset implemented; operational collection intentionally absent. |
| IF-057 | Prerequisites documented: operator, population/jurisdiction, applicable ethics, rights, privacy/security, protocol/statistics, retention/withdrawal and explicit activation. S/R external-research families. | Those determinations/approvals, a governed service, incident handling, reviewed instruments/protocol and authorized deployment/collection. | GOVERNANCE BLOCKED. Software tests cannot close this gate. |
| IF-058 | 737 recorded non-browser checks, adversarial formats, legacy differential/fuzz checks, cancellation/state tests and local-only boundaries. Cross-feature E/S/I/R families. | Exact-head native regression, actual composed pixels/timing, browser decoding/downloads and final evidence reconciliation. Earlier failures must remain recorded. | Non-browser regression PASS; aggregate cross-feature acceptance pending. |
| IF-059 | 118 native groups and 98 expected captures prepared; test code includes authored raster/input, synthetic PNG and journal download scenarios. E/S/I/R evidence families. | Current running native attempt must finish; actual captures must be verified/inspected. Physical devices, pen, cross-engine, OS workflows, actual zoom, comprehensive AT and qualified sensory review are NOT RUN. | Current-head native/visual acceptance pending; broader gates NOT RUN. |
| IF-060 | User guide, architecture, compatibility, changelog and feature/deferred-work guide updated; old v0.7 images/evidence explicitly historical; 34-document/220-link check recorded before this matrix. | Exact native/visual result, environment, hashes, reviewed captures and final outgoing documentation/example reconciliation. Recheck documentation after this addition. | Documentation implemented / locally checked; final evidence reconciliation pending. |
| IF-061 | Independent scoped component reviews and repairs recorded; least-privilege/protected integration boundary retained. | Final exact-tree integrated review, required exact-head green CI, inspected visuals and resolution of scoped blockers. P1 PR 11 and expanded PR 12 remain distinct. | Final engineering acceptance and protected integration pending; no release/hosting/collection implied. |

## Exact bounded feature inventory

### Geometry and authored formats

The ten supported authored shape identifiers are exactly:

1. `dot`
2. `pixel`
3. `circle`
4. `square`
5. `triangle`
6. `ellipse`
7. `rectangle`
8. `rounded-rectangle`
9. `polygon`
10. `star`

Scene-v4 uses sampler `authored-objects-4`; sequence-v3 uses `ordered-crossfade-3`. Ratios are exactly `1:1`, `4:3`, `3:4`, `16:9`, `9:16`. A sequence and all its authored snapshots must share the same canvas. The item cap remains 12. Legacy scene-v3/sequence-v2 remain viewport-relative; New/Convert is explicit, and neither older-file import nor capture silently reinterprets them. Geometry/effects, exact bounds and migration contracts are in [architecture](../../docs/architecture.md#authored-scene-v4-and-sequence-v3-contract).

### Four original presets

| Stable ID | Revision | Title | Authored timing type |
| --- | --- | --- | --- |
| `balanced-contours` | 1 | Balanced contours | `steady` |
| `symmetric-points` | 1 | Sparse symmetric points | `steady` |
| `sequential-shapes` | 1 | Sequential shapes | `sequential-fades` |
| `mixed-steady-pulse` | 1 | Mixed steady and pulse | `mixed-steady-pulse` |

All four use original repository-authored geometric content and MIT provenance; no external picture or questionnaire is included. Their editable scene exports do not retain a claim of immutable stimulus identity. Choosing a preset never starts timing. Static startup is not timed autoplay; item timing and snapshot sequences remain separate finite explicitly started clocks.

### Local image allocation and work ledger

| Resource | Implemented maximum or behavior |
| --- | --- |
| Encoded selected PNG/JPEG | 8,388,608 bytes, or 8 MiB. Supported MIME/header checks precede decode. |
| Header dimensions | At most 4096 pixels on either side and 8,388,608 pixels total. |
| Decoded dimensions | The same limits are checked again after orientation-aware `createImageBitmap` decode. Header preflight alone is not complete file validation. |
| Full decoded raster equivalent | A four-byte RGBA raster at the pixel cap is 33,554,432 bytes (32 MiB), excluding browser decoder intermediates/overhead. This is not a total process-memory cap. |
| Retained thumbnail | At most 128 pixels per side and 16,384 pixels; at most 65,536 RGBA typed-array bytes. Decoder bitmap is closed and intake scratch canvas shrunk after sampling. |
| Working image | Longest side 48, chosen ratio; at most 2304 pixels. Two RGB target/current buffers total at most 13,824 bytes. |
| Region search scratch | At most 2304 visited bytes and 4608 queue bytes. |
| Model/source typed-array ledger | At most 86,272 bytes: thumbnail + two working RGB buffers + visited array + queue. It excludes encoded/decode buffers, canvas backing stores and browser/JS overhead. |
| Candidate budget | Maximum 3, 6 or 12 output items; at most 384 candidate evaluations per item, 4608 total. A completed result can contain fewer items, including zero. |
| Cooperative slice | UI evaluates 16 candidates per timeout slice; pure API permits up to 32. This is yielding main-thread work, not a Web Worker or a guaranteed latency bound. |
| Fitting families | Filled, unrotated `rectangle`, `ellipse`, `triangle`; result maps through the ordinary scene-v4 validator and remains editable. |
| Existing presentation buffers | Main plus one offscreen total at most 8,388,608 pixels, dimension cap 4096 and DPR cap 2; no third full-size presentation buffer. These are separate from image decode/thumbnail allocations. |
| Intake concurrency | One active file read/decode lease. Cancellation invalidates the result but cannot forcibly abort the browser read/decode; the lease remains held until it settles and its bitmap is closed. A new intake cannot overlap it. |

Cooperative search cancellation clears scheduled work and candidate state. Generation/revision checks reject stale completion after Hide/End/import/edit/lifecycle changes. Generate does not change the scene. Use editable draft stages hidden data, with explicit one-step replacement undo; Apply/download remain separate. Original bytes, filename and metadata are absent from scene exports, but derived shapes may reveal the picture's content. No upload, remote URL input, storage or cloud model is implemented.

The ledger is a bounded-allocation design, not measured peak RSS, representative-device performance, secure deletion, natural-photo quality or a safety threshold. A lower normalized RGB error is not a semantic, usability, imagery or clinical result.

### Exact journal export contract

The selected export is JSON with the following exact closed fields. The initial UI is unchecked/off; nothing is recorded until Add reflection. All optional answers default to `skipped`.

| Level | Exact fields and values |
| --- | --- |
| Root | `format: "imagery-private-journal"`, `version: 1`, `purpose: "private-exploratory-reflection"`, `entries`. |
| Each `entries` item | `id` and `reflection`. IDs use the local `entry-1` style; they are not participant identities. |
| Each `reflection` | `scene`, `exposure`, `experiences`, `comfort`, `symptoms`, `stoppedEarly`, `preference`, `easeOfUse`, `note`. |
| `scene` in the integrated UI | Exactly `{status: "unavailable"}`. No measured scene hash/revision or renderer identity. |
| `exposure` in the integrated UI | Exactly `{status: "unavailable"}`. No measured planned/visible duration, end reason or technical-interruption attribution. |
| `experiences` | Exactly `perception`, `afterimage`, `voluntaryImagery`, `nonvisualMemory`; each one of `not-asked`, `skipped`, `none`, `uncertain`, `present`. |
| `comfort` | Exactly `before`, `after`; each one of `not-asked`, `skipped`, `uncertain`, `comfortable`, `mild-discomfort`, `moderate-discomfort`, `severe-discomfort`. |
| `symptoms` | Exactly `eyestrain`, `headache`, `dizzinessNausea`, `distress`, `otherDiscomfort`; each one of `not-asked`, `skipped`, `none`, `pre-existing`, `new-or-worse`, `uncertain`. |
| `stoppedEarly` | One of `not-asked`, `skipped`, `uncertain`, `no`, `yes`. |
| `preference` | One of `not-asked`, `skipped`, `uncertain`, `disliked`, `neutral`, `liked`. |
| `easeOfUse` | One of `not-asked`, `skipped`, `uncertain`, `difficult`, `neither`, `easy`. |
| `note` | Plain string, at most 2,000 JavaScript string code units, with the model's control/direction-override exclusions. No required note. |
| Capacity/export bound | At most 20 page-memory records; selected export at most 131,072 UTF-8 bytes. |

The pure model can validate a future available scene/exposure reference; this UI does not generate one. No timestamp, original image, full scene, device fingerprint, score, research-consent token or app preview revision is added to the export. Optional free text may itself contain private information; a minimal schema does not make it anonymous.

Export requires selected entries, an exact current payload preview, a separate explicit approval and a Download action. Edits/selection changes invalidate approval; one download consumes it. Scene, sequence and ordinary note files exclude the journal. Turning participation off clears unfinished answers, not added entries; Clear removes page records/answers/preview, not files already downloaded. There is no autosave, browser storage, import, background submission or endpoint.

## Exact-head native evidence placeholders

**Do not replace these placeholders from expected counts, test source, Node mocks or historical CI.** A running CI attempt is not a completed outcome. Enter actual run/source/environment/command results, preserve failures, verify emitted artifact/capture identities and inspect the actual images before recording PASS.

| Required evidence | Recorded acceptance status | Details to fill only after verification |
| --- | --- | --- |
| Native run identity and tested checkout | NOT RUN | Verified run/job URL, PR source head, actual test-merge/checkout head, exact artifact SHA-256 and byte count. |
| Runtime environment and commands | NOT RUN | Actual Node/browser versions, OS, ordinary sandbox state, `file:` opening route and full invoked commands. |
| Native groups | NOT RUN | Actual passed/failed/skipped/blocked totals, duration, exit status and cleanup outcome. Planned: 118 groups. |
| Actual PNG decode → candidate → editable draft/undo/export | NOT RUN | Real synthetic fixture decode and resulting canonical output; do not substitute the model/mock decoder checks. |
| Actual journal download | NOT RUN | Exact selected approved Blob payload, independent file check and rejection of stale/unapproved export; use synthetic reflections only. |
| Capture integrity | NOT RUN | Actual emitted count, filenames, byte lengths and SHA-256 verification. Expected: 98 synthetic captures, not yet an observed accepted set. |
| Current-head rendered inspection | NOT RUN | Images actually opened/inspected, geometry/effect/compositing and focus/reflow findings, narrow/short/hidden states, unresolved defects and any repaired rerun. |
| Final integrated acceptance decision | NOT RUN | Exact accepted source/tree, scope-limited reviewer outcome, required green checks and explicit remaining external/deferred gates. |

## Gates that remain separate even after native CI passes

| Gate | Status in this draft | Why software success would not close it |
| --- | --- | --- |
| Physical Android/iOS/tablet touch or pen | NOT RUN | Chrome viewport/touch emulation is not a physical device or its lifecycle/file workflow. |
| Cross-engine and additional operating systems | NOT RUN | Linux Chrome cannot establish Safari, Firefox, Edge or other OS compatibility. |
| Ordinary file chooser/download and mobile file opening | NOT RUN as manual OS acceptance | CDP file transfer and Blob checks do not establish native-dialog usability or persistent disk delivery. |
| Actual 200%/400% browser/OS zoom, screen readers, forced colors and comprehensive keyboard/AT use | NOT RUN as full manual acceptance | Effective viewport reflow, semantic checks and scanners are partial evidence, not accessibility conformance. |
| Representative-device decoder memory/latency and sustained responsiveness | NOT RUN | Explicit allocation/search limits and one decode lease are not measured process-memory or human-perceived performance guarantees. |
| Licensed held-out natural photos, unsupported silhouettes and correction effort | NOT RUN | Synthetic fitting and pixel-error reduction do not establish useful reconstruction or an advantage over manual authoring. |
| Qualified sensory/content review, clinical efficacy and diagnostic validity | NOT RUN | Geometry, brightness, durations and resource caps are engineering limits, not medically safe thresholds or efficacy evidence. |
| Real participant collection and governed research analysis | GOVERNANCE BLOCKED | Operator, applicable ethics/privacy/security, instrument rights, protocol/statistics, retention/withdrawal/incidents and explicit activation remain required. |
| v0.8 release publication or hosting | NOT PERFORMED / outside this acceptance | Code review or merge does not imply publication, deployment, data collection or authorization for them. |

The bounded candidate can be evaluated as an offline engineering increment without pretending these gates are complete. No full-engineering-roadmap completion claim, treatment claim, efficacy ranking, permission expansion, sandbox weakening or collection authorization follows from this matrix.
