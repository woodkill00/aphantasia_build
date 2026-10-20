# One-pass snapshot sequence editor specification

Status: authorized implementation after independent scripted user journeys, actual screenshot review, design/coding discussion, and risk research on 2026-10-20. No claim of human-study, clinical or physiological acceptance.

## Purpose and explicit limits

Add ordered scene snapshots, configurable hold times and adjacent crossfades, single-pass Play, Pause/Resume, immediate Stop/Hide, manual step preview, and separate portable sequence JSON. This is ordinary presentation authoring, not treatment or an afterimage-induction regimen. Defaults are editable examples, not doses.

Prototype capacity: 1–32 nonempty steps, each 1–12 objects validated by the existing static model. Hold 1,000–600,000 ms; nonfinal transition 0–60,000 ms; both in 500 ms increments. Final transition is exactly zero. Total equals sum of holds and nonfinal transitions, at most 3,600,000 ms. Defaults: hold 3,000 ms and outgoing crossfade 1,000 ms. Zero transition is a direct cut with no intermediate blank frame. These are current supported engineering bounds, not medical thresholds. A crossfade may temporarily include two 12-object snapshots, up to 24 objects.

One shared background, including existing validated nonblack backgrounds, stays constant through playback. The first/last display change and composite patterns still need risk consideration. Snapshot playback has no automatic replay, nested item-pulse oscillator, strobe, contrast inversion or exposure escalation. The separate item timeline supports only the finite shared-clock opacity pulse specified in its own contract. Broader effect-curve authoring and output analysis remain separate future work; a warning is not medical clearance.

Timed playback is windowed-only with Pause and Stop kept reachable. Static/manual previews may use clean fullscreen. Fullscreen transitions conceal and cancel. Reduced-motion preference uses manual stepping; preference changes stop playback, never resume it.

## Current migration extension

Version 0.6 uses sequence version 2 to retain styled scene-version-3 objects and each step's `pulsePeriodMs`. Version 1 inputs are validated before migration with disabled effects/default item timing and a 4,000 ms period. Snapshot playback keeps its original single clock and renders items at static full opacity: per-item timing and pulse are preserved for loading a snapshot into the scene editor, not nested inside snapshot playback. See [the item specification](item-timeline.md).

## Historical version 1 portable schema

Root: format `imagery-field-sequence`, version `1`, sampler `ordered-crossfade-1`, sequence.
Sequence exact keys: name, background, steps.
Step exact keys: id, name, holdMs, transitionMs, objects.
Names use existing nonblank 1–64-character restrictions. Step IDs are unique within a sequence; object IDs are unique within each snapshot. Static version 2 files remain unchanged. No notes, playback state, URLs, expressions, callback names, loop flags or hidden capabilities.

Use canonical validation for all editing, capture, export and import. Reject unknown fields, accessors, holes, wrong types, invalid bounds, unsafe totals, decoded duplicate JSON keys and excessive depth. The 1 MiB UTF-8 import/document bound remains. Import is stopped/hidden.

## Reduced-click UI and observed improvements

Two independent native-browser journeys and 14 inspected frames found roughly 730px of scrolling between hue and Apply and a hidden-state decorative circle that resembled residual scene content. Implement compact Scene/Sequence section selection, a selected-step inspector instead of many expanded cards, reachable Apply/capture actions, and remove the decorative hidden-state ring. Preserve live color samples beside HSL sliders.

Valid sequence edits commit immediately while hidden/stopped. There is no Apply sequence button. Invalid raw timing/name inputs retain accepted data, show a precise error, and block Play/export/capture/structural edits.

Steps are immutable snapshots. Add/Replace is an explicit combined action when the static scene has edits: preflight both the scene and proposed sequence before committing either. Rejection preserves both accepted documents and scene history, while concealing. Later scene edits do not silently modify snapshots. First capture seeds the shared background; mismatched later backgrounds are rejected with an explanation. Load selected step into the scene editor makes a copy and blocks unresolved static edits. Scene undo history remains scene-only.

New final step transition becomes zero; a former final moved earlier receives default 1,000 ms. Other transition values stay unchanged. Validate the normalized candidate and announce adjustments; reject atomically on failure.

## Engine and display authority

Pure sequence engine: canonical validation/parser, compiled half-open timeline, deterministic frameAt and injected-clock state machine. No DOM, canvas, RAF, network, persistence or visibility setter.

UI: one existing scene visibility gate controls static Show, manual step Show and timed Play, preserving its repeat-action guard. Play requires valid accepted sequence and no unresolved static draft. A frame callback may draw only while the captured scene epoch and sequence generation match, the gate remains visible, and timed mode is running. It never calls Show or reveals content. At most one RAF is pending.

Pause freezes the last actually painted elapsed time and frame, not a newly sampled click-time blend. Pause does not hide the image. Resume is explicit. Stop/Hide/End/Escape, edits, imports, selection/mode changes, fullscreen, resize, blur, tab-hide, freeze, pagehide, restoration and reduced-motion changes cancel generation/RAF and conceal synchronously. No catch-up or automatic resume. Completion immediately hides black, resets elapsed, and never replays.

## Rendering and acceptance

Draw opaque scene A on main canvas and opaque scene B on one offscreen canvas, composite B at alpha t. Reset alpha/transform/compositing state each frame; do not accumulate previous pixels. Main plus offscreen allocations together must stay within 8,388,608 pixels with existing dimension/DPR caps, including resize. Both share aspect-correct geometry. No third full-size buffer.

Exact reference oracle: circle hold0–3s, circle→square crossfade3–4s, square hold4–7s, square→triangle crossfade7–8s, triangle hold8–11s, then hidden. Check half-open boundaries and 50% blends, overlapping shapes, 12+12 objects, direct cuts, maximum bounds, atomic failures, frozen painted-frame Pause, stale callbacks, every lifecycle cancellation, reduced motion, fullscreen interruption and independent scene/sequence/note exports. Tests must distinguish controlled-clock pixels, real scheduling, emulation and physical hardware.
