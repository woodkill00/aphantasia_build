# Imagery Field

A local-first visual-design prototype for manually controlled static dots and geometry. This repository contains the self-contained app, editable sources, synthetic tests, and a focused technical/research plan.

**Engineering preview only.** This is not a treatment, diagnostic test, or validated way to develop voluntary mental imagery. A lingering afterimage does not establish an imagery gain. Static presentation and software bounds do not guarantee sensory safety.

## Open the app

Download and extract the repository, then open `imagery-app/index.html` in a browser with JavaScript enabled. Read the in-app notice before displaying a design. See [app instructions](imagery-app/README.md) for controls, viewing cautions, save/load, optional notes, and mobile-file limitations.

The app needs no account, server, Docker, or runtime package installation. Direct-file operation and real downloads have passed automated headless Chrome checks. The ordinary OS file-opening/chooser experience and physical mobile devices remain unverified; a downloaded file preview may not execute JavaScript.

## Verification

[Chrome CI run 39333956608](https://github.com/woodkill00/aphantasia_build/actions/runs/39333956608) passed on 2026-10-19:

- **156 non-browser checks:** 85 model, 50 DOM/Canvas-double, 9 static, and 12 browser-harness/fixture checks.
- **22 real-browser scenario groups:** 11 desktop and 11 phone-sized viewport/touch-emulation groups in sandbox-enabled headless Chrome 155.0.8059.84 on Linux.
- Current HTML: **40,716 bytes**, SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`.

The browser run covers file-URL launch, offline request observation, actual disk downloads and file-input round trips, malformed imports, visibility controls, note separation, and selected responsive/focus checks. It does not establish physical-phone support, OS-dialog usability, complete accessibility, medical safety, or efficacy.

The first browser run exposed two failed groups and a cleanup error; their fixes and the successful rerun are documented in the [test report](imagery-app/test-results/TEST-REPORT.md). See also the [source/delta review](imagery-app/review.md) and [artifact manifest](imagery-app/SHA256-MANIFEST.json).

## Development

From the repository root, using an existing Node installation:

```sh
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
```

CI used Node 22.23.3 and preinstalled Chrome with normal sandboxing, read-only repository permission, and no deployment or package-install step. The dependency-free real-browser suite requires Node 22+ and an already installed permitted Chrome. See the [browser procedure](imagery-app/tests/BROWSER-TEST-PROCEDURE.md) for commands, the alternative unrun Playwright suite, and manual checks. Never disable browser security to make a test pass.

## Project map

- [Architecture and data contract](docs/architecture.md)
- [Portable runtime rationale](docs/portable-runtime.md)
- [Scientific limits and research leads](docs/scientific-limitations.md)
- [Implementation and verification plan](docs/plan.md)
- [Public project queue](project-queue.json)
- [Contributor/agent guidance](AGENTS.md)
- [Security and private reporting](SECURITY.md)

Scenes and optional observation notes are separate downloads. There is no durable autosave, backend, telemetry, or account system. Use synthetic data in public examples; personal exports do not belong in this repository.

## License

No license has been selected. Do not add one or represent the project as having a particular license without a maintainer decision.
