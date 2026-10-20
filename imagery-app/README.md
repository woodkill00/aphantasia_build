# Imagery Field 0.7 candidate

A local engineering preview for static live editing, finite per-item animation and separate snapshot sequences. Version 0.7 adds startup static live preview, background saturation up to 100% with a 60% default, clearer Steady/Pulse choices and responsive precision-control improvements. Current-artifact verification is pending. The historical version 0.6 runtime passed 424 code checks, 96 native Chrome groups and independent review of 52 actual frames; those results do not verify the changed artifact. The [test report](test-results/TEST-REPORT.md) records source/run identifiers, the failed fixture attempt and full retry, and the exact-head integration gate. This is not a treatment, diagnostic test or validated way to develop mental imagery. Static displays, fades and engineering limits do not guarantee safety.

## Before viewing

Use ordinary, comfortable room lighting and screen brightness. Do not increase brightness or keep staring to make an image persist. This prototype provides no afterimage-induction regimen or medically safe viewing duration.

If you have photosensitive epilepsy or visual patterns trigger seizures, migraine, or other symptoms, seek your clinician's advice before using it. Stop if you experience headache, dizziness, nausea, eye pain, or a visual disturbance. Seek medical advice for new, persistent, or recurring visual symptoms. Sudden vision loss or severe eye pain needs urgent medical care.

## Open the app

1. Download and extract the repository ZIP, then open its `imagery-app` folder.
2. Open **index.html** in a browser with JavaScript enabled. If it opens as text or an attachment preview, use your computer's **Open with** option to choose a browser.
3. The starter scene is visible immediately as a static **Live preview**, with no timer, fade or pulse. Use **Hide** whenever you want a blank field. Read **Viewing guidance** before timed playback or further viewing.

No installation, Docker, terminal, account, or local server is required. The HTML is self-contained and designed to work offline. Do not disable browser security or bypass a security warning to open it.

The layout adapts to narrow windows, but physical-device compatibility is unverified. Mobile file viewers may preview HTML without running JavaScript; file opening/downloads vary by device. If your phone cannot open a functioning browser version, use a laptop. Phone-sized emulation is not proof of phone support.

## Build a static scene

Use **Scene** to open the scene controls. Your current valid draft is already visible at startup. After you hide it or a handled interruption conceals it, choose **Resume live preview** to show it again. There is no Apply requirement for viewing it. The same scene canvas is arranged beside the desktop inspector or above the portrait inspector, so edits remain visible while you use controls.

1. Choose a preset, or select **New object** and **Add object**. You can keep up to 12 dots, pixels, or circle/square/triangle outlines. New objects start at the center.
2. Choose **Selected object**, then change its shape, size, position, or hue/saturation/color-lightness sliders. **Remove object** deletes it from the draft; removing all objects leaves a valid background-only static scene.
3. Type **Horizontal position** and **Vertical position**, or choose **Place on field**. Placement closes the editor; click/tap the field once to stage a position and reopen the editor. An active live preview remains visible. **Esc**, **Hide**, or **End viewing** cancels placement. Numeric inputs are the keyboard alternative; there is no dragging.
4. New presets start with background HSL **4°, 60%, 4%**; background saturation still ranges from **0–100%**, and imported files retain their own background. Adjust the **Background field** sliders. Click/tap the numeric value to type a precise number, or use the adjacent minus/plus buttons for one fine step. The number, slider and buttons stay synchronized. Object/background color samples and slider tracks update immediately from draft values. During Live preview, the actual scene also updates immediately on each valid input, before releasing a slider. While hidden, only the samples update. These are external color previews, not measurements of internal vision. **Color lightness does not change screen brightness.** At 0% lightness the background is black; at 0% saturation hue has no visible effect.
5. Choose **Apply changes** to accept the scene for history/download, or **Discard** to abandon its draft. Neither is needed while previewing. These actions hide the field; choose **Resume live preview** when wanted. Invalid input stops and hides preview; correcting it does not restart it. **Undo**/**Redo** restores applied scenes within the 40-step session history. Scene history does not undo sequence edits.

Positions range from 0–100% with up to two decimal places, but the entire object must fit inside the validated edge inset. Size is a whole-number percentage of the field's shorter side: 1–8 for dots/pixels and 1–28 for outlines. Dots are filled circles; pixels are filled squares. Switching an outline to a dot/pixel caps its size at 8. Object hue is 0–359°, saturation 0–70%, and lightness 10–70%; background hue is 0–359°, saturation 0–100%, and lightness 0–40%. These are engineering restrictions, not medically safe settings.

## Style an item and schedule its appearance

The candidate item inspector separates Appearance and Timing. Enable **Outline** and/or **Shadow**, then set each effect's own color. Outline width, shadow offset and blur are percentages of the field's shorter side. Effects may be clipped at the field edge; enabling an effect never silently moves an item. Both effects fade with their item.

**Duplicate item** makes an exact appearance/timing copy with a new identifier. It initially overlaps the original. Use geometry or timing controls to separate them. **Start after previous item** copies the previous item's end into this item's start once; it does not create a continuing link between items.

For each item, set **Start**, **Fade in**, **Hold**, and **Fade out**, in seconds. Hold excludes the fades. The item's end is their sum; the preview's end is the latest end among all items. Two items can overlap or start together. Select an item through its timeline track or the object selector, then use the same numeric controls to edit it.

**Live preview** shows the complete static composition for appearance editing, ignoring the timing schedule. **Play items once** explicitly previews the validated draft's schedule without requiring Apply or committing history. From an already active static Live preview, that one action switches directly to timed item playback; it does not ask you to hide and click again. After an explicit Hide or interruption, the normal reveal guard still applies, with no delayed start queued. Pause freezes the painted frame; Resume continues explicitly. Stop/Hide and natural completion conceal the entire field, including the background. There is no automatic replay. Any edit during timed playback stops and hides it; editing does not restart the timer.

Choose **Steady · no pulse** for an item that holds its base opacity between its fade-in and fade-out. Set both fades to zero when you want it simply present for its Hold time. This is the default. Choose **Pulse** to smoothly vary the entire item's opacity within its active interval. A composition may contain steady and pulsing items together; each retains its own start, hold and fades. The scene has one shared 2–60-second cycle (default 4 seconds); each item chooses its minimum opacity from 50–100% (default 80%). All pulsing items share the timeline clock. Pulse does not extend duration or independently animate shadows/outlines. These are supported engineering choices, not medically safe settings. Combined output still needs assessment; a warning or smooth motion is not clearance.

Timed item previews remain windowed with reachable controls. Reduced-motion preference leaves static editing available and disables timed playback; it does not substitute rapid cuts. Hide, invalid fields, imports, fullscreen changes and handled lifecycle interruptions stop playback with no automatic restart. See the [full item contract](../docs/item-timeline.md) for exact bounds, migration and verification gates.

## Capture and edit a sequence

The editor uses compact **Scene**/**Sequence** sections, one selected-step inspector, and Apply/capture controls outside the scrolling editor content. The changed responsive layout requires fresh native focus/raster and actual-frame checks; earlier-version layout passes do not verify it.

- **Add scene as step** appends an independent copy of the scene. With a scene draft, its label becomes **Apply scene and add step**; it applies and captures a valid draft in one action, with no separate Apply click. The scene and proposed sequence are both checked before either is accepted. A rejected capture retains both accepted documents and scene history, and the field stays hidden.
- The first captured step sets the shared background. Later captures must have the same background; a mismatch is rejected with an explanation. A background-only scene cannot become a step. Later scene edits never silently change snapshots.
- In **Sequence**, use **Selected snapshot** to select a step. **Replace selected step** explicitly replaces that snapshot using the same atomic apply/capture process; its label becomes **Apply scene and replace step** when there are scene edits. **Load step into scene editor** makes a copy for scene editing; first resolve any existing scene draft.
- Edit **Sequence name**, **Step name**, **Hold · seconds**, or **Transition · seconds**. Valid sequence changes commit immediately while stopped/hidden. There is no Apply sequence button. Invalid raw fields preserve accepted data, show an error, and block playback, sequence export, capture, and structural changes until corrected or discarded with **Discard invalid sequence fields**.
- **Move earlier**, **Move later**, and **Delete step** change the list. Deleting the last remaining step leaves an empty editor that cannot be played or exported. The new final step's transition becomes zero; a former final step moved earlier receives the default 1-second transition. Other transition values are retained. Adjustments are announced and the whole candidate must validate before acceptance.

A portable sequence has 1–32 nonempty snapshots of 1–12 objects. Each hold is 1–600 seconds and each nonfinal transition is 0–60 seconds, both in 0.5-second increments. The final transition is exactly zero. The total of holds plus outgoing transitions must be at most 3,600 seconds (one hour). A zero transition is a direct cut without an inserted blank frame. A crossfade can temporarily combine two 12-object snapshots. These are supported product-capacity bounds, not medical thresholds or suggested durations.

### Try the authoring example

**Load 11-second example** replaces the sequence with circle → square → triangle and leaves the field hidden. It never starts playback. The example is:

- 0–3 seconds: circle hold
- 3–4 seconds: circle → square crossfade
- 4–7 seconds: square hold
- 7–8 seconds: square → triangle crossfade
- 8–11 seconds: triangle hold, then hidden

The example uses editable 3-second holds and 1-second outgoing fades. It is an authoring demonstration, not an exposure prescription.

## Manual preview and one-pass playback

In **Sequence**, **Previous** and **Next** select a step while hiding the field. Choose **Show step** explicitly to display it. Selection never starts a timer or reveals the new step automatically.

**Play once** requires a valid sequence and resolved scene/sequence drafts. It starts at the beginning in the ordinary window. Snapshot playback shows each captured item at static full opacity, ignoring its per-item schedule and pulse. The captured timing metadata is retained for loading that step back into the scene editor. The shared background stays fixed through all holds and adjacent crossfades. There is no automatic replay, loop, strobe, pulse oscillator, contrast inversion, or intensity escalation.

**Pause** freezes the exact last frame actually painted, including an in-between blend. It leaves that frame visible and does not resample the blend at click time. **Resume** explicitly continues from that painted position without catching up for paused time. **Stop / Hide** immediately conceals the scene and resets playback. Natural completion also hides the field, resets elapsed time, and never replays.

Edits, imports, selection/mode changes, fullscreen changes, resize, loss of focus, tab hiding, suspension, page restoration, and handled page lifecycle events stop and conceal. Old callbacks cannot resume playback. To start again, choose an explicit display action. With the browser/OS reduced-motion preference enabled, use **Previous**/**Next** and **Show step**; timed playback is unavailable. A preference change stops current playback and does not resume it.

## Show, hide, and fullscreen

- Startup Live preview is static, not timed autoplay. **Hide** remains in effect through subsequent edits; correcting invalid input, opening the editor or returning to the page never resumes it. Choose **Resume live preview** when you want it back.
- **Close editor** gives more room to a static scene or manual preview. Opening/closing the editor retains an active live draft and restores its unobscured/full-window layout; other modes conceal. **Hide**, **Stop / Hide**, **End viewing**, and **Esc**, when applicable, conceal both objects and the chosen background.
- **Enter fullscreen** is optional for a static scene or manual step preview. Timed Play/Resume is windowed-only so Pause and Stop stay reachable. Entering or leaving fullscreen cancels playback and hides the field.
- Fullscreen hides normal editor/navigation chrome. While hidden it offers **Live preview** or **Show selected step**, according to the selected section. While showing, a small upper-right **Exit** control remains available for touch and keyboard; it hides the field before exiting. Escape also leaves browser fullscreen. Failure keeps the field hidden with recovery instructions; the ordinary window remains usable.
- Explicit reveal uses the existing temporary anti-repeat guard. If blocked, the field stays hidden; choose Show or Play again later. No reveal is queued. The guard is an engineering restriction, not a medically safe interval or suggested schedule.

The only pulse in this candidate is the finite shared-clock opacity effect described above. Unrestricted flash/strobe, independent-frequency modulation and offscreen flash-risk analysis are not implemented; warnings do not establish sensory safety.

## Keep your work

Use the matching controls for each document:

- **Download scene JSON** / **Open scene JSON**: version 3 files contain the scene background, shared pulse period, styled objects and per-item timing. Valid version 1/2 files migrate after validation, preserving saved backgrounds and base appearance while adding disabled effects/default timing. Version 1 palette approximation remains documented. New scene exports use version 3.
- **Download sequence JSON** / **Open sequence JSON**: sequence version 2 files contain the shared background, ordered styled snapshots, names, snapshot hold/crossfade timing and each snapshot's shared item-pulse period. Version 1 sequences migrate after validation. They contain no notes, playback position/state, loop settings, URLs, or executable expressions. Static files and sequence files are distinct formats, even where version numbers coincide.
- Optional note files use the separate process below. They are not imported.

Current scene-v3 and sequence-v2 files support background saturation up to 100%. Legacy scene-v2/sequence-v1 inputs still must satisfy their original 60% maximum before migration; invalid legacy values are rejected rather than clamped. Older app versions cannot load new documents whose background saturation exceeds their former 60% maximum.

Scene and sequence inputs are bounded to 1 MiB of UTF-8 JSON and validated before acceptance. Successful imports leave the field stopped/hidden. Invalid, canceled, or superseded reads preserve accepted data. Resolve invalid fields before exporting. Check your browser's Downloads to confirm a file was kept; the app can request a download but cannot confirm it reached disk. Saving a file does not modify the HTML.

There is no durable autosave or browser storage. Closing/refreshing can lose unexported scenes, sequences, and notes. Keep the page open if a download fails.

## Optional observations and privacy

Notes are independent of scene and sequence files and scene history. Choose a category, enter your note, and select **Preview note export**. Review the exact preview, check **Include this note in the download**, then choose **Download note JSON**. If category or text changes, preview and select it again. Notes allow up to 4,000 characters and are exported separately.

Keep observations of a visible scene, incidental aftereffects, and attempts to imagine an absent object distinct; “none” and “unsure” are valid. Notes produce no diagnosis, score, or improvement claim.

Avoid unnecessary identifying/medical details. The note export contains its format/version, category, and text. Scene, sequence, and step names may also contain personal text; inspect every file before sharing. The app has no accounts, telemetry, backend, or runtime network dependency. Browser session restoration, extensions, device backups, and cloud-folder syncing may retain or copy content/downloads. End viewing and closing the page are not secure deletion.

## Testing and limits

Current version 0.7 outcomes will be recorded separately in the [test report](test-results/TEST-REPORT.md); earlier results do not verify this increment. The historical version 0.4 passed 324 non-browser checks and all 74 scoped native Chrome groups in [CI run 39352924875](https://github.com/woodkill00/aphantasia_build/actions/runs/39352924875) on source `13cfac66e80b55d401b454dc99c8e6c690f09962` and HTML SHA-256 `3b47699c7f97ffadde30aa1d766ea4ce8226096274899aaac43b0d6d4c115bda`. Controls, timing, native pixels, atomic transactions, file separation, concealment and selected layout/focus flows were exercised on desktop and phone-sized touch emulation. The [test report](test-results/TEST-REPORT.md) records current results, failures, and blockers.

The separate v0.3 baseline passed 241 non-browser checks and 54 native-browser groups in [CI run 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905), using sandbox-enabled headless Chrome 155.0.8059.39 on Linux. Two independent scripted journeys and 14 inspected actual frames informed the redesign; they were not a human usability study. The [root README](../README.md) identifies the exact v0.3 artifact and older baseline results.

Physical phones, Safari, ordinary OS file-opening/chooser workflows, screen readers, and full accessibility remain unverified. Software checks and screenshot review provide no clinical clearance or evidence of safety or effectiveness.
