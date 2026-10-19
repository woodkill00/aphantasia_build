# Software verification report

Date: 2026-10-19. Target: Imagery Field 0.1.0. Result: **150 non-browser checks passed, 0 failed**. The import-staging rerun passed the original 144 checks plus six new synthetic CDP transport/fixture checks. Real-browser execution remains **BLOCKED/NOT RUN**, as detailed below.

## Artifact and toolchain

- HTML: `imagery-app/index.html`, 40,075 bytes.
- SHA-256: `b7563e538a36e09235cfd4f370d6691d5b38c28231d0fcd6a80e3e9696884c88`.
- Executed toolchain: Node v24.19.0 on Linux.
- Data: synthetic fixtures only; no participant observations or clinical outcomes.

The HTML was reassembled from its source parts and retained this exact hash. The static suite also checks that its model/UI JavaScript is embedded verbatim. See [summary.json](summary.json) and the [artifact manifest](../SHA256-MANIFEST.json).

## Commands executed

From the repository root:

```sh
node --test --experimental-test-coverage --test-coverage-include='**/src/*.js' imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
node --check imagery-app/tests/browser.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node --check imagery-app/src/app.js
node --check imagery-app/src/model.js
node imagery-app/src/assemble.cjs
sha256sum imagery-app/index.html
```

All commands completed successfully. No dependencies were installed and no browser settings were changed. Raw process logs are not part of this public report.

## Executed scope

| Layer | Passed | What this checks |
| --- | ---: | --- |
| Model/controller | 85 | Closed schema and ranges, duplicate keys, malformed/oversized inputs, canonical round trips, geometry, draft/apply/discard, bounded history, explicit visibility, monotonic clock handling, stale-import tokens. |
| DOM/Canvas test doubles | 50 | Delivered inline event handlers, hidden startup, form routes, lifecycle hiding, buffer requests, import failures/races, download initiation/errors/cleanup, separate note preview and consent invalidation. |
| CDP transport/fixtures | 6 | Synthetic command/reply matching, protocol failures, event subscriptions, disconnect/malformed-message handling, and parser fixture checks. No browser is launched. |
| Static artifact | 9 | Inline classic scripts, syntax and embedded-source equality, selected prohibited runtime patterns, external-asset absence, IDs/labels/ARIA references, focus styling and restrictive connection CSP. |

The model workload includes 7,200 accepted bounded geometry combinations and a deterministic 10,000-command run. The UI-double workload includes 300 rapid mixed-handler sequences. These check code invariants, not physical display safety or actual browser event/render timing.

## JavaScript coverage

The combined run measured model lines/functions at 100% and branches at 94.74%; UI JavaScript lines/functions at 100% and branches at 98.37%. Compact statements can share a line, and branches remain uncovered. The report therefore makes no complete-path or blanket 100%-coverage claim.

The DOM/Canvas harness does not implement browser layout, CSS rendering, native event defaults, an accessibility tree, operating-system dialogs, or real disk downloads. Its results are not browser tests. Coverage does not measure CSS, device compatibility, full requirements, accessibility conformance, medical validity, or efficacy.

## Regression history

The earlier parser allowed duplicate JSON keys to silently overwrite values. Another earlier error path echoed an attacker-controlled key into status. Both were repaired; current regressions include escaped duplicate spellings and very long duplicate keys. A historical mock-node-count assertion was corrected as a test-fixture mistake, not an app defect.

## Browser and device status

The original sandbox-enabled Chromium launch failed before app navigation because of execution-environment restrictions. No browser pass was obtained. Browser sandboxing/security was not weakened. The supplied Playwright and no-install CDP browser suites are syntax-checked; neither has been behaviorally validated by a successful browser run. The CDP fixture command independently accepted two valid and rejected ten invalid synthetic inputs without launching a browser. A sandbox-enabled GitHub Actions browser workflow is prepared but has not run remotely; the reviewed source import is pending on the feature branch.

The following remain unverified:

- Direct-file app use, observed offline requests, real file pickers, and completed download/import round trips.
- Rendered laptop/phone layouts, screenshots, reflow/zoom, native keyboard/pointer/touch, and frame-level behavior.
- Physical mobile systems and individual desktop browsers.
- Screen-reader output, full accessibility evaluation, display timing/luminance, and qualified pattern/content review.

Follow the [browser/device procedure](../tests/BROWSER-TEST-PROCEDURE.md) in a permitted environment. Record any later browser result separately against its exact artifact hash. Phone-sized emulation cannot establish physical-phone support.

This report supports further engineering verification only. It is not release clearance, clinical approval, a safety guarantee, or evidence that afterimages develop voluntary imagery.
