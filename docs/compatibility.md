# Compatibility and verification

**Evidence date: 20 October 2026.** Imagery Field is an engineering preview. “Designed to work offline” is not a claim that every browser, phone or file manager has been tested. A narrow viewport is not a physical phone; automated checks are not full accessibility or clinical assessment.

## Current verified runtime

The v0.7 runtime merged in `1b67f86ede76e176fe8a6f9b801bc8023c3f481e` is the same runtime exercised by the [final integration run 39378606917](https://github.com/woodkill00/aphantasia_build/actions/runs/39378606917).

- Tested source: `db7c84baa1f4fda32dfaea4dd3781c16f4adc509`.
- PR test-merge checkout: `937a7ddd7808270557716b4b3979ac6d2249116a`.
- Merged and tested tree: `0f17e003ffe44b916fb67a441c5d2934e83d38d7`.
- Runtime: `imagery-app/index.html`, 167,297 bytes.
- SHA-256: `c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857`.
- Environment: Node 22.23.3 and sandbox-enabled headless Chrome 155.0.8059.39 on Linux.
- Result: **PASS**, 457 non-browser checks, 98 native Chrome groups, and all 78 emitted synthetic captures byte/hash verified and independently inspected. Native execution took 455.236 seconds; browser/profile cleanup passed.

This record identifies that runtime, not an assertion that every later documentation or packaging commit has passed CI. See the [test report](../imagery-app/test-results/TEST-REPORT.md) and [summary](../imagery-app/test-results/summary.json) for exact attempts. Failures remain recorded and are not recategorized as passes after a repair.

## Scope matrix

| Environment or workflow | Status | What the evidence means |
| --- | --- | --- |
| Linux Chrome, direct local HTML file, desktop profile | PASS | Automated rendering, controls, timing, imports/downloads, concealment and offline-request checks on the runtime above. |
| Phone-sized touch emulation in the same Chrome | PASS | Emulated viewport/touch behavior, not a real Android or iOS device. |
| 320×568 portrait, 844×390 short landscape, 1024×768 | PASS | Scoped actual native layout/focus checks and rendered-frame review. |
| 640×450 effective viewport reflow | PASS | Models available CSS space at 200% zoom from 1280×900; not an actual browser/OS zoom test. |
| Controlled-clock pixels and genuine scheduling | PASS | Separate assertions cover deterministic frame sampling and natural scheduling; neither establishes sensory safety. |
| Local sandboxed Chromium launch in the earlier test environment | BLOCKED | Launch failed before navigation. No security bypass was used; it supplies no app compatibility evidence. |
| Alternate Playwright browser suite | NOT RUN successfully | Adapted to v0.7 and syntax-checked; not a successful behavioral browser run. |
| Windows Chrome or Edge, macOS Chrome or Safari, Firefox | NOT RUN | No physical OS/browser support claim. |
| Physical Android/iOS phones or tablets | NOT RUN | File opening, downloads, touch keyboards, switching apps and sleep/wake need direct testing. |
| Ordinary native file chooser/download dialogs | NOT RUN | CDP-driven file/download flows are not OS-dialog usability evidence. |
| Actual 200%/400% zoom, screen readers, forced colors | NOT RUN as full manual acceptance | Partial semantic/focus checks do not establish complete accessibility conformance. |
| Human usability study, clinical efficacy, calibrated sensory assessment | NOT RUN | Software review and agent journeys are not those assessments. |
| Hosted site or installed app distribution | NOT RUN | No hosted deployment is part of this release preparation. |

## File compatibility

The current app exports **scene-v3** and **sequence-v2** JSON. It imports supported older scenes and sequence-v1 only after their original validation succeeds, then migrates them. Current background saturation ranges from 0–100%; legacy scene-v2/sequence-v1 validation retains 0–60%. No legacy-version export or silent invalid-file repair is provided. Notes use a separate export-only format. See [Keep your work](../imagery-app/README.md#keep-your-work).

## Report a new environment accurately

Use a fresh copy of the exact HTML and synthetic files. Record app version/hash, device and OS, browser version, opening method (`file:` versus hosted), viewport, zoom, reduced-motion setting, expected/actual behavior and PASS/FAIL/BLOCKED/NOT RUN. Exercise real file opening and downloads, editing, Hide/Escape, interruption recovery and the relevant timing mode. Do not claim an entire platform is supported from one screenshot or a passing model test.

The [browser procedure](../imagery-app/tests/BROWSER-TEST-PROCEDURE.md) contains the full software and manual acceptance steps. Public reports must follow the [privacy guidance](../SUPPORT.md); never attach real observations or private exports.
