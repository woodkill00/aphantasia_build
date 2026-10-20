# Roadmap acceptance matrix

20 October 2026 · **Version 0.8 is unreleased. Bounded arrangement software checks passed; each final head requires full CI before protected integration.** See [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for the final-head outcome.

This is an evidence snapshot for the expanded candidate, not a claim that the full roadmap or all 64 proposals are done. It separates implemented and scoped software-tested behavior from deliberately deferred work, unperformed acceptance and governance-blocked collection. The [project queue](../../project-queue.json) remains the single live task/status register; this document does not replace it. The [fixed task map](tasks.md) defines the acceptance requirements, and [research traceability](research.md#all-64-proposals-mapped-to-the-single-queue) maps every E/S/I/R proposal to those IDs.

## Candidate and evidence identity

[PR 14 run 39423486474](https://github.com/woodkill00/aphantasia_build/actions/runs/39423486474) passed 935 Node checks, all 160 native Chrome groups and the clean-checkout package gate on source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76`. Independent visual review accepted 26 actual SHA-verified captures: all 22 arrangement frames and four rapid-release/focused-Undo frames. The run emitted 142 captures; this is not a claim that all 142 were manually inspected. Each final head must pass required CI before protected integration; consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome. Version 0.8 is unreleased.

| Item | Recorded identity or outcome |
| --- | --- |
| Current acceptance target | Unreleased session arrangement on `feature/011-session-arrangement`, source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76`, tested through merge checkout `a955a9bf939666cd491ac19382a5384f6185d903`. Runtime: 322869 bytes, SHA-256 `cab0383c23dbfbf03facc541a4ee2e714c485de529b35ef41698b7160e0b4d7f`. Final documentation changes do not modify these runtime bytes. |
| Historical expanded PR 12 target | Source head `198b0fcef2ee3919e556bb930f4afc778f543564`; locally inspected baseline `b157ba3d2441561edf7e2864376173a946af1a44`. These are historical identities, not the current tested arrangement source. |
| Historical baseline runtime | `imagery-app/index.html`, 276,388 bytes, SHA-256 `eea540762d2925b157c2672d1077809e8419c0b582399bf670c9ddbb23e634fa`. |
| Historical PR 12 regression | 737/737 Node checks recorded for the earlier candidate; not acceptance of the new gallery or optional provenance. |
| Historical PR 12 native outcome | 117 of 118 native groups passed. The mobile Undo failure prevents a clean native pass. Visually identified button-layout issues also required repair. |
| Repair/new-feature candidate | Chromium input tracing established fling-controller tap suppression; scoped canvas touchstart cancellation repaired P1. The arrangement run passed original 77.1 ms, rapid movable 32.6 ms and rapid locked 34 ms release paths with the first trusted Undo/Unlock and no fling activation/tap suppression or trace drops. |
| Current focused evidence | 935/935 CI Node checks and independent source/test-code review passed. The earlier local 935-test run and separate 114 focused/9 adversarial review cases remain distinct evidence, not additive suite totals. |
| Current native and visual acceptance | 160/160 native Chrome groups and package PASS. Independent scoped visual review accepted 26 SHA-verified actual captures: all 22 arrangement captures plus four rapid/focused-Undo captures. 142 emitted does not mean 142 manually inspected. PR 12 and PR 13 source/native/visual/package acceptance and merges are recorded separately; their earlier failures remain FAIL. |
| Documentation check | Local reconciliation checks PASS: 35 Markdown files / 235 local links/fragments, 935/935 Node tests and whitespace checks. Full final documentation-head CI and outgoing-tree review remain required. |
| Published distribution | The verified published package remains v0.7.0. It does not contain the new authored, image, gallery or journal/provenance features. No published v0.8 or hosted deployment is claimed. |

The [test report](../../imagery-app/test-results/TEST-REPORT.md) preserves component evidence, historical attempts and limitations. Independent model/DOM-double reviews and synthetic fuzz checks are useful, but not native rendering, browser decoding, physical-device, accessibility, empirical-usefulness or clinical evidence.

[PR 13 run 39423249334](https://github.com/woodkill00/aphantasia_build/actions/runs/39423249334), source `60143a989f3bc84e30028fb8f7ea1ba05f71741c`, passed 855 Node checks, 140 native groups and package verification. All 120 captures were byte/hash verified; 93 changed frames were actually inspected and 27 matched previously inspected bytes. Independent scoped visual review accepted it, and PR 13 merged as `13febfe2ea96958af0ab7661dc7f395ee530e225`. The [test report](../../imagery-app/test-results/TEST-REPORT.md) also records the accepted PR 12 retake and all original failed attempts.

## Status meanings

- **Scoped software PASS:** actual executed native checks and inspected frames passed for the named source and explicitly bounded scope. It does not establish a release, all-frame visual review, external-device/AT acceptance or full-roadmap completion.
- **Implemented / non-browser tested:** the bounded behavior exists in the candidate and falls within the recorded automated source/model/mock regression scope. It is not a final native or visual pass.
- **Partial / deliberately deferred:** a useful subset exists, but the full task acceptance requirement is not satisfied. The omitted capability remains visible rather than being counted complete.
- **Pending acceptance / NOT RUN:** required exact-source execution or inspection is not yet established. A prepared test or running CI attempt is not a pass.
- **Governance blocked:** software cannot authorize real research collection; external decisions and explicit activation are required.

## IF-045–061 acceptance matrix

Proposal families are summarized here for readability. The linked [64-proposal crosswalk](research.md#all-64-proposals-mapped-to-the-single-queue) is authoritative for individual codes; mapping a proposal is not implementing or accepting it.

| ID | Implemented and tested scope | Deliberately deferred or missing evidence | Acceptance disposition |
| --- | --- | --- | --- |
| IF-045 | Specification, clarifications, plan, constitution, 64-proposal traceability and analysis; this snapshot reconciles the tested arrangement source. | 64 mapped proposals are not 64 completed features; final documentation-head CI/outgoing-tree review. | Planning artifacts implemented; documentation reconciliation awaiting final-head gates. |
| IF-046 | Direct selection, thresholded drag/grab offset, immutable gesture target, rollback and bounded move history; original and rapid first-trusted-Undo native gates passed. | Physical input/device evidence and future changed-source regression. | Scoped source/native and selected direct-editor visual PASS. |
| IF-047 | Semantic selection, numeric/tap/nudge/keyboard alternatives, stable inspector and complete focused arrangement/Undo controls; native checks and selected actual frames passed. | Actual touch/pen devices, actual OS/browser zoom, comprehensive keyboard/screen-reader/AT audit. | Scoped software PASS; broader accessibility not accepted. |
| IF-048 | Scene-v4/sequence-v3, five ratios, letterbox mapping, unchanged legacy validation and atomic capture rejection; round-trip and current native regression passed. | Physical calibration and cross-engine/device behavior. | Bounded format/native scope PASS. |
| IF-049 | Ten closed shape families, dimension/rotation/fill/contour bounds, geometry, description and serialization; current native raster regression passed. | The staged PR 13 feature visual review passed; arbitrary paths, curves/arcs/rings/lines, text, 3D/fractals and exhaustive geometry remain deferred. | Bounded source/native scope PASS; no all-feature visual claim. |
| IF-050 | Reorder/duplicate/overlap, twelve original presets and bounded gallery; session full-record locks/Unlock all, replacement/history guards, drag/placement-only Off/1/5/10 snap and exact centering. All 22 arrangement captures inspected and accepted. | Equal-spacing distribution, visible editor-only grids/guides, grouping, persistent settings, broader catalogs; gallery review is recorded separately for accepted PR 13. | Bounded arrangement source/native/visual PASS; wider task remains partial. |
| IF-051 | PNG/JPEG header/decode and resource bounds, one decode lease, cooperative cancellation and stale-result/privacy guards; current native synthetic-image checks passed. | Representative-device process memory/latency, broader raster formats and worker-thread implementation. | Bounded source/native PASS; representative performance NOT RUN. |
| IF-052 | Repository-authored deterministic seeded rectangle/ellipse/triangle fitting with 3/6/12-item budgets, bounded search and canonical output; synthetic/fuzz fixtures. I/R approximation families. | Held-out licensed natural images, unsupported silhouettes, representative latency/cancellation metrics and a manual-authoring correction-effort/usefulness comparison. Pixel error alone cannot pass that gate. | Experimental prototype only; empirical usefulness NOT RUN, full task not accepted. |
| IF-053 | Crop/palette/ratio/seed, explicit Generate, hidden editable draft, image-replacement undo and export separation; current synthetic native workflow passed. | Manual anchors and empirical correction-effort/usefulness validation. | Bounded source/native PASS; empirical acceptance NOT RUN. |
| IF-054 | Closed journal-v2 and legacy v1 records, opt-in latest-ended fingerprint/version/mode/duration/end reason; current real-browser digest and interval regression passed. | Calibrated light dose, gaze/attention and binary renderer identity are not measured. | Bounded software provenance source/native PASS. |
| IF-055 | Initially-off 20-record session journal, exact selected preview, separate single-use download approval, clear/delete and no network/storage; current native regression passed. | Manual OS download usability and comprehensive AT. | Bounded source/native PASS; broader visual/external gates separate. |
| IF-056 | Disabled research information, closed local data boundary, separate prospective consent scopes and anonymity/deletion caveats. S/R submission-boundary families. | No functional consent/submission service, endpoint, live participant payload, upload queue, statistical analysis or efficacy leaderboard. Real-record submission is not a demonstration route. | Disabled explanatory subset implemented; operational collection intentionally absent. |
| IF-057 | Prerequisites documented: operator, population/jurisdiction, applicable ethics, rights, privacy/security, protocol/statistics, retention/withdrawal and explicit activation. S/R external-research families. | Those determinations/approvals, a governed service, incident handling, reviewed instruments/protocol and authorized deployment/collection. | GOVERNANCE BLOCKED. Software tests cannot close this gate. |
| IF-058 | 935/935 CI Node checks and 160/160 native groups on the recorded arrangement source; artifact identity, cancellation and cross-feature regression recorded. | Final documentation/test changes require fresh full exact-head CI; preserve all earlier failures. | Recorded source software PASS; each final head must pass required CI. |
| IF-059 | 160 native groups passed; 142 captures emitted; 26 actual SHA-verified frames independently inspected, all 22 arrangement plus four rapid/focused Undo. | Not all 142 manually inspected. Physical devices/pen, cross-engine/OS, actual zoom, AT and sensory review remain separate. | Arrangement scoped visual/native PASS, not universal or all-frame acceptance. |
| IF-060 | Main/user guides, architecture, feature guide, matrix and exact evidence reconciled without changing runtime; historical failures preserved. | Rerun offline docs/full Node checks, then final exact-head CI and outgoing-tree review. | Documentation reconciliation implemented; final-head gates remain required. |
| IF-061 | Independent source and assigned native/input/scoped-visual/package review accepted PR 14 source 47adabdd; no scoped arrangement blocker. | Final documentation-head CI, outgoing-tree review, protected integration; external gates remain separate. Earlier feature-increment visual reviews passed on their recorded sources. | Recorded scoped acceptance PASS; integration outcome is tracked in [PR 14](https://github.com/woodkill00/aphantasia_build/pull/14). |

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

## Exact-source executed evidence

These are observed results for source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76`, not acceptance of an untested later documentation head. Prior failed attempts remain in the test report and queue.

| Evidence | Recorded status | Exact scope |
| --- | --- | --- |
| Run and checkout | PASS | [Run 39423486474](https://github.com/woodkill00/aphantasia_build/actions/runs/39423486474), job 118630054300; test-merge `a955a9bf939666cd491ac19382a5384f6185d903`. Runtime 322869 bytes, SHA-256 `cab0383c23dbfbf03facc541a4ee2e714c485de529b35ef41698b7160e0b4d7f`. |
| Environment and commands | PASS | Node v22.23.3; Linux Chrome 155.0.8059.84; normal sandbox, synthetic local `file:` pages. `node --test imagery-app/tests/*.test.cjs`; `node imagery-app/tests/browser-cdp.cjs`. |
| Aggregate execution | PASS | 935/935 CI Node checks; 160/160 native groups, zero failures, 645.442 seconds; browser closed and temporary profile removed. |
| Image, journal/provenance and gallery | NATIVE PASS | Their actual synthetic native scenarios passed within the complete suite; this does not establish empirical usefulness. Separate earlier feature-frame review passed on the accepted PR 12/13 sources, not by claiming all 142 current frames were manually inspected. |
| Original and fast input paths | PASS | Mobile original 77.1 ms, rapid movable 32.6 ms, rapid locked 34 ms. First trusted Undo/Unlock passed without fling activation, tap suppression or trace drops. Locked canvas touchstart was consumed; Unlock touchstart was uncanceled. |
| Capture inspection | SCOPED PASS | 142 emitted; 26 actual SHA-verified captures inspected and accepted: all 22 arrangement plus four rapid/focused-Undo. No claim that all 142 were manually inspected. |
| Portable package smoke | PASS, NOT PUBLISHED | Exact allowlists, ZIP/CRC/checksums/metadata and identical HTML verified. ZIP SHA-256 `b4c3b91b8c97fbbf786522d7d45632cb29e369af70425688592412b5ed1ab58c`. |
| Final documentation head and protected integration | REQUIRED GATE | Each final head, including documentation and its assertion, must pass full CI and outgoing-tree review before protected integration. Consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome. |

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
