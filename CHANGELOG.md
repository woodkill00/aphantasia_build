# Changelog

User-visible changes are listed here. Version labels describe engineering increments, not a promise that a tagged Release or downloadable release asset exists. Exact test attempts, failures, environments and artifact hashes live in the [test report](imagery-app/test-results/TEST-REPORT.md).

## 0.8 — Unreleased; roadmap candidate under verification

- Direct click/tap selection, transactional live dragging, overlap cycling and non-drag numeric/tap/nudge/keyboard routes, with separate bounded draft move undo/redo.
- Explicit scene-v4 fixed-ratio authoring: ten bounded shape families, five ratios with letterboxing, rotation/fill/dimensions, layer reordering and four original editable presets. Legacy viewport scene-v3 behavior remains unchanged.
- Sequence-v3 preserves a shared authored canvas in every snapshot and rejects incompatible captures atomically; legacy sequence-v2 remains supported.
- Experimental local still PNG/JPEG approximation with header/decode budgets, a 3/6/12-item bounded cooperative search, crop/palette/seed controls, explicit Generate and hidden Use editable draft with one-step draft-replacement undo. No original-image export or upload; derived shapes can reveal content.
- Optional session-only journal, initially off, with 20-record bound, skipped defaults, selected exact export preview and separate approval. Scene/exposure provenance is explicitly unavailable in the UI. No storage, autosave or collection.
- Disabled research-submission information and governance prerequisites. No endpoint, operational Send route, real participant collection, statistics or efficacy claims.
- Spec-Kit traceability, independent model-review findings and [implemented/deferred feature guide](docs/roadmap-features.md). Locks/snap/align, fuller semantic galleries, richer paths/formats and empirical usefulness studies remain deferred.
- Exact-head native-browser CI, actual visual acceptance and final integrated review remain required. Scoped synthetic/model/mock evidence is not a whole-candidate pass; historical v0.7 evidence is not reused as acceptance. No 0.8 release or hosting is claimed.

## Unreleased documentation and distribution preparation

- Shorter getting-started path, a canonical user guide and task-based documentation index.
- Clearer Apply-versus-download, no-autosave and three-preview explanations.
- Troubleshooting, compatibility, contribution and public-report privacy guidance.
- Issue/PR templates, current synthetic examples and local portable-release preparation.
- Added the MIT License for repository-authored code, documentation and examples, copyright © 2026 woodkill00. Third-party research and attributed material retain their own rights and terms.
- Historical verification remains preserved; Release publication and hosting are separate decisions.

## 0.7 — 2026-10-20

- The starter scene opens in static live preview without a button click. Startup never starts fades, pulses or another timer.
- Background saturation supports 0–100%, with 60% still the default; the default new background is HSL 4°, 60%, 4%.
- Explicit per-item **Steady · no pulse** and **Pulse** choices make mixed timing easier to understand.
- One **Play items once** action switches an active static preview into finite item playback. Hide/cancellation still requires a fresh explicit reveal.
- Responsive precision controls and the compact phone-sized header were improved and checked in actual rendered frames.
- Current scene-v3/sequence-v2 files preserve backgrounds above 60% saturation. Original legacy validators and item/effect color bounds remain unchanged.

Merged on main; final scoped verification passed 457 code checks, 98 native Chrome groups and review of 78 captures. See [compatibility](docs/compatibility.md) for limits, not a blanket platform-support claim.

## 0.6 — 2026-10-20

- Added typed numeric slider values and fine-step minus/plus buttons.
- Added independently colored outlines and shadows, duplicate-item and start-after-previous helpers.
- Added per-item start/fade-in/hold/fade-out timing, overlap, finite automatic completion and optional shared-clock opacity pulse.
- Added timeline tracks and Pause/Resume/Stop behavior without nesting snapshot playback clocks.
- Introduced scene-v3 and sequence-v2 formats. Valid older files migrate with effects disabled and default timing; saved backgrounds and base appearance are retained.

## 0.5 — 2026-10-20

- Added actual live-draft editing without repeated Apply/Show actions while an explicit live session is active.
- Kept preview and inspector visible together and retained accepted-scene history/snapshot semantics.
- Invalid input and Hide stop/conceal the preview; correction alone does not reveal it. Version 0.7 later added one static startup reveal.

## 0.4 — 2026-10-20

- Added independent scene snapshots, atomic Apply/capture and direct sequence editing.
- Added ordered holds, adjacent crossfades/direct cuts, manual stepping and finite one-pass playback against a shared background.
- Added exact painted-frame Pause/Resume, reachable Stop/Hide and reduced-motion manual alternatives.

## 0.3 — 2026-10-20

- Added immediate HSL color samples/slider tracks and clean static/manual fullscreen with an accessible exit.

## 0.2 — 2026-10-19

- Added independent object editing, HSL colors/backgrounds, placement and scene-v2 files with strict older-scene migration.

## 0.1 — 2026-10-19

- Established the local self-contained static-scene prototype, explicit visibility controls, synthetic validation tests and separately selected optional-note exports.

## Continuing limitations

No autosave, accounts, backend or runtime network dependency. Timed playback is windowed, explicit and one-pass, not looping. Scenes, sequences, optional notes and optional journals are separate files. Physical devices, other browser engines, full accessibility and clinical/sensory validation remain unestablished. Software limits are not medically safe thresholds.
