# Scene and sequence editor design

Version 0.5 live-editing candidate, updated 2026-10-20. Controls are implemented in the candidate source; independent verification is in progress. This document describes the source interaction and structure; it is not a claim that browser, physical-device, accessibility, or qualified sensory acceptance has passed. The [final sequence specification](sequence-spec.md) governs the increment.

## Product scope

A local visual-design workspace with a window-filling field, 0–12 individually editable static objects, background/object HSL controls, immediate editor-only color samples, and optional clean fullscreen static/manual preview. The extension adds 1–32 ordered nonempty snapshots, editable finite holds and adjacent crossfades/cuts, manual stepping, and explicitly started single-pass playback.

This can express a user's chosen external composition or description. It does not measure internal vision, diagnose aphantasia, or establish imagery improvement. Duration, object, color, and resource limits are product-engineering choices, not medically safe settings. No autoplay/replay loop, strobe/pulse oscillator, intensity escalation, or exposure prescription is added.

## What the v0.3 visual review found

Two independent scripted native-browser journeys used synthetic circle/square/triangle compositions. Fourteen actual captured frames were inspected. The review found roughly 730 px of scrolling between hue and Apply, and a decorative hidden-state circle that could resemble lingering scene content. These are specific engineering usability observations, not participant data or a human usability study.

The candidate addresses those findings with:

- Compact **Scene** and **Sequence** section selectors.
- One **Selected snapshot** inspector rather than many expanded step cards.
- Apply/capture actions outside the scrolling editor content, reachable alongside either section.
- Removal of the decorative hidden-state circle, while retaining clear hidden-state text.
- The existing labeled live color samples and gradient slider tracks next to HSL inputs.

These changes are implemented in the candidate source and require fresh actual-frame, focus, and small-window checks. The old screenshots cannot verify the new layout.

## Live scene editing

Choose **Live preview** once to view the current valid draft. Object/background sliders, shape/size/position changes, object addition/removal, presets and placement repaint the actual scene immediately without Apply or another reveal request. Selection and editor open/close retain live preview. The main canvas is visible beside desktop controls, above portrait controls, or beside a compact short-window inspector; there is no second preview bitmap.

Apply remains an explicit accepted-scene/history commit; Discard restores the accepted scene. Both hide, as do undo/redo. The Live draft/Changes staged indicator distinguishes preview from committed data. Saved sequence snapshots remain independent. Invalid input stops/conceals and reports the error; a later correction cannot reveal until explicit Live preview. Hide/Escape, imports, sequence changes, fullscreen and lifecycle events stop live preview.

Small object/background samples still work while hidden. HSL is CSS color, not measured internal vision, calibrated luminance, or hardware brightness. Lightness 0 is black; saturation 0 makes hue irrelevant.

## Reduced-click scene → snapshot workflow

**Add scene as step** creates a copy. If the static scene has edits, the button reads **Apply scene and add step** and applies/captures after preflighting both documents. **Replace selected step** explicitly updates an existing snapshot using the same process; with edits its label is **Apply scene and replace step**. Invalid geometry, empty objects, incompatible backgrounds, timing/total limits, or unresolved sequence fields must not partially update the accepted scene, sequence, or history. Rejection still conceals.

The first capture seeds the shared background. Later snapshots must match it; valid nonblack backgrounds remain supported. Snapshots are immutable independent copies, so editing the scene afterward does not change a stored step. **Load step into scene editor** makes another copy and blocks unresolved scene drafts.

The **Sequence** inspector edits name, hold, and outgoing transition. Valid changes commit immediately while stopped/hidden, with no Apply sequence button. Invalid raw input preserves accepted data and displays a precise error, blocking Play, sequence export, capture, and structural edits until corrected or discarded. Reorder/delete updates only boundary transitions: the new final becomes zero; a former final moved earlier gets the default 1-second transition; other values remain. Validate and accept the entire normalized candidate atomically.

Supported capacity is 1–32 steps, each with 1–12 objects, holds of 1–600 seconds, transitions of 0–60 seconds in 0.5-second increments, and at most one hour total. The final transition is zero. Zero means a cut without an inserted blank frame. A crossfade temporarily combines up to 24 objects from adjacent snapshots. These are product bounds, not physiological thresholds.

## Display and playback

The field starts hidden. **Previous**/**Next** select a step while hidden; **Show step** explicitly displays it. **Load 11-second example** replaces the sequence with 3-second circle, square, and triangle holds plus two 1-second fades; it stays hidden and never starts. Defaults/examples are editable authoring aids, not viewing recommendations.

**Play once** starts at the beginning, in the ordinary window, only with valid accepted data and resolved drafts. **Pause** keeps the exact last actually painted frame visible, including a partial blend. **Resume** is explicit and continues from that frame without catch-up. **Stop / Hide** and natural completion conceal and reset elapsed time. There is no automatic replay.

All display routes use the existing explicit visibility gate and repeat-action guard. No deferred callback can open that gate. Sequence edits/selections, invalid scene input, imports, section changes, fullscreen, resize, blur, hidden tabs, suspension/restoration, and reduced-motion changes stop/conceal. Valid manual scene edits only retain an already active live draft. Invalidated callbacks cannot resume. Reduced-motion preference uses manual stepping instead of automatic cuts.

Timed Play/Resume is windowed-only so Pause and Stop stay reachable. Static scenes and manual previews may enter clean fullscreen: workspace chrome disappears, hidden fullscreen has a Show route, and a small keyboard/touch Exit remains while visible. Fullscreen changes conceal; Escape retains native browser exit behavior. Unsupported/rejected fullscreen leaves the full-window layout available.

## Data and privacy

[The architecture](architecture.md) defines unchanged static version 2, validated legacy static version 1 migration, and separate `imagery-field-sequence` version 1. They are different formats even when version numbers match. Sequence JSON stores the fixed background, ordered object snapshots, names, and times; it omits notes, playback state, URLs, expressions, and loop capabilities. Imports stop/hide; invalid data retains the accepted document.

Only explicitly exported local files persist by design. Optional notes remain independent and require their own exact preview and selection before download. Scene/sequence exports omit them. No network resources, accounts, telemetry, or browser storage are added. Browser/device retention or syncing is outside app control; closing is not secure deletion. Public tests/examples remain synthetic.

## Verification and remaining acceptance

The separate v0.3 artifact passed 241 non-browser checks and 54 native-browser groups in [CI run 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905), Chrome 155.0.8059.39. The [root README](../README.md) identifies its source and HTML hash. Its software pass and 14-frame visual review do not verify this sequence candidate.

The candidate needs independent source review, atomic editing regressions, deterministic timeline checks, controlled-clock composited pixel checks, natural scheduling checks, all cancellation routes, reduced-motion behavior, separate export/import tests, and fresh screenshots of reachable controls. Physical devices, Safari, ordinary OS file workflows, full manual accessibility, and qualified sensory review remain separate unverified gates. Software tests are not clinical clearance or efficacy evidence. See the [plan](plan.md) and [test report](../imagery-app/test-results/TEST-REPORT.md).

Broader effect-curve authoring and offscreen output analysis remain proposals. Advanced live flash/pulse controls are unavailable; warnings alone do not establish sensory safety. Hosted deployment and new participant/research systems are outside this increment.
