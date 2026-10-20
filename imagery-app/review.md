# Current source and native-browser acceptance: version 0.4

The exact 114,116-byte artifact `3b47699c7f97ffadde30aa1d766ea4ce8226096274899aaac43b0d6d4c115bda` passed 324 non-browser checks and all 74 native Chrome groups in [run 39352924875](https://github.com/woodkill00/aphantasia_build/actions/runs/39352924875), source `13cfac66e80b55d401b454dc99c8e6c690f09962`. Production fixes and the final harness-only observation repair were independently reviewed. The native run confirms repaired focus recovery, 44-pixel short-layout controls, capture-source context, sequence boundaries/composition, genuine real-time playback and cancellation, separate downloads, static color feedback and clean fullscreen. Independent inspection of 28 actual frames from the preceding run accepted this same unchanged runtime; final-run capture evidence is reconciled in the [test report](test-results/TEST-REPORT.md) and summary.

The first two failed v0.4 runs are retained, including native auto-blur/target failures and media observer timeouts. The final harness reads event records before live preference state, retaining trusted synchronous Hidden/black assertions. The live-getter cache explanation remains a hypothesis, not a proven browser defect. No production code changed for that final harness repair.

This is scoped software acceptance. Physical devices, other engines, full accessibility, qualified sensory review and clinical efficacy are not established. Merge status is separate from test acceptance; nothing here claims hosted deployment. Earlier version-specific findings below are historical.

# Source and browser-repair review

Historical reviewed artifact: Imagery Field 0.1.0, 2026-10-19; **40,716 bytes**, SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`. [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) subsequently passed 156 non-browser checks and all 22 scoped real-Chrome scenario groups.

## Baseline source findings

The initial review covered validation, state/visibility controls, imports, privacy boundaries, and accessibility-oriented structure. Its 40,075-byte baseline had SHA-256 `b7563e538a36e09235cfd4f370d6691d5b38c28231d0fcd6a80e3e9696884c88`.

- One closed validator protects presets, edits, imports, history, and serialization. Duplicate decoded JSON keys and unsupported capabilities are rejected.
- Showing a scene requires an explicit action; accepted edits remain hidden. Hide/End/Escape and lifecycle handlers invalidate pending imports. There is no animation or delayed reveal queue.
- Geometry is limited to sparse dots or one contour. Those engineering bounds are not sensory-safety thresholds.
- Untrusted strings use text/value sinks. The reviewed runtime has no network, remote asset, browser-storage, or executable-import path.
- Notes and scenes export separately. Note export requires the exact preview and explicit selection; edits invalidate approval.
- Semantic controls, labels, visible focus, text descriptions, keyboard alternatives, and bounded status text are present. These features do not establish complete accessibility.

Earlier parser regressions for duplicate-key overwrite and unbounded error text remain covered. Additional baseline refinements addressed status scrolling, intrinsic control widths, and End focus behavior.

## Independently reviewed repair delta

The [first real-browser run](https://github.com/woodkill00/aphantasia_build/actions/runs/39333164845) passed 20/22 groups but failed desktop overflow at 320 CSS pixels and the mobile-emulation initial Show assertion; profile cleanup also failed. The original mobile failure's exact cause was not established.

The runtime repair changes only CSS and regenerated HTML: grid tracks can shrink below intrinsic min-content widths, grid children can shrink within those tracks, and the file input stays within its allocated width. Model, UI JavaScript, and shell markup remain unchanged. The repair does not clip page overflow, reduce control targets, change scene/exposure limits, or add animation.

The reviewed harness delta observes one trusted click per native gesture, handles initial settling only after an observed concealment lifecycle event, and preserves strict overflow, Visible/nonblack-canvas, and rapid-lock assertions. Cleanup now confirms process closure before removing its profile, uses bounded termination/removal handling, and preserves failure status. Additional synthetic regressions bring harness/fixture checks to 12.

The independent delta review found no source-level blocker to rerunning CI. The subsequent green run provides the missing browser evidence for the repaired artifact: 22/22 groups passed, with browser closure and profile removal confirmed. The earlier failures remain part of the record; passing this rerun does not establish the original mobile failure's cause.

## Remaining limits

This supports the tested engineering preview only. Physical-device/ordinary OS workflows, other browser engines, manual screen-reader and complete accessibility checks, qualified pattern/content review, and clinical efficacy remain unestablished. See the [test report](test-results/TEST-REPORT.md) and [browser procedure](tests/BROWSER-TEST-PROCEDURE.md).

## Version 0.2 source review — 2026-10-19

Artifact: `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43` (57,177 bytes).

Independent source review accepted this artifact for scoped browser testing. Full-window editing, background/object controls, explicit reveal, concealment, fullscreen fallback and local-data boundaries are preserved. Earlier skip-link, sticky Apply, focus-ring, native Escape, short-viewport and guidance-findability findings were repaired and checked in source. Generated HTML matches the source parts.

Browser fullscreen, zoom/reflow, physical devices, assistive technology and qualified sensory/content acceptance remain separate gates. Static output and engineering limits do not establish medical safety or imagery gains. The earlier v0.1 results above are historical; they do not certify this changed artifact.

### Native-browser evidence accepted

[CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180), source head `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`, passed **216 non-browser checks and 38 scoped headless-Chrome groups**. The application artifact above is unchanged. An independent reviewer inspected the native logs: all 12 trusted fullscreen event snapshots had Hidden state, zero colored pixels, and focus on the visible fullscreen control. Tested narrow/short reflow, object edits, background colors, offline file workflows and concealment checks passed.

The first v0.2 run passed 36/38 browser groups, with fullscreen Escape assertions failing before the harness observed native event delivery. The independently reviewed harness correction observes the event and asserts its immutable synchronous snapshot; it does not poll for eventual Hidden success. The first run used Chrome 155.0.8059.84, while the passing run used Chrome 155.0.8059.39, so the historical failure's exact cause is not conclusively isolated. Both results are retained in the test report.

This supports a scoped engineering preview. Physical devices, other browser engines, OS dialogs, comprehensive accessibility, calibrated display/sensory review and clinical efficacy remain unestablished. Nothing has been merged or deployed.

## Version 0.3 source candidate — 2026-10-20

Independent source review accepted HTML `98cbba97fa2b55835f840295d20ffeb79b40f8fbda8725ca86930f4d67e8823a` (65,152 bytes) for native browser testing. The source and generated HTML match. Bounded live color swatches and range gradients do not reveal the full-field scene; fullscreen suppresses normal chrome and retains an accessible Exit plus explicit Show while hidden. No idle timer or scene animation was introduced.

Review repairs clarified rejected-exit recovery while fullscreen remains active and added a dark-backed focus indicator against variable scene colors. Actual browser and screenshot acceptance remains pending for this candidate; earlier v0.2 results do not transfer automatically.

## Version 0.4 sequence candidate — 2026-10-20

Independent source review accepted candidate `be1be8a2aea767e966033fd9690d4d2e5138b24bdc2fd42ab9ad126deb15c20e` (111,934 bytes) for native verification. Generated HTML matches the source parts and the static model remains unchanged. The pure sequence engine independently passed 25 tests including 8,000 seeded timing-oracle samples; the current aggregate non-browser suite passed 319 checks.

Review found and closed visible mode-switch guard bypass, focus recovery and clock-fault issues. Single visibility authority, generation/epoch cancellation, painted-frame Pause, opaque-frame blending and aggregate two-buffer allocation were reviewed. Actual native temporal pixels, responsive controls, and user journeys remain acceptance gates for this candidate.

The earlier v0.3 candidate independently passed 241 non-browser and 54 native groups in run 39348407905. Two independent scripted user journeys and actual inspection of 14 screenshots identified excessive color-to-Apply scrolling and an ambiguous decorative hidden-state ring. The sequence UI implements compact section selection, reachable actions and removal of that ring. This is engineering QA, not a human usability study or medical clearance.
