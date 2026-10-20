# Interactive scene roadmap: implemented features and limits

20 October 2026 · Version 0.8 is **unreleased, with the bounded arrangement core tested**. This is an implementation guide, not acceptance of every requirement in the roadmap. The published [v0.7.0 release](https://github.com/woodkill00/aphantasia_build/releases/tag/v0.7.0) does not include these features. No hosted service, new release, real participant collection or clinical readiness is claimed.

The [Spec-Kit specification](../specs/008-interactive-scene-roadmap/spec.md), [clarifications](../specs/008-interactive-scene-roadmap/clarifications.md), [plan](../specs/008-interactive-scene-roadmap/plan.md) and [task map](../specs/008-interactive-scene-roadmap/tasks.md) define intended requirements. The [public work register](../project-queue.json) is the single live status record. A source implementation, automated check, native run, rendered-frame review, human usability study and research-governance decision are different forms of evidence.

## Feature 014 preparation snapshot

The 20 October 2026 flat-session-group candidate has reviewed source/model/DOM evidence, not native, actual visual, measured performance or clean-checkout CI package acceptance. Its prepared 224 native groups and 94 new captures have not run at this snapshot. Read the [exact report](../imagery-app/test-results/TEST-REPORT.md) and [group guide](../imagery-app/README.md#flat-session-groups-feature-014-candidate), not older successful workflows, for the changed runtime. Verified Feature 013 main and final exact-head checks remain integration requirements.

Select two or more ungrouped items and Group them; every later member selection expands to the complete group. Groups are rigid arrangement units, not layers or parent transforms. Align requires two units, equal gaps three; their shape/outline union includes internal empty space. Ungroup and explicitly select one member before individual editing/locking. Group/Ungroup is a metadata-only transaction in the existing bounded history, with immediate Hide and unchanged canonical schemas.

Groups are only for this editing session. Apply and downloads do not save them. Loading, Discard, accepted-scene history or reload clears them. A successful Discard with any existing group clears all groups and selects the first accepted item; without groups, a valid prior singleton is preserved.

## Start without changing legacy files

Open the development source's `imagery-app/index.html` locally. The starter appears as a static Live preview, never timed autoplay. Hide/End/Escape conceal; later edits or delayed callbacks must not reveal it again. Explicitly resume when wanted. There is no autosave.

- Keep a legacy viewport scene if you want the old coordinate/layout behavior. Existing v1/v2 inputs are validated under their original bounds and migrate to scene-v3, not authored v4.
- **Convert this draft to fixed ratio** keeps the draft's items but starts a square authored layout. Review changed proportions before Apply.
- **New fixed-ratio scene** starts a new single-point square draft. It is not a conversion that preserves the old staged composition.
- Fixed ratios are 1:1, 4:3, 3:4, 16:9 and 9:16. The full canvas fits with black letterboxing rather than crop/stretch. Margins are not content or placement targets.
- **Apply changes** accepts a scene in this page; **Download scene JSON** requests a file. Apply is not disk saving. Confirm the file in Downloads before closing.

Fixed ratio preserves an authored composition, not calibrated physical size, viewing distance, brightness or luminance. Shape/count/color/timing/resource limits are engineering restrictions, not medically safe thresholds.

## P1: direct and equivalent editing

Click/tap selects the topmost eligible item; drag past a 4 CSS-pixel threshold to move it while preserving the grab offset. Release records one draft move. Pointer cancellation, capture loss, changed layout, Hide/Escape/import or lifecycle interruption cancels and rolls back the active gesture. Timed playback and fullscreen viewing are not direct-editing surfaces.

Hollow interiors count as targets; shadows and letterbox bars do not. Small hit tolerance aids thin/tiny shapes. Use the semantic object selector or **Select next overlapping item** for ambiguous overlap. Numeric coordinates, tap-place, four directional buttons and focused-preview arrow keys offer non-drag routes. Shift+arrow uses 0.1 instead of 1 position unit; text inputs keep normal key behavior.

**Undo move** / **Redo move** are a separate 40-entry draft history and conceal the preview. Other edits reset that history. They do not replace applied-scene Undo/Redo or Apply. See the [direct-editing guide](../imagery-app/README.md#direct-preview-editing).

## P2: bounded geometry, layers and twelve original examples

Authored scene-v4 adds ellipse, rectangle, rounded rectangle, polygon and star alongside dot, pixel, circle, square and triangle: ten finite families, not every mathematical shape. Dimensions, rotation, body fill/outline, polygon/star parameters and original effects/timing pass the shared closed validator. Width/height are bounded by family; unsupported fields, arbitrary paths, markup and nonfinite values are rejected. The [architecture](architecture.md#authored-scene-v4-and-sequence-v3-contract) records exact ranges.

Layer buttons move an item backward/forward by one draw-order position. Duplicate creates an editable overlap with a fresh ID. Session locks, snap and centering are the implemented fourth increment, with scoped native/visual acceptance described below. Later candidates add separately specified editor aids, multi-selection/equal gaps and flat session groups; the earlier fourth-increment evidence does not accept those changes.

The **Original preset gallery** begins as a text-only list of twelve original MIT examples. Filter by item count, item color count, vertical symmetry, geometric overlap and authored timing. Color count excludes the shared background and disabled effects; symmetry includes colors; overlap includes containment as well as crossing shapes. These are descriptive filters, not clinical outcomes or a recommended order.

| Examples | What they demonstrate |
| --- | --- |
| Balanced contours; Spatial triplet | Simple forms and separated spatial arrangements. |
| Sparse symmetric points | A sparse five-point constellation. |
| Symmetric pair; Displaced pair | Equal circles with and without vertical reflection. |
| Overlapping contours | A circle and square with intersecting geometric regions. |
| Simple house; Simple tree; Simple boat; Small still life | Bounded original compositions built only from ordinary editable shapes. |
| Sequential shapes; Mixed steady and pulse | Existing finite timing choices; static thumbnails show all items without running timing. |

Each entry has a stable ID, revision 1, description, original provenance, MIT license, counts and shared-validator result. The four original scene payloads remain unchanged. Editable exports deliberately omit catalog identity, so an edited derivative cannot claim to be an unchanged experimental stimulus.

**Show static thumbnails** is a separate explicit opt-in. At most twelve 64×48-pixel canvases are allocated, without DPR multiplication: 36,864 pixels total, or 147,456 RGBA bytes, separate from the existing main/offscreen scene buffers. Hide/End/Escape, filter changes and page interruptions conceal them and shrink their backing stores to 1×1. Nothing automatically re-enables them. Thumbnails use validated geometric paths, not arbitrary SVG/markup, remote assets or animation. **Use draft** stages an editable composition while hidden; Live preview, Apply, download and optional timed playback remain separate actions.

Scene-v4 uses explicit authored canvas metadata. Sequence-v3 repeats the shared canvas in every snapshot and rejects any mismatch. Legacy sequence-v2 remains viewport-relative. An incompatible format family, background or ratio cannot silently alter either document on capture. Snapshot sequence playback still uses its own holds/transitions, not nested item clocks. The published v0.7 app cannot open authored v4/v3 files; keep original files if compatibility matters.

### Fourth increment: session lock, snap and center contract

**Implemented; scoped source, native, visual and package checks passed.** This is a bounded extension of IF-050, not a new released feature or evidence that the whole roadmap is complete. Each final head must pass required CI before protected integration; consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome.

Locks protect the selected item's complete stored record for this session: geometry, position, appearance and its own timing. They do not freeze background, canvas proportions, shared pulse period, other items or the final composite. A locked topmost item stays selectable but cannot be dragged; text identifies its lock. A duplicate is a new unlocked independent copy. Unlock all is always available, as are Hide/Stop/End/Escape and ordinary exports.

Apply and snapshot Add/Replace retain locks. Accepted-scene Undo/Redo are disabled with an explanation while any lock remains. Draft move history and Discard preflight the resulting scene and reject any change/removal of locked records without consuming history. Successful whole-scene replacement clears locks with notice; rejected/canceled/stale replacements retain them. Sequence import alone does not replace the editor scene or clear locks, but successful Load step does. The [user guide](../imagery-app/README.md#session-locks-and-arrangement) lists all replacement routes.

Snap starts Off, with 1/5/10 normalized-content-unit choices for drag and tap-placement only. It preserves the grab offset and chooses a feasible grid position within geometry/effect bounds; letterbox taps remain invalid. Changing snap does not reposition an item. Typed X/Y, nudges, keyboard movement and Center horizontally/vertically/both remain exact and unsnapped. Centering sets the intended axis or axes to 50 in one validated draft-move operation, with no history entry for a no-op and no implicit Apply or reveal.

Lock/snap changes cancel active gestures/placement and invalidate stale editing results. Session controls add no scene fields, saved preferences, grid pixels or clocks. Toggling them with no active gesture must leave the canonical scene fingerprint unchanged. Distribution, grids/guides and grouping are not part of this increment. The [acceptance matrix](../specs/008-interactive-scene-roadmap/tasks.md#if-050-fourth-increment-acceptance-matrix) requires exact-source model/UI/native checks and inspected captures.

## P3: local raster approximation, deliberately experimental

**Open local image tools** is optional. Choose only a still PNG/JPEG, at most 8 MiB encoded, 4096 pixels on either side and 8,388,608 decoded pixels. Header preflight precedes browser decoding, and oriented dimensions are checked again. Animated PNG, GIF, SVG, malformed/over-budget inputs and remote URLs are not accepted. Only a thumbnail of at most 128 pixels per side is retained after successful intake.

Choose a 3/6/12-item maximum, seed, canvas ratio, palette and numeric crop. The crop is contained without stretching; no subject recognition or automatic semantic crop is promised. Explicit **Generate candidate** fits a small 48-pixel-longest-side working raster, with at most 384 candidates per item. Cooperative main-thread slices yield between bounded batches; this is not a background worker or a real-time performance guarantee.

Generation leaves scene work unchanged. Review the textual shape list/error summary. **Use editable draft** stages ordinary filled rectangle/ellipse/triangle items, still hidden and uncommitted. Resume Live preview explicitly to inspect/edit, Apply to accept, then download to keep. The candidate may contain fewer than the selected maximum, including no items if none improves the bounded fit. There is no automatic reveal, timing or file save. **Undo image draft replacement** restores the previous valid draft/selection while hidden, until another scene edit clears that one-step replacement history. Invalid existing fields block replacement. This is separate from move undo and accepted-scene history.

**Cancel / discard candidate** does not change the scene. **Clear source** also discards its retained thumbnail and resets options. **Show source thumbnail** is an explicit separate display action; it cancels a candidate and Generate hides it again. Hide, End, import, new edits and page interruption invalidate work; stale completion cannot apply or reveal. A cancelled file/decode still has to finish releasing its resource before another intake can begin.

The original image, filename and metadata do not enter scene/sequence exports. There is no upload, cloud model, storage or telemetry. Derived shapes can still disclose image content and are not anonymous. Browser/OS caches and backups remain outside secure-deletion guarantees. See the [workflow](../imagery-app/README.md#approximate-a-local-picture) and [resource ledger](architecture.md#local-image-resource-and-cancellation-contract).

Normalized RGB error is an algorithm diagnostic, not a semantic-quality score, useful-correction-effort result or imagery outcome. Synthetic model fixtures are not held-out natural-image evaluation. Natural-image/unsupported-silhouette benchmarks, representative-device latency/memory measurements and manual-authoring correction-effort comparisons remain open. Do not advertise this prototype as useful photo reconstruction merely because its pixel error decreases.

## P4: optional private reflections

The session journal is off initially. Enabling it does not create records; only **Add reflection to session** does. Each answer defaults to Skipped, and missingness choices remain distinct. External perception, visual persistence, voluntary imagery, nonvisual memory, comfort, discomfort, early stopping, preference and ease of use are separate custom exploratory descriptions. No score, validated questionnaire or causal/efficacy inference is generated.

At most 20 records stay in page memory, with up to 2,000 characters per optional note. A second, initially unchecked option, **Include optional scene fingerprint and visible duration in future reflections**, enables provenance for subsequent successfully rendered main-field displays. It does not reconstruct earlier viewing, track source/gallery thumbnails, or create a reflection automatically.

Only the latest ended display interval can be attached after its SHA-256 digest is ready. Static/item displays fingerprint the canonical scene; a timed sequence fingerprints the whole canonical sequence, while a manually shown sequence step fingerprints that step as a scene. The record includes format/version, renderer version, mode, planned duration where applicable, foreground-visible duration and end reason. Paused frames remain visible and count, so visible duration can exceed planned playback duration. A new displayed edit begins a new interval, not a cumulative session total.

While disabled, active, pending, failed or unavailable, provenance fields are **unavailable**; no older result is substituted. Opt-out or Clear discards retained provenance and invalidates late digest completion. The renderer label `0.8.0-dev.provenance1` is a version identifier, not a binary hash. The fingerprint describes canonical document bytes, not rendered pixels or anonymity. No timestamp/epoch, source picture, full scene content or device identifier is exported. These engineering durations do not measure gaze, attention, light dose, comfort or efficacy. See the [exact provenance contract](architecture.md#optional-display-provenance-contract).

Select records, preview the exact journal-v2 JSON, approve that particular payload separately, then request **Download approved journal JSON**. Selection/edit changes invalidate preview/approval; each download needs fresh approval. Added records are not automatically selected. Turning the journal off clears unfinished answers but keeps added records; delete/clear removes page records, not already downloaded files. There is no autosave, storage, import or transmission. Journal files are separate from scene, sequence and single-note files and may contain private information. See the [journal guide](../imagery-app/README.md#private-session-journal).

## P5: research remains disabled

The UI explains why research submission is not available. It has no endpoint, working Send control, upload queue, live participant payload, statistical analysis or efficacy leaderboard. Opting into local journaling or downloading a file is not research consent.

Real collection needs a responsible operator, applicable population/jurisdiction and ethics determination, instrument rights, privacy/security review, reviewed protocol/statistical plan, retention/deletion/withdrawal and incident rules, and separate explicit authorization. Any future one-report, longitudinal linkage and recontact scopes need distinct consent. Pseudonymous data is not necessarily anonymous; irreversible anonymous aggregation cannot promise deletion of one person's report. Public issues/spreadsheets are not participant-report destinations.

## Verification and deferred work

Independent component reviews identified and prompted repairs to direct-edit transaction identity/overlap caching, rotated-edge coordinate quantization, adversarial typed-array/closed-field validation, image cancellation across app actions and overlapping decode resource ownership. Their model, fuzz and DOM-double results are summarized in [analysis](../specs/008-interactive-scene-roadmap/analysis.md); they are not native or human-study evidence.

A historical gallery/provenance candidate, PR 13 head `65c96ebcae397884deb032d9bc430ddad61d68b7`, passed 830 Node checks and 135 of 136 native groups in [run 39415125146](https://github.com/woodkill00/aphantasia_build/actions/runs/39415125146). Immediate mobile drag-to-Undo still failed, so overall native acceptance failed and packaging was skipped. All 116 actual capture payloads matched their hashes/lengths and were inspected; the repaired whole gallery group and focused Undo controls were visible. The six new gallery/provenance groups per emulated device passed, including native pixels, real browser SHA-256 and exact local journal download. This is scoped Linux Chrome evidence, not overall acceptance or evidence for new lock/snap/center code.

[PR 14 run 39423486474](https://github.com/woodkill00/aphantasia_build/actions/runs/39423486474) passed 935 Node checks, all 160 native Chrome groups and the clean-checkout package gate on source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76`. Independent visual review accepted 26 actual SHA-verified captures: all 22 arrangement frames and four rapid-release/focused-Undo frames. The run emitted 142 captures; this is not a claim that all 142 were manually inspected. Each final head must pass required CI before protected integration; consult [PR 14 checks](https://github.com/woodkill00/aphantasia_build/pull/14/checks) for its outcome. Version 0.8 is unreleased. The original mobile Undo defect was diagnosed as Chromium fling-controller tap suppression and repaired in P1; the arrangement run retested original and fast movable/locked paths. Prior PR 11/12/13 failures remain failures. PR 12 source 61c0480baaaf4503209172b9154e1071e61baf37 passed 764 Node checks, 128 native groups, package verification and scoped visual review, and merged as b5fd8d8cb5728f31e0dd34ad449c0820a71588e7. All 108 captures were hash-verified; 19 changed frames were inspected and 89 matched previously inspected bytes. [PR 13 run 39423249334](https://github.com/woodkill00/aphantasia_build/actions/runs/39423249334), source `60143a989f3bc84e30028fb8f7ea1ba05f71741c`, passed 855 Node checks, 140 native groups and package verification. All 120 captures were byte/hash verified; 93 changed frames were actually inspected and 27 matched previously inspected bytes. Independent scoped visual review accepted it, and PR 13 merged as `13febfe2ea96958af0ab7661dc7f395ee530e225`. Historical v0.7 results in [compatibility](compatibility.md) identify a different artifact.

Still separate or deferred:

- Arbitrary SVG/freeform paths/curves, arcs/rings/lines, text, 3D/fractals, larger item budgets and an exhaustive shape inventory.
- Visible editor aids, multi-selection/equal gaps and flat session groups have separately scoped implementations and evidence; the current group runtime still requires native/visual/performance/package/CI acceptance. Persistent lock/snap/group settings, nesting, editable group names, merging, isolation and broader catalogs remain deferred.
- Raster formats beyond PNG/JPEG, richer tracing/manual anchors, empirical natural-image and correction-effort usefulness acceptance.
- Provenance native regression passed on the recorded arrangement source; broader feature visual review remains separate. Calibrated physical exposure/gaze measurement and governed research activation are not established. The optional software interval summary is not a measurement of attention or light dose.
- Physical-device touch/pen, cross-engine and OS file workflows, actual zoom and comprehensive assistive-technology/accessibility acceptance.
- Qualified sensory/content review, clinical efficacy, diagnostic validity and participant research.

No read-only repository permission, normal browser sandbox or CI protection is relaxed by this documentation. No hosting, deployment, release publication or participant collection is authorized merely by implementing the roadmap.
