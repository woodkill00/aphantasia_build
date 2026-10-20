# Reference review, design evidence and baseline

Feature 013 · 20 October 2026. This feature requires repository contract and arithmetic analysis, not new clinical research. No efficacy/safety evidence or viewing prescription is inferred. [Scientific limitations](../../docs/scientific-limitations.md) remain unchanged.

## Provenance of the promoted contract

The accepted atomic multi-selection draft has SHA-256 `d80da6f9dd1636f86558b714a4a4620c9c6e364b12aa57f60e6cdd49352e5ed8`. The promoting task verified that digest before extracting its complete detailed contract into [specification](spec.md) §§2–11 and its full 28 numbered acceptance cases plus mandatory precision subcases into [tasks](tasks.md). Changes to framing identify Feature 013, the final frozen Feature 012 candidate, verified-main dependency and the frozen product decisions. Companion clarifications/plan/analysis/checklists organize, rather than relax, the accepted requirements.

Independent design review dated 20 October 2026 accepted that final consolidated draft for promotion to a bounded repository feature, subject to separately verified Feature 012 integration. It found no remaining design correctness blocker. That verdict did not accept an implementation, native interaction, visual output, performance, CI, release or integration.

## Starting source and distinct evidence classes

- Earlier accepted core main: `edc92d58f83c5ceb3c3233e338a8bad7a85b2d2a`; tree `a436707b99e5b62324f6d9ee6f4f585c6ed210be`. [Workflow 39428678423](https://github.com/woodkill00/aphantasia_build/actions/runs/39428678423) reported 935 Node checks, 160 native groups, package and cleanup PASS. These historical results are not Feature 012/013 results.
- Feature 012 frozen final PR 15 head prefix supplied by the coordinating task: `e819df22`; full candidate tree `0f19c407632ea36765898f2a314b2e3624ce2412`. The supplied [final-head workflow 39441769939](https://github.com/woodkill00/aphantasia_build/actions/runs/39441769939) was running at promotion preparation, not verified complete by this document.
- Locally verified working base: `62f918345482a08aa1c645e18de857dad093bf8e`; `git rev-parse HEAD HEAD^{tree}` returned the same candidate tree. This verifies local tree identity, not protected integration or exact-main CI.
- Required integration evidence: actual integrated Feature 012 main commit/tree and required run result, reconciled against the frozen tree. The integration owner records them in the single queue; differing source requires reconciliation and relevant reruns.
- Feature 013 runtime/native/visual/performance/package/CI acceptance: not established at specification promotion. This document contains design evidence and future acceptance requirements only.

## Repository references

| Reference | Finding used by Feature 013 |
| --- | --- |
| [AGENTS](../../AGENTS.md) and [constitution](../../.specify/memory/constitution.md) | Local self-contained bounded editor; one closed validator; immediate concealment; semantic equivalents; source-bound evidence and single queue. |
| [008 spec](../008-interactive-scene-roadmap/spec.md), [clarifications](../008-interactive-scene-roadmap/clarifications.md) and [tasks](../008-interactive-scene-roadmap/tasks.md) | Stable IF-050 staged arrangement scope and existing one-item behavior; no incidental release/research authority. |
| [012 spec](../012-editor-aids/spec.md), [clarifications](../012-editor-aids/clarifications.md) and [analysis](../012-editor-aids/analysis.md) | Grid/snap independence, explicit aid arming/disarming, marked-view suppression and exact-source native/visual obligations. |
| [Architecture](../../docs/architecture.md) and [editor design](../../docs/editor-redesign.md) | Current controller/display ownership, shared content rectangle, main/offscreen limits, responsive inspector and explicit fullscreen controls. |
| `imagery-app/src/model.js` | Canonical validation preserves tolerated near-hundredth numeric payloads; strict inset and authored/legacy rules remain distinct; shared geometry may return polygons for authored circles/dots. |
| `imagery-app/src/editor-model.js` | Existing single-item placement/clamping, normalized center helpers, 4-pixel drag threshold, 40-entry history constant and defensive full-record locks are compatibility references. |
| `imagery-app/src/app.js` | Current selected-item helpers, generic refresh/history clearing, cancellation/precision overrides, move staging, replacement boundaries and provenance/aids interactions require explicit integration audit. |
| Existing arrangement/direct-edit tests | Retain substantive singleton, hide/lifecycle, rapid-touch first Undo/Unlock, lock/snap and history regressions while broadening controls and history labels. |

## Source-grounded arithmetic findings

The independent review used the existing source model with Node `v24.19.0`, without DOM/browser activity or checkout writes. The final arithmetic audit script digest was `077645cf5cd267509f81248a43371f7a0e210fba6949272fba0ff53680b2a1f4`. Its observations are design calculations, not tests of Feature 013 code.

1. **Preserved tolerated coordinates.** X `[41.23000000001, 48.34000000003]` canonicalizes unchanged. Raw subtraction is `7.110000000020001`; integer lattice difference is 711. A changed-axis +1 command may yield `[42.23, 49.34]`. Therefore no-op/untouched-axis equality is exact payload equality, while real translation's offset invariant is lattice equality.
2. **Rounded-origin zero feasibility.** Authored 1:1 size-1 dot with outline 1.3 has extent 1.8. X `2.80000000001` is valid but rounded 2.8 is invalid; the ordinary inward lattice minimum is 2.81. Pairing it with a filled size-2 dot at X 98 produces ordinary common interval `[1,0]`, yet exact original delta zero is valid. This proves interval-only clamping cannot be the multi-item rule.
3. **Repeated alignment drift.** Authored 1:1 triangle contours, size 20, rotations `[17,37,71]`, X `[40,55,70]`, Y `[30,50,70]` produce successive naive Align left X values `[40,41.52,40.22]`, `[40,41.51,40.22]`, `[39.99,41.51,40.22]`, then continued drift. Fixed comparison-only already-satisfied predicates are required, not merely rounded final coordinates.
4. **Tolerance audit.** Ten authored families × five ratios × three viewport sizes (`1200×700`, `320×760`, `640×360`) × six alignment modes yielded 900 valid computed outputs in the reviewed fixtures. Maximum original-target error was `0.004929032962632363`, maximum final requested-edge/midpoint spread `0.008542650337531654`, with zero observed postcondition failures and zero inset rejections in those fixtures. This supports the specified 0.005/0.01 comparison bounds, not universal geometry/browser acceptance.

These findings do not verify raw-input cancellation, app atomic publication, current locks, history, stale events, native input, actual pixels, physical devices or assistive technologies. Those cases remain in the complete acceptance map. Do not count these 900 calculations as executed implementation checks.

## Coverage estimate, not measured candidate performance

The prepared native plan preserves all 178 existing groups and adds 22, for 200 prepared groups. The earlier group-count-only projection was superseded when independent review required actual batch geometry captures across all authored ratios and legacy wide/tall layouts, plus a frozen-baseline comparison. Recorded Feature 012 duration is 795.126 seconds. Conservative added-work estimates are up to 160 seconds for the initial new checks, 55 seconds for ratio visuals, and 100 seconds for six alternating baseline/candidate pairs, totaling approximately 1110.126 seconds. A proposed 1380-second (23-minute) native limit provides approximately 24% headroom; another 180 seconds gives a 1560-second (26-minute) limit for the same single job. Independent review is required before application. This is a coverage estimate, not measured Feature 013 performance. Current Feature 012 CI, required assertions, sandbox, read-only permissions, cleanup and packaging remain unchanged.

## Deliberate deferrals

Flat session groups, group lifecycle/metadata, nesting, bulk style/timing, resizing/rotation, lasso, selection outlines, smart guides, custom rulers, entered-gap/equal-center modes, persistent preferences, schema changes and larger item budgets are outside Feature 013. Feature 014 may specify flat session groups separately; it is not a dormant data model here. Physical-device/AT/zoom/cross-engine and qualified sensory/research acceptance remain separately reported. Release publication, hosting and collection are not consequences of engineering integration.

Historical estimate, superseded before execution: the initial 198-group plan used 795.126 / 178 × 198 = 884.466 seconds and proposed 18 minutes native / 21 minutes job. Independent review then required actual new batch geometry coverage across ratios and a hash-pinned baseline comparison, yielding the separately reviewed 200-group, 23/26-minute plan above. Neither estimate is measured candidate performance.
