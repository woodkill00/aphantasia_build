# Research decisions and proposal traceability

Research reviewed 20 October 2026. This is a targeted engineering/scientific planning pass, not a systematic review, participant study or evidence of efficacy. Four review perspectives proposed 16 ideas each and exchanged challenges; the 64 ideas are consolidated below. Their coverage does not mean every idea should become a separate control.

## Decisions supported by the review

1. **Direct manipulation can precede a new schema.** Existing normalized positions and tap-place support provide a conservative P1 foundation. A gesture must update a valid draft without changing accepted snapshots or starting timing.
2. **Geometry precedes useful photo approximation.** Existing circle/square/triangle are contours, while filled dot/pixel sizes are smaller. Twelve current items cannot credibly reconstruct arbitrary photos. Filled adjustable primitives and an authored-ratio contract are prerequisites for a useful area/color approximation.
3. **Scene identity is not stimulus equivalence.** Percentage centers plus shorter-side sizing vary relative geometry across aspect ratios. New fixed-ratio scenes improve reproducibility, but do not calibrate luminance, physical size or viewing distance. Legacy behavior must remain intact.
4. **Accessibility needs more than keyboard dragging.** Provide a single-pointer non-drag alternative as well as keyboard access; preserve semantic selection/focus and reachable cancellation. Source `calc()` rules cannot establish actual reflow or accessibility.
5. **Photo inputs and derived scenes stay local.** Derived vectors can disclose personal content even after EXIF/original bytes are removed. No cloud model or remote tracing service is necessary for initial approximation.
6. **Preference is not imagery improvement.** Separate displayed perception, residual percepts, voluntary imagery and nonvisual memory. Custom ratings remain exploratory; software cannot establish diagnosis or efficacy.
7. **Data quality is not data quantity.** Minimize justified fields; distinguish missingness and interrupted exposure. Separate private journaling from a governed submission service. Do not use public GitHub issues for personal experience/health reports.
8. **Comparative studies require their own design.** Fixed scenes, counterbalancing, repeated-measures analysis, uncertainty, attrition/adverse stops and expectation/practice/carryover checks matter. Do not rank treatment effects from self-selected favorites.

## Algorithm and integration conclusions

Primitive fitting is the closest conceptual match to editable geometric approximation. The Primitive project's examples commonly use far more than 12 items, so their quality cannot be imported as a promise. Its source is not a drop-in browser dependency. VTracer is a candidate for later richer path/vector modes; browser packaging and exact dependency licenses still need verification. Potrace has GPL/commercial licensing implications and must not be silently copied into an MIT-only package. Initial implementation should favor bounded repository-authored logic with no new runtime dependency unless a reviewed decision justifies otherwise.

Raw SVG is not accepted input. A future path mode would require a numeric closed schema, vertex/command caps, fill rules, editability and dedicated testing. Generative cloud image reconstruction, arbitrary paths, 3D/fractals and higher item counts are not needed to complete the first useful increments.

## All 64 proposals mapped to the single queue

Codes E, S, I and R identify review perspectives, not individual credentials. The map retains each original proposal while consolidating overlapping implementation work. Queue IDs resolve in [project-queue.json](../../project-queue.json); [tasks](tasks.md) define deliverables and tests. External gates are deliberately not marked as implemented software.

| Code | Proposal | Queue coverage |
| --- | --- | --- |
| E01 | Preview selection opens inspector | IF-046 |
| E02 | Transactional live drag | IF-046 |
| E03 | Cancellation/concealment invariants | IF-046, IF-058 |
| E04 | Numeric/tap/nudge/keyboard equivalents | IF-047 |
| E05 | Shared mapping and hit testing | IF-046, IF-049 |
| E06 | Semantic item/layer list | IF-047, IF-050 |
| E07 | Responsive layout and focus checks | IF-047, IF-059 |
| E08 | Versioned bounded parametric shapes | IF-048, IF-049 |
| E09 | Layering/locks/duplicate/overlap selection | IF-050 |
| E10 | Optional grid/guides/align/distribute | IF-050 |
| E11 | Authored ratio with preserved legacy behavior | IF-048 |
| E12 | Explicit draft/Apply/history state | IF-046, IF-047 |
| E13 | Versioned original presets | IF-050 |
| E14 | Count/path/memory complexity tiers | IF-049, IF-051 |
| E15 | Closed numeric exchange, no markup | IF-048, IF-058 |
| E16 | Provenance without edit surveillance | IF-054, IF-055 |
| S01 | Separate experience categories | IF-054 |
| S02 | Optional local journal/export | IF-055 |
| S03 | Immutable scene/render provenance | IF-048, IF-054 |
| S04 | Separate exploration/evaluation | IF-054, IF-057 |
| S05 | Baseline/post discomfort and stopping | IF-054, IF-055 |
| S06 | Composed-output review/static alternatives | IF-058, IF-059 |
| S07 | Neutral questions and missingness | IF-054, IF-055 |
| S08 | Visible-time/interruption accounting | IF-054 |
| S09 | Separate granular consent | IF-056, IF-057 |
| S10 | Minimal submission/withdrawal contract | IF-056, IF-057 |
| S11 | Governed secure service | IF-057 (external activation gate) |
| S12 | Instrument rights/scoring registry | IF-057 (external rights gate) |
| S13 | Controlled counterbalanced comparison | IF-057 (protocol gate) |
| S14 | Preregistration and analysis plan | IF-057 (protocol gate) |
| S15 | Uncertainty/repeated measures/attrition | IF-056, IF-057 |
| S16 | Qualified independent review | IF-057, IF-059 |
| I01 | Converter/editor geometry registry | IF-049, IF-052 |
| I02 | Reviewable atomic conversion draft | IF-053 |
| I03 | Generation-safe cancellation | IF-051, IF-053 |
| I04 | Full decode/work/display resource ledger | IF-051 |
| I05 | Crop/focus/manual anchors | IF-052, IF-053 |
| I06 | Honest bounded complexity | IF-051, IF-052 |
| I07 | Restricted primitive families | IF-052 |
| I08 | Palette/background preview | IF-052, IF-053 |
| I09 | Original/result comparison | IF-053 |
| I10 | Local algorithm/seed/crop provenance | IF-052 |
| I11 | Editable ordinary output layers | IF-052, IF-053 |
| I12 | Deterministic iteration/seed mode | IF-052 |
| I13 | Textual/keyboard conversion review | IF-053, IF-059 |
| I14 | Filterable composition presets | IF-050 |
| I15 | Later bounded region/path mode | IF-049 (explicit follow-on, not required first family set) |
| I16 | Human-assisted correction/effort benchmark | IF-052, IF-053 |
| R01 | Explicit interaction state machine | IF-046 |
| R02 | Bounded gesture undo/redo | IF-046 |
| R03 | Single registry/write path | IF-049 |
| R04 | Canonical transforms/quantization/migration | IF-048, IF-049 |
| R05 | Overlap/hollow hit policies | IF-046, IF-050 |
| R06 | Non-drag controls/focus | IF-047 |
| R07 | Shared-token rendered layout evidence | IF-047, IF-059 |
| R08 | Composed animation safety review | IF-058, IF-059 |
| R09 | Bounded cancellable image processing | IF-051 |
| R10 | Honest converter quality/provenance | IF-052 |
| R11 | Versioned presets/evaluation identity | IF-050, IF-054 |
| R12 | Separate personal experience schema | IF-054, IF-055 |
| R13 | Ranking/confounding/missingness safeguards | IF-056, IF-057 |
| R14 | Separate submission trust boundary | IF-056, IF-057 |
| R15 | Compatibility/provenance without fingerprints | IF-054, IF-059 |
| R16 | Risk-based evidence gates | IF-058, IF-059, IF-060, IF-061 |

## Primary and authoritative sources

- [W3C Pointer Events](https://www.w3.org/TR/pointerevents3/): pointer identity/capture/cancellation vocabulary; implementation must verify actual supported behavior.
- [W3C dragging alternatives](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) and [target sizing](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): non-drag and control-size considerations.
- [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): rendered layout requirements, not proof from CSS source.
- [SVG shapes](https://www.w3.org/TR/SVG2/shapes.html) and [paths](https://www.w3.org/TR/SVG2/paths.html): geometric vocabulary; not authorization to accept arbitrary SVG.
- [Primitive](https://github.com/fogleman/primitive), [VTracer](https://github.com/visioncortex/vtracer), [Potrace](https://potrace.sourceforge.net/): algorithm/licensing candidates, not installed dependencies.
- [WHATWG workers](https://html.spec.whatwg.org/multipage/workers.html), [W3C File API](https://www.w3.org/TR/FileAPI/), [OWASP upload handling](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): bounded local processing and input-handling considerations.
- [Aphantasia and involuntary imagery](https://pubmed.ncbi.nlm.nih.gov/38564857/): different imagery phenomena require careful distinction; no app efficacy established.
- [Original VVIQ paper](https://bpspsychub.onlinelibrary.wiley.com/doi/abs/10.1111/j.2044-8295.1973.tb01322.x): instrument version/admin/scoring and rights require verification before embedding.
- [Pupillary imagery research](https://pubmed.ncbi.nlm.nih.gov/35356890/): controlled laboratory evidence does not validate a home webcam diagnosis.
- [W3C flash guidance](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold): consider composed output; no medical clearance implied.
- [OHRP research applicability](https://www.hhs.gov/ohrp/education-and-outreach/online-education/human-research-protection-training/lesson-2-what-is-human-subjects-research/index.html), [GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj): qualified applicability/governance review required, not a blanket claim of legal compliance.
- [Preregistration](https://www.cos.io/initiatives/prereg), [pilot sample-size guidance](https://www.bmj.com/content/390/bmj-2024-083405.full), [CONSORT 2025](https://www.bmj.com/content/389/bmj-2024-081124): study planning/reporting resources, not implemented research protocols.
