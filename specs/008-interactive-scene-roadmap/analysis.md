# Cross-artifact analysis

20 October 2026 · Design analysis, not runtime acceptance.

## Coverage and consistency

- The seven user stories cover direct movement/selection, equivalent interaction, broad shapes, presets, photo approximation, private reflection and a disabled future submission boundary.
- All 64 review proposals are mapped in [research.md](research.md) to stable IDs in [tasks.md](tasks.md) and the [single queue](../../project-queue.json). Overlaps intentionally share tasks.
- P1 preserves existing scene-v3 semantics. P2 explicitly requires scene-v4 and sequence-v3 to avoid losing authored-canvas metadata in snapshots.
- Gesture undo is draft-scoped; accepted Apply/history/export remains explicit. UI wording must prevent two unrelated Undo meanings from becoming ambiguous.
- A fixed authored ratio helps repeat composition but is not calibration. Legacy viewport-relative scenes are not silently transformed.
- The 12-item cap and current canvas buffers remain unless a measured/reviewed change justifies otherwise. This prevents photo quality ambitions from quietly expanding renderer resources.
- P4 is memory-only and optional; P5 has no operational submission path. Governance, instrument rights, recruitment and deployment are not automatically approved by feature implementation.
- The constitution preserves existing Hide/lifecycle/static-startup/finite-clock/import boundaries. No package or CI/security change is required by the specification.

## Risks and required mitigations

| Risk | Consequence | Mitigation and evidence |
| --- | --- | --- |
| Inspector reflow during drag | Pointer/item jump, incorrect stored coordinates | Defer layout-affecting change or freeze content rect; native drag geometry assertion and screenshots |
| Overlap/hollow geometry ambiguity | Wrong item selected | Document topmost/hollow/tolerance policy, list and overlap cycling; fixture matrix |
| Dual draft/accepted history | Lost work or unintended commit | Explicit labels and one transactional write path; apply/discard/undo interleaving tests |
| Silent old-file reinterpretation | Broken user files or incomparable scenes | Strict versioned validators/migration; golden legacy fixtures and capture metadata tests |
| Async conversion after Hide/edit | Unexpected scene reveal/replacement | Termination plus generation/revision rejection; injected late completion tests |
| Decode or worker memory amplification | Frozen or terminated browser | Encoded/decoded/work/output limits and total buffer ledger; malformed/oversized tests |
| Arbitrary SVG/metadata input | Injection or privacy leakage | Raster-only initial input, closed numeric output, no remote fetch; adversarial export tests |
| “Better reconstruction” treated as imagery gain | Misleading health/science claim | Separate quality, preference, comfort and imagery wording; no combined score |
| Repeated sessions treated as independent people | Biased future comparisons | No efficacy leaderboard; statistical protocol gate and synthetic analysis contract |
| Public experience export mistaken for anonymous | Disclosure of personal scene/notes | Explicit local preview, minimal fields, no automatic upload; qualified governance before submission |
| CSS math mistaken for visual acceptance | Unreachable controls on real layouts | Actual captures/interactions at documented dimensions and separate physical-device gaps |
| Old tests cited for new source | False completion claim | Reassemble/hash after each repair and rerun final exact-head gates |

## Open gates, not hidden assumptions

IF-048 must freeze exact expanded field names/ranges and supported common ratios before implementation. IF-051/IF-052 must set measured resource budgets and decide whether approximation is useful. IF-057 remains external: operator, ethics/privacy/security/instrument/statistical choices cannot be invented by developers. Physical devices, ordinary OS file workflows, assistive technology and qualified sensory/content review must retain separate evidence states.

No critical requirement is intentionally omitted. Bounded custom paths, richer tracing, adaptive study recommendations and real submission activation are explicitly follow-on or externally gated, not falsely included in the first engineering release.
