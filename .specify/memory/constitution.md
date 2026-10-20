# Imagery Field engineering constitution

Version 1.0 · Ratified 20 October 2026 for the approved interactive-scene roadmap.

This repository-local Spec-Kit constitution governs specification, clarification, planning, task analysis, implementation and evidence. It installs no CLI or third-party code. [Repository guidance](../../AGENTS.md) remains authoritative for existing invariants; the [feature specification](../../specs/008-interactive-scene-roadmap/spec.md) records the new scope. Changes to this constitution require an explicit rationale, impact analysis and independent review, not a silent edit to make a test pass.

## I. User control precedes automation

Startup may show the existing valid static Live preview once, never timed playback. Hide/Stop/Escape, invalid input, import and lifecycle cancellation retain their authority. A delayed pointer, conversion, import or animation result cannot reveal or mutate a superseding scene. New automated work produces a reviewable draft and never starts a presentation. Existing accepted-scene Apply/export and snapshot semantics remain explicit.

## II. One closed data and geometry contract

Every edit, preset, conversion, import, migration and export uses the same canonical validator. A shared shape definition supplies bounds, rendering and hit testing. Unsupported versions, unknown fields, nonfinite values, executable markup and remotely fetched content fail closed. Legacy validators are not loosened. An expanded scene model is versioned and does not silently reinterpret old files.

## III. Local, minimal and opt-in

The portable runtime remains self-contained and network-independent. Selected photos are processed locally; they and derived personal scenes are not automatically anonymous. Optional journal records stay separate from scene JSON, in session memory unless a later persistence decision explicitly changes this. Exact previews and explicit export are required. No telemetry, accounts, hidden storage, identifiers, camera, microphone or real research submission is introduced incidentally.

## IV. No unsupported scientific conclusion

External perception, involuntary visual persistence, voluntary imagery, nonvisual memory, preference and discomfort are separate concepts. Do not generate diagnostic scores, improvement badges, efficacy rankings, exposure prescriptions or claims that reconstruction accuracy establishes imagery. Numerical resource limits and slow animation are engineering constraints, not medically safe thresholds. Qualified content, ethics, statistical and privacy decisions cannot be replaced by software tests.

## V. Accessible equivalent control

Pointer drag is an enhancement, not the only way to edit. Provide keyboard and single-pointer non-drag alternatives, semantic item selection, visible focus, textual descriptions and reachable Stop/Hide. Shared spacing tokens and CSS calculations must be checked against rendered layouts, including narrow and short views, not accepted by source inspection alone.

## VI. Bounded, cancellable work

Keep object, path, image-decode, buffer, iteration and history limits explicit and tested. No arbitrary capability increase is justified by an attractive screenshot. Worker cancellation and stale-result invalidation are separate requirements. Preserve normal browser sandboxing and least privilege; do not add packages or change CI/security permissions as an incidental workaround.

## VII. Evidence bound to the exact source

Write regression tests for changed behavior, assemble from source, run the dependency-free suite, and inspect native-browser results and actual captures. Record source/artifact hashes, commands, versions and PASS/FAIL/BLOCKED/NOT RUN. Emulation is not a physical device, mocks are not native browsers, and automated checks are not accessibility or clinical certification. A source change invalidates relevant prior evidence until rerun.

## VIII. Single work register and reviewed integration

[project-queue.json](../../project-queue.json) is the sole live status/dependency/evidence register. Spec-Kit tasks provide acceptance criteria and stable ID mappings, not a second progress board. Preserve historical failures and separate engineering completion from governance/device/scientific gates. Review exact outgoing files and synthetic captures before PR integration. Release publication, hosting and collection remain separate scoped operations.
