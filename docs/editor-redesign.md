# Scene and sequence editor design

Version 0.7, updated 2026-10-20. This document describes the editor interaction and structure. Exact source, native-pixel/focus, actual-frame and CI outcomes are recorded separately in the test report. The [snapshot sequence specification](sequence-spec.md) and [item appearance/timeline specification](item-timeline.md) govern their separate modes; neither software acceptance nor this design establishes physical-device, full accessibility or qualified sensory acceptance.

## Product scope

A local visual-design workspace with a window-filling field, 0–12 individually editable static objects, background/object HSL controls, immediate editor-only color samples, and optional clean fullscreen static/manual preview. Snapshot mode provides 1–32 ordered nonempty snapshots, editable finite holds and adjacent crossfades/cuts, manual stepping, and explicitly started single-pass playback. The item inspector adds typed numeric values and fine-step buttons, independently colored outlines/shadows, selectable timeline tracks and finite overlapping per-item fades with an optional shared-clock opacity pulse.

This can express a user's chosen external composition or description. It does not measure internal vision, diagnose aphantasia, or establish imagery improvement. Duration, object, color, and resource limits are product-engineering choices, not medically safe settings. No timed autoplay/replay loop, unrestricted strobe, independent pulse frequency, intensity escalation or exposure prescription is added. The bounded shared opacity pulse is an authoring feature, not a medically safe setting.

## What the v0.3 visual review found

Two independent scripted native-browser journeys used synthetic circle/square/triangle compositions. Fourteen actual captured frames were inspected. The review found roughly 730 px of scrolling between hue and Apply, and a decorative hidden-state circle that could resemble lingering scene content. These are specific engineering usability observations, not participant data or a human usability study.

The earlier redesign addressed those findings with:

- Compact **Scene** and **Sequence** section selectors.
- One **Selected snapshot** inspector rather than many expanded step cards.
- Apply/capture actions outside the scrolling editor content, reachable alongside either section.
- Removal of the decorative hidden-state circle, while retaining clear hidden-state text.
- The existing labeled live color samples and gradient slider tracks next to HSL inputs.

These changes have fresh actual-frame, focus and small-window checks for the recorded v0.5 artifact; old screenshots are not used to verify new layout.

## Live scene editing

The valid starter draft appears immediately as a static **Live preview**, without pulse, fades or a timer. **Hide** is immediately available. After concealment, an explicit live-preview action is required to show the draft again; no edit or callback resumes it. Object/background sliders, shape/size/position changes, object addition/removal, presets and placement repaint the actual scene immediately without Apply or another reveal request. Selection and editor open/close retain live preview. The main canvas is visible beside desktop controls, above portrait controls, or beside a compact short-window inspector; there is no second preview bitmap.

Apply remains an explicit accepted-scene/history commit; Discard restores the accepted scene. Both hide, as do undo/redo. The Live draft/Changes staged indicator distinguishes preview from committed data. Saved sequence snapshots remain independent. Invalid input stops/conceals and reports the error; a later correction cannot reveal until explicit **Resume live preview**. Hide/Escape, imports, sequence changes, fullscreen and lifecycle events stop live preview.

Small object/background/outline/shadow samples still work while hidden. Each slider has a unit-labeled editable number and one-step minus/plus controls. Invalid partial values conceal; correction does not resume display. The new-scene HSL 4/60/4 background does not overwrite imported backgrounds. Background saturation supports the full 0–100% range; 60% is only the default. HSL is CSS color, not measured internal vision, calibrated luminance, or hardware brightness. Lightness 0 is black; saturation 0 makes hue irrelevant.

## Responsive layout acceptance

Use shared space/size tokens, calc() for remaining space, bounded min/max/clamp values and shrinking grid tracks. The same canvas must remain visible beside or above the inspector without covering it; no second preview bitmap is added. The preview/editor split must allow the complete focused precision row, including label, number, unit, fine-step buttons and slider. Preserve a 44px control target and visible focus. Short windows may compress decorative chrome, not clip controls or conceal the Hide action.

Review actual rendered startup, background, appearance, steady/pulse/mixed timing and sequence views at desktop, narrow portrait, short landscape and high-zoom sizes. Check overlap, text wrapping, complete focused fields, scrolling and stable canvas dimensions after status updates. Numeric layout assertions supplement screenshots; CSS arithmetic or center-point hit checks alone are not visual signoff. Phone-sized emulation is not physical-device acceptance.

## Finite item playback

**Play items once** captures the valid current draft without applying it to history. A single explicit action switches an already active static Live preview directly into item playback. It invalidates prior display work, does not auto-start a timer, and does not bypass an explicit Hide/interruption lock. Start, Fade in, Hold and Fade out define each item’s active interval; the latest end determines the one-pass preview duration. Each item explicitly chooses **Steady · no pulse** or **Pulse**. Steady holds full base opacity between the item's fades; zero fades give a simple timed on/off hold. Steady and pulsing items can coexist, overlap, or follow one another. The timeline communicates each mode and the total duration. Optional pulse shares one absolute scene clock and multiplies the entire item’s body, outline and shadow opacity. Duplicate item and Start after previous item are one-time editing helpers, not linked dependencies. Any edit during timed playback cancels and conceals; no edit implicitly restarts it. Reduced-motion preference disables item playback while leaving static Live preview available.

## Reduced-click scene → snapshot workflow

**Add scene as step** creates a copy. If the static scene has edits, the button reads **Apply scene and add step** and applies/captures after preflighting both documents. **Replace selected step** explicitly updates an existing snapshot using the same process; with edits its label is **Apply scene and replace step**. Invalid geometry, empty objects, incompatible backgrounds, timing/total limits, or unresolved sequence fields must not partially update the accepted scene, sequence, or history. Rejection still conceals.

The first capture seeds the shared background. Later snapshots must match it; valid nonblack backgrounds remain supported. Snapshots are immutable independent copies, so editing the scene afterward does not change a stored step. **Load step into scene editor** makes another copy and blocks unresolved scene drafts.

The **Sequence** inspector edits name, hold, and outgoing transition. Valid changes commit immediately while stopped/hidden, with no Apply sequence button. Invalid raw input preserves accepted data and displays a precise error, blocking Play, sequence export, capture, and structural edits until corrected or discarded. Reorder/delete updates only boundary transitions: the new final becomes zero; a former final moved earlier gets the default 1-second transition; other values remain. Validate and accept the entire normalized candidate atomically.

Supported capacity is 1–32 steps, each with 1–12 objects, holds of 1–600 seconds, transitions of 0–60 seconds in 0.5-second increments, and at most one hour total. The final transition is zero. Zero means a cut without an inserted blank frame. A crossfade temporarily combines up to 24 objects from adjacent snapshots. These are product bounds, not physiological thresholds.

## Display and playback

Switching to the snapshot sequence conceals the field. **Previous**/**Next** select a step while hidden; **Show step** explicitly displays it. **Load 11-second example** replaces the sequence with 3-second circle, square, and triangle holds plus two 1-second fades; it stays hidden and never starts. Defaults/examples are editable authoring aids, not viewing recommendations.

**Play once** starts at the beginning, in the ordinary window, only with valid accepted data and resolved drafts. **Pause** keeps the exact last actually painted frame visible, including a partial blend. **Resume** is explicit and continues from that frame without catch-up. **Stop / Hide** and natural completion conceal and reset elapsed time. There is no automatic replay.

Except for the one-time static startup preview, display routes require explicit action through the existing visibility gate and repeat-action guard. No deferred callback can open that gate. Sequence edits/selections, invalid scene input, imports, section changes, fullscreen, resize, blur, hidden tabs, suspension/restoration, and reduced-motion changes stop/conceal. Valid manual scene edits only retain an already active live draft. Invalidated callbacks cannot resume. Reduced-motion preference uses manual stepping instead of automatic cuts.

Timed Play/Resume is windowed-only so Pause and Stop stay reachable. Static scenes and manual previews may enter clean fullscreen: workspace chrome disappears, hidden fullscreen has a Show route, and a small keyboard/touch Exit remains while visible. Fullscreen changes conceal; Escape retains native browser exit behavior. Unsupported/rejected fullscreen leaves the full-window layout available.

## Data and privacy

[The architecture](architecture.md) and [item specification](item-timeline.md) define scene version 3, validated legacy scene version 1/2 migration, and separate `imagery-field-sequence` version 2 with version 1 migration. They are different formats even when version numbers match. Sequence JSON stores the fixed background, ordered styled-object snapshots, item timing/shared pulse-period metadata, names, and sequence times. Snapshot playback renders the saved items at full opacity and uses only its own hold/crossfade clock. The JSON omits notes, playback state, URLs, expressions, and loop capabilities. Imports stop/hide; invalid data retains the accepted document.

Only explicitly exported local files persist by design. Optional notes remain independent and require their own exact preview and selection before download. Scene/sequence exports omit them. No network resources, accounts, telemetry, or browser storage are added. Browser/device retention or syncing is outside app control; closing is not secure deletion. Public tests/examples remain synthetic.

## Verification and remaining acceptance

The [root README](../README.md) and [test report](../imagery-app/test-results/TEST-REPORT.md) identify each tested source/HTML hash and distinguish current evidence from historical software passes and screenshot reviews. Version 0.7 source `33bca8b59e52596f0784529b9162ea5240d1a7fb` passed 457 code checks and 98 native groups in [CI run 39377219664](https://github.com/woodkill00/aphantasia_build/actions/runs/39377219664); all 78 fresh actual frames were independently inspected. The review confirmed complete focused precision rows, separate canvas/inspector regions, reachable Hide/Stop/Exit, explicit Steady/Pulse and mixed tracks, and the repaired compact phone-sized header. The 640×450 scenario checks effective reflow, not actual zoom. No physical-device, actual OS/browser-zoom or full-accessibility acceptance follows from it. Final documentation-head CI remains a separate gate.

The verification contract requires independent source review, atomic editing regressions, deterministic timeline checks, controlled-clock composited pixel checks, natural scheduling checks, all cancellation routes, reduced-motion behavior, separate export/import tests, and fresh screenshots of reachable controls. Physical devices, Safari, ordinary OS file workflows, full manual accessibility, and qualified sensory review remain separate unverified gates. Software tests are not clinical clearance or efficacy evidence. See the [plan](plan.md) and [test report](../imagery-app/test-results/TEST-REPORT.md).

Broader effect-curve authoring and offscreen output analysis remain proposals. Unrestricted strobe and independent pulse-frequency controls are unavailable; the implemented finite shared-clock opacity pulse and warnings do not establish sensory safety. Hosted deployment and new participant/research systems are outside this increment.
