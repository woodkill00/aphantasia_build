# Reference review and accepted baseline

20 October 2026. This feature needs repository contract analysis, not new clinical research. No outside efficacy/safety evidence is claimed or adopted; no viewing prescription is derived from the grid. [Scientific limitations](../../docs/scientific-limitations.md) remain unchanged.

## Exact starting source

- Merged main: `edc92d58f83c5ceb3c3233e338a8bad7a85b2d2a`.
- Tree: `a436707b99e5b62324f6d9ee6f4f585c6ed210be`.
- Local equivalent commit used for the isolated branch: `1a0f839bbf73cb69b06b784c94d3f3851cce1fd7`; its tree was locally verified identical.
- Main postmerge workflow: [run 39428678423](https://github.com/woodkill00/aphantasia_build/actions/runs/39428678423), job `118647677541`. The coordinating task supplied and independently reviewed the result: 935 Node checks, 160 native groups, 656.545 seconds, package and cleanup PASS.
- Unchanged baseline runtime: `imagery-app/index.html`, 322869 bytes; SHA-256 `cab0383c23dbfbf03facc541a4ee2e714c485de529b35ef41698b7160e0b4d7f`.

These results close the accepted core baseline, not this new increment. Changed aids source requires its own full exact-source checks and actual affected capture review. The historical [008 acceptance](../008-interactive-scene-roadmap/acceptance.md) preserves earlier PR/source/visual scope and failed attempts; do not relabel all emitted images as manually inspected.

## Repository findings and decisions

| Reference | Finding used by feature 012 |
| --- | --- |
| [008 spec US2](../008-interactive-scene-roadmap/spec.md#us2--edit-without-dragging-and-arrange-layers-p1p2), [clarifications](../008-interactive-scene-roadmap/clarifications.md) and [task map](../008-interactive-scene-roadmap/tasks.md) | Grid/guides are a later IF-050 increment. Existing snap is independent, session-only, drag/placement-only, with no scene pixels or schema fields. |
| [Architecture](../../docs/architecture.md) | One visibility gate, shared contentRect, main/offscreen buffer bounds, ordinary static editing versus finite separate playback, session locks, exact provenance boundaries. |
| `imagery-app/src/editor-model.js` | Pure hit/place/translate/align and 40-entry history limit; no existing visible-grid or selection-history rewrite is necessary. |
| `imagery-app/src/app.js` | Explicit mode/controller ownership, common conceal/cancel paths, postpaint provenance start, responsive canvas measurement, async import/image/digest invalidation and journal callback seams. |
| `imagery-app/src/provenance-model.js` and `journal-ui.js` | Closed end reasons already include edit. Status and saved association are separate call paths; both need the marked-view exclusion. |
| [Editor design](../../docs/editor-redesign.md), `shell.html` and `style.css` | Preserve actual preview/inspector layout, complete focused rows, 44px targets, explicit fullscreen Show/Exit, and persistent Hide. |
| [Constitution](../../.specify/memory/constitution.md) and [AGENTS](../../AGENTS.md) | No incidental storage/network/packages/security/publication/research scope; exact-source software and external acceptance remain separate. |

The 8 CSS-pixel grid interval and 200-line/230-element bounds are explicit engineering choices for this increment. They are testable but are not clinical safety limits or representative-device performance evidence. The conservative provenance choice is to exclude marked viewing, not invent an unvalidated screen/stimulus measurement.

## Deliberate deferrals

Multi-selection alignment/distribution, transaction generalization, groups, persistence and format migration belong in separately clarified and tested increments after aids. They are not implementation dependencies of this feature. No new empirical usefulness, qualified sensory, physical-device or assistive-technology acceptance is inferred from accepted core software checks.
