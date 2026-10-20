# Troubleshooting

Keep the page open if you have work that has not been downloaded. **Apply is not saving**, and there is no autosave. The [user guide](../imagery-app/README.md) describes the controls; [compatibility](compatibility.md) explains what has actually been tested.

## The HTML opens as text, a ZIP preview, or an attachment

Extract the repository ZIP first. Open `imagery-app/index.html`, not a source file from `src`. Use your computer's **Open with** action to choose a browser with JavaScript enabled. A phone's file viewer may show HTML without running it; that is not a functioning app session. Ordinary mobile file-opening workflows are not yet verified.

The current user workflow needs no server, account, Node, Docker or package installation. Do not disable browser security or bypass a certificate/security warning. If your device cannot open the local file, report the exact workflow using the [support guide](../SUPPORT.md), or use another available computer/browser; do not assume phone-sized emulation proves phone support.

## The preview disappeared

This is expected after **Hide**, **Apply changes**, **Discard**, undo/redo, imports, invalid input, a fullscreen transition or handled lifecycle interruption such as switching tabs, loss of focus or resizing. It prevents an old callback or corrected field from unexpectedly revealing the scene.

Correct any invalid field, then choose **Resume live preview** for static editing, **Show step** for a selected snapshot, or the appropriate explicit Play action. Editing alone never overrides Hide. A temporary reveal guard may require you to try again later; no delayed display is queued. Do not repeatedly click to defeat it.

## Live preview shows every item, ignoring my timing

Live preview is intentionally static so you can edit the whole composition. Choose **Play items once** to run Start → Fade in → Hold → Fade out. The end is the latest item end. Choose **Steady · no pulse** for no pulse; set both fades to zero for a simple on/off hold. Pulse is optional and does not extend the timeline.

**Sequence → Play once** is different: it plays captured snapshots with their own holds/crossfades. It does not run the captured items' individual timing clocks. Later scene edits do not automatically change a captured snapshot; use **Replace selected step** explicitly.

## Play is unavailable or playback stopped

- Correct invalid inputs and resolve any draft required by the selected playback mode.
- Return to the ordinary window. Timed playback is windowed-only so Pause and Stop remain reachable.
- With reduced-motion preference enabled, use static live editing or **Previous / Next → Show step** instead. Timed playback is intentionally unavailable; changing that preference is not required to use the app.
- Check that a sequence contains at least one valid nonempty snapshot.
- After Hide or an interruption, start again explicitly. Natural completion hides the field and never loops.

Do not weaken these controls or browser security to make playback run.

## I applied changes, but my work was not saved

**Apply changes** accepts the scene for session history and scene export. It does not write to disk. Use **Download scene JSON** or **Download sequence JSON**, then check the browser's Downloads list and actual file. Optional notes have their own preview, selection and download.

The app can request a download but cannot confirm disk delivery. If the file is missing, check the browser's download status and destination. Keep the page open while resolving it. Do not reload as a first troubleshooting step: unexported work may be lost.

## Download or capture is blocked

Correct invalid raw fields first. Scene download needs an applied scene, so use **Apply changes** for a valid draft. Snapshot capture offers **Apply scene and add step** or **Apply scene and replace step** to accept and capture a valid draft together.

A sequence must use one shared background. Later captures with a different background are rejected rather than silently changing all steps. Match the current scene background to the sequence background before capturing, or create a separate sequence. Background-only scenes can be saved as scenes but cannot become sequence snapshots.

Invalid sequence fields block playback, export and structural changes. Correct them or choose **Discard invalid sequence fields** to restore the accepted values. A failed transaction keeps the previously accepted documents.

## A saved file will not import

Use the matching **Open scene JSON** or **Open sequence JSON** control. A note file, image, ZIP, or the HTML app itself is not an importable scene. Imports must be valid UTF-8 JSON within 1 MiB and match the closed format, version and field rules.

Current exports use scene version 3 and sequence version 2. Earlier supported formats are validated under their original rules before migration. A legacy scene-v2 or sequence-v1 file with background saturation above 60% is invalid even though new formats support 100%. Unknown fields, malformed values and unsupported versions are rejected, not silently repaired. Keep a backup rather than manually changing a version number to force acceptance.

Older app builds may reject current exports, especially backgrounds above their former 60% saturation maximum. Use the current app with a copy of the original file. If a valid-looking synthetic example fails, report its app version and format without attaching private exports.

## Hue changes do not seem to do anything

At 0% lightness the background is black. At 0% saturation it is gray, so changing hue has no visible effect. The default background is HSL 4°, 60%, 4%, which is intentionally very dark. HSL color lightness is not hardware brightness or calibrated luminance. Do not increase screen brightness or staring duration to induce an afterimage.

## A number, outline, shadow, or position is rejected or clipped

Read the field's error and permitted range. Numbers must satisfy the displayed step size; fine-step buttons provide the smallest supported increment. The base item must fit within the validated edge inset. Shadows and outlines can extend toward the field edge and may be clipped; enabling an effect does not silently move the item. Size is measured against the shorter field dimension, not independently stretched across width and height.

## Controls are hard to reach

Scroll the editor area, or use the keyboard and numeric inputs. The preview and editor adapt to narrow/short windows; selected layouts have native browser evidence, not universal acceptance. If a focused value, label, minus/plus button or Hide control is cut off, report the exact viewport, browser version and zoom. A screenshot with synthetic content is useful after checking it for private tabs, paths and text. Do not reduce an accessibility setting just to make a bug disappear.

## Still stuck?

See [Support](../SUPPORT.md). Include app version/hash if known, browser/OS, how you opened it, reproducible steps, expected and actual results, and a minimal synthetic example. Public issues are public. Never include personal observations, health details, credentials, real note exports or private screenshots. Use the [private security route](../SECURITY.md) for vulnerabilities.
