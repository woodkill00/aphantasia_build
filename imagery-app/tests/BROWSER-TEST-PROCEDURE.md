# Browser and device verification

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

The suite covers laptop and phone-sized touch emulation, hidden startup, explicit display controls, editing, actual downloads, JSON round trips, rejected imports, stale import races, optional-note separation, selected focus/layout checks, and observed requests/errors. The script was syntax-checked but has not been behaviorally validated by a successful browser run. Fix test defects transparently if execution exposes them.

## Physical-device and manual checks

Use synthetic scenes and notes. Record device, OS, browser/version, artifact hash, expected/actual behavior, and PASS/FAIL/BLOCKED/NOT RUN for each case.

1. Download and open the actual HTML through the ordinary OS-to-browser workflow. A file preview or HTTP server is not this acceptance case.
2. Disconnect networking and reopen a fresh copy. Exercise all presets, edits, history, visibility controls, imports, and exports. Inspect app network requests where supported.
3. Confirm hidden startup and concealment after backgrounding, app switching, lock/unlock, resize, page restoration, and sleep/wake. Hide must remain reachable while scrolling and while a file read is pending.
4. Export an accepted scene, verify the real file exists, close/reopen a moved or renamed HTML copy, import the file, and compare canonical data. Exercise duplicate filenames, canceled downloads/choosers, blocked downloads, same-file reselect, and read errors.
5. Reject empty, malformed, oversized, duplicate-key, unknown-version/field, nested, URL, markup, and animation fixtures without executing them or losing the last valid scene.
6. Rapidly combine opposing edits, palette/preset changes, history, Hide/Show, and keyboard repeat. An old file read must not restore a hidden scene or overwrite newer accepted data.
7. Check narrow portrait/landscape layouts, 200% and 400% zoom/reflow, high pixel density, reduced motion, forced colors, and slow-device conditions. Confirm bounded canvas allocation and no perpetual redraw.
8. Use the complete interface with keyboard only and relevant screen readers. Check names, focus, error announcements, scrolling, no focus traps, and reachable Hide/End controls. Automated element selection is not a screen-reader test.
9. Test physical iOS and Android separately for HTML launch, JavaScript execution, picker/download behavior, actual file location, touch controls, scrolling, and virtual keyboards. Document unsupported launch routes explicitly.
10. Verify that scene export excludes synthetic notes; note export requires reviewing and selecting current contents; edits/clearing invalidate prior preview approval; reload clears in-memory notes.

Phone emulation is not a physical phone result. Browser tests cannot establish medical safety, efficacy, calibrated luminance/timing, or full accessibility conformance. Qualified review remains separate.
