# Imagery Field

## Current repair candidate

The first actual sandboxed Chrome CI run passed 20 of 22 scenario groups but failed narrow-screen overflow and the initial mobile reveal assertion; browser profile cleanup also failed. The source and harness corrections below have passed 156 non-browser checks and independent delta review. The current HTML is 40,716 bytes, SHA-256 `3c825e09e145b66b8be957fd4dcb491562e70bc475343e0b3aed43b5159fd7ec`. Browser rerun is pending; no complete browser pass is claimed.

First run: https://github.com/woodkill00/aphantasia_build/actions/runs/39333164845

## Initial import baseline (historical)

A small, local-first visual-design prototype for manually controlled static dots and geometry. The repository contains the self-contained app, editable sources, synthetic software tests, and a focused technical/research plan.

**Engineering preview only.** This is not a treatment, diagnostic test, or validated way to develop voluntary mental imagery. A lingering afterimage does not establish an imagery gain. Static presentation and software bounds do not guarantee sensory safety.

## Open the app

Download and extract the repository, then open `imagery-app/index.html` in a browser with JavaScript enabled. Read the in-app notice before displaying a design. See [app instructions](imagery-app/README.md) for controls, viewing cautions, save/load, optional notes, and mobile-file limitations.

No account, server, Docker, or runtime package installation is required by the app's design. Direct-file browser launch, actual downloads, offline behavior, and physical-device support still require executed browser/device evidence. A downloaded file preview may not execute JavaScript.

## Development

The committed HTML is assembled from the source parts. From the repository root, using an existing Node installation:

```sh
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/model.test.cjs imagery-app/tests/ui.test.cjs imagery-app/tests/static.test.cjs imagery-app/tests/browser-cdp.test.cjs
```

The dependency-free suite was checked with Node v24.19.0. There is no npm install step. A no-install Chrome DevTools Protocol browser suite and GitHub Actions workflow are prepared, but real-browser CI has not run. The workflow uses preinstalled Node/Chrome with normal sandboxing and read-only repository permission; it does not deploy the app. The separately supplied Playwright browser suite requires an already installed, permitted Playwright/Chromium environment; see the [browser procedure](imagery-app/tests/BROWSER-TEST-PROCEDURE.md). Never disable browser security to make a test run.

## Verification status

- 150 non-browser checks pass: 85 model, 50 DOM/Canvas-double, 9 static, and 6 CDP transport/fixture checks.
- The HTML is 40,075 bytes, SHA-256 `b7563e538a36e09235cfd4f370d6691d5b38c28231d0fcd6a80e3e9696884c88`.
- Real-browser execution was blocked before app navigation in the original test environment. No browser pass is claimed.
- Screen-reader use, real mobile behavior, qualified sensory/content review, and efficacy remain unestablished.

See the [test report](imagery-app/test-results/TEST-REPORT.md), [source review](imagery-app/review.md), and [artifact manifest](imagery-app/SHA256-MANIFEST.json). Software coverage percentages are not clinical, accessibility, or device-compatibility coverage.

## Project map

- [Architecture and data contract](docs/architecture.md)
- [Portable runtime rationale](docs/portable-runtime.md)
- [Scientific limits and research leads](docs/scientific-limitations.md)
- [Implementation and verification plan](docs/plan.md)
- [Public project queue](project-queue.json)
- [Contributor/agent guidance](AGENTS.md)
- [Security and private reporting](SECURITY.md)

Scenes and optional observation notes are separate downloads. There is no durable autosave, backend, telemetry, or account system. Use synthetic data for tests and repository examples; exported personal notes do not belong in this public repository.

## License

No license has been selected for this repository. Do not add one or represent the project as having a particular license without a maintainer decision.
