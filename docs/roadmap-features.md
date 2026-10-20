# Interactive scene roadmap: implemented features and limits

20 October 2026 · Version 0.8 is **unreleased and under verification**. This is an implementation guide, not acceptance of every requirement in the roadmap. The published [v0.7.0 release](https://github.com/woodkill00/aphantasia_build/releases/tag/v0.7.0) does not include these features. No hosted service, new release, real participant collection or clinical readiness is claimed.

The [Spec-Kit specification](../specs/008-interactive-scene-roadmap/spec.md), [clarifications](../specs/008-interactive-scene-roadmap/clarifications.md), [plan](../specs/008-interactive-scene-roadmap/plan.md) and [task map](../specs/008-interactive-scene-roadmap/tasks.md) define intended requirements. The [public work register](../project-queue.json) is the single live status record. A source implementation, automated check, native run, rendered-frame review, human usability study and research-governance decision are different forms of evidence.

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

Layer buttons move an item backward/forward by one draw-order position. Duplicate creates an editable overlap with a fresh ID. Locking, snap, guides, align/distribute and grouping are not available.

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

The earlier PR 12 candidate recorded 737 passing Node checks and 117 of 118 native groups, not a clean native pass. A mobile Undo failure and visually identified button-layout issues have candidate repairs, but those repairs and the new gallery/provenance increment need exact-head native execution and inspected captures. Focused integrated provenance tests use real Node SHA-256 with DOM doubles; they are not native display-time evidence. Final exact-head regression, native-browser CI, integrated review and inspected rendered captures remain required for the expanded candidate. Planned native scenarios include actual synthetic PNG decode and an explicitly approved journal download, rather than only substituted decoders/DOM mocks. Do not count test code as an executed pass. Historical v0.7 results in [compatibility](compatibility.md) identify a different artifact.

Still separate or deferred:

- Arbitrary SVG/freeform paths/curves, arcs/rings/lines, text, 3D/fractals, larger item budgets and an exhaustive shape inventory.
- Lock/snap/guide/align/group tools and broader catalogs beyond the twelve original examples.
- Raster formats beyond PNG/JPEG, richer tracing/manual anchors, empirical natural-image and correction-effort usefulness acceptance.
- Native verification of optional display provenance, calibrated physical exposure/gaze measurement and governed research activation. The optional software interval summary is not a measurement of attention or light dose.
- Physical-device touch/pen, cross-engine and OS file workflows, actual zoom and comprehensive assistive-technology/accessibility acceptance.
- Qualified sensory/content review, clinical efficacy, diagnostic validity and participant research.

No read-only repository permission, normal browser sandbox or CI protection is relaxed by this documentation. No hosting, deployment, release publication or participant collection is authorized merely by implementing the roadmap.
