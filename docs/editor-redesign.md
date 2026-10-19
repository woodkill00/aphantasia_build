# Full-window scene editor, version 0.2

Implementation has passed current non-browser and scoped headless Chrome checks. Physical-device, Safari, manual accessibility, and qualified sensory/clinical acceptance remain unverified. Updated 2026-10-19.

## Product scope

A static, local visual-design workspace with a window-filling field, optional browser fullscreen, 0–12 individually editable objects, and background hue/saturation/lightness sliders. It can express a user's chosen reconstruction or description; it does not measure internal vision or establish imagery improvement.

## Implemented interaction

- The field fills the window behind a collapsible editor and persistent controls. **Close editor**, then **Show scene**, gives more room to the composition. **Enter fullscreen** is a separate action; unavailable/rejected fullscreen leaves the full-window layout usable.
- Fullscreen uses the common root containing Hide and End. Entry/exit/error, editor toggles, Escape, and relevant lifecycle changes conceal. Hidden rendering removes the chosen background and objects, leaving black behind the controls and hidden-state message.
- Add dots, pixels, or circle/square/triangle outlines; select each through the object selector; remove any object. Removing all objects leaves a valid background-only scene.
- Change shape, position, size, and per-object HSL color. **Place on field** closes the editor for one click/tap on the hidden field, then reopens it. Numeric x/y controls provide a keyboard alternative. Placement is canceled by Escape, Hide, or End.
- Positions use field-width/height percentages. Object dimensions use the shorter side so circles/squares are not stretched. Shape sizes and placement are validated with a conservative inset; a click/tap is clamped to that inset.
- Background and object color sliders show their numeric values. Background lightness changes CSS color, not hardware brightness or calibrated luminance. Lightness 0 is black; saturation 0 makes hue irrelevant.
- Presets and scene edits are staged while hidden. **Apply changes** validates/accepts them; **Discard** returns to the accepted scene. Show/export requires resolving the draft. Undo/redo handles accepted scenes within 40-step session history.
- **Show scene** always requires a fresh explicit action. A 3,000 ms repeat-action guard never schedules a later reveal and is not a suggested exposure/recovery interval. There is no live scene preview, animation, flicker, automatic progression, or exposure prescription.

## Data and privacy

[The exact data contract](architecture.md) defines version 2 (`static-objects-2`), bounded object geometry, and distinct object/background HSL ranges. Count, color, buffer, and geometry limits make the implementation reviewable; they are not medically safe settings.

Legacy version 1 files are validated against their original schema and geometry before conversion, then validated again as version 2. Fixed-offset dots become independent objects; a contour remains one object; the background becomes black. Palette colors are approximated in whole-number HSL. Full-window layout preserves logical positions, not pixel-identical old screenshots. New downloads use version 2.

Only explicitly exported local files persist by design. Optional notes remain independent and require their own exact preview and selection before export. Scene exports omit them. No network resources, accounts, telemetry, or browser storage are added. Browser/device retention or syncing is outside the app's control; closing is not secure deletion. Public tests use synthetic data.

## Verification and remaining acceptance

Recorded checks cover the closed validator, malformed nested/duplicate JSON keys, migration, history, import invalidation, explicit visibility, hidden backgrounds, object operations, fullscreen exit/injected denial fallback, aspect-correct geometry, semantic labels, selected narrow-screen/keyboard controls, file round trips, and offline operation.

The current artifact passed 216 non-browser checks and all 38 headless Chrome groups in [CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180). The first browser run passed 36/38; a harness-only fullscreen-event observation repair retained same-event hiding/black-pixel/focus assertions, and the app was unchanged for the successful rerun. See the [root README](../README.md) for the exact artifact hash. Physical fullscreen behavior, phone file-launch/download routes, Safari, and manual accessibility require separate testing. Qualified sensory review and clinical efficacy remain unverified. See the [plan](plan.md) and [test report](../imagery-app/test-results/TEST-REPORT.md) for evidence and remaining gates.
