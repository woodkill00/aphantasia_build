# Source and browser-repair review

Current reviewed artifact: Imagery Field 0.1.0, 2026-10-19; **40,716 bytes**, SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`. [CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) subsequently passed 156 non-browser checks and all 22 scoped real-Chrome scenario groups.

## Baseline source findings

The initial review covered validation, state/visibility controls, imports, privacy boundaries, and accessibility-oriented structure. Its 40,075-byte baseline had SHA-256 `b7563e538a36e09235cfd4f370d6691d5b38c28231d0fcd6a80e3e9696884c88`.

- One closed validator protects presets, edits, imports, history, and serialization. Duplicate decoded JSON keys and unsupported capabilities are rejected.
- Showing a scene requires an explicit action; accepted edits remain hidden. Hide/End/Escape and lifecycle handlers invalidate pending imports. There is no animation or delayed reveal queue.
- Geometry is limited to sparse dots or one contour. Those engineering bounds are not sensory-safety thresholds.
- Untrusted strings use text/value sinks. The reviewed runtime has no network, remote asset, browser-storage, or executable-import path.
- Notes and scenes export separately. Note export requires the exact preview and explicit selection; edits invalidate approval.
- Semantic controls, labels, visible focus, text descriptions, keyboard alternatives, and bounded status text are present. These features do not establish complete accessibility.

Earlier parser regressions for duplicate-key overwrite and unbounded error text remain covered. Additional baseline refinements addressed status scrolling, intrinsic control widths, and End focus behavior.

## Independently reviewed repair delta

The [first real-browser run](https://github.com/woodkill00/aphantasia_build/actions/runs/39333164845) passed 20/22 groups but failed desktop overflow at 320 CSS pixels and the mobile-emulation initial Show assertion; profile cleanup also failed. The original mobile failure's exact cause was not established.

The runtime repair changes only CSS and regenerated HTML: grid tracks can shrink below intrinsic min-content widths, grid children can shrink within those tracks, and the file input stays within its allocated width. Model, UI JavaScript, and shell markup remain unchanged. The repair does not clip page overflow, reduce control targets, change scene/exposure limits, or add animation.

The reviewed harness delta observes one trusted click per native gesture, handles initial settling only after an observed concealment lifecycle event, and preserves strict overflow, Visible/nonblack-canvas, and rapid-lock assertions. Cleanup now confirms process closure before removing its profile, uses bounded termination/removal handling, and preserves failure status. Additional synthetic regressions bring harness/fixture checks to 12.

The independent delta review found no source-level blocker to rerunning CI. The subsequent green run provides the missing browser evidence for the repaired artifact: 22/22 groups passed, with browser closure and profile removal confirmed. The earlier failures remain part of the record; passing this rerun does not establish the original mobile failure's cause.

## Remaining limits

This supports the tested engineering preview only. Physical-device/ordinary OS workflows, other browser engines, manual screen-reader and complete accessibility checks, qualified pattern/content review, and clinical efficacy remain unestablished. See the [test report](test-results/TEST-REPORT.md) and [browser procedure](tests/BROWSER-TEST-PROCEDURE.md).
