# Implementation and verification plan

Updated 2026-10-19. The single public work register is [`project-queue.json`](../project-queue.json). Planned work is not a clinical approval or automatic scope authorization.

## Current implemented baseline

The first slice is a self-contained static dot/contour editor with explicit show/hide, bounded schema validation, staged edits, undo/redo, portable scene JSON, and separately previewed optional note exports. The non-browser suite passes. Browser/device acceptance is still open.

## Next verification sequence

1. Run the actual generated HTML in a permitted sandbox-enabled browser. Test startup hidden, every editing route, rapid combined actions, lifecycle hiding, stale import races, offline requests, and actual export/import round trips. Record the browser version and artifact hash. Publish only synthetic fixtures and reviewed logs.
2. Resolve any defects without widening the scene or exposure scope. Re-run model, static, and DOM-double checks after fixes, then repeat the affected real-browser cases. Preserve failed outcomes and separate blocked checks from passes.
3. Perform real-device launch and accessibility checks. Evaluate file opening, downloads, pointer/touch, keyboard-only operation, focus, screen readers, zoom/reflow, and forced colors. Report each supported device/browser separately.
4. Obtain qualified review of the displayed patterns and guidance before any broader viewing or research claim. Software tests alone do not satisfy that gate.

## Definition of an engineering-test result

A reproducible result names the command or procedure, tool/browser versions, tested artifact hash, fixture, expected behavior, actual behavior, and PASS/FAIL/BLOCKED/NOT RUN. Distinguish synthetic DOM doubles, automated real-browser checks, emulation, and physical-device work. Do not count pending work as passed.

## Deferred decisions

- The prepared GitHub Actions workflow runs dependency-free checks and the no-install real-Chrome suite with the default sandbox. It is not yet executed remotely; the reviewed source import is pending on the feature branch. A CI result cannot establish physical-device or clinical acceptance.
- A project license remains a maintainer decision.
- Complex objects/scenes, durable storage, hosted delivery, accounts, telemetry, timing protocols, participant management, and efficacy measures remain separate proposals.
- No deployment is needed for this initial source repository. Public source availability is not a launch or medical-readiness claim.
