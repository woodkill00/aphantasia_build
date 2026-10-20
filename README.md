# Imagery Field

A local-first scene and sequence editor. Version 0.5 makes the actual scene update live from manual edits after one explicit Live preview action. Version 0.4 added ordered scene snapshots, editable holds and adjacent crossfades, manual step preview, and explicitly started one-pass playback. Static scenes still have individual dots/pixels/outlines, object/background HSL controls, immediate editor-only color samples, and optional clean fullscreen viewing.

**Engineering preview only.** This is not a treatment, diagnostic test, or validated way to develop voluntary mental imagery. A lingering afterimage or an external reconstruction does not establish an imagery gain. Static presentation, smooth transitions, and software bounds do not guarantee sensory safety.

**Scoped software evidence:** version 0.5 passed 349 non-browser checks and all 82 native Chrome groups, with 36 rendered captures reviewed. Its recorded native run hit the old workflow deadline after reporting success; the exact-head clean-exit CI gate is tracked separately in PR checks. Independent source/user-flow review and actual rendered-frame inspection informed the repairs. Physical-device, full accessibility and clinical acceptance remain separate. See the [sequence contract](docs/sequence-spec.md) and [current test report](imagery-app/test-results/TEST-REPORT.md).

## Open and use the app

Download and extract the repository, then open `imagery-app/index.html` in a browser with JavaScript enabled. Read **Viewing guidance** before displaying a design. No account, server, Docker, or runtime package installation is needed.

1. In **Scene**, choose a preset or add objects, then adjust position, size, shape, and color. Choose **Live preview** once to see the actual draft, then sliders, shapes, positions, adding/removing objects and presets update it immediately. The preview stays visible beside/above the controls. Small color samples also work while hidden.
2. Live preview does not need Apply. Use **Apply changes** to commit the draft for undo/history and scene download, or **Discard** to abandon it. These actions hide the field; restart Live preview when wanted. Invalid fields also stop/hide preview; fixing them never automatically reveals it. For a snapshot, **Add scene as step** becomes **Apply scene and add step** when there are edits, combining application and capture. **Replace selected step** similarly becomes **Apply scene and replace step**. Both documents are checked before either is accepted.
3. In **Sequence**, choose **Selected snapshot** and edit its name, **Hold · seconds**, and **Transition · seconds**. Valid changes commit immediately while stopped/hidden; there is no extra Apply sequence action. **Move earlier**, **Move later**, and **Delete step** change the order.
4. Choose **Previous** or **Next**, then **Show step**, for manual preview. Or use **Play once** in the window, with **Pause**, **Resume**, and **Stop / Hide**. Pause keeps the exact last painted frame; completion hides the field and never replays.
5. Save with **Download scene JSON** or **Download sequence JSON**. Optional notes have their own preview, selection, and download. Closing or reloading can lose unexported work.

**Load 11-second example** replaces the sequence with circle → square → triangle, stays hidden, and does not start playback. Each shape holds for 3 seconds; the first two outgoing crossfades last 1 second. It is an editable authoring example, not a viewing prescription.

A sequence supports 1–32 nonempty snapshots, 1–12 objects each, holds of 1–600 seconds, and transitions of 0–60 seconds, both in 0.5-second increments. A zero transition is a direct cut, and the final transition is zero. Total duration is at most one hour. These are product-capacity limits, not medical thresholds. One shared background stays constant. There is no autoplay, automatic replay, strobe, or pulse mode.

Timed playback is windowed-only so Pause and Stop remain reachable. Static scenes and manual step previews may use clean fullscreen. Fullscreen transitions and handled lifecycle changes cancel/conceal; nothing automatically resumes. Reduced-motion preference uses manual stepping. See [app instructions](imagery-app/README.md) for exact controls, atomic capture failures, file separation, and viewing cautions.

## Verification: separate artifacts

**Version 0.5 live editing:** see the current test report for its exact artifact, 349/82 results, compact-layout repair, 36-frame review and distinct workflow-timeout outcome. Earlier results below apply only to their historical artifacts.

**Version 0.4 baseline:** [CI run 39352924875](https://github.com/woodkill00/aphantasia_build/actions/runs/39352924875) passed **324 non-browser checks and 74/74 native Chrome scenario groups**, 37 each for desktop and phone-sized touch emulation. Source head: `13cfac66e80b55d401b454dc99c8e6c690f09962`. The 114,116-byte HTML has SHA-256 `3b47699c7f97ffadde30aa1d766ea4ce8226096274899aaac43b0d6d4c115bda`. Node 22.23.3 and sandbox-enabled Chrome 155.0.8059.39 on Linux were used; browser/profile cleanup passed. This covers sequence pixels/timing, atomic edits, reduced-motion events, file flows and revised layout, not untested devices or clinical efficacy. The two earlier failing runs and their repairs remain in the test report.

**Version 0.3 baseline:** [Chrome CI run 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905) passed **241 non-browser checks and 54 real-browser scenario groups** in sandbox-enabled headless Chrome **155.0.8059.39** on Linux. Source head: `57b8f2c2811dc246abca55d9630c0581551d448d`. The 65,152-byte HTML has SHA-256 `98cbba97fa2b55835f840295d20ffeb79b40f8fbda8725ca86930f4d67e8823a`.

Two independent scripted native-browser journeys and inspection of 14 actual captured frames informed the next layout. They found excessive scrolling between hue and Apply and a hidden-state decorative circle that could resemble residual scene content. These are engineering usability observations, not a human study. Compact Scene/Sequence sections, a selected-step inspector, reachable Apply/capture actions, and removal of that circle are implemented and checked in the version 0.4 source, native journeys and rendered-frame review.

**Historical version 0.2:** [CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180) passed 216 non-browser checks and 38 real-browser groups on 2026-10-19. Source head: `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`. Its 57,177-byte HTML has SHA-256 `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43`. A separate fixture check accepted 3 valid and rejected 14 invalid inputs. Its first browser run passed 36/38; a harness-only fullscreen-event observation repair preceded the complete rerun with the app unchanged. The runs used different Chrome patch versions, so the original failure's cause remains unproven.

**Historical version 0.1:** [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) passed 156 non-browser checks and 22 real-browser groups on 2026-10-19. Its 40,716-byte HTML has SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.

Browser results are scoped to automated Linux Chrome and desktop/phone-sized viewport and touch emulation. They do not establish physical-device support, Safari support, ordinary OS file-opening/chooser usability, full accessibility, medical safety, or efficacy. Keep failures and environment blockers in the [test report](imagery-app/test-results/TEST-REPORT.md); see also the [source review](imagery-app/review.md) and [artifact manifest](imagery-app/SHA256-MANIFEST.json).

## Development

From the repository root, using an existing Node installation:

```sh
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/*.test.cjs
```

The dependency-free real-browser suite requires Node 22+ and an already installed permitted Chrome. CI uses preinstalled Node/Chrome with normal sandboxing, read-only repository permission, and no deployment or package-install step. See the [browser procedure](imagery-app/tests/BROWSER-TEST-PROCEDURE.md) for commands and outstanding checks. Never disable browser security to make a test pass.

## Project map

- [Architecture and exact data contracts](docs/architecture.md)
- [Scene and sequence interaction design](docs/editor-redesign.md)
- [One-pass sequence specification](docs/sequence-spec.md)
- [Timed-presentation boundaries](docs/timing-boundaries.md)
- [Portable runtime rationale](docs/portable-runtime.md)
- [Scientific limits and research leads](docs/scientific-limitations.md)
- [Implementation and verification plan](docs/plan.md)
- [Public project queue](project-queue.json)
- [Contributor/agent guidance](AGENTS.md)
- [Security and private reporting](SECURITY.md)

Scene, sequence, and optional observation-note files are separate downloads. There is no durable autosave, backend, telemetry, browser storage, or account system. Use synthetic data in public examples; personal exports do not belong in this repository. Broader effect-curve authoring and offscreen output analysis are future proposals, not implemented capabilities or clearance for live flashing/pulsing. Hosted deployment is outside this increment.

## License

No license has been selected. Do not add one or represent the project as having a particular license without a maintainer decision.
