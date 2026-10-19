# Browser and device verification

These instructions describe work to run; they do not show a passed browser test. The original sandbox-enabled Chromium launch was blocked before app navigation by the execution environment. No browser security was relaxed.

## No-install Chrome suite and CI

The prepared workflow in `.github/workflows/check.yml` uses preinstalled Node and Chrome on a standard hosted runner, read-only repository permission, a pinned checkout action, no saved checkout credentials, and no deployment or artifact upload. It has not run remotely. The actual browser suite uses the default Chrome sandbox.

From the repository root with Node 22+ (including its built-in WebSocket) and a permitted preinstalled Chrome:

```sh
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node imagery-app/tests/browser-cdp.cjs
```

`CHROME_PATH` selects an existing executable when needed. `BROWSER_TEST_OUTPUT` can select a local results folder; otherwise the script creates a temporary folder. Generated results may contain process paths and must be inspected before publication. Screenshots are opt-in with `BROWSER_SCREENSHOTS=1`. Never use real observations in fixtures.

The fixture check validates two accepted and ten rejected inputs without launching a browser. The six `browser-cdp.test.cjs` checks exercise the synthetic transport and fixtures only. Neither establishes browser compatibility. The no-install suite covers the real-file workflow and selected browser controls/downloads through Chrome DevTools Protocol; its browser behavior remains unverified until a real run completes.

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
