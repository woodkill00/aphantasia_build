# Implementation and verification plan

Updated 2026-10-19. The single public work register is [`project-queue.json`](../project-queue.json). Planned work is not clinical approval or authorization for new scope.

## Current iteration: version 0.2

The [full-window scene editor](editor-redesign.md) implements individual static objects, background HSL controls, optional browser fullscreen, validated version 1 migration, and version 2 exports. It retains manual reveal, immediate concealment, draft/apply separation, history, import invalidation, and independently previewed notes.

The current artifact passed 216 non-browser checks and all 38 real-browser scenario groups in [CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180), source head `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`. A separate synthetic fixture check accepted 3 valid inputs and rejected 14 invalid inputs. See the [root README](../README.md) for the exact HTML hash.

The first browser run passed 36/38; a harness-only repair synchronized observation with the native fullscreen event while retaining same-event Hidden/black-pixel/focus assertions. The app was unchanged for the successful rerun. The two runs used different Chrome patch versions, so the original failure’s cause remains unproven. Preserve that failed attempt and the local launch blocker alongside the passing CI evidence. This closes the recorded headless Chrome scope, not physical-device, Safari, manual accessibility, or qualified sensory/clinical acceptance.

## Historical verified baseline

Version 0.1's narrow dot/contour editor passed [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608): 156 non-browser checks and 22 headless Chrome scenario groups, after a scoped CSS reflow repair and browser-harness hardening. That result belongs to HTML SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`, not the version 0.2 redesign. The first failed run and later successful rerun remain part of the evidence.

## Acceptance work

1. Preserve independent source/data-contract review and the passing synthetic checks; rerun all affected checks whenever source changes. Cover version 2 ranges, malformed nested/duplicate keys, version 1 validation/migration, object operations, history, import races, note isolation, and no delayed reveal.
2. Preserve and rerun the real-browser suite after relevant changes, using a permitted environment with normal sandboxing. Its recorded scope covers direct-file/offline behavior; real downloads/reimports; object operations; hidden backgrounds; fullscreen transitions and injected denial fallback; aspect-correct rendering; narrow-screen controls; and selected keyboard/focus checks. Record environment blockers separately from app/test failures.
3. Tie every result to its exact source/artifact hash. Reassemble and rerun after source changes; investigate failures without weakening assertions, browser security, or static-only scope. Any remote run/publication needs its required authorization.
4. Check physical-device and ordinary OS workflows: opening downloaded HTML, file choosers, download locations, app switching, sleep/wake, touch, virtual keyboards, fullscreen entry/exit, and each claimed browser. Phone-sized touch emulation cannot close this gate.
5. Complete manual accessibility evaluation: keyboard-only object editing/placement alternatives, focus recovery, screen readers/text descriptions, zoom/reflow, forced colors, and reachable Hide/End controls in ordinary and fullscreen layouts. Automated checks are partial evidence, not conformance.
6. Obtain qualified review of the actual displayed patterns, larger field, editable colors, display conditions, and guidance before broader viewing/research claims. Software checks do not establish sensory safety or efficacy.

## Evidence contract

Record command/procedure, tool/browser versions, artifact hash, fixture, expected/actual behavior, and PASS/FAIL/BLOCKED/NOT RUN. Distinguish synthetic doubles, automated real browsers, emulation, and physical devices. Preserve failed attempts and explain repairs; missing evidence stays missing.

The passing CI workflow uses preinstalled tools, normal Chrome sandboxing, read-only repository permission, and no deployment. A passing run does not certify clinical or physical-device readiness. See the [test report](../imagery-app/test-results/TEST-REPORT.md) and [browser procedure](../imagery-app/tests/BROWSER-TEST-PROCEDURE.md).

## Deferred decisions

A license remains a maintainer decision. Arbitrary object groups/freeform geometry, durable storage, hosted delivery, accounts, telemetry, timing protocols, participant management, and efficacy measures require separate specification and review. Public source availability is not a launch or medical-readiness claim.
