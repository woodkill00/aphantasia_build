# Implementation and verification plan

Updated 2026-10-19. The single public work register is [`project-queue.json`](../project-queue.json). Planned work is not a clinical approval or automatic authorization for new scope.

## Verified engineering baseline

The static dot/contour editor implements explicit show/hide, a bounded scene schema, staged edits, history, portable scene JSON, and separately previewed optional note exports. [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) passed 156 synthetic/non-browser checks and 22 headless Chrome scenario groups after a narrowly scoped CSS reflow repair and browser-harness hardening. Full evidence and the first failed run remain in the [test report](../imagery-app/test-results/TEST-REPORT.md).

## Next verification work

1. Keep CI tied to the exact source commit and generated HTML hash. Rerun after later edits; investigate failures without weakening assertions, browser sandboxing, or the static app scope.
2. Check physical-device and ordinary OS workflows: opening the downloaded HTML, file chooser behavior, actual download locations, app switching, sleep/wake, touch, virtual keyboards, and each claimed browser. Phone-sized touch emulation cannot close this gate.
3. Complete manual accessibility evaluation: keyboard-only operation, focus order and recovery, screen readers, zoom/reflow, forced colors, and usable controls with assistive technology. Automated layout/focus checks are only partial evidence.
4. Obtain qualified review of actual displayed patterns, viewing conditions, and guidance before broader viewing/research claims. Software checks do not establish sensory safety or efficacy.

## Evidence contract

Record the command/procedure, tool/browser versions, artifact hash, fixture, expected/actual behavior, and PASS/FAIL/BLOCKED/NOT RUN. Distinguish synthetic doubles, automated real browsers, emulation, and physical devices. Preserve failed attempts and explain repairs; do not convert missing evidence into a pass.

The CI workflow uses preinstalled tools, normal Chrome sandboxing, read-only repository permission, and no deployment. It tests source; it does not certify clinical or physical-device readiness.

## Deferred decisions

A license remains a maintainer decision. Complex objects/scenes, durable storage, hosted delivery, accounts, telemetry, timing protocols, participant management, and efficacy measures remain separate proposals requiring explicit specification and review. Public source availability is not a launch or medical-readiness claim.
