# Implementation plan

## Baseline and approach

Start from the reviewed self-contained v0.7 runtime and preserve its closed validation, finite separate clocks, static startup and concealment invariants. Source parts are authoritative; assemble `imagery-app/index.html` only with the existing assembler. No package installation or generated third-party starter is needed for this Spec-Kit process.

[Constitution](../../.specify/memory/constitution.md) → [specification](spec.md) → [clarifications](clarifications.md) → [research](research.md) → [tasks](tasks.md) → [analysis](analysis.md) → staged implementation and evidence. The [project queue](../../project-queue.json) owns live status. A stage is not complete simply because source files exist.

## P1: direct manipulation

First isolate pure coordinate mapping and hit-test behavior for existing shapes. Keep the actual content rectangle authoritative. Add a pointer state machine (idle, selected, pending gesture, dragging, canceled), capture ownership, movement threshold and generation guard. Maintain starting draft and grab offset; publish only validated draft moves. Separate one-operation draft gesture history from accepted Apply/history semantics. Keep keyboard/tap/numeric routes equivalent and prevent inspector reflow from shifting the active canvas.

Test pure geometry first, then DOM state/cancellation, then native pointer and keyboard behavior. Inspect desktop, narrow, short landscape and hidden-state frames. Do not expose transformations during timed playback.

## P2: geometry and presets

Freeze the new schema and authored-ratio contract before changing the renderer or converter. Build a closed registry with validation, canonical geometry, extents, draw instructions, hit tests and descriptions. Retain old validators and migrate explicitly. Add the first bounded families and fill/stroke/rotation/dimensions with matching controls and test fixtures. Preserve existing item count and buffer limits unless reviewed evidence says otherwise.

Layer/lock/overlap and optional snap/align operate on the same draft write path. Add original static presets with IDs/revisions, descriptions and provenance, not medical labels. New fixed-ratio layouts use letterboxing with mapped hit regions; old files remain viewport-relative. Test snapshot/item playback integration, round trips and invalid parameters at every boundary.

## P3: local image approximation

Prototype against synthetic supported scenes before natural-image claims. Validate selected raster file/decode dimensions, crop and palette; create bounded working pixels. Run bounded computation with progress, cancellation and stale-result generation checks. Produce only ordinary scene data, never imported SVG markup or remotely generated code. Review candidates before atomic Apply; no timer/reveal authority belongs to conversion.

Benchmark supported synthetic scenes, unsupported silhouettes and licensed held-out natural images separately. Measure memory accounting, main-thread responsiveness, cancellation, runtime, output validity and correction effort. No-go if output is invalid/noneditable, data leaks, cancellation fails, old results apply, allocation is unbounded, or manual creation is equally useful without the added complexity. A failed feasibility gate remains a documented prototype, not a production success.

## P4: private journal

Keep optional session-memory experience data in a separate closed schema/module. Use neutral categories and missingness states, versioned scene provenance and justified exposure-quality accounting. No autosave. Preview exact selected export bytes; clearing must remove session records and generated preview state. Scene/sequence exports exclude notes and journal content. No hidden collection occurs merely because a user edits or views.

Test no-network/no-storage, optional participation, separate exports, input bounds, missingness, local deletion and absence of diagnostic scoring. Qualified wording review remains distinct from code acceptance.

## P5: disabled submission contract

Document a minimal future submission payload and a local synthetic consent/payload review interface only if it helps demonstrate the contract. It must remain disabled without an endpoint, upload queue, credentials or external request. No public health reports, real participants or questionnaire reproduction.

Activation is outside this implementation until the responsible operator and applicable ethics/privacy/security/instrument/statistical gates are satisfied and deployment/collection is explicitly authorized. Preserve the distinction between voluntary local reflection and governed research.

## Integration and evidence

- Allocate one writer per shared source path; reviewers inspect exact frozen diffs.
- Run current dependency-free Node checks after changes; use synthetic fixtures and preserve failed attempts.
- Reassemble and hash the artifact. Run native Chrome with its normal sandbox and inspect actual screenshots; source arithmetic and DOM mocks do not close visual acceptance.
- Exercise actual supported portable-file behavior, not just a served page; record unavailable browsers/devices honestly.
- Update user guide, architecture, examples, test report, compatibility and queue with only observed facts.
- Integrate reviewed increments through required green checks. Release/hosting or participant collection is not implied by merging code.
- Any source repair repeats relevant evidence and final exact-head checks. Never weaken assertions or permissions to obtain a pass.
