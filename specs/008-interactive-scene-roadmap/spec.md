# Specification: interactive scenes and responsible experience tools

Feature 008 · 20 October 2026 · Implementation authorized; acceptance evidence pending.

## Goal and scope

Make scene creation direct, precise and understandable, expand useful geometric composition, offer curated examples and a bounded local photo-approximation workflow, and support optional private reflection. Implement through the repository-local Spec-Kit sequence: specify → clarify → plan → tasks → analyze → implement → verify. This document is a requirement, not a claim that the capability exists.

The maintainer approved implementation and automated/visual testing of the researched roadmap. This does not authorize silently collecting participant reports, hosting a service, recruiting people, adding copyrighted instruments, installing packages, expanding repository permissions or claiming treatment efficacy. [Clarifications](clarifications.md), [plan](plan.md), [analysis](analysis.md) and [task map](tasks.md) define the staged boundary. Live statuses are only in the [project queue](../../project-queue.json).

## User stories and acceptance scenarios

### US1 — Select and move a scene item directly (P1)

As a scene author I can click/tap an eligible shape in the static live field, see its item panel, and drag it without reloading or using Apply merely to see its new position.

- Given an active valid static Live draft, a click selects the topmost eligible item and opens its inspector without changing its position or starting timing.
- Given a drag past a small documented movement threshold, the item's grab offset is preserved; validated X/Y values and pixels update together. The viewport cannot shift under the active pointer when the inspector opens.
- Releasing creates one draft-history operation; cancel restores the pre-gesture draft. Existing Apply, accepted-scene history and export semantics are not silently replaced.
- Escape/Hide, pointer cancellation or lost capture, import, mode change, resize and lifecycle interruption invalidate the gesture. No later callback changes or reveals the superseding scene.
- Background clicks, overlapping/hollow shapes, tiny items and non-primary pointers have documented policies; a semantic item list remains a reliable selection route.
- During timed playback, direct editing is disabled or explicitly stops/conceals before returning to edit mode. It never changes a playing snapshot in place.

### US2 — Edit without dragging and arrange layers (P1/P2)

As a keyboard, touch or precision user I can select an item semantically and move it through typed coordinates, tap-place and directional nudges. Text inputs keep their normal key behavior. Selection state, focus and coordinate announcements are clear but not noisy.

Later layer controls provide forward/back ordering, duplicate, lock and overlap cycling. Snap/guides/align are optional and visibly enabled; they cannot silently alter imported geometry. All methods reach the same validator and canonical coordinates. Hide/Stop remain reachable at 320 CSS-pixel widths and short landscape views; screenshots and actual interaction must establish this, not just `calc()` use.

### US3 — Compose with a broad bounded shape vocabulary (P2)

As an author I can choose useful parameterized families rather than search an impossible exhaustive list of every geometric shape. First expansion covers ellipse, rectangle/rounded rectangle, regular polygon and star, with independently specified dimensions/rotation and supported fill/stroke choices. Existing dot/pixel/circle/square/triangle files retain their meaning.

- Scene-v4 and sequence-v3 contracts identify new capabilities and preserve authored-canvas metadata across captures. Sequence snapshots with mismatched canvas contracts are rejected atomically. Unsupported capture must fail explicitly until the corresponding contract is available, never silently discard metadata. Unknown keys/versions/parameters fail closed; original legacy bounds are validated before migration.
- Each family has validation, deterministic geometry, bounds, hit testing, rendering, text description and round-trip fixtures.
- The 12-item cap and existing buffer limits remain until a separately justified measured change. Curves, arcs, rings, lines and bounded custom paths are follow-on registry entries, not raw SVG execution.
- A fixed authored-ratio option maps through a content rectangle with letterboxing. Old viewport-relative scenes remain unchanged. Bars are not selectable scene content; changing layout requires an explicit preview, not crop/stretch.
- Fixed ratio does not claim calibrated physical size, viewing distance or luminance.

### US4 — Try understandable original presets (P2)

As a new user I can browse static thumbnails and descriptions by item count, color count, symmetry, overlap and timing type. The initial authored catalog includes simple forms/spatial triplets, symmetric/displaced pairs, overlaps, sparse constellations and simple house/tree/boat/still-life compositions that fit the supported model.

Each preset has a stable ID, revision, provenance/license, description and validator result. Editing produces a derivative instead of falsely retaining an unchanged experimental stimulus identity. Presets do not auto-play, rank treatment effectiveness or imply prescribed exposure. Existing timing remains an explicit finite choice.

### US5 — Approximate a locally selected picture (P3)

As an author I can choose a supported local raster image, crop/focus it, select a palette and bounded complexity, and review an editable geometric approximation before applying it.

- PNG/JPEG are initial candidate formats; encoded bytes, dimensions, decoded pixels and work/output budgets are bounded separately. Unsupported animated formats, raw SVG/HTML, remote URLs and malformed inputs are rejected.
- Processing never transmits the image, filename or metadata; no original image data enters a scene export. Derived shapes may still disclose image content and are not called anonymous.
- Conversion occurs outside the interaction-critical path, with progress and cancellation. Fixed seed/iteration mode supports reproducible fixtures; incomplete results are identified rather than silently presented as canonical output.
- Result items are ordinary editable items and pass the shared validator. Original/result comparison has a textual equivalent. Apply is atomic and undoable; Discard leaves prior work unchanged.
- Hide, another import, a new edit or lifecycle change invalidates old results; completion cannot reveal a hidden field or begin timing.
- The current 12-item contour format supports at most sparse-sketch experimentation. Useful filled approximation depends on P2. It must outperform a relevant manual-authoring baseline in correction effort before being represented as useful; pixel error alone is insufficient.

### US6 — Record an experience privately (P4)

As a user I may record an optional session reflection without submitting it or creating an account. The editor works fully if I decline.

- Session-memory records distinguish external perception, visual persistence, voluntary imagery, nonvisual memory, comfort, preference and usability. None, uncertain, worse, not asked, skipped and technical interruption remain distinct.
- Optional baseline/post discomfort and early-stop fields do not infer causality or require re-exposure. Stop is immediate and never conditional on answering.
- Records may include exact scene revision/app rendering version and intended/actual visible timing, without original photos, full personal scene content or detailed device fingerprints by default.
- Journal export is separate from scene export, has an exact payload preview and explicit selection, and uses synthetic fixtures in tests. Clearing and page-close limitations are clear. No autosave, browser storage or transmission is added.
- Custom fields are exploratory, unvalidated measures. No questionnaire text is copied and no diagnostic/imagery-improvement score is generated.

### US7 — Understand future research submission without accidental collection (P5)

As a user I can understand that public submissions are not enabled. A bounded local contract/consent demonstration may show synthetic payloads and missing prerequisites, but has no endpoint, background queue or functional Send route.

Activation requires a named responsible operator, jurisdiction/population review, ethics determination/approval as applicable, licensed instruments, retention/withdrawal policy, security/deletion tests and a prespecified study/statistical protocol. Granular consent separates one-report submission, longitudinal linkage and recontact. Pseudonymous IDs do not guarantee anonymity, and irreversible anonymous aggregation cannot promise participant-specific deletion. Public issues/spreadsheets are not participant-report destinations.

## Invariants and explicit non-goals

- Preserve static startup and explicit conceal/resume authority, finite separate clocks, reduced-motion behavior, strict imports and self-contained runtime.
- Do not add unrestricted flashing, contrast inversion, loops, exposure escalation or afterimage induction prescriptions.
- Evaluate composed animation, not only individual pulse speed; existing engineering caps are not medical safety claims.
- Do not create efficacy leaderboards, automated diagnoses, webcam pupil tests, generative cloud image uploads, accounts or participant recruitment.
- Do not interpret all 64 review ideas as 64 immediate features. [Research mapping](research.md) consolidates overlaps and identifies empirical/governance deferrals.

## Success and evidence

Success means the implemented stage meets its functional contract and has exact-source regression, native-browser and inspected visual evidence, with limitations recorded. Baseline tests must remain intact. New interaction coverage includes non-primary pointers, capture loss, stale callbacks, invalid raw input, hidden state, resize and keyboard focus. Every new format has adversarial import and canonical round-trip coverage. Image and journal tests verify no network/storage leakage. Physical device, OS workflow, comprehensive assistive-technology and qualified scientific review remain separate gates unless actually performed.
