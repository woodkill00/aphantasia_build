# Software verification report

## Current v0.2 candidate: non-browser PASS, browser pending

Date: 2026-10-19. **214/214 non-browser checks pass** against Imagery Field 0.2.0. The expanded real-browser suite is prepared but has **not run on this candidate**. Previous v0.1 browser passes below do not establish v0.2 compatibility. No physical-device, full accessibility, sensory-safety, or efficacy acceptance is implied.

### Exact candidate

- HTML: `imagery-app/index.html`, **57,177 bytes**.
- SHA-256: `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43`.
- Restored repository base: `ece81bf045afcd3045622fdad625271b717bde3e`; current v0.2 changes were tested locally before a new branch/CI commit was created.
- Executed local environment: Linux, Node **v24.19.0**. All fixtures are synthetic.

### Executed results

| Layer | Result | Coverage and limits |
| --- | --- | --- |
| Model/controller | 113 PASS | Strict v2 nested objects/arrays/colors/IDs/ranges; all 7,200 original v1 boundary combinations; v1 migration; parser limits/duplicate keys; aspect-correct deterministic geometry; 10,000 seeded controller commands; history, guards and import invalidation. |
| DOM/Canvas doubles | 79 PASS | Delivered inline scripts; object edits/selection/add/remove/placement; all six HSL inputs hide before change; background-only scenes and black Hide; fullscreen entry/exit/unsupported/rejected/late completion; stage-owned hiding controls; lifecycle/import races; preview-only note export; focus recovery and guidance. These are synthetic doubles, not actual browser/layout evidence. |
| Static artifact | 10 PASS | Source/artifact equality; classic inline scripts; static-only/network/storage prohibitions; semantic labels; full-stage control ancestry. Fullscreen is now explicitly allowed, replacing the obsolete v0.1 blanket prohibition. |
| CDP transport/fixtures | 12 PASS | Transport, lifecycle settling, shutdown and independent parser fixtures. No Chrome launch in this layer. |
| Standalone fixture check | 3 accepted / 14 rejected | Includes v1 migration, v2 scenes, nested duplicate keys, unsupported object fields, duplicate IDs and invalid colors. |
| Native browser suite | NOT RUN on v0.2 | 38 prepared groups: 19 desktop plus 19 phone-sized viewport/touch emulation. |

The current model-only coverage rerun passes 113 tests with **99.46% lines, 94.91% branches, 100% functions**. This is not whole-app, CSS, browser, accessibility, physical-device, or clinical coverage.

### Commands executed for the candidate

```sh
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node --check imagery-app/tests/browser-cdp.cjs
node --check imagery-app/tests/browser.cjs
node --test --experimental-test-coverage --test-coverage-include='**/src/model.js' imagery-app/tests/model.test.cjs
```

No installation, security relaxation, remote mutation, or real participant data was used by these checks.

### Browser gate and prepared cases

The existing sandbox-enabled local Chrome runner was attempted against the restored v0.1 baseline using `/usr/bin/chromium`. It timed out waiting for `DevToolsActivePort` after 20 seconds, before any browser case or app navigation. Both observed attempts recorded BLOCKED, zero cases, browser closure and profile removal. The second launch was a duplicate while the first background command's result was being collected, not a security workaround. No sandbox bypass or further local launch retry was made. This environment failure is neither a v0.2 app failure nor browser success.

The current 38-group CDP suite retains actual file-URL operation, offline request/error observation, real disk download/file-input round trips, malformed/inert imports, import races, notes separation, native display controls, selected responsive/focus checks, and repeat-action guard checks. New groups cover trusted native object selection/add/remove/move, all six native HSL sliders with concealment before `change`, empty colored backgrounds with black Hide, fullwindow aspect-correct raster geometry, one-click placement, actual fullscreen entry/exit/Escape and in-stage Hide/End/focus, injected fullscreen denial fallback, skip-link recovery, 320×568 and 844×390 focused controls, 320×180 directly reachable Hide/End, and v1 import/v2 export.

The injected denial case tests fallback handling, not a real browser permission denial. Viewport/touch emulation and a 320×180 CSS viewport are not a physical device or a complete actual-zoom/screen-reader assessment. Actual fullscreen behavior and browser layout remain acceptance gates until the suite runs successfully in a permitted browser. The alternative Playwright suite was schema-adapted and syntax-checked only; it remains NOT RUN.

### v0.2 attempt and correction history

1. Restored v0.1 baseline: **156/156** original non-browser checks passed at SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.
2. First adapted v0.2 run: **202/206**, with four harness assumptions exposed: geometry returns a canonical CSS color string; placement intentionally consumes `pointerup`; the fullscreen root is an outer `div`; and a particular original v1 size/radius combination is valid. The tests were corrected to these verified contracts; validation, placement state, ancestry and color assertions were retained. The rerun passed **206/206**. Brief simultaneous source changes to match the mistaken assumptions were reverted; a concurrent model-only diagnostic failure from that transient state is not candidate evidence.
3. Accessibility review repairs: skip-link recovery, unclipped canvas focus, non-sticky Apply row, direct guidance access, fullscreen focus recovery, preserved native Escape default, and narrow/short reflow. Tests explicitly assert Escape remains unprevented and still conceals immediately. Added regressions passed **214/214** on the exact frozen candidate above.

Raw TAP/process logs and machine-specific browser reports are kept locally and excluded from public delivery. The prior v0.1 launch failures, first CI failures and successful rerun remain recorded below.

---

# Historical v0.1 verification

Date: 2026-10-19. Historical v0.1 result: **156/156 non-browser checks and 22/22 real-browser scenario groups passed** in [GitHub Actions run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608). This is scoped engineering evidence, not clinical clearance, a safety guarantee, full accessibility certification, or universal device support.

## Exact tested artifact

- App: Imagery Field 0.1.0, `imagery-app/index.html`, **40,716 bytes**.
- HTML SHA-256: `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.
- PR source head: `ed57cd64482f8637ccb3230b46f34b3d976cf9fc`.
- GitHub test-merge checkout: `e7a156d12d319bcad94ee17899b7bf582a4388d9`. This CI checkout is not a claim that the PR was merged into main.
- CI environment: Linux/Ubuntu 24.04.5, Node **22.23.3**, headless Chrome **155.0.8059.84**, default browser sandbox retained.
- Inputs: synthetic fixtures only. No real observations or raw process logs are bundled here.

See [summary.json](summary.json) and the [artifact manifest](../SHA256-MANIFEST.json). Later source or generated-artifact changes require new evidence; this report identifies this particular successful run.

## Executed checks

| Layer | Passed | Scope |
| --- | ---: | --- |
| Model/controller | 85 | Closed schema/ranges, duplicate keys, malformed/oversized inputs, canonical round trips, geometry, drafts/history, explicit visibility, clocks, stale-import tokens. |
| DOM/Canvas doubles | 50 | Delivered script handlers, forms, lifecycle hiding, buffer requests, import races, download initiation/errors/cleanup, separate note preview and consent invalidation. These are not browser tests. |
| Static artifact | 9 | Inline syntax/source equality, selected prohibited runtime patterns, asset absence, IDs/labels/ARIA references, focus styling and connection CSP. |
| Browser harness/fixtures | 12 | Synthetic CDP transport, fixtures, initial lifecycle settling and bounded process-cleanup regressions. These do not launch Chrome. |
| Actual Chrome scenarios | 22 | Eleven desktop and eleven phone-sized viewport/touch-emulation groups using the generated HTML through a file URL. |

The separate fixture command accepted two valid and rejected ten invalid scene inputs. Model workloads include 7,200 bounded geometry combinations and a seeded 10,000-command sequence; UI doubles include 300 rapid mixed-handler sequences.

### What the actual browser run established

Both emulation configurations passed startup hidden/black-pixel checks; explicit Show, Escape, keyboard and End; edit/preset/history/numeric-validation routes; actual disk-download/reload/file-input byte round trips; rejected/inert imports; delayed-file-read races; note preview, selection, separate download, invalidation, reload and invalid-value cases; selected responsive widths, resize hiding, target sizing and focus; and repeated actions without queued reveal.

The browser was in offline mode for app checks. Both configurations reported no page runtime errors, dialogs, or remote app requests. Browser closure and temporary-profile removal completed. This is scoped observation of this app/run, not a guarantee about browser-background traffic or every future configuration.

File-input selection was driven through browser automation. The ordinary OS picker and double-click/open-with experience were not exercised. Phone-sized touch emulation ran in desktop Linux Chrome; it is not physical Android or iOS evidence.

## Commands

From the repository root, CI executed:

```sh
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node imagery-app/tests/browser-cdp.cjs
```

CI used preinstalled Node/Chrome, no package-install step, no security-disabling flags, read-only repository permission, and no deployment.

A separate local Node 24.19.0 coverage rerun used:

```sh
node --test --experimental-test-coverage --test-coverage-include='**/src/model.js' imagery-app/tests/model.test.cjs
```

It passed 85/85 model tests and measured **99.25% lines, 93.29% branches, 100% functions for `src/model.js` only**. This is not whole-app, rendered CSS, browser-path, device, accessibility, or medical coverage. No blanket 100%-coverage claim is made.

## Failure and repair history

1. **Initial local environment:** sandbox-enabled Chromium launch was blocked before app navigation. The original 40,075-byte HTML (`b7563e538a36e09235cfd4f370d6691d5b38c28231d0fcd6a80e3e9696884c88`) had 144 original non-browser passes, later expanded to 150 with the initial CDP checks. That local blocker did not establish app failure or browser success.
2. **[First actual CI run 39333164845](https://github.com/woodkill00/aphantasia_build/actions/runs/39333164845):** source head `3a995efb185bb48777745c495fdebef40ef11f24`; Chrome 155.0.8059.39. All 150 non-browser checks passed, but only 20/22 browser groups passed. Failures were horizontal overflow at 320 CSS pixels and the mobile-emulation first Show assertion reporting Hidden instead of Visible. Profile cleanup then failed with ENOTEMPTY. This run was not a pass.
3. **Reviewed repairs:** CSS grid/file-input sizing corrected narrow-screen overflow. Harness input/lifecycle settling and process cleanup were hardened, with six additional regressions. Strict overflow, target-size, visibility/pixel, and rapid-lock assertions were retained. The original mobile failure's cause remains uncertain; the new sequencing is not presented as proof of it.
4. **[Successful rerun 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608):** the current hash passed all 156 non-browser checks, all 22 browser groups, and cleanup. The [source/delta review](../review.md) explains the limited changes.

Earlier duplicate-key overwrite and unbounded parser-error defects also remain covered by regressions. A historical mock-node-count assertion was a fixture correction, not an app defect.

## Still not established

- Physical phones, ordinary OS file-opening/chooser behavior, device sleep/wake, and real-world download locations.
- Safari, Firefox, Edge or other browser/version/platform combinations beyond the recorded Chrome environment.
- Complete keyboard-only, screen-reader, zoom/reflow, forced-colors and assistive-technology evaluation; selected automated focus/layout checks are partial evidence.
- Qualified visual-pattern/content assessment, calibrated display luminance/timing, medical suitability, or efficacy.

The alternative Playwright suite remains unrun. Follow the [browser/device procedure](../tests/BROWSER-TEST-PROCEDURE.md) for further checks, preserving failed/blocked/not-run outcomes separately.
