# Imagery Field prototype

An experimental engineering preview for simple, manually controlled static visual designs. It is not a treatment, a diagnostic test, or a validated way to develop mental imagery. A lingering afterimage is not evidence that voluntary imagery has improved. Static presentation and the app's restrictions do not guarantee safety.

## Before viewing

Use ordinary, comfortable room lighting and screen brightness. Do not increase brightness or keep staring to make an image persist. This prototype provides no afterimage-induction regimen or medically safe viewing duration.

If you have photosensitive epilepsy or visual patterns trigger seizures, migraine, or other symptoms, seek your clinician's advice before using it. Stop if you experience headache, dizziness, nausea, eye pain, or a visual disturbance. Seek medical advice for new, persistent, or recurring visual symptoms. Sudden vision loss or severe eye pain needs urgent medical care.

## Open the app

1. Download the repository ZIP and extract it, then open its imagery-app folder.
2. Open **index.html** in a browser with JavaScript enabled. If it opens as text or an attachment preview, use your computer's **Open with** option to choose a browser.
3. Read the in-app notice before choosing to display a design.

No installation, Docker, terminal, account, or local server is required. The self-contained HTML is designed to run without network access after download. Do not disable browser security or bypass a security warning to open it.

The layout is designed for phone-sized screens and laptops. Responsive layout does not establish that a phone can launch a downloaded HTML app: mobile file viewers may show a preview without running JavaScript, and file opening and downloads vary by device. If your phone cannot open it in a functioning browser, use a laptop. Physical-device compatibility must be checked separately.

## View and edit

- Choose a preset, then adjust its controls. Designs contain one circle, square, or triangle outline, or one to five irregularly placed dots, using the provided muted palette.
- Choose **Apply changes** to accept your edits, or **Discard changes** to abandon them. Edits, imports, **Undo**, and **Redo** leave the design hidden; choose **Show scene** separately to display it.
- Choose **Hide** or press **Esc** to return to the neutral panel. **End viewing** also hides the field and retains your scene and notes in the open page. Nothing advances automatically.
- **Show scene** includes an anti-repeat guard. A temporarily unavailable Show action is an engineering restriction, not a medically safe exposure interval or a suggested viewing schedule.

There are no flashing or animation modes, timed exposure controls, afterimage-strength settings, or brightness-escalation exercises. Objects, complex scenes, and a training programme are outside this first prototype.

## Keep your work

Choose **Apply changes** before saving any edits, then **Download scene JSON** to preserve the accepted design. Check your browser's Downloads to confirm that the file was saved. The app can request a download; it cannot confirm that it reached your disk.

Later, reopen **index.html** and use **Open scene JSON** to select that saved file. The scene opens hidden. Only this app's supported scene format is accepted; other JSON files are not general-purpose scene imports.

There is no durable autosave. Closing or refreshing the page can lose work that you have not exported. Saving a scene does not change the HTML file itself.

## Optional observations and privacy

Observation notes are optional and exported separately from scene JSON. Choose a category, enter your note, and select **Preview note export**. Review the preview, check **Include this note in the download**, then choose **Download note JSON**. If you change the category or text, preview and approve the new contents again. This version exports notes but does not import them.

Keep observations of a visible design, incidental aftereffects, and attempts to imagine an absent object distinct; “no image” and “uncertain” are valid observations. Notes do not produce a diagnosis or improvement score.

Free text may contain personal information. Avoid unnecessary identifying or medical details. A note export contains the category and your text; scene exports exclude notes. Exported files can be copied or synced by your browser, device, or cloud-folder settings. The application does not intentionally persist notes in browser storage, so export anything you want to retain before closing or refreshing. Browser session restoration, extensions, device backups, or syncing may still retain or copy page content and downloads. Closing the page is not a secure-deletion guarantee; the preview’s wording about notes disappearing describes intended app behavior only. Scene names can also contain personal text, so inspect scene files before sharing them.

## Testing and limits

See the [software test report](test-results/TEST-REPORT.md) for exact versions, artifact hash, and remaining checks. The current build passed 156 non-browser checks and 22 sandbox-enabled headless Chrome scenario groups, including file-URL launch, offline request observation, actual downloads/file-input round trips, and selected responsive layouts. Desktop and phone-sized touch emulation were tested on Linux; physical phones, ordinary OS file-opening/chooser workflows, screen readers, and full accessibility remain unverified.

This is an engineering test preview, with no clinical clearance. Software checks do not establish safety, effectiveness, or full accessibility.
