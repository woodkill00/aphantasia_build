# Software verification report

Date: 2026-10-19. Current result: **156/156 non-browser checks and 22/22 real-browser scenario groups passed** in [GitHub Actions run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608). This is scoped engineering evidence, not clinical clearance, a safety guarantee, full accessibility certification, or universal device support.

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
