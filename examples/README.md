# Synthetic examples

These files contain only invented shapes and labels. They demonstrate editing
and file formats, not a training schedule, treatment, or sensory-safety advice.
Their timings are example data, not recommended exposure durations.

## Current formats

Import a `.scene.json` file with **Open scene JSON**, then explicitly select
**Resume live preview** to reveal it. Importing never starts a display or timer. A static Live
preview shows all items without running their fade or pulse settings.

- [Static starter](static-starter.scene.json): one circle on the default H4,
  S60%, L4% background. Start here to change a color, type a numeric value, or
  use a slider's minus/plus buttons. No pulse is enabled.
- [Outline and shadow](outline-shadow.scene.json): a circle with independently
  colored outline and shadow beside an unstyled square. Change the two effect
  colors separately. This is a static styling example.
- [Steady overlap](steady-overlap.scene.json): two Steady (no pulse) items with
  fades and overlapping visibility. **Play items once** uses a six-second
  timeline: the first item ends at 5 seconds; the second starts at 2 seconds
  and ends at 6 seconds. Steady means no pulse, not an infinite hold.
- [Mixed timing](mixed-timing.scene.json): one Steady item and one Pulse item,
  sharing a four-second pulse period. **Play items once** ends at 8 seconds;
  the first item ends at 7 seconds. Only the second item's opacity pulses,
  between its authored 80% minimum and 100%, within its fade envelope.
  This is an optional engineering example, not a medical safety threshold.
- [Snapshot sequence](snapshot-sequence.sequence.json): import with **Open
  sequence JSON**, not Open scene JSON. Three ordered styled-object snapshots use
  three-second holds and two one-second crossfades, totaling 11 seconds.
  **Play once** runs the separate snapshot timeline. Nested item timing and
  pulse metadata do not animate inside snapshots.

Current scene files use version 3 / `styled-objects-3`; current sequence files
use version 2 / `ordered-crossfade-2`. All current examples use the default
background. The background saturation control still supports 0–100%.
These are closed formats: adding fields can make an import invalid.

Timed playback is explicit, finite, windowed, and does not replay automatically.
Use **Hide**, **End viewing**, or Escape to stop/conceal. Reduced-motion handling
disables timed playback; static preview/manual snapshot stepping remain the
alternative. Changing tabs or other interruptions may conceal the display.
Do not change browser security settings to make an example work.

## Legacy migration examples

The original files remain unchanged, intentionally:

- [reference-scene.json](reference-scene.json) is scene version 2.
- [reference-sequence.json](reference-sequence.json) is sequence version 1.

They exercise the original validators and migration into current formats.
Their original backgrounds are preserved, rather than replaced with the new
default. A newly downloaded migrated document uses the current schema.

## Save your work

**Apply changes** commits an in-page edit; it does not save a file.
**Download scene JSON** and **Download sequence JSON** save different document types. Verify the file reached your
Downloads folder before closing or refreshing: there is no durable autosave.
Notes, if used, are separate and are not included in these public examples.
Inspect your own labels and notes before sharing exported files.
