# Imagery Field 0.2

A local engineering preview for manually controlled static scenes. It is not a treatment, diagnostic test, or validated way to develop mental imagery. A lingering afterimage or a reconstruction is not evidence that voluntary imagery improved. Static presentation and the app's restrictions do not guarantee safety.

## Before viewing

Use ordinary, comfortable room lighting and screen brightness. Do not increase brightness or keep staring to make an image persist. This prototype provides no afterimage-induction regimen or medically safe viewing duration.

If you have photosensitive epilepsy or visual patterns trigger seizures, migraine, or other symptoms, seek your clinician's advice before using it. Stop if you experience headache, dizziness, nausea, eye pain, or a visual disturbance. Seek medical advice for new, persistent, or recurring visual symptoms. Sudden vision loss or severe eye pain needs urgent medical care.

## Open the app

1. Download and extract the repository ZIP, then open its `imagery-app` folder.
2. Open **index.html** in a browser with JavaScript enabled. If it opens as text or an attachment preview, use your computer's **Open with** option to choose a browser.
3. Use **Viewing guidance** to read the in-app guidance before choosing to display a scene. The field starts hidden.

No installation, Docker, terminal, account, or local server is required. The HTML is self-contained and designed to work offline. Do not disable browser security or bypass a security warning to open it.

The layout adapts to narrow windows, but physical-device compatibility is unverified. Mobile file viewers may preview HTML without running JavaScript; file opening/downloads vary by device. If your phone cannot open a functioning browser version, use a laptop. A responsive layout or phone-sized browser test is not proof of phone support.

## Build a scene

1. Choose a preset, or select **New object** and **Add object**. You can keep up to 12 dots, pixels, or circle/square/triangle outlines. New objects start at the center.
2. Use **Selected object** to pick the object to edit. Change its shape, size, position, or hue/saturation/color-lightness sliders. **Remove object** deletes it from the draft; removing all objects leaves a background-only scene.
3. For positioning, type **Horizontal position** and **Vertical position**, or choose **Place on field**. Placement closes the editor; click/tap the hidden field once, and the editor reopens with the new position staged. **Esc**, **Hide**, or **End viewing** cancels placement. There is no dragging or visible preview while editing.
4. Adjust the **Background field** sliders. They can describe a color you choose to represent your experience; they do not measure internal vision. **Color lightness does not change screen brightness.** At 0% lightness the background is black; at 0% saturation hue has no visible effect.
5. Choose **Apply changes** to accept the draft or **Discard** to abandon it. Invalid values leave the last applied scene unchanged. **Undo**/**Redo** restores applied scenes within the 40-step session history.

Positions range from 0–100% with up to two decimal places, but the entire object must fit inside the validated edge inset. Size is a whole-number percentage of the field's shorter side: 1–8 for dots/pixels and 1–28 for outlines. Dots are filled circles; pixels are filled squares. Switching an outline to a dot/pixel caps its size at 8. Object hue is 0–359°, saturation 0–70%, and lightness 10–70%; background hue is 0–359°, saturation 0–60%, and lightness 0–40%. These are engineering restrictions, not medically safe settings.

## Show, hide, and fullscreen

- Choose **Close editor** if you want more of the window for the composition, then choose **Show scene**. Scene edits, selection, presets, imports, history, and editor toggles leave the field hidden; apply or discard staged changes before showing.
- **Hide** or **Esc** immediately removes both objects and the chosen background. Controls and the hidden-state message remain against black. **End viewing** also opens the editor and retains your scene and notes in the open page.
- **Enter fullscreen** requests optional browser fullscreen; **Exit fullscreen** returns to the window. The viewing controls stay inside the fullscreen area. Entry, exit, or rejection hides the scene. If fullscreen is unavailable or rejected, continue in the full-window layout.
- Changing windows/tabs, resizing, and other handled page lifecycle events conceal the scene. It never resumes automatically.
- **Show scene** has a temporary anti-repeat guard. If blocked, it stays hidden; press Show again later when you choose. No reveal is queued. This is an engineering restriction, not a medically safe interval or suggested schedule.

There are no flashing/animation modes, timed exposures, afterimage-strength settings, or brightness-escalation exercises. Browser fullscreen and lifecycle behavior still need device-specific testing.

## Keep your work

Apply or discard staged changes, then choose **Download scene JSON**. Check your browser's Downloads to confirm the file was kept; the app can request a download but cannot confirm it reached disk. Saving a scene does not modify the HTML.

Later, reopen **index.html** and choose **Open scene JSON**. Only valid app scene files up to 1 MiB are accepted. Version 2 files store the background and individual objects. Version 1 files are validated before migration: dots become separate objects, contours remain one object, and the background becomes black. Legacy palette colors are approximated in HSL; the new full-window layout may look different. All new exports use version 2. The imported scene stays hidden; invalid/canceled imports keep your applied scene.

There is no durable autosave or browser storage. Closing/refreshing can lose unexported scenes and notes. Keep the page open if a download fails.

## Optional observations and privacy

Notes are independent of scene files and history. Choose a category, enter your note, and select **Preview note export**. Review the exact preview, check **Include this note in the download**, then choose **Download note JSON**. If category or text changes, preview and select it again. Notes allow up to 4,000 characters; they are exported separately and cannot be imported in this version.

Keep observations of a visible scene, incidental aftereffects, and attempts to imagine an absent object distinct; “none” and “unsure” are valid. Notes produce no diagnosis, score, or improvement claim.

Avoid unnecessary identifying/medical details. The note export contains its format/version, category, and text; scene files never include notes. Scene names can also contain personal text, so inspect both kinds of file before sharing. The app has no accounts, telemetry, backend, or runtime network dependency. Browser session restoration, extensions, device backups, and cloud-folder syncing may still retain or copy page content/downloads. End viewing and closing the page are not secure deletion.

## Testing and limits

Version 0.2 passed 214 non-browser checks, plus a separate synthetic fixture check accepting 3 valid inputs and rejecting 14 invalid inputs. Its 38 prepared real-browser scenario groups remain NOT RUN: local browser launch is blocked in the current environment, and no passing v0.2 CI result is recorded. The [root README](../README.md) identifies the exact tested artifact. See the [test report](test-results/TEST-REPORT.md) for exact artifact hashes, commands, results, and remaining checks.

The historical version 0.1 build passed 156 non-browser checks and 22 sandbox-enabled headless Chrome scenario groups. Those results apply to the older artifact, not this redesign. Physical phones, ordinary OS file-opening/chooser workflows, screen readers, and full accessibility remain unverified. Software checks provide no clinical clearance or evidence of safety or effectiveness.
