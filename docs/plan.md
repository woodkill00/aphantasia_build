# Implementation and verification plan

Updated 2026-10-20. The single public work register is [`project-queue.json`](../project-queue.json). Planned work and a passing software test are not clinical approval, a human study, or authorization for unrelated scope.

## Current increment: verified version 0.4 software preview

Implemented the [final one-pass sequence contract](sequence-spec.md): independent scene snapshots, atomic apply/capture, immediate valid sequence edits, 1–32 steps, finite holds, adjacent crossfades/direct cuts against one shared background, manual step preview, windowed one-pass playback, exact painted-frame Pause/Resume, immediate cancellation/concealment, reduced-motion handling, and separate sequence JSON.

The exact version 0.4 artifact passed 324 non-browser checks and 74 native Chrome groups in [run 39352924875](https://github.com/woodkill00/aphantasia_build/actions/runs/39352924875). Compact Scene/Sequence sections, a selected-step inspector, reachable Apply/capture actions, visible capture-source context and removal of the decorative hidden-state circle were reviewed using actual native flows and rendered frames. This is scoped engineering acceptance, not inherited v0.3 evidence or physical-device/clinical clearance.

The supported hold/transition/count/total capacities are engineering limits, not medical thresholds. The 11-second circle/square/triangle example is an editable authoring fixture, not a prescription. No autoplay, replay loop, strobe/pulse oscillator, exposure escalation, or automatic reduced-motion cuts are included. Timed playback stays windowed; static/manual preview may use clean fullscreen. No hosted deployment is authorized for this increment.

## Verified historical baselines

- **v0.3:** [CI run 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905), 241 non-browser checks and 54 native-browser groups, sandbox-enabled headless Chrome 155.0.8059.39 on Linux, source head `57b8f2c2811dc246abca55d9630c0581551d448d`. Its HTML is 65,152 bytes, SHA-256 `98cbba97fa2b55835f840295d20ffeb79b40f8fbda8725ca86930f4d67e8823a`.
- **v0.3 visual/user-journey review:** two independent scripted native-browser journeys and 14 inspected actual frames. Observations included roughly 730 px of scrolling between hue and Apply and a hidden-state decorative circle that could resemble residual scene content. This is engineering usability evidence, not a human usability study or safety assessment.
- **v0.2:** [CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180), 216 non-browser checks and 38 browser groups. The initial run passed 36/38; a harness-only fullscreen-event observation repair preceded the complete rerun with unchanged app source. Chrome patch versions differed, so the first failure's cause remains unproven. Preserve the failure and local launch blocker.
- **v0.1:** [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608), 156 non-browser checks and 22 browser groups after the recorded layout/harness repairs.

The [root README](../README.md) and [test report](../imagery-app/test-results/TEST-REPORT.md) distinguish artifact hashes, environments, attempts, and limits. The separate version 0.4 run supplies current sequence evidence; older runs remain historical.

## Sequence acceptance checks completed in the recorded software scope

1. **Closed data contract:** independently review static/sequence separation, canonical validation on every path, unknown/duplicate keys, accessors/holes/depth/UTF-8 bounds, names/IDs, nonempty snapshots, timing increments, total duration, and immutable accepted data. Keep legacy static migration unchanged.
2. **Atomic reduced-click editing:** test Add/Replace with valid and invalid scene drafts, mismatched backgrounds, full capacity, excessive totals, invalid sequence raw fields, reorder/delete normalization, no partial commit/history change on failure, and load-step copy behavior. Confirm sequence edits do not change scene undo history or notes.
3. **Pure timeline:** use injected clocks for exact half-open boundaries, 50% blends, zero-transition cuts, maximum bounds, completion/reset, Pause at the last acknowledged painted frame, explicit Resume without catch-up, generation invalidation, and backward/nonfinite clock behavior.
4. **Real composited pixels:** on the exact built artifact inspect circle/square/triangle reference frames, overlap, 12 + 12 objects, nonblack shared backgrounds, direct cuts without blank intermediates, paused blend identity, and aspect-correct geometry. Verify main + offscreen allocation caps, including resize. Controlled-clock pixels and natural RAF scheduling are separate evidence.
5. **Display authority and lifecycle:** independently test all Stop/Hide/End/Escape paths; scene/sequence edits, imports, selections, section changes, fullscreen entry/exit/error, resize, blur, hidden tab, freeze, pagehide/restoration, and reduced-motion changes. Invoke stale callbacks after cancellation. No callback may reveal content; at most one RAF may remain pending.
6. **Portable files and isolation:** exercise direct-file/offline launch, actual scene/sequence/note downloads, reimports, malformed and superseded files, separate schema/version handling, and no persistence/network additions. Confirm selected exact note preview remains required.
7. **Actual interaction and visual review:** repeat independent synthetic scripted journeys, inspect actual screenshots, and check reachable Apply/capture/Pause/Stop, selected-step focus, keyboard alternatives, clean static/manual fullscreen, narrow windows, zoom, and reduced-motion manual stepping. Do not label agent journeys a human study.
8. **Release evidence:** reassemble, run every affected non-browser and native-browser check, review source/delta independently, and tie outcomes to the final source/artifact. Refresh documentation, queue, report, and manifest only with verified current results. Preserve failures; do not weaken assertions or browser security to obtain a pass.

## Separate acceptance gates

Physical-device and ordinary OS workflows need their own evidence: downloaded-file opening, file choosers and download locations, app switching, sleep/wake, touch/virtual keyboards, fullscreen, and each claimed browser. Phone-sized touch emulation cannot close this gate.

Complete manual accessibility evaluation separately: keyboard-only editing, focus recovery, screen readers and text descriptions, zoom/reflow, forced colors, and reachable concealment controls. Automated checks are partial evidence, not conformance.

Qualified review of actual displayed patterns, colors, transitions, display conditions, and final guidance remains outstanding before broader viewing/research claims. Software checks do not establish sensory safety, clinical readiness, or efficacy. See [timed-presentation boundaries](timing-boundaries.md) and [scientific limitations](scientific-limitations.md).

## Evidence contract

Record command/procedure, tool/browser versions, source and artifact hash, fixture, expected/actual behavior, and PASS/FAIL/BLOCKED/NOT RUN. Distinguish model/DOM doubles, controlled-clock browser pixels, real scheduling, automated user journeys, screenshot inspection, emulation, and physical devices. Preserve failed attempts and explain repairs; missing evidence stays missing.

CI uses preinstalled tools, normal Chrome sandboxing, read-only repository permission, and no deployment. Merge authorization is contingent on the required checks/review passing; merge is not hosted deployment or a medical-readiness claim. See the [browser procedure](../imagery-app/tests/BROWSER-TEST-PROCEDURE.md).

## Deferred decisions

A license remains a maintainer decision. Arbitrary groups/freeform geometry, broader effect-curve authoring, offscreen output analysis, live flash/pulse modes, durable storage, hosted delivery, accounts, telemetry, participant management, and efficacy measures require separate specification and review. Authoring/analysis proposals are not implemented live-display features, and a warning does not clear them for use.
