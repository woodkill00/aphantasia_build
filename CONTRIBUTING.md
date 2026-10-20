# Contributing to Imagery Field

Thank you for helping make this small local app easier to use and verify. Start with the [user guide](imagery-app/README.md), [project boundaries](AGENTS.md), and [public work register](project-queue.json). The register is the single project task/status list; an open item is not permission to add unrelated capabilities.

**License:** repository-authored code, documentation and examples use the [MIT License](LICENSE), copyright © 2026 woodkill00. Retain its notices when redistributing. Preserve third-party attribution and applicable terms; do not copy research text, questionnaires or other third-party assets into the project merely because they are linked or cited.

## Useful contributions

Clear reproduction steps, documentation corrections, synthetic examples, focused usability fixes and tests are welcome for review. Discuss changes to data formats, persistence, network access, timing/stimulation features or product claims before implementing them. Do not add clinical claims, automatic replay, stronger-afterimage exercises or a new exposure prescription.

Use [Issues](https://github.com/woodkill00/aphantasia_build/issues/new/choose) for ordinary bugs and proposals. Use [SECURITY.md](SECURITY.md) for security findings, not a public bug report. [SUPPORT.md](SUPPORT.md) explains safe reporting.

## Work locally

Using the app needs only a browser. Developing it uses existing **Node 22+** and **Git** installations. The dependency-free suite uses Git for isolated packaging fixtures; it needs no third-party package dependencies. There is no `npm install` or application server step.

From the repository root:

```sh
node --version
git --version
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/*.test.cjs
node scripts/check-docs.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
```

Open `imagery-app/index.html` directly in a browser for the local app. The dependency-free native browser suite additionally needs an already installed, permitted Chrome:

```sh
CHROME_PATH=/path/to/google-chrome node imagery-app/tests/browser-cdp.cjs
```

That environment-variable syntax is for a POSIX shell; set `CHROME_PATH` using your shell's equivalent on other systems. The verified CI environment is Linux Chrome, not proof of cross-platform test-runner support. Read the [browser procedure](imagery-app/tests/BROWSER-TEST-PROCEDURE.md) before running it. Do not install dependencies, disable sandboxing or relax security merely to bypass an environment blocker. Report BLOCKED separately from FAIL or PASS.

## Edit source, not just the generated file

- `imagery-app/src/model.js`, `sequence-model.js`, `item-model.js`: validation, state and pure timing contracts.
- `imagery-app/src/app.js`: browser interaction and rendering.
- `imagery-app/src/shell.html`, `style.css`: markup and responsive layout.
- `imagery-app/src/assemble.cjs`: produces the portable `imagery-app/index.html`.
- `imagery-app/tests/`: synthetic checks and browser harnesses.
- `examples/`: public synthetic authoring/migration examples.

Change the source parts first, run the assembler, and include the matching generated HTML. Do not hand-edit the generated file alone. Documentation-only changes do not require a runtime change. Keep the runtime self-contained: no remote fonts/assets, account system, telemetry, browser storage or backend without a separate approved scope decision.

## Test and review honestly

1. Add a regression for a behavior defect. Run the full Node suite after behavior changes and rerun affected native scenarios against the exact assembled artifact.
2. Keep invalid inputs, interruption/repeated-action cases, strict migrations, Hide authority and stale-callback tests. Do not weaken an assertion just to make CI green.
3. For layout changes, inspect actual rendered screenshots and keyboard/focus flows at narrow, short and effective-zoom viewports. CSS calculations are a design method, not visual acceptance.
4. Record commands, versions, exact source/runtime hash and PASS/FAIL/BLOCKED/NOT RUN. Native browser evidence, test doubles, emulation, physical devices and manual accessibility are distinct.
5. Keep historical failures and explain fixes. Update the current evidence/manifest only with observed results; do not prefill a new commit's success.

CI uses the existing `local-prototype` job with normal browser sandboxing, read-only repository permission, and no deployment step. A merge, Release or hosted deployment is a separate action, not a consequence of a passing local test. Maintainers use the [release-preparation guide](docs/releases.md) for portable packaging.

## Privacy and pull requests

Use synthetic scene names, notes and fixtures. Inspect the exact diff, screenshots, logs and generated artifacts for credentials, private paths, personal/health observations and real exports. `.gitignore` does not scrub tracked content or history.

Open a focused draft pull request with the user-visible purpose, relevant issue, changed boundaries, commands/outcomes and remaining limits. Update the user guide/changelog for user-facing changes and contracts for format/behavior changes. Use the PR checklist, preserve unrelated work, and do not bundle repo-setting changes or a license decision into an incidental fix. Review and response times are not guaranteed.
