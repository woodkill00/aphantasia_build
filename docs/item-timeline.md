# Item appearance and finite timeline specification

Version 0.6 candidate, 2026-10-20. This document specifies the requested editor increment; implementation, native-browser verification and release acceptance are separate gates. It is not evidence of clinical efficacy, sensory safety or accessibility conformance.

## Editing experience

One selected-item inspector combines geometry, appearance and timing. Keep the actual scene canvas visible beside or above the controls. Use compact expandable Appearance and Timing sections rather than displaying every item as a large form.

- New starter scenes and presets use background HSL **4°, 60%, 4%**. Imported scenes retain their saved background; migration never replaces it with a new default.
- Each slider has an always-editable numeric value with a visible unit, a matching native slider, and explicit decrement/increment buttons. The controls share one value, range and fine step. Hue/saturation/lightness use one-degree/one-percentage-point steps; effect dimensions use 0.1-unit steps. Typing must not be overwritten by an unrelated render while the field is being edited. Invalid/partial input follows the existing validation-and-conceal contract.
- Minus/plus changes exactly one fine step per activation, clamps to the supported range and is disabled at its boundary. Keyboard operation remains available. There is no timed button-repeat mechanism.
- Outline and shadow can each be enabled independently and together. Each has its own HSL color controls and color sample. Disabled effects retain their settings but do not render.
- **Duplicate item** copies appearance and timing using a fresh object identifier. It does not silently move or reschedule the copy; overlapping bars make the copy's schedule visible.
- **Start after previous item** copies the preceding array item's computed end into the selected item's start. It is disabled for the first item. This is a one-time edit, not a persistent dependency: later edits to the previous item do not silently move another item.
- Compact timeline tracks show each item's start, fade-in, hold, fade-out and end, with a common time scale. Selecting a track selects the corresponding item. Numerical controls remain the accessible editing route; draggable clips and a separate project system are outside this increment.

## Static editing versus playback

**Live preview** remains the existing static authoring view: every item is shown at its full base opacity, independent of its schedule, so appearance edits are immediately visible. It does not run a timer, pulse or fade while the user edits.

**Play items once** is a separate explicit action that validates and captures the current scene draft and runs its finite item schedule. It does not require an otherwise unnecessary Apply click and does not commit a draft to undo history. While running or paused, edits cancel and conceal the timed preview; editing cannot implicitly restart it. **Apply** still commits scene history and export state.

Item playback is windowed, with Pause, Resume and Stop/Hide reachable. Pause freezes the last painted frame and time. Resume is explicit, without catch-up for paused time. Natural completion hides the entire field, including its background, and never replays. No autoplay, loop or delayed reveal is added. Startup is hidden. Stop/Hide/End/Escape, imports, fullscreen transitions and handled lifecycle interruptions invalidate the playback generation and conceal. No stale callback may reveal hidden output.

Reduced-motion preference leaves static Live preview available and disables timed item playback rather than substituting automatic cuts. A preference change stops current timed playback; it never resumes it.

## Scene format 3

Keep format `imagery-static-scene`, with `version: 3` and `sampler: "styled-objects-3"`. A scene has exactly `name`, `background`, `pulsePeriodMs` and `objects`. The shared pulse period is an integer from 2,000 to 60,000 ms in 100 ms increments, default 4,000 ms. Each object keeps `id`, `shape`, `x`, `y`, `size` and `color`, and adds these exact records:

- `outline`: `enabled`, `width`, `color`.
- `shadow`: `enabled`, `offsetX`, `offsetY`, `blur`, `color`.
- `timing`: `startMs`, `fadeInMs`, `holdMs`, `fadeOutMs`, `pulse`.
- `timing.pulse`: `enabled`, `minOpacity`.

Each record is closed: reject unsupported/missing keys, accessors, sparse or extended arrays and invalid scalar values. Retain the existing 12-item, 1 MiB UTF-8, nesting, duplicate-key, identifier and name restrictions. Imports are data only, never code, markup or network locations.

### Appearance

The original base-shape geometry, color bounds and inset checks remain authoritative. Size and all effect dimensions use a percentage of the field's shorter side, not CSS pixels. Independent effect color uses integer hue 0–359, saturation 0–70 and lightness 0–70, including black shadow colors. Existing object/background color ranges are unchanged.

Outline width is 0.1–4 units in 0.1-unit increments. Draw it behind the item's existing base fill/stroke so the original base color stays visible: filled shapes receive a perimeter outline; outlined shapes receive a wider colored backing stroke. Shadow offsetX and offsetY are −12 to 12 units, and blur is 0–6 units, each in 0.1-unit increments. Shadow is derived from the visible item/outline, then the item and outline are painted above it. Reset all canvas shadow/compositing state between items.

Effects can extend beyond the validated base shape and are clipped at the canvas edge. The validator does not claim a finite Gaussian blur boundary. Do not silently recenter or shrink an item to accommodate an enabled effect. With effects disabled, imported base shapes keep their existing appearance. Main/offscreen canvas allocation limits remain unchanged.

### Timing and exact interval meaning

All four timing fields use integer milliseconds from 0 to 600,000 in 100 ms increments. User-facing controls display seconds in 0.1-second increments. Fade-in, hold and fade-out may individually be zero, but their sum must be positive. The latest item end must not exceed 3,600,000 ms. These are engineering capacities, not safe viewing limits or suggested durations.

For item i:

- Active start = startMs.
- Hold start = startMs + fadeInMs.
- Fade-out start = startMs + fadeInMs + holdMs.
- End = startMs + fadeInMs + holdMs + fadeOutMs.
- Preview total = the maximum item End, not the sum of every item's duration.

Before Start and at/after End the item's opacity is zero. Nonzero fade intervals interpolate continuously from 0 to 1 or 1 to 0. Zero fade means an immediate boundary change without an inserted blank frame. Items overlap naturally when their active intervals overlap. Array order remains drawing order; later objects paint over earlier objects. The background stays constant through the single pass. A scene with no items remains a valid background-only static document but has no item timeline to play.

Default timing is start 0, fade-in 0, hold 3,000 ms, fade-out 0. It is an editable authoring default, not a viewing prescription.

### Optional pulse contract

Pulse is a finite, smooth opacity modulation inside the item's active interval, multiplied by its fade envelope. It does not change position, size, color or the background, and it does not lengthen the item or timeline. It is disabled by default. Each item's minimum opacity is 0.50–1.00 in 0.01 increments, default 0.80. All pulsing items share the scene's 2–60-second period, default 4 seconds, and its absolute timeline phase. There are no independent item frequencies or phase offsets, unrestricted strobe or contrast-inversion modes.

For an enabled item, multiply its fade envelope by `minOpacity + (1 - minOpacity) * (1 + cos(2 * PI * elapsedMs / pulsePeriodMs)) / 2`. The period uses total timeline elapsed time, not time since that item started. The factor applies through fade-in, hold and fade-out, avoiding a discontinuity at fade/hold joins. The entire item, outline and shadow use this same opacity; they do not pulse independently. Disabled pulse uses a factor of one.

The numerical bounds are transparent engineering restrictions, not medically established safety limits. Shared phase reduces independently interleaved pulse clocks but does not establish that arbitrary composed output is safe. The relevant evidence and unverified limits are in [timed-presentation boundaries](timing-boundaries.md).

Per-item bounds alone cannot establish the safety or conformance of the combined output. Overlap, phase, fades, edges, contrast, screen size and device rendering all matter. A warning, a smooth waveform or a software pass is not medical clearance.

## Migration and existing scene sequences

Scene versions 1 and 2 are validated under their original schema before migration to version 3. Preserve their object identities, base geometry, colors and saved backgrounds, adding disabled effects and the default timing above. Version 1's already-documented palette approximation remains unchanged. New defaults do not overwrite migrated background colors.

Existing snapshot sequences remain a separate presentation mode with their own finite hold/crossfade clock. Sequence format `imagery-field-sequence`, version 2 and sampler `ordered-crossfade-2` carries version-3 styled objects and each step's `pulsePeriodMs`; version 1 sequences migrate their objects under the old contract before adding defaults, including a 4,000 ms period. A sequence snapshot retains item timing metadata for later loading into the scene editor, but snapshot playback renders all items as static full-opacity objects and uses only the sequence's hold/crossfade timing. It does not nest item schedules or pulse inside another timeline. Labels and instructions must explain this distinction. Do not silently strip effects or timing on capture, file round-trip or loading a snapshot.

## Acceptance gates

Verify numerical input/slider/button synchronization, partial typing, units and fine steps; new versus imported background defaults; independent outline/shadow colors on every shape; clipping and effect-state reset; exact timing boundaries, overlaps, zero fades and total duration; duplicate IDs and one-time sequencing action; migrations and file round-trips; pause-frame identity; invalid input and stale callbacks; reduced motion; live-versus-timed mode crossover; and full cancellation. Use synthetic data only.

Native browser checks must inspect rendered effect colors and opacity, concurrent/sequential item states, real-time completion, and focused numeric/slider controls on narrow and short viewports. Screenshot review supplements numerical hit/visibility assertions; neither replaces physical-device or full assistive-technology testing. Tie all passed, failed, blocked and not-run outcomes to the exact generated artifact. Historical version 0.5 results do not verify these new capabilities.
