# Version 0.7 verification procedure

Use the complete dependency-free suite against the exact assembled artifact: `node --test imagery-app/tests/*.test.cjs`, syntax/fixture checks, then `node imagery-app/tests/browser-cdp.cjs` with an already installed permitted Chrome. The final version 0.7 runtime gate passed 457 non-browser tests, 98 native groups and 78 synthetic rendered captures in [run 39378606917](https://github.com/woodkill00/aphantasia_build/actions/runs/39378606917), using Node 22.23.3 and sandbox-enabled Chrome 155.0.8059.39 on Linux. Tested source was `db7c84baa1f4fda32dfaea4dd3781c16f4adc509`, tested merge checkout was `937a7ddd7808270557716b4b3979ac6d2249116a`, and the result was merged to main as `1b67f86ede76e176fe8a6f9b801bc8023c3f481e`.

The tested HTML is 167,297 bytes with SHA-256 `c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857`. All 78 capture hashes were checked; 65 matched the previously reviewed exact-runtime set and 13 changed captures were visually reviewed. Later changes require fresh exact-artifact verification. Documentation and packaging checks may increase the non-browser count without changing this historical runtime gate. Consult the [current report](../test-results/TEST-REPORT.md) and [machine-readable summary](../test-results/summary.json) for exact outcomes rather than historical sections below.

Keep sandboxing, offline direct-file checks, genuine event observations, strict raster/validation assertions and process cleanup. CI currently allows ten minutes for the native step within a twelve-minute job. The final gate's native run took 455.236 seconds and confirmed browser/profile cleanup. Do not silently omit tests or weaken assertions to meet that budget; report actual runtime and any deadline failure separately. Decode bounded synthetic capture records, verify bytes/hashes, and inspect actual pixels. Keep raw logs and unreviewed captures outside the public source tree. Only selected, reviewed synthetic stills with [provenance](../../docs/images/README.md) are included as public documentation.

Additional item coverage includes static Live startup without timed autoplay; background saturation through 100%; typed numeric controls and fine steps; migrated scene/sequence files; independently colored body/outline/shadow; grouped alpha; steady, pulsing and mixed finite timelines; exact auto-end, Pause/Resume/Stop; shared-buffer reuse; cancellation, accessibility names and complete focused-field visibility at compact sizes. The complete visible numeric row includes its label, numeric field, slider and real buttons; a text label is not itself a 44-pixel interactive target. Emulation is not physical-device, full accessibility or clinical/sensory validation.

## Historical procedure records

The sections below describe earlier artifacts and former workflow budgets. They do not override the current procedure above.

---

# Version0.4 repair awaits native rerun

The repaired114,116-byte HTML has SHA-256 `3b47699c7f97ffadde30aa1d766ea4ce8226096274899aaac43b0d6d4c115bda`;323 non-browser checks pass. [First native v0.4 run39350355646](https://github.com/woodkill00/aphantasia_build/actions/runs/39350355646) failed8 of74 groups on the previous be1be8a2 artifact. All28 captured synthetic frames were hash verified and inspected. Current repaired native execution is NOT RUN. The complete failure history and unexecuted tails are in the report.

Rerun the existing74-group suite,37 per profile, through unchanged sandbox-enabled CI. Keep native completion/Escape focus and44px target assertions. Media preference changes now wait only for a native MediaQueryList event and validate its immutable same-event Hidden/black snapshot; both directions and cleanup use this barrier. Existing fullscreen snapshots are unchanged. Every case reloads the document; controlled clocks cannot leak into genuine real-time journeys. Inspect28 new JPEG checkpoints before repaired-source visual acceptance.

Run `node --test imagery-app/tests/*.test.cjs`, helper syntax/fixture checks, then `node imagery-app/tests/browser-cdp.cjs`. Install nothing; do not change browser security, timeout, workflow actions or artifacts. First native runtime was4m51s, within the existing6-minute step. Decode `IMAGERY_VISUAL_CAPTURE` lines and verify hashes; raw logs/failure images remain private. Emulation does not establish physical-device, accessibility or efficacy acceptance.

---

# Version 0.3 scoped native-browser verification passed

The current candidate adds immediate local HSL samples/slider gradients and clean native fullscreen. The 65,152-byte HTML has SHA-256 `98cbba97fa2b55835f840295d20ffeb79b40f8fbda8725ca86930f4d67e8823a`. Its 241 local non-browser checks, browser syntax and 3-valid/14-invalid fixture check pass on Node v24.19.0. [First current CI run 39347872671](https://github.com/woodkill00/aphantasia_build/actions/runs/39347872671) passed 240 non-browser checks and 52/54 real-browser groups on Chrome 155.0.8059.39. Two short-fullscreen groups failed on a test-only sentence-order assumption; the repair requires both instructions independently, and [Complete rerun 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905) then passed 241 non-browser checks and all 54 native browser groups on the unchanged HTML, including the injected-Exit-denial tail. All 14 synthetic frames were captured and inspected. Older passes below remain historical.

Use the existing sandbox-enabled CI and the same commands documented below; install nothing and do not change browser security. The existing native fullscreenchange observer and immutable trusted-event Hidden/black/focus assertions are retained. Added checks cover actual draft swatch RGB before native range change, black/gray semantics, selection/import/history color state, hidden fullscreen chrome/tab stops, keyboard Show/Exit, subdued pointer-idle Exit, first-action touch Exit, short fullscreen layout and injected Exit rejection.

The requested shared-reference JPEG captures are emitted as `IMAGERY_VISUAL_CAPTURE` JSON lines in the existing job log. They contain only the synthetic three-outline fixture. Decode and inspect them before claiming visual review or redistributing frames; raw failure screenshots and process output stay private. Phone-sized touch emulation does not establish physical mobile support. No temporal sequence, animation, fade, loop or automatic reveal is included in this candidate.

---

# Browser and device verification

## v0.2: scoped Chrome browser suite passed

The current v0.2 HTML is 57,177 bytes, SHA-256 `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43`. Its 216 non-browser checks and all 38 browser groups passed in [CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180), using Chrome 155.0.8059.39, Node 22.23.3 and the default sandbox. Tested source head: `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`; PR test-merge checkout: `9175892d5a9872f810fa216962b3017507d96eb0`. The first v0.2 run passed 36/38 groups and failed both native-Escape fullscreen groups before the event-observation harness repair. The [failed v0.2 run](https://github.com/woodkill00/aphantasia_build/actions/runs/39343004081) remains part of the evidence; the v0.1 pass below is historical only. See the [current report](../test-results/TEST-REPORT.md).

Run the existing sandbox-enabled browser workflow in a permitted environment with preinstalled Node 22+ and Chrome; install nothing and do not disable the sandbox or other browser security:

```sh
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node imagery-app/tests/browser-cdp.cjs
```

The standalone fixture check now accepts 3 valid and rejects 14 invalid fixtures. The browser suite adds native object controls and all six HSL sliders, input-before-change hiding, fullwindow raster aspect, colored background-only scenes, native fullscreen entry/exit/Escape and focus, a separately labeled injected API rejection, skip recovery, 320×180 Hide/End reachability, and v1 migration to v2 downloads. Exact runtime assertion failures remain failures; an unavailable permitted browser is BLOCKED.

The fullscreen harness now waits for native fullscreenchange delivery, then validates the synchronous post-app event snapshot (trusted event, Hidden, zero colored canvas pixels, correct label/focus). It logs before-action, after-action and event ordering and retains the live Hidden/pixel assertions. It never polls until the desired hidden state appears. The successful rerun observed property changes before event delivery for entry and explicit Exit, and same-event Hidden/black/focus snapshots for all fullscreen transitions. Native Escape had already delivered its event before the post-action read in this run. The first failure remains compatible with an observation race, but its exact cause is unproven; pre-event compositor behavior was not established.

The local baseline launch timed out before navigation. No further local security workaround is authorized. Every future browser run must identify its exact artifact hash, Chrome version, source/checkout commit, command, all case results and cleanup. Read the actual errors before modifying tests; keep failed attempts and distinguish test defects from app regressions. Raw logs/screenshots must be reviewed before publication.

Physical-device and manual acceptance additionally need real touch/keyboard use; actual browser fullscreen acceptance/exit and error behavior; every Hide/End path while the editor is collapsed or scrolled; all background colors becoming black on Hide; pixel/circle proportions across orientation changes; one-shot placement cancellation; actual 200%/400% zoom; screen readers; forced colors; and ordinary OS open/picker/download workflows. CSS-viewport emulation cannot close those gates.

---

# Historical v0.1 browser verification

The dependency-free Chrome suite passed 22/22 scenario groups in [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) on 2026-10-19, against the 40,716-byte HTML with SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`. The [test report](../test-results/TEST-REPORT.md) records the exact source/checkout, versions, first-run failures, repairs, and remaining limits. Instructions below support reproduction and the still-unrun manual/device checks.

## No-install Chrome suite and CI

The workflow in `.github/workflows/check.yml` uses preinstalled Node and Chrome on a standard hosted runner, read-only repository permission, a pinned checkout action, no saved checkout credentials, and no deployment or artifact upload. The successful run used Node 22.23.3 and Chrome 155.0.8059.84 on Linux, with the default Chrome sandbox.

From the repository root with Node 22+ (including its built-in WebSocket) and a permitted preinstalled Chrome:

```sh
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node imagery-app/tests/browser-cdp.cjs
```

`CHROME_PATH` selects an existing executable when needed. `BROWSER_TEST_OUTPUT` can select a local results folder; otherwise the script creates a temporary folder. Generated results may contain process paths and must be inspected before publication. Screenshots are opt-in with `BROWSER_SCREENSHOTS=1`. Never use real observations in fixtures.

The fixture check validates two accepted and ten rejected inputs without launching a browser. The 12 `browser-cdp.test.cjs` checks exercise synthetic transport, fixtures, initial lifecycle settling, and cleanup behavior without launching Chrome. These checks alone do not establish browser compatibility. The separate executed browser suite covers actual file-URL, control, download/file-input, selected layout, and offline-request behavior through Chrome DevTools Protocol. Desktop and phone-sized touch emulation passed; ordinary OS dialogs and physical phones were not tested.

## Alternative Playwright suite

Use a permitted environment with Node, Playwright, and a Chromium executable already available. From the repository root:

```sh
node imagery-app/tests/browser.cjs
```

Set `CHROMIUM_PATH` when the executable differs from the script's standard Linux location. The suite enables the Chromium sandbox and navigates the actual HTML through `file:`. No package installation is performed by the script. A missing dependency or failed launch is BLOCKED, not PASS. Generated outputs are local and git-ignored; inspect them for machine details before publishing.

The suite covers laptop and phone-sized touch emulation, one-time static live startup, explicit conceal/resume controls, editing, actual downloads, JSON round trips, rejected imports, stale import races, optional-note separation, selected focus/layout checks, and observed requests/errors. The alternate Playwright script has been adapted to the v0.7 startup contract and syntax-checked, but has not been behaviorally validated by a successful browser run. Its historical scenarios explicitly select Hide before testing stopped behavior. Fix test defects transparently if execution exposes them.

## Physical-device and manual checks

Use synthetic scenes and notes. Record device, OS, browser/version, artifact hash, expected/actual behavior, and PASS/FAIL/BLOCKED/NOT RUN for each case.

1. Download and open the actual HTML through the ordinary OS-to-browser workflow. A file preview or HTTP server is not this acceptance case.
2. Disconnect networking and reopen a fresh copy. Exercise all presets, edits, history, visibility controls, imports, and exports. Inspect app network requests where supported.
3. Confirm one-time visible static startup with no timed autoplay. After Hide/Escape, backgrounding, app switching, lock/unlock, an actual viewport change, page restoration, or sleep/wake, confirm concealment persists until a fresh explicit Resume action. A same-size resize notification must not be confused with an actual viewport change. Hide must remain reachable while scrolling and while a file read is pending.
4. Export an accepted scene, verify the real file exists, close/reopen a moved or renamed HTML copy, import the file, and compare canonical data. Exercise duplicate filenames, canceled downloads/choosers, blocked downloads, same-file reselect, and read errors.
5. Reject empty, malformed, oversized, duplicate-key, unknown-version/field, nested, URL, markup, and animation fixtures without executing them or losing the last valid scene.
6. Rapidly combine opposing edits, palette/preset changes, history, Hide/Show, and keyboard repeat. An old file read must not restore a hidden scene or overwrite newer accepted data.
7. Check narrow portrait/landscape layouts, 200% and 400% zoom/reflow, high pixel density, reduced motion, forced colors, and slow-device conditions. Confirm bounded canvas allocation and no perpetual redraw.
8. Use the complete interface with keyboard only and relevant screen readers. Check names, focus, error announcements, scrolling, no focus traps, and reachable Hide/End controls. Automated element selection is not a screen-reader test.
9. Test physical iOS and Android separately for HTML launch, JavaScript execution, picker/download behavior, actual file location, touch controls, scrolling, and virtual keyboards. Document unsupported launch routes explicitly.
10. Verify that scene export excludes synthetic notes; note export requires reviewing and selecting current contents; edits/clearing invalidate prior preview approval; reload clears in-memory notes.

Phone emulation is not a physical phone result. Browser tests cannot establish medical safety, efficacy, calibrated luminance/timing, or full accessibility conformance. Qualified review remains separate.

## Version 0.7 startup and responsive acceptance

The dependency-free CDP gate observes the real initial static preview before any Hide action. Legacy stopped-state cases explicitly click native Hide; they do not override runtime initialization. Startup pixels use an independent HSL oracle at default H4/S60/L4 and S100, then verify current scene/sequence capture and reload defaults. Instrumented native RAF requests must be zero before explicit timed playback. Default live preview must transition to finite items with one Play click.

Steady and Pulse are native select choices for each item; a mixed raster fixture holds its steady item unchanged while a pulsing item varies and both stop at the latest end. Controlled-clock raster checks remain distinct from real scheduling tests.

Full label, numeric output, slider and both fine buttons are checked for clipping, hit testing and 44-pixel input targets at 320×568, 844×390, 640×450 and 1024×768. The 640×450 case represents the effective CSS viewport of 1280×900 at 200% zoom; it is a reflow check, not browser-chrome zoom, physical-device or text-enlargement evidence. Actual captured frames still require independent inspection.


## Expanded roadmap execution budget

The same single required workflow job permits 15 minutes for sandboxed native Chrome and 18 minutes for the complete job. Permissions, sandbox, assertion coverage, cleanup and the one-minute package smoke step are unchanged; this does not authorize retry-to-green or parallel jobs.

Measured baseline: [run 39415125146](https://github.com/woodkill00/aphantasia_build/actions/runs/39415125146) executed 136 native groups and 116 captures in 591.044 seconds with normal cleanup, close to the former 600-second limit. The composed candidate prepares 160 groups and 142 captures: four additional direct-input diagnostic groups plus twenty lock/arrangement groups. These include explicit reveal guards, trusted input, raster checks, exact downloads, real aperture/focus checks and bounded browser input tracing. Allowing up to 150 seconds for this added coverage leaves approximately 159 seconds of bounded runner/tracing variation within the 900-second native ceiling. The 18-minute job limit reserves 180 seconds for checkout, Node checks, fixture checks and the unchanged package smoke.

These are execution ceilings and prepared counts, not performance acceptance or passed results. Actual durations, unavailable diagnostics, timing-regime misses and timeouts remain reportable failures. The rapid-release cases must exercise a measured move-to-release interval below 80 ms and must not retry to meet that condition. Original pre-release raster checks remain separate from rapid-release post-release raster checks. Physical-device and other-engine behavior is not inferred from these native Linux Chrome tests.


## Feature013 evidence-transport repair preparation, 20 October 2026

The evidence-only repair uses the [lossless native transport contract](BROWSER-EVIDENCE-TRANSPORT.md). It changes generic reporting only: runtime, all 200 native groups and their ordering/assertions, capture settings, paired baseline and timing criteria, default sandbox, cleanup, read-only permissions and the existing 23-minute native / 26-minute single-job limits are unchanged. The complete transport decoder must be supplied with independently verified terminal job success, exact source/runtime identity including clean checkout, and `expectedCases: 200`; consistent decoding alone is not acceptance. Assigned actual capture, paired timing and package review remain required.

[Run 39453086729](https://github.com/woodkill00/aphantasia_build/actions/runs/39453086729) is green in workflow metadata, but its completed-log response closes and detailed evidence remains unavailable/unreviewed. A new transport run is fresh evidence, not retrospective acceptance. The 7,350,000-byte native output cap is a bounded risk-bearing budget, not a connector guarantee; both favorable and unfavorable retained-corpus projections and additional overhead are disclosed in the transport contract. Preserve any cap/transport failure, every original capture byte and hash, and all prior failures.
