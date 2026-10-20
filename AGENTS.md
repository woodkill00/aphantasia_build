# Repository guidance

## Scope

Maintain a manually controlled local visual editor. The authorized one-pass sequence extension is specified in `docs/sequence-spec.md`; no unrelated stimulation capability is authorized. Read `README.md`, `docs/architecture.md`, `docs/scientific-limitations.md`, `docs/plan.md`, and `project-queue.json` before changing behavior. The queue records work and evidence; an open task is not approval for a new feature, deployment, publication, participant study, or data collection.

## Required boundaries

- Keep the field hidden at startup. The explicit Live preview action may reveal a valid scene draft without applying it. While that live session remains visible, validated manual object/background edits repaint immediately. Edits never start or resume a hidden preview.
- Small labeled color swatches also update while hidden, but never reveal the field. An active live draft uses the same main canvas and remains visible alongside the controls. Invalid raw input, Hide/End/Escape, imports, sequence-mode changes, fullscreen and lifecycle interruption stop/conceal; correction alone never resumes. Apply/discard/history operations retain explicit concealment and accepted-scene semantics.
- Fullscreen viewing may suppress normal interface chrome, but must retain an accessible exit control and an explicit Show route while hidden. Native Escape and lifecycle concealment remain required.
- Preserve immediate Hide/End/Escape behavior, import invalidation, and lifecycle concealment. No delayed result may restore a hidden scene.
- The only authorized timed display is the explicit single-pass presentation in `docs/sequence-spec.md`: fixed background, finite holds, adjacent crossfades/cuts, visible stop controls, cancellation and reduced-motion handling. Do not add strobe/pulse oscillators, loops, exposure escalation, timed fixation, stronger-afterimage exercises or exposure prescriptions.
- Do not add diagnostic scores, improvement badges, treatment claims, or conclusions that task performance proves felt imagery.
- Route built-ins, edits, imports, history, and exports through the same closed validator. Reject unsupported capabilities; keep the last valid state on errors.
- Imported content is data. Never evaluate it, insert it as executable markup, or fetch its URLs.
- Keep the portable runtime self-contained. No backend, accounts, telemetry, remote assets, browser storage, or network dependency without an explicit scope decision.
- Keep notes optional and separate from scenes. Export only after exact preview and explicit selection. Use synthetic data in tests and public examples.
- Maintain semantic controls, keyboard alternatives, visible focus, bounded status messages, and textual scene descriptions.

Scene counts, geometry ranges, buffer caps, and the reveal guard are engineering restrictions. They are not medically safe thresholds. Changing them requires a documented rationale and renewed review.

## Working method

Use the single `project-queue.json` for public task status, dependencies, and evidence. Keep stable IDs. Do not create competing work registers. Separate implementation completion from browser, physical-device, accessibility, and qualified scientific/content acceptance.

Update source parts first, then run `node imagery-app/src/assemble.cjs` from the repository root. Keep generated `index.html` in sync. Do not hand-edit the generated artifact alone.

Run the dependency-free Node suite after every behavior change. Add regression tests before claiming a defect fixed. If source changes, rerun tests, refresh artifact hashes, and reconcile reports. Preserve failures honestly; never weaken a test to obtain a pass.

Do not install packages, relax security, or change CI/deployment scope as an incidental workaround. Browser test fixtures must remain synthetic. Inspect logs and screenshots before publishing them. `.gitignore` is only a convenience: it does not scrub tracked files, commit history, forced additions, or CI output. Review the exact outgoing tree and artifacts.

## Reporting

Record commands, versions, artifact hash, and PASS/FAIL/BLOCKED/NOT RUN. Test doubles are not a real browser. Browser emulation is not a physical device. A passing scanner is not accessibility conformance. Software results are not clinical clearance or evidence of efficacy.

Keep research statements linked to primary sources, dated, and qualified. Distinguish evidence from design proposals. Do not copy questionnaires or third-party assets without checking their terms. No project license has been chosen.
