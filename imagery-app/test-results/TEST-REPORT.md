# Feature 014 repaired-candidate preparation record

20 October 2026, 17:02 UTC. This is a dated source-and-transport repair snapshot, not native/performance acceptance. Runtime **419083 bytes**, SHA-256 `e4551d303f8883bdcbfe105bde164132c7a5430ed9bf599b5809351f74f744c8`; app `e1bb5f1c8706b9f2f692fc233aafe903a5a5e7e023626690815de1353fcb68ee`. The exact combined runtime/model/DOM suite passes **1289/1289**, Node v24.19.0, 19363.321859 ms; focused UI **146/146** and independently repeated group-plus-selection model **104/104** pass. Exact combined runtime, native two-hunk test-premise repair and lossless transport source review have passed. Complete local `node --test imagery-app/tests/*.test.cjs`: **1353/1353 PASS**, zero failures/cancelled/skipped, Node v24.19.0, **23926.495041 ms**, after accepted runtime/native-premise/transport integration and metadata refresh. **Repaired native, actual visual, paired performance and clean-checkout CI package gates are NOT RUN.** The independently accepted bounded lossless test-evidence transport is integrated; its 23 new tests and 23 existing CDP tests pass. This source acceptance is not a native run.

## First PR 17 native attempt: terminal failure, partial evidence only

[Run 39454651362](https://github.com/woodkill00/aphantasia_build/actions/runs/39454651362), source `7bc6bbf1435275b9fe882a27f0b2564c98238176`, tree `8ea48e89e402c1e5ff6eb5e6bb27b4faf1f6deea`, tested prior runtime `7fac30dabe3e327d3060fc2a25b9975d625950c7d186580a3dd8ce3699b317d9`. The terminal API confirms **FAIL**, native step **FAIL**, and portable package step **SKIPPED**. Full log retrieval ended with “Transport closed”; final native counts, full duration and mobile outcomes remain **UNKNOWN**, not invented from the prepared 224-group count.

The retained partial snapshot contains **146 observed passes and three desktop failures**. Of the twelve new desktop group cases, ten passed and two failed in that available portion. Review byte/hash-verified **198 capture payloads** and actually inspected all **45 available new desktop group images**, with no additional visual blocker in that scope. Two planned desktop group images (rapid/provenance) and every mobile group image were not inspected. These observations do not constitute full-run or repaired-runtime acceptance.

The three retained failures are:

1. **Real paired singleton drag regression:** candidate-minus-frozen-baseline p95 **+12.4 ms**, exceeding the unchanged **+10 ms** limit. Nudge +6.3 ms and first Hide +3.2 ms met their delta gates, and observed absolute handlers were below 50 ms. This does not excuse the drag failure.
2. **Rapid grouped-placement test premise:** the fixture reused the previous live-editor rectangle after placement activated and the editor closed. Independently confirmed repair reads the fresh content rectangle after activation; expected numeric coordinates and rapid release/first Undo gates remain unchanged.
3. **Clean metadata-provenance test premise:** the baseline preceded five selection-induced draws/tracker calls. Independently confirmed repair completes selection before taking the baseline, then activates Group/Ungroup/Group directly; zero-call, raster and dirty-state assertions remain unchanged.

The exact two-hunk native repair is SHA-256 `46ab0bf79e94c502d4729908ebff53276d1ee92cdc5ae4fc3fccf7ba67b8ee66` and is source-accepted, not executed native acceptance. No native case, assertion, timing threshold or expected coordinate was removed.

## Narrow defensive performance repair and its evidence limit

A. Presentation-only counts use already validated internal selection length when groups are empty. Nonempty groups retain the existing validated unit derivation. This is not an input validator, command path, mutable cache or scene publication.

B. An explicit bounded set of document commands with a strictly validated ordinary empty-group envelope delegates to the existing defensive selection planner, preserving its closed scene/selection/command/options, canonical output and lock validation. Group/Ungroup/Duplicate and all commands with groups retain the full group path, including both-stack ID reservations. History and atomic prepublication validation are unchanged.

The three new UI count regressions initially failed **0/3** for repeated empty-group validation; that failed pre-repair attempt is retained. Synthetic local call-count instrumentation on the same maximum-effects singleton move drops full canonical-scene calls **38 → 28** (repaired Feature 013: **26**) while retaining the same **943 Canvas operations**. This diagnoses eliminated redundant validation; it is **not native performance PASS**, calibrated latency, heap measurement or evidence that the +10 ms native threshold now passes. The unchanged paired native comparison and full visual/CI gates must run on the exact repair.

The independently reviewed execution ceiling remains **30 minutes native / 33 minutes for the same job**, with the unchanged +10 ms p95-delta and <50 ms handler gates, sandbox, read-only permissions, cleanup and one-minute package step. No assertion-threshold or security change is part of this repair.

## Bounded lossless transport experiment, independently source-reviewed

The new [transport contract](../tests/BROWSER-EVIDENCE-TRANSPORT.md) preserves exact original stdout/stderr record bytes and capture payloads through ordered Brotli quality-6 blocks. It does not resize/re-encode JPEGs, remove a scenario/assertion, alter thresholds, or change runtime/browser settings. New transport tests **23/23** plus existing CDP tests **23/23** pass. The runner-only integration leaves the runtime, native scenario order and 30/33-minute budgets unchanged.

This is a risk-bearing delivery experiment, not a guarantee of connector capacity. Two retained-corpus every-line replays project to **6,564,851 bytes** (PR 17 basis) and **7,666,076 bytes** (older PR 16 basis) for 350 captures. Neither linear projection is a bound; the second exceeds the reviewed **7,350,000-byte native-output cap**. The cap stays fixed and fails closed. Node/setup/transport-test/package output and Actions timestamp overhead remain outside it, and encoding does not turn whole-job connector reads into bounded range reads.

Retained-corpus replay reconstructed exact bytes but remained synthetic BLOCKED/nonaccepted evidence. Cap, spool, output or decoding failures cannot count as successful delivery; native assertions and cleanup continue, and final acceptance additionally needs independently verified terminal job success plus the expected clean source/runtime identity and case count. The bounded temporary spool is not uploaded or guaranteed retrievable later. No package, permission, workflow action/settings, credential, remote destination or screenshot-quality change is added. Fresh full-run evidence remains required.

## Remaining exact-head gates

[PR 17 checks](https://github.com/woodkill00/aphantasia_build/pull/17/checks) provide subsequent exact-head outcomes; this dated record does not predict them. Exact independent source freeze, refreshed runtime pin, complete local aggregate and offline documentation checks are accepted within their local scope: **58 Markdown files / 400 links**, **88 manifest entries** including all three recursive fixtures and every transport helper/test/document, runtime/transport freeze hashes and whitespace all PASS. Then execute and inspect the complete repaired native, actual visual, same-runner timing and clean-checkout package evidence. The accepted transport helper, tests, runner integration and explanatory document are included in the final aggregate/manifest. No workflow action, setting or permission was changed. Verified prerequisite/main identity and final exact-head review remain integration requirements.

The prerequisite record is also explicitly dated: the integration owner reports that the previous published Feature 013 head `ac0bb7db` has a green workflow status, but its detailed native/visual evidence remains unreviewed because log transport was unavailable. Green status alone does not close that evidence gate. A separate evidence-only Feature 013 update is being prepared with identical runtime `df7dacc50172e624cca42f21dff34437b1ba2ec3f45122fcb232f0cfc1345db4` and the exact accepted transport helper/test/document bytes. No new published head or source identity is claimed here. The eventual group revision must reconcile that dependency while preserving its group source and this dated group evidence; consult [PR 16 checks](https://github.com/woodkill00/aphantasia_build/pull/16/checks) for subsequent exact-head status, not inferred acceptance.

Physical devices, other engines, actual assistive technology, zoom/OS-file workflows, sensory safety and efficacy remain unverified. No release, hosting, collection, storage, dependency or permission change is made by this metadata work.

---

## Historical first Feature 014 preparation, superseded artifact

The following dated record preserves earlier local passes and then-unrun gates for a different runtime. It is not acceptance of this repair, and the first PR 17 failure above remains failed.

# Feature 014 flat session-group preparation record

20 October 2026, 16:03 UTC. This is a dated source-preparation snapshot, not later native acceptance, verified-main integration, a release or hosting. The independently reviewed reconciled runtime is **417565 bytes**, SHA-256 `7fac30dabe3e327d3060fc2a25b9975d625950c7d186580a3dd8ce3699b317d9`; app SHA-256 `c0251f809f29ebb9bab5727214532b1d7bc7633e7a6b26fe3589c0b6cf69a56f`. **Group native, actual visual, measured performance and clean-checkout CI package acceptance: NOT RUN at this snapshot.** Prepared coverage is 224 native groups (200 preserved plus 24 additive) and 94 new planned captures, not passed cases or inspected images.

## Exact local evidence and preparation identity

- Final post-propagation complete local command `node --test imagery-app/tests/*.test.cjs`: **1318/1318 PASS**, zero failures/cancelled/skipped, Node v24.19.0, **21233.043654 ms**. This supersedes the pre-propagation checkpoints below without erasing them.
- Final offline documentation check: **57 Markdown files / 396 local links PASS**; documentation-focused suite **20/20 PASS**. Synthetic preflight **3 valid / 14 rejected PASS**, explicitly no browser execution. All **85 manifest entries**, **three recursive fixture files**, frozen source hashes and whitespace verify. All **19** release-kit/assembler marker pairs reconstruct the exact unchanged runtime. Three initial ad-hoc validation-probe setup errors (private export assumption, guessed part count and whitespace-sensitive parsing) were corrected in the local probe only; no repository source/test was changed to obtain this verification.

- Complete local `node --test imagery-app/tests/*.test.cjs`: **1318/1318 PASS**, zero failures, Node v24.19.0, 23953.905555 ms, after exact manifest/workflow hash refresh. This includes documentation and package-unit fixtures, not a native browser or the actual clean-checkout CI package gate. A later metadata/30-minute-native-budget checkpoint also passed **1318/1318**, zero failures, in 22576.584384 ms, but preceded the final exact inherited native-helper propagation and therefore is not final aggregate evidence.
- Runtime/model/UI aggregate excluding only docs/package-unit suites: **1277/1277 PASS** on the frozen runtime. Focused group plus inherited atomic-selection DOM: **143/143 PASS**, independently repeated (81 group plus 62 inherited tests). Source review found no remaining source blocker; neither count accepts rendered layout.
- Local preparation base `c9a31520bcfb256cf940781d17923ae8867eae47`, tree `51f641ecbd13007028ff1b22d31088fe6f579ba7`, is not verified Feature 013 main. Narrow repairs from independently reviewed upstream runtime `df7dacc50172e624cca42f21dff34437b1ba2ec3f45122fcb232f0cfc1345db4` were reconciled, not whole-app copied. All 62 inherited atomic UI tests remain byte-identical to that accepted source repair. The accepted inherited `browser-multi-selection.cjs` was subsequently copied exactly (SHA-256 `0fdde8f580b5e445318105cdb7c5c8742ae21efd75cdf117028a4e3c8c42a2ab`), including strict actual-ancestor clipping and capture-before-export repairs, together with the matching Feature 013 specification, clarifications and tasks. Earlier local passes preceding that propagation are checkpoints, not final exact-helper evidence.
- Source assembly and release-kit reconstruction include `group-model.js` after `selection-model.js`; source hashes verify unchanged. This metadata pass refreshes the exact runtime hash and implements the separately reviewed 30-minute native / 33-minute same-job ceilings; sandbox, permissions, cleanup, package step and publication behavior are unchanged. Recursive fixture coverage is explicitly checked, including the MIT-preserved local Feature 012 baseline.
- The documentation test's obsolete Feature 013 status assertion is narrowly refreshed to require a dated Feature 014 preparation statement, explicit pending native/visual/performance/package gates, unsaved-group warning and no-group Discard exception. No runtime or native assertions are weakened.

## Retained failures and reviewed corrections

The first focused group run was **105/108**, with three fixture/injector failures: an out-of-inset fifth item, a wrong-realm object passed to the closed validator and an injector that also rejected rollback. The new test fixtures were corrected without runtime relaxation; the original failure remains a failure. The first complete group aggregate was **1271/1279**, with seven stale manifest/package-pin checks and one stale workflow HTML pin. No complete-suite pass was claimed then.

Subsequent independent review reproduced real safety failures despite earlier passing candidates: captured-gesture metadata cancellation **1/6**, clock-fault stale raster **0/2**, semantic refresh/status failure **0/3**, post-publication Hidden-label failure **0/1**, and metadata no-op clock-status failure **0/2**. Each original failure is retained. The repaired path separates safety concealment from metadata-only no-paint publication, physically clears/removes unavailable output, preserves raw input and exact prior state before publication, retains complete hidden transactions afterward, and preserves truthful failure status. Earlier 1243/1243, 1252/1252 and 1258/1258 runtime checkpoints do not accept later source.

Accepted upstream repairs additionally preserve unchanged native Move anchor options, explicit ordinary-input draft intent and exact return-to-origin dirty intent, and the hidden short-window inspector aperture. The reconciled Discard rule is explicit: with no groups, retain a still-valid prior singleton; with any group anywhere, clear all groups and select the first accepted item or empty. Both preserve lock preflight, history clearing and concealment. This exception is now aligned across the specification, clarifications, plan, analysis, case 21 and user guidance.

## Native, visual, performance and integration still required

Execute the final exact assembled suite with all 224 prepared groups and independent inspection of actual captures. Verify exported numeric states separately from observed session groups; exports intentionally omit groups. Inspect full twelve-row labels, item/unit counts, Group/Ungroup/anchor/loss explanations, 44-pixel targets and real focus/corner hits at 1280×800, 320×760, 640×360 and 320×280. The prepared 94 new captures are not an inspected visual result.

Measure same-runner synchronous metadata and grouped-arrangement handler-plus-layout intervals and first Hide, including median/p95/max and instrumentation limits. Investigate attributable work above 50 ms. Cardinality/retention bounds and CI duration allowances do not establish measured performance or physical display latency. The independently reviewed execution ceilings are 30 minutes native and 33 minutes for the same job; this is a bounded coverage allowance, not performance acceptance.


## Feature 014 bounded execution allowance, 20 October 2026

Independent review accepted a 30-minute native ceiling inside the same 33-minute job. The complete accepted guides baseline was 795.126 seconds. Add the prior Feature 013 itemized 315-second projection rounded conservatively to 320, then the Feature 014 upper projection of 360 seconds: `795.126 + 320 + 360 = 1475.126` seconds. The 1800-second native ceiling leaves 324.874 seconds, approximately 22.023% projected headroom. The 33-minute same-job limit retains 180 seconds for non-native work, including the unchanged one-minute package step.

These are reviewed projections, not measured Feature 014 speed or a performance PASS. The failed first Feature 013 run took 1032.432 seconds but did not complete every tail and is not a complete baseline. Actual repaired Feature 013 and complete Feature 014 outcomes/durations must be reconciled before acceptance. The source still investigates attributable handler-plus-layout work above 50 ms. No additional job, retry policy, skipped assertion, package installation, permission expansion, sandbox change, credential retention, upload or publication step is introduced.

Verified Feature 013 main is separately required. Its first native run passed **194/200**, with six failures, and the repaired source's **1192/1192** local pass does not repair that historical result or imply repaired native success. The dated upstream record follows below; [PR 16 checks](https://github.com/woodkill00/aphantasia_build/pull/16/checks) provide subsequent exact-head prerequisite outcomes. No Feature 014 PR or successful CI identity is invented before verification. Every eventual exact head must pass its own required checks and review before protected integration.

Physical devices, other engines, actual assistive technology, zoom/OS-file workflows, calibrated timing, human usefulness and sensory/clinical/research outcomes remain unverified. No new release, hosting, storage, telemetry or collection was added.

---

## Historical Feature 013 repaired and earlier preparation records

The following dated evidence belongs to prior artifacts. Later source cannot inherit its passes, and earlier pending wording is not a current outcome.

# Feature 013 repaired-candidate preparation record

20 October 2026, 15:53 UTC. This is a dated source-preparation snapshot, not a claim of later native acceptance or integration. The independently reviewed repaired runtime is **382339 bytes**, SHA-256 `df7dacc50172e624cca42f21dff34437b1ba2ec3f45122fcb232f0cfc1345db4`. Complete local `node --test imagery-app/tests/*.test.cjs`: **1192/1192 PASS**, zero failures, Node v24.19.0, 17203.442198 ms. Independent targeted UI checks passed 233 tests; atomic UI passed 62. Repaired native/visual/package checks had not run at this snapshot. Every exact head must pass all gates before protected merge; see [PR 16 checks](https://github.com/woodkill00/aphantasia_build/pull/16/checks) for the subsequent exact-head outcome.

## Failed first native attempt, retained

[Run 39447144887](https://github.com/woodkill00/aphantasia_build/actions/runs/39447144887), source `12c2b3563a8018750d09ad16b8d1a2f3008c98ae`, passed 1177 Node and **194/200 native groups**, with six failures in 1032.432 seconds. Chrome 155.0.8059.39, Node 22.23.3, default sandbox and browser/profile cleanup were retained; packaging was skipped. Discard selection, same-name explicit draft intent, and hidden short-window row clipping each failed on both devices. These remain failures, not a timeout or retroactive pass.

All 214 emitted captures were byte/hash verified; 42 new v12 images were inspected, while 36 planned short-layout images were unreached. Review additionally found stale native anchor-option paint and provenance captures taken after export cleared the preview. The other 172 emitted frames are not claimed manually inspected. Paired shared-route timing completed within the predeclared bounds, but the maximum-item candidate-only tail was unreached; this does not accept the repaired runtime.

Repairs preserve the selected singleton on Discard when valid, retain explicit ordinary-input dirty intent including a drag returning exactly to its origin, apply short-window full-inspector scrolling while hidden, and avoid rebuilding unchanged anchor options. Native tests now intersect actual clipping ancestors without relaxing full-label, 44-pixel, focus, corner/center-hit or Hide checks; journal captures occur before Apply/export clears their content. All original assertions and 200 native groups remain. The new failure regressions and original failures are retained. No runtime or test repair is counted as an executed browser pass.

Guides [exact-main run 39444608463](https://github.com/woodkill00/aphantasia_build/actions/runs/39444608463) independently passed 1080 Node/178 native groups, scoped 36-frame visual review, bounded paired timing, package and cleanup on main `d95fbdc004324d1a9e062c085952e4df0bfa4626`. That result does not accept Feature 013. Physical devices, other engines, assistive technology, calibrated display latency and human-usefulness evidence remain unverified. No release, hosting, telemetry or research collection was added.

---

## Historical first-candidate preparation record

The following records preserve the earlier snapshot and its then-pending outcomes; they are not current acceptance claims.

# Version 0.8 atomic multi-selection candidate

20 October 2026. Feature 013 has independent source review and a complete local Node pass. **Native, visual, same-runner timing and clean-checkout CI package acceptance: NOT RUN for this changed runtime.** Prepared coverage is 200 native groups (178 preserved plus 22 additive) and 78 additional actual captures. This report does not claim integration, a release, deployment, physical-device testing or efficacy.

## Exact source and local evidence

- HTML: 381567 bytes; SHA-256 `b3361a68f8ba585fcd3300b435a0ca7a38d3634446763a8983c194645b203bf8`.
- Complete local command `node --test imagery-app/tests/*.test.cjs`: **1177/1177 PASS**, zero failures, Node v24.19.0, 16997.864914 ms. This includes model, DOM-double, documentation and package-unit checks, not native browser execution.
- Pure selection model: 50 new tests; combined unchanged editor/arrangement plus new model suite **79/79 PASS**, independently repeated. Atomic UI: **47/47 PASS**; independent targeted UI review passed 218 checks before the final informational timing-sentence correction, then independently checked that narrow correction and timeline regression.
- Exact assembler and release-kit source marker lists agree; the portable runtime remains self-contained. Runtime source review is accepted, not native acceptance.

## Failures and corrections retained

The first full aggregate passed **1147/1156**, with nine failures: eight stale runtime-hash documentation/integrity/package failures before final metadata refresh and one real same-preset export-dirty compatibility failure. The behavior failure has a focused regression. All nine remain recorded failures, not a pass.

Independent review also exposed exact singleton helper compatibility mistakes (orthogonal-axis rounding, multiplication/division order and half-hundredth placement), provisional/cancellation refresh failure losing raw input or leaving stale visible raster, misleading cancellation text after a complete gesture commit followed by a scroll failure, and stale invalid markers after a successful full-field restore. These were repaired with direct regressions. A full **1177/1177** pass on preceding runtime `fce4844df0a639eba3096516de0e05e8e38e3b9a4e195a1e9cb9b27c240f2ce4` took 17590.644446 ms, but did not accept the later informational timing-sentence correction. The exact final-runtime aggregate above was rerun after that correction and source review.

## Prepared native, visual and timing gates

The additive native suite covers trusted semantic selection/primary controls, rapid multi-drag and first Undo, atomic locks/history/structural commands, invalid raw-input preservation, all authored aspect ratios plus legacy wide/tall batch geometry, idempotent alignment/equal gaps, and 12-row focus/aperture/corner-hit checks at wide, narrow and short layouts. Actual images, not geometry assertions alone, must be inspected. Existing 178 groups and their assertions remain intact.

A test-only, MIT-preserved Feature 012 artifact is pinned to SHA-256 `bfb0470286be0cda2233cfa0ece7c4248f3b224bdf2851821223a7317fdf2735`, from [reviewed PR 15 source](https://github.com/woodkill00/aphantasia_build/commit/e819df22d6a6e01414e58468a55ae7da628d47b1). It is loaded locally on the same Chrome target/device, alternating baseline/candidate order across six pairs of identical synthetic maximum-effect scenes. Compare only preserved singleton nudge, drag and first Hide; new batch and gap operations have no baseline equivalent and remain candidate-only measurements. All trusted raw samples and partial failure evidence are retained.

Before execution, the investigation gates are candidate-minus-baseline p95 ≤10 ms for comparable routes and each candidate event/Hide <50 ms. This measures synchronous handler-plus-forced-layout work, not calibrated screen latency, physical-device performance or human usefulness. There are 32 required reveal guards per device, totaling 198.4 seconds of prescribed test waits; total added work is estimated at 260–320 seconds, not measured. Independently reviewed coverage limits are 23 minutes native and 26 minutes for the same single job, with default sandbox, read-only permissions and cleanup unchanged. The earlier 198-group/18–21-minute estimate is preserved as superseded in [research](../../specs/013-atomic-selection/research.md).

## Prerequisite and remaining scope

Guides PR 15 merged as main `d95fbdc004324d1a9e062c085952e4df0bfa4626`, tree `0f19c407632ea36765898f2a314b2e3624ce2412`, after [exact-head run 39441769939](https://github.com/woodkill00/aphantasia_build/actions/runs/39441769939) passed 1080 Node and 178 native groups in 798.552 seconds, package/cleanup and assigned 36-frame guide visual review. Its [exact-main run](https://github.com/woodkill00/aphantasia_build/actions/runs/39444608463) is still a separate pending gate at this snapshot. Neither result accepts changed Feature 013 source.

Session groups are the next separate engineering increment. Physical devices, other engines, OS file workflows, assistive technology, actual zoom, calibrated display timing, natural-image usefulness and governed participant research remain unverified. No release, hosting, durable storage, telemetry or collection was added.

---

## Historical Feature 012 evidence, superseded current-candidate status

# Version 0.8 editor aids candidate

2026-10-20. Feature 012 is a separate editor-only grid/center-guide increment. **Recorded corrected runtime: scoped source, native, visual, bounded paired timing and package acceptance PASS.** Final evidence/test-assertion head requires its own full CI before protected integration; this report does not claim a merge. The recorded run executed all 178 native groups: 160 preserved groups plus 18 additive aid checks. No new release or deployment has occurred.

## Accepted corrected-head evidence

[PR 15 run 39437474221](https://github.com/woodkill00/aphantasia_build/actions/runs/39437474221), job 118678217139, tested head `5edddc18cabdbaeb6cd9612c34fd8b68f9fc5f16` through merge `e54ba26592a2f156f61f657c7603eba5ead79872`. **1080/1080 CI Node checks and 178/178 native groups PASS**, zero failures, 795.126 seconds on Linux Chrome 155.0.8059.39 / Node v22.23.3. Default sandbox retained; browser and temporary-profile cleanup passed. Runtime 337656 bytes / `bfb0470286be0cda2233cfa0ece7c4248f3b224bdf2851821223a7317fdf2735` matches reviewed source.

Aided rapid release measured 19.7 ms desktop / 31.9 ms mobile emulation. Both delivered the first trusted Undo with complete traces, no retained-event drops and no fling activation/tap suppression. Actual raster/export, geometry, lifecycle, provenance and keyboard/nudge assertions passed.

Independent review byte/hash-verified all **178 captures**. Assigned visual scope is **36 v11 frames**: 27 exactly match previously inspected bytes and all nine new/changed frames were inspected. Both repaired forced-colors screenshots now show visible neutral guides while controls retain the system palette. Both previously unreached aided-history frames were inspected; no scoped clipping/label/focus/Hide blocker. Twenty changed frames outside that scope are not claimed manually inspected. Physical devices, other engines, OS file-picker interaction, screen readers and full accessibility conformance remain unverified.

The timing criterion was declared on PR 15 at 14:16 UTC before these results: per-device same-artifact on p95 minus off p95 ≤10 ms; on maximum and first Hide each <50 ms. Desktop p95 on/off 2.9/1.8 ms (delta 1.1), mobile 2.5/2.5 ms (delta 0); first Hide 7.0/7.2 ms. All scoped criteria passed. This measures 12 trusted setting events per condition plus forced layout, not calibrated display latency or universal performance. The final native source explicitly asserts the same predeclared 10 ms criterion and therefore needs its own exact-head run.

Clean-checkout package consistency passed, including identical runtime bytes, allowlists, ZIP structure/CRCs, metadata and internal/external checksums. ZIP SHA-256 `3b13a9125a4bb139a632d172f2d5fbdd079a79c819f43ed2d172dea4a10702c3`. These temporary preparation files were not published. Prior failed runs below remain failures; this pass does not rewrite their outcomes.

## Artifact and historical local attempts

- HTML: 337656 bytes; SHA-256 `bfb0470286be0cda2233cfa0ece7c4248f3b224bdf2851821223a7317fdf2735`.
- Pure aids model: 67 focused checks passed; UI aids: 67 focused checks passed. Independent review reproduced and then verified repairs for sub-ulp content-rectangle rejection and an overlay cleanup exception interrupting Hide. Persistent cleanup-fault Hide/End/Escape regressions now pass.
- Full local Node attempt after metadata refresh: **1064/1069 PASS, five FAIL**. Release-kit source assembly omitted both new modules. The package verifier correctly rejected the mismatch. The matching SOURCE_PARTS entries were added; exact-byte/source/allowlist checks remain unchanged. Focused package suite then passed **21/21**. The subsequent complete rerun passed **1069/1069**, zero failures, on Node v24.19.0 in 17916.570772 ms. This is local Node/model/DOM-double/package-unit evidence, not native browser execution.
- Native fixture preflight: 3 valid and 14 rejected synthetic cases PASS; no browser executed by that command.
- Optional DOM-only aids do not modify raster/export data, snap preferences or existing accepted history. Aid-affected viewing cannot attach clean provenance until a successful fresh explicit clean display start. At this historical local stage, actual browser assertions, capture inspection and measured paired performance were still pending; corrected-head acceptance is recorded above.

After that 1069-check pass, independent adversarial review reproduced a failed-clean-paint provenance bug: a failed explicit clean start after guide use exposed an older completed record. The corrected candidate releases suppression only after successful raster/start and immediately begins the new display identity. Independent reproduction now remains unavailable. All **77 aids UI tests** pass, including four raster-failure routes, four repeat-lock rejections and two throwing schedulers. Prior passing tests did not detect or excuse this defect. Final corrected-runtime aggregate passed **1079/1079** on Node v24.19.0 in 14791.818884 ms. Documentation checks passed 42 Markdown files / 285 local links; synthetic fixture preflight passed 3 valid / 14 rejected cases. At that point, native execution, actual capture inspection and the clean-checkout CI package gate were pending; corrected-head acceptance is recorded above.

## First exact-head native run and retained failure

[PR 15 run 39434279779](https://github.com/woodkill00/aphantasia_build/actions/runs/39434279779), source `c41840c4a98d54560ac955a5caba6aebebe7b5ae`, finished **176/178 native PASS, two FAIL** in 799.627 seconds with normal browser/profile cleanup. Both failures occur in the new aided input case: after Redo intentionally concealed the preview, the test incorrectly expected a hidden focused canvas to accept ArrowRight. The correction explicitly asserts Hidden and aids-off, then resumes Live and rearms guides before keyboard nudge. No runtime guard or assertion was removed, and the required rapid-release first Undo checks before this point passed. This failed run remains failed; a corrected exact-head rerun was required and is recorded above. Packaging was skipped.

The paired synthetic synchronous setting-handler-plus-forced-layout checks passed: desktop on p95/max 3.5 ms versus off max 1.9 ms, first Hide 6.9 ms; mobile emulation on p95/max 2.6 ms versus off max 2.4 ms, first Hide 6.7 ms. These are not calibrated physical display latency or user-performance measurements. Independent review byte/hash-verified all 176 emitted captures and inspected all 34 reached v11 captures. Normal grids, authored clipping, narrow/short focused labels and persistent Hide passed that scoped visual review. Both forced-colors images revealed a real visual defect: the system palette made CSS grid borders nearly black against unchanged dark canvas pixels. The narrow repair preserves fixed neutral colors only on `.editor-aid-line` in forced-colors mode; controls retain the system palette and existing color-swatch behavior is unchanged. Source and native computed-color assertions were reviewed; at that point actual repaired screenshots and a full rerun were still required; their later acceptance is recorded above. Two aided-history captures were unreached due to the test-sequence failure. No acceptance of all changed older frames is claimed.

After both narrow repairs, the new runtime passed **1080/1080 local Node checks** on Node v24.19.0 in 16967.507973 ms, including **78/78 aids UI/source checks**. The added forced-color source test preserves the pre-existing color-swatch opt-out and permits only it plus guide marks; the first draft of that assertion incorrectly counted only the new opt-out and was corrected without changing existing runtime behavior. That corrected runtime subsequently passed the recorded exact-head native and repaired-frame review above; the final evidence/test-assertion head still requires its own CI.

The final evidence and paired-timing-assertion delta passed **1080/1080 local Node checks** on Node v24.19.0 in 13897.355976 ms. Offline documentation checks passed 42 Markdown files / 286 links. This is local evidence only; the final head still requires full native CI.

## Verified prerequisite, not acceptance of changed code

Core main `edc92d58f83c5ceb3c3233e338a8bad7a85b2d2a` passed [exact-main run 39428678423](https://github.com/woodkill00/aphantasia_build/actions/runs/39428678423): 935 Node checks, 160 native groups, 656.545 seconds, runtime `cab0383c23dbfbf03facc541a4ee2e714c485de529b35ef41698b7160e0b4d7f`, package/cleanup PASS. Independent review hash-verified all 142 captures and accepted the assigned 26-frame arrangement/input visual scope. Core PR 14 is merged; the historical premerge statements below are retained as dated snapshots, not current integration status.

Physical devices, cross-engine behavior, assistive technology, calibrated display timing and human usefulness remain unverified. Multi-selection alignment/distribution and session groups are separate subsequent increments. Research submission remains disabled.

---

## Historical arrangement premerge report (superseded status, preserved evidence)

# Version 0.8 session arrangement candidate

2026-10-20. **Bounded arrangement source, native, scoped visual and package checks PASS.** The recorded source passed **935/935 CI Node checks and 160/160 native groups**. Independent review accepted **26 actual SHA-verified captures: all 22 arrangement plus four rapid-release/focused-Undo frames**. The run emitted 142 captures; not all 142 were manually inspected. Final documentation-head CI and protected integration remain pending; PR 14 is not recorded as merged. Version 0.8 remains unreleased; the published package remains v0.7.0.

## Exact current artifact and prior local evidence

- HTML: 322869 bytes; SHA-256 `cab0383c23dbfbf03facc541a4ee2e714c485de529b35ef41698b7160e0b4d7f`.
- App source SHA-256: `113235f2620a108c5203b4e07b4b2912180b3c6aa0f04da6684ab2934a6d32fd`.
- Command: `node --test imagery-app/tests/*.test.cjs`; Node v24.19.0; 935 tests passed in 13835.289512 ms. This full local suite includes model, DOM-double and package unit tests, not actual browser execution or the clean-checkout package gate.
- Independent source/test-code review accepted the current locked-selection token and required rapid native-test source: 114 focused tests and 9 independent lifecycle/event-order adversarial cases passed, with no source blocker. These checks are separate review evidence, not 123 extra tests added to the 935-test total. Later native/visual acceptance is recorded separately below.
- Reviewed native arrangement test SHA-256: `f49c11af4961adaaca26f5f850e4b55dc1e544b0fde0c2484db4386c3962ea86`. That test-code review alone did not prove execution; the exact-source native result below supplies the executed evidence.

The fourth increment implements session-only full-record stored-item locks, Unlock all, accepted-history guards, successful-only replacement clearing, drag/placement-only Off/1/5/10 snap, Center X/Y/both, and independent unlocked duplication. The scoped P1 active-touch repair is present, with a separate one-shot locked-selection intent that consumes only the matching valid canvas touchstart and clears on interruption. Locks and snap are not exported or persisted. The native fast locked-flick case measured a 34 ms mobile release, preserved coordinates/history, and delivered the first trusted Unlock without fling activation or tap suppression. The separate 120 ms deliberate-hold case did not substitute for this gate.

## Executed arrangement evidence and scoped acceptance

[PR 14 run 39423486474](https://github.com/woodkill00/aphantasia_build/actions/runs/39423486474), job 118630054300, tested source `47adabdd1ca0b301ecb96b3a431b76dc1f63ad76` through test-merge `a955a9bf939666cd491ac19382a5384f6185d903`. The runtime hash/bytes above match the reviewed native report. **935/935 CI Node checks, 160/160 native groups, zero native failures and the clean-checkout portable package gate passed.** Native execution took 645.442 seconds on Linux, Node v22.23.3 and Chrome 155.0.8059.84 with the default sandbox. Browser closure and temporary-profile removal both passed.

Commands were `node --test imagery-app/tests/*.test.cjs` and `node imagery-app/tests/browser-cdp.cjs`, followed by the existing clean-checkout package smoke. The independently verified package passed exact allowlists, ZIP structure/CRCs, internal/external checksums, metadata and identical runtime HTML checks. ZIP SHA-256: `b4c3b91b8c97fbbf786522d7d45632cb29e369af70425688592412b5ed1ab58c`. These temporary preparation outputs were not published.

The mobile original move-to-release interval was 77.1 ms; required rapid movable was 32.6 ms and rapid locked was 34 ms (desktop rapid locked: 8.4 ms). The first trusted Undo/Unlock passed without fling activation, tap suppression, retained-trace drops or errors. Locked canvas touchstart was consumed, Unlock touchstart remained uncanceled, and the first trusted control click activated as required. No retry or deliberate hold substituted for the rapid gate.

The run emitted 142 synthetic captures. Independent review actually opened **26 SHA-verified captures**, comprising **all 22 v10 arrangement captures and four v8 rapid-release/focused-Undo captures** across desktop and touch emulation. Whole narrow lock/unlock/centering labels fit their controls and inspector aperture; focused Undo remained visible at 320 pixels; Hide/End stayed reachable; snapped geometry matched assertions and invalid/import-correction states stayed hidden. This is scoped review, not manual inspection of all 142 frames or keyboard/screen-reader conformance.

The assigned independent source/native/input/scoped-visual/package review accepted this source with no scoped arrangement blocker. Documentation and its narrow assertion are being reconciled without runtime changes; **full final documentation-head CI and independent outgoing-tree review remain required before protected integration**. PR 14 merge, v0.8 release, hosting and collection are not claimed.

Local documentation reconciliation passed `node scripts/check-docs.cjs` (35 Markdown files, 235 local links/fragments), the full 935/935 Node suite on Node v24.19.0 (zero failures/skips/cancellations/TODOs), and whitespace checks. Runtime/source hashes above are unchanged. These local results do not replace full final documentation-head CI.

## Accepted P1 prerequisite, not inherited arrangement acceptance

[P1 run 39418445824](https://github.com/woodkill00/aphantasia_build/actions/runs/39418445824) succeeded on source `372b81d8cf515e3ff19f1f3fca7505970c73d560`: **591/591 Node checks, 116/116 native groups, 92 captures and package PASS**. Independent scoped visual review accepted eight direct-editor captures, six unique. The original 73.2 ms and required rapid 35.8 ms move-to-release paths delivered the first trusted Undo without browser fling activation or tap suppression. [PR 11](https://github.com/woodkill00/aphantasia_build/pull/11) merged as `b8fccdd17240cd89d92872d80200306d64a0b8f3`.

[Diagnostic run 39416525048](https://github.com/woodkill00/aphantasia_build/actions/runs/39416525048), source `8fef7dd862dc7e33e0f3f171ab88c1cbd60bb2f2`, passed 113/114 native groups and remained FAIL. Its Chromium input trace proved fling-controller tap suppression on the original 74.6 ms release path; held release at 203.5 ms and other releases above 80 ms passed. Scoped canvas touchstart cancellation repaired that tested P1 path. The cause is no longer unknown for this observed browser path; neither the diagnosis nor its repair establishes physical-device behavior. Prior failed runs remain failures. P1's accepted source does not accept the changed arrangement runtime.

## Prior gallery/provenance and stacked failures retained

- [PR 12 run 39409429924](https://github.com/woodkill00/aphantasia_build/actions/runs/39409429924): 737 Node checks and 117/118 native groups. All 98 captures were inspected; narrow action-label clipping and mobile Undo click generation blocked acceptance. Later diagnostics showed that screenshot removal and an 80 ms tap dwell alone were insufficient fixes.
- [PR 11 run 39414688866](https://github.com/woodkill00/aphantasia_build/actions/runs/39414688866): 566 Node checks and 108/112 native groups. Four mobile Undo variants failed. Focused Undo visual repair did not itself repair click delivery; the later accepted P1 result above is separate evidence.
- [PR 12 run 39414923557](https://github.com/woodkill00/aphantasia_build/actions/runs/39414923557): 739 Node checks and 120/124 native groups. Four mobile Undo variants failed; package skipped. All 104 capture payloads were verified; 17 changed captures were inspected individually and 87 matched previously inspected bytes. No additional scoped visual blocker was found, but the native gate remained FAIL.
- [PR 13 run 39413117772](https://github.com/woodkill00/aphantasia_build/actions/runs/39413117772): 829 Node checks and 135/136 native groups in 585.313 seconds, normal cleanup, and 116 hash/byte-verified captures. Immediate mobile Undo failed and packaging was skipped. Visual inspection found the narrow gallery thumbnail clipped under pinned Apply chrome. The later test retained individual 320×568 aperture/corner-hit reachability and added an honestly labeled 320×760 simultaneous row/Use/thumbnail capture.
- [PR 13 run 39415125146](https://github.com/woodkill00/aphantasia_build/actions/runs/39415125146), source `65c96ebcae397884deb032d9bc430ddad61d68b7`: 830 Node checks and 135/136 native groups in 591.044 seconds, normal cleanup, package skipped. Runtime was 312959 bytes, SHA-256 `5a6e6114f87b20335ba755f9ec7cbf98187a6ed332b8886f52a10bee82d7c002`. All 116 actual capture payloads were verified and inspected, including repaired whole-gallery controls at 320×760; no additional scoped visual blocker was found. Immediate mobile Undo still failed, although three fresh diagnostic variants and six new gallery/provenance groups per device passed. This run itself did not establish the cause; the later Chromium trace above did.

Later [PR 12 run 39423240391](https://github.com/woodkill00/aphantasia_build/actions/runs/39423240391), source `61c0480baaaf4503209172b9154e1071e61baf37`, passed 764 Node and 128 native checks plus package verification. All 108 captures were byte/hash verified; 19 changed actual frames were inspected, and 89 matched previously inspected bytes. Scoped visual review accepted it, and PR 12 merged as `b5fd8d8cb5728f31e0dd34ad449c0820a71588e7`. [PR 13 run 39423249334](https://github.com/woodkill00/aphantasia_build/actions/runs/39423249334), source `60143a989f3bc84e30028fb8f7ea1ba05f71741c`, passed 855 Node checks, 140 native groups and package verification. All 120 captures were byte/hash verified; 93 changed frames were actually inspected and 27 matched previously inspected bytes. Independent scoped visual review accepted it, and PR 13 merged as `13febfe2ea96958af0ab7661dc7f395ee530e225`. None of these later results converts the earlier failed attempts to PASS. Current arrangement acceptance rests on its own exact-source evidence above. Superseded gallery/provenance and prepared-arrangement summaries remain preserved in summary.json.

Prior scoped source reviews checked the twelve original presets, preservation of the original four payloads, no default thumbnail/hashing behavior, bounded buffers/digest queue, explicit opt-out/Clear, exact preview/download consent and truthful stop reasons. Real Node SHA-256 tests checked canonical scene/whole-sequence hashes, lifecycle interruption, paused-visible intervals and stale-association rejection. These facts remain source/model evidence rather than current native execution.

## Current acceptance boundary and limits

- Recorded exact-runtime native execution, 26-frame scoped capture review and the clean-checkout package gate passed. Final documentation-head CI and protected integration remain pending; accepted PR 12/13 feature visual reviews remain separately scoped. Pure models, DOM doubles and code review alone are not native rendering or physical exposure evidence.
- Ten bounded shape families, five fixed ratios, twelve original presets, optional static thumbnails, experimental local image approximation, private journal-v2 and disabled research information remain bounded engineering features, not all possible geometry, a clinical tool or an activated study.
- Local image conversion has synthetic geometric tests, not a natural-photo or human correction-effort benchmark. Pixel-error reduction is not semantic fidelity or user benefit.
- Foreground-visible duration measures renderer acknowledgments, not attention, eye tracking, calibrated luminance, clinical dose or guaranteed continuous physical visibility. Paused displayed frames count.
- Journal remains optional session memory, with no network, autosave, timestamp, user/device identifier or research submission. SHA fingerprints are not anonymity. Operator, ethics, privacy, security, instrument-rights, retention and withdrawal decisions remain blocked.
- Physical phones/tablets, Safari/Firefox, assistive technology and participant usability remain unexecuted. Historical v0.7 screenshots are not current-feature acceptance.
- No new Release/tag, hosting, real collection, physical-device, accessibility-conformance or clinical claim is made. Visible grids/guides, grouping, distribution, persistent lock/snap metadata, arbitrary paths/3D families, richer inverse graphics and performance-cap increases remain outside this completed implementation scope.

## Historical verification below

# Public repository onboarding, MIT licensing and release preparation

2026-10-20. This increment adds task-based user/contributor/support documentation, privacy-aware forms, current synthetic examples, four original reviewed screenshots, bounded Actions dependency updates, offline portable-file tools and the owner-selected MIT license. It does not change app runtime bytes, publish a Release/tag, upload release assets, deploy a site or change repository security settings. Repository-authored code, documentation and examples are licensed under [MIT](../../LICENSE), copyright (c) 2026 woodkill00; cited research and other third-party material retain their own rights and terms.

## Exact-source CI already observed

[Run 39386135529](https://github.com/woodkill00/aphantasia_build/actions/runs/39386135529), job 118506311402, passed **494/494 Node checks, 98/98 native Chrome groups and the actual clean-checkout portable-file CLI build/verifier** for source `5fd67d4b65c31aeef1b5d955a7c84b641b5fb815` through test-merge `921ed9ed5a96ff876979e05bce5a2861ec34c05b`. Node 22.23.3, Linux, sandbox-enabled Chrome 155.0.8059.39; native duration 456.261 seconds. Browser closure and temporary-profile removal passed. All 78 synthetic capture records were decoded and verified against their byte counts/SHA-256 values (1,396,262 JPEG bytes); 66 were byte-identical to the independently accepted final v0.7 baseline. The 12 differing actual JPEGs were independently visually inspected with no new layout or control blocker. This historical first commit preceded the license integration and therefore does not verify the later MIT packaging changes.

The historical first smoke produced matching standalone/ZIP HTML and passed exact allowlists, archive structure/CRCs, metadata and internal/external checksums. Its ZIP SHA-256 was `6a3c14961b686514ed32ea7e6b7b597b9eebf867fe7c956ad002eb244ca844ac`. That was temporary runner output with the then-unselected license status, not a published release or a license-preserving final distribution.

## Completed MIT integration and local checks

The final local integration passed **498/498 Node checks** on Node 24.19.0, with no failures, skips or cancellations: 20 documentation/onboarding checks and 21 packaging checks augment the unchanged runtime/model/browser-harness tests. `node scripts/check-docs.cjs` passed for 25 Markdown documents and 155 local links/fragments. Browser syntax and fixture checks passed (3 valid accepted, 14 invalid rejected); those preparation commands do not launch a browser.

The approved `LICENSE` SHA-256 is `e787f2e2f0ecac57514b7d4ad51b6b5f737b042b42ce38ea73dd2ce88b5c6d0c`. Portable preparation now requires exactly those license bytes, preserves the notice inside the ZIP and alongside the standalone HTML, and records SPDX MIT plus the license checksum in metadata. Tests reject missing, ambiguous or changed notices and forged packages even if their ordinary checksums are recomputed. Independent Python ZIP reading verifies the deterministic 14-entry licensed archive, CRCs, sorted paths, fixed 1980 timestamps, regular-file modes, exact HTML/LICENSE/example bytes and internal/external checksums. Synthetic fixture commits and package hashes are test inputs, not release provenance.

The builder records the operator-supplied Actions URL without remotely authenticating its status or exact-commit coverage. The read-only workflow runs the full existing sandbox-enabled Chrome suite and then a one-minute CLI preparation/verifier smoke in a clean exact checkout; the current-run URL is explicitly labeled as still in progress. Output remains in a temporary runner directory, with no upload or publication step. [PR 6 checks](https://github.com/woodkill00/aphantasia_build/pull/6/checks) are the authoritative location for the final commit's full native and MIT packaging outcome. Require that exact-head workflow and review to pass before merge; do not substitute this historical source run or local tests for it.

## Unchanged merged runtime and public media

Version 0.7 merged as `1b67f86ede76e176fe8a6f9b801bc8023c3f481e`; its tree `0f17e003ffe44b916fb67a441c5d2934e83d38d7` matches its tested integration. [Runtime integration run 39378606917](https://github.com/woodkill00/aphantasia_build/actions/runs/39378606917), job 118482264215, passed 457 runtime-era non-browser checks and 98 native groups for source `db7c84baa1f4fda32dfaea4dd3781c16f4adc509` through test-merge `937a7ddd7808270557716b4b3979ac6d2249116a`. Node 22.23.3, sandbox-enabled Chrome 155.0.8059.39; native duration 455.236 seconds, normal cleanup. Its 78 actual captures (1,396,276 JPEG bytes) were independently inspected.

The runtime remains 167,297 bytes, SHA-256 `c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857`. All eight runtime/source files match that merged baseline. The four static documentation JPEGs under `docs/images/` are the original unchanged synthetic bytes from the final v0.7 integration run, with exact provenance, capture scales and emulation limits in the [capture manifest](../../docs/images/capture-manifest.json). They were independently visually inspected; no raw logs or personal exports are committed.

## Scope and remaining limits

The current beginner download remains the extracted source ZIP and `imagery-app/index.html`; no nonexistent release-asset link is advertised. Current-format examples coexist with unchanged legacy migration examples. The maintainer builder requires explicit provenance and a clean exact-commit checkout, validates examples and assembled/runtime equality, emits only allowlisted files without overwrites, and verifies archive structure and bytes. MIT selection is complete; an actual public Release, tag, asset upload, hosting or security-setting change remains a separate operation requiring its applicable authorization and verification.

Documentation checks verify local links/fragments, current instructions, source commands, static media provenance and public-form privacy guidance. Validators and UI doubles exercise current/legacy example import/export without automatic playback. These scoped checks do not establish ordinary OS opening workflows, physical devices, other engines, complete accessibility, sensory safety or clinical efficacy. Historical failed/blocked attempts and their original environments remain below unchanged.

<!-- HISTORICAL-V07-SOURCE-EVIDENCE -->
# Version 0.7 live startup and responsive timing verification

2026-10-20. **457/457 non-browser checks and 98/98 native Chrome groups PASS** in [run 39377219664](https://github.com/woodkill00/aphantasia_build/actions/runs/39377219664), job 118477960095. Source head `33bca8b59e52596f0784529b9162ea5240d1a7fb` was tested through PR test-merge checkout `b9087838b1f58fd3a12f3c51bc0d078c82029b88`. All **78 actual synthetic rendered captures** were byte/hash verified (1396233 JPEG bytes); all 78 were independently inspected and accepted for the tested software scope.

## Exact artifact and environment

- HTML: 167297 bytes; SHA-256 `c19be4351ce9fbecfeed5f7ed91578e4659ad299cd83e0e3083ea80e2e00c857`.
- Node 22.23.3, Linux, sandbox-enabled Chrome 155.0.8059.84.
- Native duration: 463.189 seconds (7m43.189s). Workflow exited successfully; browser closure and temporary-profile deletion passed.
- Full commands: `node --test imagery-app/tests/*.test.cjs`; `node --check imagery-app/tests/browser-cdp.cjs`; `node imagery-app/tests/browser-cdp.cjs --check-fixtures`; `node imagery-app/tests/browser-cdp.cjs`. Fixture checks accepted 3 valid inputs and rejected 14 invalid inputs.
- The preinstalled-tool CI retains read-only repository permission and the normal browser sandbox, with no package installation, permission expansion or deployment. Inspected pages reported zero runtime errors, unexpected dialogs or remote app requests.

## Verified software scope

The valid starter draft renders immediately as a static Live preview with the requested HSL 4/60/4 background; startup starts no timer or pulse. Background saturation is editable from 0–100, not capped at its 60 default. Current-format scene/sequence paths preserve 100, while original legacy bounds and item/effect bounds remain unchanged. Numeric entry, slider and fine-step buttons synchronize and actual live pixels change without Apply. Explicit Hide, invalid input and handled lifecycle cancellation remain concealed; valid edits never resurrect output.

Per-item Steady and Pulse selection, mixed steady/pulsing composition, zero-fade hold, overlapping fades and finite automatic end were verified. One deliberate Play action transfers active static preview into finite item playback without bypassing a later Hide lock. Repeated Play, stale callbacks, Stop/Hide/Escape, reduced motion, mode changes and separate snapshot clocks retain their reviewed controls.

Actual native layout checks cover 320×568 portrait, 844×390 short landscape, 640×450 effective viewport reflow and 1024×768, under both desktop and phone-sized touch profiles. Complete labels, focused numeric fields, ranges and fine-step buttons must fit their scrollport, actual controls retain 44px targets, and preview/editor rectangles do not overlap. Header button bounds, whole text, hit testing and compact one-row alignment are checked. Expanded style/timing rows and actual mixed-summary tracks are included. The 640×450 case models the CSS viewport of 1280×900 at 200% zoom; it is not native browser-chrome zoom or text-zoom testing. CSS calc/min/max/clamp and shared sizing tokens are design mechanisms, not proof of every possible layout.

## Failure, review and complete retry

The first attempt below passed 96/98 native groups but failed two new tests because a diagnostic LABEL identifier was mistaken for an input/button target. The explicit element-tag classification repair adds an independent regression and preserves full-label bounds/hit checks and actual-control 44px assertions. Neither previously unexecuted responsive tail was waived: both passed in this full rerun. Independent inspection of all 56 first-run frames also identified a wasted mobile header row; the narrow three-column action-grid repair changed the artifact, so fresh exact-runtime native and visual evidence was required. Actual mixed-summary/track captures were added rather than inferring them from selector screenshots.

The first run used Chrome 155.0.8059.39 and this successful run used 155.0.8059.84; both exact environments are recorded. The harness classification is reproduced by its focused regression, not attributed to an unproven Chrome defect. The 10-minute native step and 12-minute job budgets were approved from measured prior duration plus counted additional guards/checks; no assertions, security flags or acceptance gates were weakened. Local sandbox-enabled Chromium launch was blocked before navigation, so it is recorded as an environment blocker, not native verification.

## Integration and limits

Later documentation-only integration must retain this exact runtime/tests and pass complete exact-head CI before merge; consult [PR 5 checks](https://github.com/woodkill00/aphantasia_build/pull/5/checks). This source-run report alone does not assert a merge or hosted deployment.

Physical devices, other browser engines, ordinary OS dialogs, full accessibility, calibrated sensory/medical safety and clinical efficacy remain unestablished. Browser emulation is not a physical-device test, compressed screenshots supplement exact raster assertions, and agent review is not a human usability study. Opacity/timing limits are engineering restrictions, not medically safe thresholds or composite-output photosensitivity certification.

<!-- V07-FIRST-FAILED-ATTEMPT -->
# First version 0.7 native attempt (failed)

2026-10-20. [First native run 39375994747](https://github.com/woodkill00/aphantasia_build/actions/runs/39375994747) passed all 456 Node checks and 96/98 native Chrome groups, but is a failed workflow. Both new precision-layout groups misclassified a text LABEL as a 44px numeric/range/button target. Later responsive/timing assertions and 20 planned captures did not execute. Repair requires explicit control-role classification while preserving complete-label bounds and actual-control 44px assertions, followed by a complete native rerun.

Source head: `fdb4afff3c943af6118de37b82fb557cf2f25963`; PR test-merge checkout: `7188016cfe29d1f0bcb1dd6bf271b6641975dcdb`. Runtime: 167235 bytes, SHA-256 `842aba7113a8c8372f19e3d8cd7708484447431215ed2d288c12da84bed12b70`. Node 22.23.3 and sandbox-enabled Chrome 155.0.8059.39 on Linux. Native duration 447.411 seconds; browser closure and temporary-profile deletion passed. All 56 emitted synthetic JPEG captures were byte/hash verified (999716 bytes); missing captures and pending visual review prevent full layout acceptance.

The candidate changes one static startup preview, background saturation through 100% with default 60%, explicit Steady/Pulse item modes and calculated responsive precision layout. The native step/job budget is 10/12 minutes based on measured prior runtime plus counted new guards/checks. No assertions or browser-security settings were weakened. Local sandbox-enabled Chromium launch was blocked before navigation; native CI is the actual browser evidence.

Full exact-head CI, actual-frame acceptance and evidence reconciliation remain required before merge. Physical devices, other engines, ordinary OS dialogs, full accessibility, calibrated sensory safety and clinical efficacy are not established. Historical results below do not verify this changed runtime.

<!-- HISTORICAL-V06-EVIDENCE -->
# Version 0.6 verified item styles and finite timelines

2026-10-20. **424/424 non-browser checks and 96/96 native Chrome scenario groups PASS.** [Full successful run 39366282160](https://github.com/woodkill00/aphantasia_build/actions/runs/39366282160), job 118443770240, tested source `3d04cb7d60cc50faa1eaa182b7f5c0b1410d6f79` through PR test-merge checkout `df3e57d63f1cba3d1749e8228f2ef6acb1d046ca`. All **52 actual synthetic rendered captures** were byte/hash verified and independently inspected; no visual blocker remained.

## Exact artifact and environment

- HTML: 162947 bytes; SHA-256 `920e01bf5f3bf6fb306135ba35a14b7a88f1e3e5c5a9b70a461e6f278192bf97`.
- Node 22.23.3, Linux, sandbox-enabled Chrome 155.0.8059.39.
- Native duration: 7m13.973s, with successful workflow exit, browser closure and temporary-profile deletion. The eight-minute native step and ten-minute job are unchanged.
- Commands: `node --test imagery-app/tests/*.test.cjs`; `node --check imagery-app/tests/browser-cdp.cjs`; `node imagery-app/tests/browser-cdp.cjs --check-fixtures`; `node imagery-app/tests/browser-cdp.cjs` using preinstalled Chrome.
- Synthetic fixtures, direct-file/offline app checks, no package installation, security bypass or deployment. The inspected pages reported no runtime errors, unexpected dialogs or remote app requests.

## Verified software scope

Typed numeric values and fine-step buttons synchronize with ranges, including unit names and fractional validation. New-scene background is HSL 4/60/4; strict old-file migrations preserve stored backgrounds and appearance. Independent outline/shadow colors, all five shape silhouettes and whole-item grouped opacity were checked using native raster samples and actual frames.

Static Live preview remains separate from explicitly started finite item playback. Per-item start/fade/hold/end intervals overlap or follow each other, and the latest end controls automatic completion. Shared-clock opacity pulse, exact painted-frame Pause/Resume, Stop/Hide, reduced-motion handling, stale-callback invalidation and mode changes passed. Item and snapshot clocks do not nest; their renderer reuses the same bounded canvas pair. Compact focused fields and action reachability were checked on narrow/short layouts. All prior live-edit, snapshot-sequence, import/export and cancellation groups were rerun, not inherited from older artifacts.

## Failed attempt and repair

[First run 39365150191](https://github.com/woodkill00/aphantasia_build/actions/runs/39365150191) on source `45882413759a10b5950dd1031d6d009cd585303d` passed 423 code checks and 94/96 native groups. Both legacy swatch groups failed because the test adapter overwrote styled fixture records with incomplete raw objects. The strict runtime correctly rejected the malformed schema, so later swatch/history assertions in those two groups did not execute. This was a real failed CI attempt, not a timeout. Native duration was 7m15.283s and cleanup passed. All 52 first-run frames were verified and inspected, but that did not make the aggregate run pass.

The fixture-only repair passes explicit object overrides through the shared fixture builder and adds a regression for exact swatch composition/defaults plus continued rejection of malformed records. Runtime and strict swatch assertions were unchanged. The full successful retry above exercised all previously unexecuted tails. No test, timeout or security setting was weakened.

## Integration and limits

The recorded run verifies the exact source and runtime above. Later documentation-only integration commits must also pass their full exact-head CI before merge; see [current PR checks](https://github.com/woodkill00/aphantasia_build/pull/4/checks). This report does not assert a merge or deployment.

Physical phones, other browser engines, ordinary OS file dialogs, full accessibility, calibrated sensory/medical safety and clinical efficacy remain unverified. Browser emulation is not physical-device evidence. Compressed screenshots supplement exact raster assertions, not a human study. Shared opacity pulse bounds are engineering restrictions, not medically safe thresholds or WCAG certification of composite output.

## Previous version reconciliation

Version 0.5's later [clean-exit CI run 39358880818](https://github.com/woodkill00/aphantasia_build/actions/runs/39358880818) passed 349 non-browser checks and 82 Chrome groups on source `9e26a832bf0d7e98c46e2f1bd3f24cfe5b91b1ee`; it merged as `95e0483905b8aa5845127a3f9ac637720e8ad380`. The earlier timeout report below is historical, not the final v0.5 release state. Its failures remain recorded.

<!-- PRIOR-EVIDENCE -->
# Version 0.5 live-edit software evidence

2026-10-20. The exact artifact below passed **349/349 non-browser checks and 82/82 native Chrome scenario groups**. Independent source review and inspection of **36 actual rendered captures** accepted the scoped live-edit behavior and responsive controls.

**CI outcome is separate:** [run 39358013657](https://github.com/woodkill00/aphantasia_build/actions/runs/39358013657), job 118417249126, emitted a passing full browser report and successful browser/profile cleanup, but GitHub marked the native step **FAILED** at its six-minute deadline (approximately 6m03s). This run is not green CI. The native step budget is now eight minutes within the unchanged ten-minute job. The full suite must run to a clean workflow exit; consult the [current PR checks](https://github.com/woodkill00/aphantasia_build/pull/3/checks) for the exact commit's outcome before merging.

## Exact artifact and environment

- Source commit: `6bcbcc5461ba5b3464af63706495931ec67a24c2`.
- HTML: 118362 bytes; SHA-256 `8eff59e156fc2ae5b631ae56eca05282e6cf8ff012f469ab2f1a8a4971d38326`.
- Node 22.23.3, Linux, sandbox-enabled Chrome 155.0.8059.39.
- Synthetic fixtures only; offline local-file app checks; no package installation, security bypass or deployment.
- Browser closure and temporary-profile deletion both passed.

## What passed

Live preview displays a valid draft without Apply. Native range input changes actual raster pixels before pointer release; six object/background HSL channels use independent expected RGB samples. Object shape/position/add/remove/preset changes redraw while accepted exports/history and sequence snapshots remain separate. Hide/Escape, invalid fields and lifecycle events stop preview; later valid edits never reactivate hidden output. Rejected draft export produces no download and leaves current draft pixels unchanged.

Native responsive checks include desktop, phone-sized touch emulation, 320×568 portrait and 844×390 landscape. The canvas and inspector do not intersect; the complete focused slider must fit inside a scrollport at least 80 CSS pixels high. The remaining static/fullscreen, sequence timing/composition, pause/resume/stop, reduced-motion, validation, file round-trip and cancellation scenarios also passed. These are automated software checks, not a human usability study or physical-phone testing.

## Failure and repair history

1. [First v0.5 run 39356071107](https://github.com/woodkill00/aphantasia_build/actions/runs/39356071107), source `604eec3a4496830c46a07fde3b127d766a355bc0`, passed 349 non-browser checks and 78/82 browser groups. An old color test did not wait the reveal guard after editing; a new export test incorrectly expected concealment from a rejected unapplied export. The corrected tests retain the real guard wait and assert no download, guidance and unchanged draft pixels.
2. Actual screenshots exposed a focused slider clipped at 320×568 despite center hit-testing. Compact live-view chrome/padding and a 25% preview / 75% inspector split at short portrait sizes repaired the scrollport. The test now checks the entire slider and minimum scrollport height.
3. The complete retry passed all 82 groups, captured 36 frames and cleaned up, but exceeded the workflow step's six-minute deadline. The budget-only repair to eight minutes retains the full suite and unchanged security settings.

## Limits

Physical phones, other browser engines, ordinary OS file dialogs, full accessibility, calibrated sensory assessment and clinical efficacy remain unverified. Software tests and static/gradual visuals do not establish sensory safety. The historical reports below apply only to their recorded artifacts.

---

# Version 0.4 verified software preview

Date: 2026-10-20. **324/324 non-browser checks and 74/74 native Chrome groups PASS.** [Successful full run 39352924875](https://github.com/woodkill00/aphantasia_build/actions/runs/39352924875), job 118401068686, tested source `13cfac66e80b55d401b454dc99c8e6c690f09962` through PR test-merge checkout `7dc3a5663548e1275d34f8f611807d44fdc9f19e`.

HTML: **114,116 bytes**, SHA-256 `3b47699c7f97ffadde30aa1d766ea4ce8226096274899aaac43b0d6d4c115bda`. CI used Node **22.23.3**, Linux and sandbox-enabled Chrome **155.0.8059.39**. Browser closure and temporary-profile removal both passed. No package-install, security-bypass or deployment step was added. This is a local software preview, not medical or comprehensive accessibility clearance.

## Executed checks

The dependency-free suite passed 113 static-model/controller, 25 sequence-engine, 153 DOM/Canvas/clock-double, 11 static-artifact and 22 CDP transport/fixture/oracle checks. Browser-helper syntax and synthetic fixture checks passed. Commands:

```sh
node --test imagery-app/tests/*.test.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
node imagery-app/tests/browser-cdp.cjs
```

All 74 native scenario groups passed, 37 per desktop and phone-sized touch-emulation profile. Coverage includes immediate draft HSL swatches; static and manual fullscreen with explicit Show/Exit; atomic scene-to-step capture and separate file round trips; controlled-clock native RGB at hold/crossfade/cut boundaries; 12+12 overlapping objects; genuine real-time Play/Pause/Resume/Stop and one-pass completion; native focus recovery; stale callback/mode/lifecycle concealment; reduced-motion changes; and fixed actions/focus/hit targets in narrow/short layouts, including 44-pixel Stop/Show targets at 320×180. The 320×180 assertion is native geometry/hit-testing evidence, not a screenshot claim.

Each native case reloads the document. Controlled test clocks do not leak into the separate unmodified real-time journeys. Event waits observe delivery only: immutable trusted fullscreen and media-event snapshots must already report the required hidden state and black raster. The tests do not poll until application concealment eventually succeeds. All previously unexecuted tails now ran and passed in the complete successful run.

The independent engine suite includes 8,000 seeded timing-oracle samples. Earlier isolated sequence-engine coverage was 99.10% lines, 93.37% branches and 100% functions for the unchanged engine only; it is not whole-app or native/device coverage.

## Actual visual and user-flow review

The final run captured 28 compact synthetic JPEG checkpoints, totaling 312,207 bytes. Every decoded byte count and SHA-256 was verified. Actual pixels were inspected in four contact sheets, with full-size desktop circle-hold and desktop/mobile hue/action-strip rechecks; no new visual blocker was found. This is consistent with the independent review of all 28 preceding-run frames for the exact unchanged runtime hash. The current artifact shows color samples and reachable Apply/capture actions, a source-scene caption with separate Applied/Staged status, correctly separated static and snapshot edits, clean shown fullscreen, explicit hidden Show, the expected circle hold and blended paused frame, and black fields after Stop/Exit. Native independent journeys exercised authoring, replacement/reorder/timing edits, save/reload, manual preview and unmodified real-time playback.

These are automated user-perspective engineering checks, not a human usability study. JPEGs are reduced/compressed; exact colors and concealment use separate native Canvas pixel assertions. Long-name behavior is covered in source/regression tests; canonical-name screenshots do not prove every possible layout.

## Preserved failures and repairs

1. [First v0.4 run 39350355646](https://github.com/woodkill00/aphantasia_build/actions/runs/39350355646), source `6c0e73e99b67b410569261880ce42f8403354725`, original HTML `be1be8a2aea767e966033fd9690d4d2e5138b24bdc2fd42ab9ad126deb15c20e`: 319 non-browser checks passed, 66/74 native groups passed and 8 failed. Native auto-blur exposed focus recovery reading activeElement too late; tiny Stop targets were below the unchanged 44-pixel requirement; media assertions ran before observed native delivery. Repairs preserve focus before hiding/disabling, reserve minimum target size and observe immutable native-event snapshots. Source/target capture context was also clarified. Failed groups' unexecuted tails were not counted as passes.
2. [Second run 39352036226](https://github.com/woodkill00/aphantasia_build/actions/runs/39352036226), source `551b9800680145ae398dda47b9bfdfec024e6938`, current runtime hash: 323 non-browser checks passed; 67/74 native groups passed and 7 failed waiting for the separate media-query observer. The original focus/target failures and all six independent sequence journeys passed. The app's diagnostics showed its motion handler had concealed, but the observer did not record the expected event. This was still an overall failed run.
3. Independently reviewed **harness-only** repair removed the observer's live MediaQueryList.matches read between emulation invalidation and native change delivery. It waits only on event-record count, then checks trusted event, expected preference, Hidden description, every-pixel black raster and final live preference. A two-direction regression rejects reads during pending delivery. No timeout was increased and no behavior assertion was removed. The cache/getter causal explanation remains a hypothesis; the observed timeouts resolved in the full successful rerun with unchanged production HTML.

Both failed runs remain failures, not retroactive passes. The successful run supplies the current acceptance evidence. The previous local sandbox-enabled browser launch blocker was not bypassed; existing GitHub CI supplied native execution.

## Remaining gates

Physical Android/iOS devices, ordinary OS file choosers/opening/download locations, other browser engines, full screen-reader/keyboard/zoom/forced-color accessibility, calibrated display/color/timing, qualified sensory assessment and clinical efficacy remain unverified. Timed playback is windowed, single-pass and has no autoplay, replay loop or flash/pulse oscillator. Wider effect analysis/authoring remains a proposal. No hosted deployment is included.

---

# Version 0.3 candidate verification

Date: 2026-10-20. Current status: **241 non-browser checks and all 54 native Chrome groups PASS on the exact v0.3 artifact.**

Candidate HTML: 65,152 bytes; SHA-256 `98cbba97fa2b55835f840295d20ffeb79b40f8fbda8725ca86930f4d67e8823a`. Repository baseline: `f614c2733ac6c8df838e9dd3d7ffdf6dd746745a`. First tested source head: `b16cc2683145389abe53e30ae201d978d26c99c9`; PR test-merge checkout: `61570e66e0e7258af20fe9728a72e147faa58e46`. The baseline rerun passed 216/216 on Node v24.19.0 before test changes.

## Executed non-browser checks

On Linux with Node v24.19.0, the frozen candidate passed 241/241 after the harness repair: 113 model, 100 DOM/Canvas-double, 11 static, and 17 CDP harness/fixture/oracle checks. Browser suite syntax and separate fixtures passed (3 valid accepted; 14 invalid rejected). Commands:

```sh
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
```

The first expanded development run passed 235/236. Its sole failure was a capitalization assumption in the test: the actual fullscreen error said “Exit fullscreen to apply or discard…” while the assertion expected capitalized “Apply.” A case-insensitive assertion now retains the required actionable error. No runtime behavior assertion was removed. The exact developing artifact hash was not captured for that first attempt; it is not used as acceptance evidence.

New tests cover per-input object/background HSL samples without Apply or full-field painting, gray/black semantics, selection/history/import synchronization, missing-object samples, hidden fullscreen controls, draft/repeat guards, focus recovery, rejected Exit, lifecycle concealment and stale callbacks. The implementation adds no fullscreen timer. The existing download cleanup timer cannot draw, reveal, or restore fullscreen UI.

## Real-browser and visual gates

The expanded suite prepares 54 real-Chrome groups (27 per desktop and phone-sized viewport/touch-emulation configuration). It adds an independent HSL-to-RGB oracle; native range input observations before change; actual computed swatches; hidden studio/tab-order checks; keyboard Show/Exit; pointer-idle and first-touch Exit; short fullscreen controls; injected Exit denial; and native fullscreen entry/Exit/Escape. The prior trusted fullscreenchange assertions are unchanged: the app must synchronously leave Hidden state, all-black canvas pixels, and correct mode-control focus at the observed native event. Polling only waits for event delivery, never for expected concealment.

[First v0.3 CI run 39347872671](https://github.com/woodkill00/aphantasia_build/actions/runs/39347872671), on sandbox-enabled Chrome 155.0.8059.39 and Node v22.23.3, passed 240 non-browser checks and 52/54 browser groups. The two short-fullscreen groups failed because the test required “Exit fullscreen” to precede “apply or discard,” while the correct displayed guidance supplied those directions in the opposite order. This is a verified test-order assumption, not a missing direction. The repaired helper now separately requires both directions; its regression rejects a message missing either. Runtime sources and HTML are unchanged. The groups stopped before injected Exit denial, so that remaining tail was NOT RUN on the first attempt; the complete rerun below subsequently executed and passed it.

All 14 requested shared-reference JPEG frames were captured, decoded, hash verified, and inspected by the tester (154,158 total JPEG bytes). The actual frames show the purple H260/S30/L50 sample and color-gradient tracks, a purple-only middle-square change, consistent outline geometry, clean fullscreen with just upper-right Exit, hidden fullscreen with explicit Show, and black scene after Exit. Desktop and phone-sized touch emulation were inspected; images are reduced/compressed, and exact Canvas RGB/black pixels are checked separately. Real scripted scroll observations show about 740 CSS pixels between object hue and Apply, a concrete future UI-placement opportunity. This is not a human usability study.

The first run recorded zero page runtime errors, unexpected dialogs, or remote app requests. Browser closure and profile removal passed. No new local browser launch was attempted because the previous sandbox-enabled launch blocker remains; no package, workflow, or browser-security workaround was used. [Complete v0.3 rerun 39348407905](https://github.com/woodkill00/aphantasia_build/actions/runs/39348407905) passed 241 non-browser checks and all 54 native groups on Chrome 155.0.8059.39 / Node v22.23.3. Source head: `57b8f2c2811dc246abca55d9630c0581551d448d`; PR test-merge checkout: `345a041818b452f8da648d30834817e1c6a43598`. Both injected-Exit-denial tails now executed and passed. Cleanup, runtime/dialog/request checks passed. The runtime HTML was unchanged between runs.

Computed swatch checks establish CSS color and sample dimensions. They do not by themselves establish that a sample remains within the editor scrollport during every mobile slider gesture. The slider gradients are additional immediate feedback. Real pixels and user-perspective interaction review remain necessary.

Physical devices, ordinary OS dialogs, Safari, full screen-reader/zoom/manual accessibility, calibrated color, qualified sensory review and efficacy remain unverified. Historical v0.2/v0.1 results below belong to their recorded artifacts only.

The separate independently authored browser-user module adds two groups per configuration: construction of the exact shared three-outline scene through trusted native controls, and draft/discard/apply/view flows with its own painted-pixel RGB oracle. Its synthetic fixture and three RGB expectations pass without launching a browser. These scripted interactions are not a human usability study.

---

# Software verification report

## Current v0.2 result: scoped Chrome CI PASS

Date: 2026-10-19. **216/216 non-browser checks and 38/38 browser groups pass** in [Chrome CI run 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180), after an event-observation harness repair. The first v0.2 run passed 36/38 groups and failed both native-Escape fullscreen groups; that failure is preserved below. Production source and the app hash did not change between those runs. Previous v0.1 browser passes below do not establish v0.2 compatibility. No physical-device, full accessibility, sensory-safety, or efficacy acceptance is implied.

### Exact candidate

- HTML: `imagery-app/index.html`, **57,177 bytes**.
- SHA-256: `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43`.
- Restored repository base: `ece81bf045afcd3045622fdad625271b717bde3e`. Successful source head: `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`; PR test-merge checkout: `9175892d5a9872f810fa216962b3017507d96eb0`. This test checkout is not evidence of a merge to main.
- Successful CI: Ubuntu 24.04.5, Node **22.23.3**, Chrome **155.0.8059.39**, default sandbox. The earlier failed v0.2 run used Chrome 155.0.8059.84; these versions must not be conflated.
- Executed local environment: Linux, Node **v24.19.0**. All fixtures are synthetic.

### Executed results

| Layer | Result | Coverage and limits |
| --- | --- | --- |
| Model/controller | 113 PASS | Strict v2 nested objects/arrays/colors/IDs/ranges; all 7,200 original v1 boundary combinations; v1 migration; parser limits/duplicate keys; aspect-correct deterministic geometry; 10,000 seeded controller commands; history, guards and import invalidation. |
| DOM/Canvas doubles | 79 PASS | Delivered inline scripts; object edits/selection/add/remove/placement; all six HSL inputs hide before change; background-only scenes and black Hide; fullscreen entry/exit/unsupported/rejected/late completion; stage-owned hiding controls; lifecycle/import races; preview-only note export; focus recovery and guidance. These are synthetic doubles, not actual browser/layout evidence. |
| Static artifact | 10 PASS | Source/artifact equality; classic inline scripts; static-only/network/storage prohibitions; semantic labels; full-stage control ancestry. Fullscreen is now explicitly allowed, replacing the obsolete v0.1 blanket prohibition. |
| CDP transport/fixtures | 14 PASS | Transport, lifecycle settling, shutdown and independent parser fixtures. No Chrome launch in this layer. |
| Standalone fixture check | 3 accepted / 14 rejected | Includes v1 migration, v2 scenes, nested duplicate keys, unsupported object fields, duplicate IDs and invalid colors. |
| Native browser suite | 38 PASS / 0 FAIL | Chrome 155.0.8059.39; 19 desktop plus 19 phone-sized viewport/touch emulation. Cleanup PASS; zero app runtime errors, unexpected dialogs or remote app requests observed. |

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

### Executed browser scope and remaining gates

The existing sandbox-enabled local Chrome runner was attempted against the restored v0.1 baseline using `/usr/bin/chromium`. It timed out waiting for `DevToolsActivePort` after 20 seconds, before any browser case or app navigation. Both observed attempts recorded BLOCKED, zero cases, browser closure and profile removal. The second launch was a duplicate while the first background command's result was being collected, not a security workaround. No sandbox bypass or further local launch retry was made. This environment failure is neither a v0.2 app failure nor browser success.

The successful 38-group CDP run covers actual file-URL operation, offline request/error observation, real disk download/file-input round trips, malformed/inert imports, import races, notes separation, native display controls, selected responsive/focus checks, and repeat-action guard checks. New groups cover trusted native object selection/add/remove/move, all six native HSL sliders with concealment before `change`, empty colored backgrounds with black Hide, fullwindow aspect-correct raster geometry, one-click placement, actual fullscreen entry/exit/Escape and in-stage Hide/End/focus, injected fullscreen denial fallback, skip-link recovery, 320×568 and 844×390 focused controls, 320×180 directly reachable Hide/End, and v1 import/v2 export.

The injected denial case tests fallback handling, not a real browser permission denial. Viewport/touch emulation and a 320×180 CSS viewport are not a physical device or a complete actual-zoom/screen-reader assessment. The run establishes its recorded Chrome scope, including actual object/slider edits, background concealment, aspect/reflow and native fullscreen transitions. It does not establish behavior across other browser versions, operating systems, physical devices or compositor frames before delivery of the fullscreenchange event. The alternative Playwright suite was schema-adapted and syntax-checked only; it remains NOT RUN.

### v0.2 attempt and correction history

1. Restored v0.1 baseline: **156/156** original non-browser checks passed at SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.
2. First adapted v0.2 run: **202/206**, with four harness assumptions exposed: geometry returns a canonical CSS color string; placement intentionally consumes `pointerup`; the fullscreen root is an outer `div`; and a particular original v1 size/radius combination is valid. The tests were corrected to these verified contracts; validation, placement state, ancestry and color assertions were retained. The rerun passed **206/206**. Brief simultaneous source changes to match the mistaken assumptions were reverted; a concurrent model-only diagnostic failure from that transient state is not candidate evidence.
3. Accessibility review repairs: skip-link recovery, unclipped canvas focus, non-sticky Apply row, direct guidance access, fullscreen focus recovery, preserved native Escape default, and narrow/short reflow. Tests explicitly assert Escape remains unprevented and still conceals immediately. Added regressions passed **214/214** on the exact frozen candidate above.

4. **[First v0.2 Chrome CI run 39343004081](https://github.com/woodkill00/aphantasia_build/actions/runs/39343004081):** source head `fdb05e0e368b75bd1b62808f299a73f31ea986e4`, PR test-merge checkout `533204ed06c83c6e548471fa30e939b3cfaf4141`, Ubuntu 24.04.5, Node 22.23.3, Chrome 155.0.8059.84 with default sandbox. Non-browser **214/214** passed; browser **36/38** passed; both native fullscreen groups failed immediately after native Escape with `Visible` where `Hidden` was expected. Other groups, runtime/request logs, browser closure and profile removal passed. This run was not a pass.
5. **Event-observation repair:** the old test observed `fullscreenElement === null` and asserted Hidden before requiring delivery of the asynchronously queued `fullscreenchange` event. Native Escape can be consumed by the browser, so a DOM keydown is not guaranteed. The first run omitted event snapshots, so its exact cause cannot be proven retrospectively. The repaired harness registers its observer after the app and takes a synchronous immutable fullscreenchange snapshot: native trust, element, visibility, black-pixel count, canvas label and focus. It waits only for event receipt, then asserts immediate Hidden/black state and repeats the existing live pixel check. Before-action, after-action and event times are logged on success and failure. Two regression checks reject missing/untrusted/colored/visible/wrong-focus snapshots. **216/216** local checks passed; production source and HTML hash were unchanged before rerunning CI.

6. **[Successful v0.2 rerun 39343535180](https://github.com/woodkill00/aphantasia_build/actions/runs/39343535180):** exact source head `f27405d7a4a14ed24a0a95d8f5fc0f5155ff7a4b`, test-merge checkout `9175892d5a9872f810fa216962b3017507d96eb0`, Chrome **155.0.8059.39**, Node 22.23.3. **216/216** non-browser checks and **38/38** native browser groups passed. All twelve recorded fullscreen transitions across the two configurations were trusted browser events whose same-event post-app snapshots were Hidden, contained zero colored canvas pixels, and focused the appropriate visible mode control. Browser closure and profile removal passed; runtime errors, unexpected dialogs and remote app requests were zero.
7. **Event-order evidence and its limit:** successful traces show the fullscreen element property changing before the event observer ran for entry and explicit Exit. For example, desktop entry recorded the new element with event count 0 at 190.7 ms, then the event snapshot at 202.8 ms; desktop explicit Exit recorded no fullscreen element with event count 1 at 3378.2 ms, then the event snapshot at 3389 ms. In this successful run, native Escape's event was already processed before the post-action read in both configurations. These observations support event-delivery synchronization and are compatible with the suspected first-run race; they do **not** prove the earlier Escape failure's cause or establish pre-event compositor behavior. Strict synchronous event-state/raster/focus assertions remain in place.

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
