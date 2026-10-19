# Imagery Field

A local-first, manually controlled static scene editor. Version 0.2 adds a full-window field, optional browser fullscreen, individual dots/pixels/outlines, and object/background color controls. The repository contains the self-contained app, editable sources, synthetic tests, and a focused technical/research plan.

**Engineering preview only.** This is not a treatment, diagnostic test, or validated way to develop voluntary mental imagery. A lingering afterimage or an external reconstruction does not establish an imagery gain. Static presentation and software bounds do not guarantee sensory safety.

## Open and use the app

Download and extract the repository, then open `imagery-app/index.html` in a browser with JavaScript enabled. Read the in-app guidance before displaying a design. No account, server, Docker, or runtime package installation is needed.

1. Start with a preset or add objects. Select an object to change its shape, position, size, and HSL color. **Place on field** lets you click or tap a new position while hidden; position inputs provide a keyboard alternative.
2. Adjust background hue, saturation, and color lightness. These describe a chosen color, not measured internal vision or the screen's hardware brightness.
3. Choose **Apply changes**, close the editor if desired, then choose **Show scene** separately. The field starts hidden; edits never reveal it automatically.
4. **Hide**, **End viewing**, and **Esc** conceal both the objects and chosen background. **Enter fullscreen** is optional; the full-window layout remains usable if the browser rejects or lacks fullscreen.

See [app instructions](imagery-app/README.md) for ranges, saving/loading, optional notes, and viewing cautions. Physical mobile devices and ordinary OS file-opening/chooser workflows remain unverified; a downloaded file preview may not execute JavaScript.

## Verification: separate artifacts

**Version 0.2:** 214 non-browser checks passed against the 57,177-byte HTML, SHA-256 `b4bc6fc6a6ea6d530d8a9c7da38426219716452be94d9fb39a05ef2191c2be43`. The separate synthetic fixture check accepted 3 valid inputs and rejected 14 invalid inputs. The 38 prepared real-browser scenario groups are **NOT RUN**: local browser launch is blocked in the current environment, and no passing v0.2 CI run is recorded. Consult the [test report](imagery-app/test-results/TEST-REPORT.md), [source/delta review](imagery-app/review.md), and [artifact manifest](imagery-app/SHA256-MANIFEST.json) for the exact artifact and evidence. Do not carry forward the old browser pass as a pass for this redesign.

**Historical version 0.1 baseline:** [Chrome CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) passed on 2026-10-19:

- 156 non-browser checks: 85 model, 50 DOM/Canvas-double, 9 static, and 12 browser-harness/fixture checks.
- 22 real-browser scenario groups: 11 desktop and 11 phone-sized viewport/touch-emulation groups in sandbox-enabled headless Chrome 155.0.8059.84 on Linux.
- Historical HTML: 40,716 bytes, SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.

That older run covered direct-file launch, offline request observation, downloads/imports, malformed files, visibility controls, note separation, and selected responsive/focus checks. Neither that result nor synthetic tests establish physical-phone support, OS-dialog usability, complete accessibility, medical safety, or efficacy.

## Development

From the repository root, using an existing Node installation:

```sh
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
```

The dependency-free real-browser suite requires Node 22+ and an already installed permitted Chrome. The earlier CI used Node 22.23.3, preinstalled Chrome with normal sandboxing, read-only repository permission, and no deployment or package-install step. See the [browser procedure](imagery-app/tests/BROWSER-TEST-PROCEDURE.md) for current commands and outstanding checks. Never disable browser security to make a test pass.

## Project map

- [Architecture and exact data contract](docs/architecture.md)
- [Version 0.2 editor design](docs/editor-redesign.md)
- [Portable runtime rationale](docs/portable-runtime.md)
- [Scientific limits and research leads](docs/scientific-limitations.md)
- [Implementation and verification plan](docs/plan.md)
- [Public project queue](project-queue.json)
- [Contributor/agent guidance](AGENTS.md)
- [Security and private reporting](SECURITY.md)

Scenes and optional observation notes are separate downloads. There is no durable autosave, backend, telemetry, browser storage, or account system. Use synthetic data in public examples; personal exports do not belong in this repository.

## License

No license has been selected. Do not add one or represent the project as having a particular license without a maintainer decision.
