# Requirements quality and acceptance checklist

This checklist describes review questions and evidence locations. Live status is only in [project-queue.json](../../../project-queue.json); nothing here certifies implementation.

## Specification quality review

- Does [the specification](../spec.md) distinguish user goals from implementation details and provide observable acceptance scenarios for each story?
- Are all 64 research proposals mapped once by code, with overlaps consolidated and deferred ideas explicit in [research.md](../research.md)?
- Do [clarifications](../clarifications.md) preserve old-file/accepted-scene semantics, explicit new-format canvas behavior and memory-only journal scope?
- Are no network, persistence, collection, package, deployment or clinical claims smuggled into implementation tasks?
- Does [analysis](../analysis.md) identify gesture, asynchronous, geometry, resource, privacy and scientific-interpretation failure modes?
- Are independent review and qualified external gates distinct from development work?

## Per-increment evidence review

- Exact source commit/tree and assembled HTML bytes/hash recorded.
- Regression test added for every changed behavior or repaired defect; failures preserved.
- All relevant model/DOM/import/round-trip and native-browser checks actually run.
- Pointer, keyboard and non-drag equivalents reach identical validated positions.
- Stop/Hide/Escape/import/resize/lifecycle and late-callback invariants exercised.
- New geometry has render/bounds/hit/description/export coverage and legacy files remain valid under original rules.
- Photo output remains editable, bounded, local and explicitly applied; metadata/bytes are absent from exports.
- Journal is optional, separate, previewed and memory-only; synthetic data only.
- Submission remains disabled with no endpoint or operational upload path.
- Actual rendered desktop/narrow/short/focus frames inspected; physical-device and assistive-technology gaps named.
- Documentation and queue cite current evidence, not inherited historical counts.
- Independent exact-head review and required CI pass before integration; release/hosting/collection not implied.

## Reporting vocabulary

Use PASS, FAIL, BLOCKED or NOT RUN with a command/procedure and source identity. A visual screenshot review is not a clinical evaluation; a small set of native browsers is not universal compatibility; mocks/emulation do not replace physical or assistive-technology evidence.
