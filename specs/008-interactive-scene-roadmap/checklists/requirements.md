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

## Session lock and arrangement review

The bounded arrangement source, native and scoped visual checks passed on the exact source recorded in the [public queue](../../../project-queue.json). These questions remain regression requirements, not certification of the full roadmap. Final documentation-head CI, protected integration and external gates remain separate.

- Do locks protect defensive full stored-item records rather than imply immutable composite pixels, and stay within the 12-item bound?
- Can users select a locked item without dragging or clicking through it, identify its lock in text, unlock it, or use Unlock all by keyboard/touch?
- Are all item/precision/timing/layer/delete handlers guarded even if a disabled control is tampered with or receives a synthetic event? Does duplication leave the locked source unchanged and create an unlocked copy?
- Do Apply and snapshot capture retain locks, while accepted history is disabled with an explanation? Do rejected draft-history/Discard candidates leave stacks unchanged?
- Does every successful whole-scene replacement clear locks with notice only after success, while failed/canceled/stale replacements preserve both locks and scene? Does sequence import retain locks until a successful Load step?
- Do lock/snap changes cancel and roll back active gestures/placement and invalidate stale asynchronous edits without starting a reveal or timer?
- Is snap initially Off, limited to drag/placement, mapped through content coordinates and constrained to feasible grid indices without off-grid edge clamping? Are typed/nudge/keyboard/center routes exact and unsnapped?
- Does Center X/Y/both create one validated bounded draft move, no operation on unchanged coordinates, and no implicit accepted Apply?
- Are Hide/Stop/End/Escape/export/unlock always available, with complete focused controls and labels inside the actual scroll aperture and successful corner/center hit tests?
- Are locks/snap absent from downloads and storage, with no new grid pixels, distribution, clock or provenance hash change from toggling session controls with no active gesture?
- Are current-source native results and actual captures recorded separately from prior failed runs, mocks, physical-device/AT evidence and clinical claims?

## Reporting vocabulary

Use PASS, FAIL, BLOCKED or NOT RUN with a command/procedure and source identity. A visual screenshot review is not a clinical evaluation; a small set of native browsers is not universal compatibility; mocks/emulation do not replace physical or assistive-technology evidence.
