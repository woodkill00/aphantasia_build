# Roadmap acceptance matrix draft

20 October 2026 · **Version 0.8 is unreleased. Final engineering acceptance is pending.**

This is an evidence snapshot for the expanded candidate, not a claim that the full roadmap or all 64 proposals are done. It separates implemented and non-browser-tested behavior from deliberately deferred work, unperformed acceptance and governance-blocked collection. The [project queue](../../project-queue.json) remains the single live task/status register; this document does not replace it. The [fixed task map](tasks.md) defines the acceptance requirements, and [research traceability](research.md#all-64-proposals-mapped-to-the-single-queue) maps every E/S/I/R proposal to those IDs.

## Candidate and evidence identity

| Item | Recorded identity or outcome |
| --- | --- |
| Current acceptance target | Unreleased gallery/provenance integration on `feature/010-gallery-provenance`; source/artifact identity must be frozen and refreshed after final integration. No earlier hash accepts this changed runtime. |
| Historical expanded PR 12 target | Source head `198b0fcef2ee3919e556bb930f4afc778f543564`; locally inspected baseline `b157ba3d2441561edf7e2864376173a946af1a44`. These are historical identities, not the current dirty source. |
| Historical baseline runtime | `imagery-app/index.html`, 276,388 bytes, SHA-256 `eea540762d2925b157c2672d1077809e8419c0b582399bf670c9ddbb23e634fa`. |
| Historical PR 12 regression | 737/737 Node checks recorded for the earlier candidate; not acceptance of the new gallery or optional provenance. |
| Historical PR 12 native outcome | 117 of 118 native groups passed. The mobile Undo failure prevents a clean native pass. Visually identified button-layout issues also required repair. |
| Repair/new-feature candidate | The mobile Undo input-delivery defect remains under investigation. A button-layout repair candidate is present, but exact-head native rerun and inspected rendered evidence remain pending. Test preparation is not repair verification. |
| Current focused evidence | Preset/gallery model and DOM checks pass; integrated provenance checks use real Node SHA-256 with DOM doubles. Final aggregate totals/hashes belong in the refreshed test report/summary, not copied from the historical candidate. |
| Current native and visual acceptance | PENDING / NOT RUN for this changed runtime. New gallery/provenance captures and repaired workflows must be executed and inspected. Historical planned counts of 118 groups/98 captures are not current observed totals. |
| Documentation check | PASS for this documentation draft: 35 Markdown files / 228 local links and fragments via `node scripts/check-docs.cjs`. Rerun after final integration; this offline check does not establish browser or visual acceptance. |
| Published distribution | The verified published package remains v0.7.0. It does not contain the new authored, image, gallery or journal/provenance features. No published v0.8 or hosted deployment is claimed. |

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
| IF-050 | One-layer reorder, duplicate and overlap cycling; twelve original revisioned MIT examples, shared validation, text-first descriptive filters and opt-in bounded static thumbnails, including house/tree/boat/still life. | Locks, snap, guides, align/distribute, groups and broader catalogs; current gallery native/visual acceptance. | Bounded gallery implemented / model and DOM tested; layer-tool task remains partial and native/visual acceptance pending. |
| IF-051 | PNG/JPEG header/decode bounds, thumbnail/work budgets, cooperative cancellation, stale-result guards, single read/decode lease and local-only data path; malformed/adversarial/mock tests. E/I/R resources and privacy families. | Actual browser decode/orientation/resource release on the exact head; representative-device peak memory/latency. No worker-thread implementation or broader raster formats. | Bounded foundation implemented / non-browser tested; native/performance acceptance pending. |
| IF-052 | Repository-authored deterministic seeded rectangle/ellipse/triangle fitting with 3/6/12-item budgets, bounded search and canonical output; synthetic/fuzz fixtures. I/R approximation families. | Held-out licensed natural images, unsupported silhouettes, representative latency/cancellation metrics and a manual-authoring correction-effort/usefulness comparison. Pixel error alone cannot pass that gate. | Experimental prototype only; empirical usefulness NOT RUN, full task not accepted. |
| IF-053 | Numeric crop, palette/ratio/seed, explicit Generate, textual candidate review, hidden Use editable draft, one-step image-draft replacement undo and explicit Apply/download separation; stale candidate tests. I/R review and control families. | Actual synthetic-image decoder → draft → edit/undo/download browser journey and rendered source/result review. Manual anchors and empirical correction-effort validation are deferred. | Implemented bounded workflow / non-browser tested; native and empirical acceptance pending. |
| IF-054 | Journal-v2 closed neutral schema, legacy v1 record validator, unavailable defaults and separately opt-in latest-ended canonical document fingerprint, renderer version, mode, planned/visible duration and end reason. Real Node SHA-256 integrated checks use DOM doubles. | Exact-head browser digest/visibility/interruption checks; calibrated light dose, gaze/attention and binary renderer identity are not measured. | Bounded software provenance implemented / non-browser tested; native acceptance pending. |
| IF-055 | Initially off, optional session-only journal; 20-record limit, skipped defaults, exact selected preview, separate single-use approval/download, clear/delete and no storage/network; synthetic model/UI tests. S/R local-reflection families. | Exact-head native journal Blob download, focus/keyboard and responsive rendered workflows. Physical OS download usability and full accessibility. | Implemented / non-browser tested; native/visual acceptance pending. |
| IF-056 | Disabled research information, closed local data boundary, separate prospective consent scopes and anonymity/deletion caveats. S/R submission-boundary families. | No functional consent/submission service, endpoint, live participant payload, upload queue, statistical analysis or efficacy leaderboard. Real-record submission is not a demonstration route. | Disabled explanatory subset implemented; operational collection intentionally absent. |
| IF-057 | Prerequisites documented: operator, population/jurisdiction, applicable ethics, rights, privacy/security, protocol/statistics, retention/withdrawal and explicit activation. S/R external-research families. | Those determinations/approvals, a governed service, incident handling, reviewed instruments/protocol and authorized deployment/collection. | GOVERNANCE BLOCKED. Software tests cannot close this gate. |
| IF-058 | Historical PR 12 recorded 737 passing Node checks. Current gallery/provenance focused checks add metadata, cancellation, opt-out, exact digest and visible-interval coverage with synthetic DOM doubles. | Final frozen-source aggregate counts/hashes, native composed pixels/timing, browser decoding/downloads and evidence reconciliation. Preserve intermediate failures. | Focused non-browser checks pass; current aggregate and cross-feature acceptance pending final refresh. |
| IF-059 | Historical PR 12 passed 117/118 native groups, with a mobile Undo failure; visual button-layout findings prompted candidate repairs. New gallery/provenance tests/captures are being integrated. | Exact-head clean rerun, verified actual captures and rendered inspection of repairs and additions. Physical devices, pen, cross-engine, OS workflows, actual zoom, comprehensive AT and qualified sensory review remain NOT RUN. | Historical attempt incomplete; current-head native/visual acceptance pending. |
| IF-060 | Main/user guides, architecture, feature/deferred-work guide and acceptance matrix describe twelve examples and separate opt-in journal-v2 provenance; old v0.7 distribution/evidence remain historical and intact. | Exact final aggregate/native/visual outcome, environment, hashes, reviewed captures and outgoing-tree reconciliation. Rerun local documentation checks after integration. | Documentation updated; final evidence reconciliation pending. |
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

### Twelve original presets

| Stable ID | Revision | Title | Authored timing type |
| --- | --- | --- | --- |
| `balanced-contours` | 1 | Balanced contours | `steady` |
| `symmetric-points` | 1 | Sparse symmetric points | `steady` |
| `sequential-shapes` | 1 | Sequential shapes | `sequential-fades` |
| `mixed-steady-pulse` | 1 | Mixed steady and pulse | `mixed-steady-pulse` |
| `spatial-triplet` | 1 | Spatial triplet | `steady` |
| `symmetric-pair` | 1 | Symmetric pair | `steady` |
| `displaced-pair` | 1 | Displaced pair | `steady` |
| `overlapping-contours` | 1 | Overlapping contours | `steady` |
| `simple-house` | 1 | Simple house | `steady` |
| `simple-tree` | 1 | Simple tree | `steady` |
| `simple-boat` | 1 | Simple boat | `steady` |
| `still-life` | 1 | Small still life | `steady` |

All twelve use original repository-authored geometric content and MIT provenance; no external picture or questionnaire is included. The original four scene payloads are unchanged. The text-first gallery filters item/color counts, vertical symmetry, geometric overlap and timing, not clinical outcomes. Only Show static thumbnails enables up to twelve static 64×48 canvases: 36,864 pixels or 147,456 RGBA bytes without DPR scaling. Invalidation conceals them and shrinks backing stores to 1×1; filters, callbacks and restoration cannot re-enable them. Their editable scene exports do not retain a claim of immutable stimulus identity. Choosing a preset never starts timing. Static startup is not timed autoplay; item timing and snapshot sequences remain separate finite explicitly started clocks.

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

The selected export is JSON with the following exact closed fields. The initial UI is unchecked/off; no reflection is saved until Add reflection. All optional answers default to `skipped`.

| Level | Exact fields and values |
| --- | --- |
| Root | `format: "imagery-private-journal"`, `version: 2`, `purpose: "private-exploratory-reflection"`, `entries`. |
| Each `entries` item | `id` and `reflection`. IDs use the local `entry-1` style; they are not participant identities. |
| Each `reflection` | `scene`, `exposure`, `experiences`, `comfort`, `symptoms`, `stoppedEarly`, `preference`, `easeOfUse`, `note`. |
| `scene` in the integrated UI | Default/pending/failure: exactly `{status: "unavailable"}`. After separate opt-in and the latest ended display digest is ready: `status`, `format`, `version`, `sha256`, `rendererVersion`. |
| `exposure` in the integrated UI | Default/pending/failure: exactly `{status: "unavailable"}`. Eligible latest-ended interval: `status`, `mode`, `plannedMs`, `visibleMs`, `interrupted`, `endedReason`. |
| `experiences` | Exactly `perception`, `afterimage`, `voluntaryImagery`, `nonvisualMemory`; each one of `not-asked`, `skipped`, `none`, `uncertain`, `present`. |
| `comfort` | Exactly `before`, `after`; each one of `not-asked`, `skipped`, `uncertain`, `comfortable`, `mild-discomfort`, `moderate-discomfort`, `severe-discomfort`. |
| `symptoms` | Exactly `eyestrain`, `headache`, `dizzinessNausea`, `distress`, `otherDiscomfort`; each one of `not-asked`, `skipped`, `none`, `pre-existing`, `new-or-worse`, `uncertain`. |
| `stoppedEarly` | One of `not-asked`, `skipped`, `uncertain`, `no`, `yes`. |
| `preference` | One of `not-asked`, `skipped`, `uncertain`, `disliked`, `neutral`, `liked`. |
| `easeOfUse` | One of `not-asked`, `skipped`, `uncertain`, `difficult`, `neither`, `easy`. |
| `note` | Plain string, at most 2,000 JavaScript string code units, with the model's control/direction-override exclusions. No required note. |
| Capacity/export bound | At most 20 page-memory records; selected export at most 131,072 UTF-8 bytes. |

The separate provenance checkbox defaults off. It hashes only subsequent successfully rendered foreground main-field displays, not selected/staged data or source/gallery thumbnails. Static/item mode fingerprints the canonical scene; a shown step fingerprints that step as a scene; timed sequence mode fingerprints the whole canonical sequence. The renderer label `0.8.0-dev.provenance1` is a version identifier, not a binary hash. Paused frames remain visible and count, so visible duration may exceed planned duration. At most the latest ended interval is attachable; active, pending, failed and unavailable states never substitute an older result. Existing reflections are not retroactively populated.

The tracker bounds one active and one latest completed metadata record, one in-flight digest and one replaceable latest queued canonical input, each input at most 1 MiB. Opt-out/Clear discard retained state and revoke stale completion; a browser digest already in flight may finish but cannot reattach. No epoch/timestamp, original image, full scene, device identifier, internal generation token, score or research-consent token is exported. Visible time is not gaze, attention, light dose or a safety measure. Fingerprints and optional notes are not anonymous. See the [detailed contract](../../docs/architecture.md#optional-display-provenance-contract).

Export requires selected entries, an exact current payload preview, a separate explicit approval and a Download action. Edits/selection changes invalidate approval; one download consumes it. Scene, sequence and ordinary note files exclude the journal. Turning participation off clears unfinished answers, not added entries; Clear removes page records/answers/preview, not files already downloaded. There is no autosave, browser storage, import, background submission or endpoint.

## Exact-head native evidence placeholders

**Do not replace these placeholders from expected counts, test source, Node mocks or historical CI.** A running CI attempt is not a completed outcome. Enter actual run/source/environment/command results, preserve failures, verify emitted artifact/capture identities and inspect the actual images before recording PASS.

| Required evidence | Recorded acceptance status | Details to fill only after verification |
| --- | --- | --- |
| Native run identity and tested checkout | NOT RUN | Verified run/job URL, PR source head, actual test-merge/checkout head, exact artifact SHA-256 and byte count. |
| Runtime environment and commands | NOT RUN | Actual Node/browser versions, OS, ordinary sandbox state, `file:` opening route and full invoked commands. |
| Native groups | NOT RUN | Actual passed/failed/skipped/blocked totals, duration, exit status and cleanup outcome. Record the current suite count; 118 groups belongs to the historical PR 12 attempt. |
| Actual PNG decode → candidate → editable draft/undo/export | NOT RUN | Real synthetic fixture decode and resulting canonical output; do not substitute the model/mock decoder checks. |
| Actual journal-v2 download and optional provenance | NOT RUN | Exact selected approved Blob payload, browser digest of the displayed scene/whole sequence, paused-visible duration, unavailable/pending/opt-out behavior and stale export rejection; synthetic reflections only. |
| Actual preset gallery | NOT RUN | Text-only default, descriptive filters, static thumbnail opt-in, resource bounds, Hide/End/Escape/lifecycle invalidation, draft-only staging and inspected narrow/short layouts. |
| Capture integrity | NOT RUN | Actual emitted count, filenames, byte lengths and SHA-256 verification. Record the current expected/actual capture counts; the historical 98-capture plan is not evidence for this runtime. |
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
