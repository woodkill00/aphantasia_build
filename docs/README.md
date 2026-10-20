# Documentation

Start with the [repository overview](../README.md). Imagery Field is a local engineering preview, not a medical or clinical tool. The app runs from `imagery-app/index.html`; developer tools are not needed just to use it.

## Use the app

- [User guide](../imagery-app/README.md): opening, live editing, item effects/timing, separate snapshot sequences, and saving your work.
- [Synthetic examples](../examples/README.md): importable starting points and legacy migration examples.
- [Troubleshooting](troubleshooting.md): common symptoms and recovery without weakening browser security.
- [Compatibility and verification](compatibility.md): tested environments and explicitly unverified workflows.
- [Changelog](../CHANGELOG.md): changes visible to users and file-format compatibility.
- [Support](../SUPPORT.md): where to ask for help and what is safe to share publicly.

## Develop and maintain

- [Contributing](../CONTRIBUTING.md): source layout, local checks, review expectations, and privacy.
- [Architecture](architecture.md): components, validators, rendering and historical migration inputs.
- [Item timeline](item-timeline.md): current appearance, scene-v3/sequence-v2 and finite item playback contract.
- [Snapshot sequence](sequence-spec.md): separate ordered holds/crossfades and playback contract.
- [Editor design](editor-redesign.md): interaction and layout rationale.
- [Portable runtime](portable-runtime.md): why the browser artifact is self-contained.
- [Browser test procedure](../imagery-app/tests/BROWSER-TEST-PROCEDURE.md): exact commands and manual checks.
- [Test report](../imagery-app/test-results/TEST-REPORT.md), [summary](../imagery-app/test-results/summary.json), and [artifact manifest](../imagery-app/SHA256-MANIFEST.json): versioned evidence, including failed attempts.
- [Release preparation](releases.md): local packaging, verification and separately approved publication.
- [Security reporting](../SECURITY.md) and [repository guidance](../AGENTS.md).

## Research, limits, and project state

- [Scientific limitations](scientific-limitations.md): external perception, afterimages and voluntary mental imagery are not interchangeable evidence.
- [Timed-presentation boundaries](timing-boundaries.md): scope and unresolved sensory-assessment needs.
- [Implementation plan](plan.md): completed software increments and distinct acceptance gates.
- [Public work register](../project-queue.json): the single task/status register. Documentation is not a second task backlog.

Historical sections describe their own artifacts and versions. They do not override the current user guide or establish support for untested environments. Software verification, browser emulation, physical-device testing, accessibility evaluation and clinical/sensory assessment are separate forms of evidence.
