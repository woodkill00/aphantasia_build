# Prepare a portable release

This is a maintainer guide, not the current user's download path. Users can obtain the source ZIP and open `imagery-app/index.html` using the [getting-started instructions](../README.md#get-started). Do not advertise a release asset or `/releases/latest` link before that exact asset exists; GitHub's “latest” route also excludes prereleases.

The local tools below prepare files only. They do not publish a Release, create a tag, deploy a site, choose a license or change repository settings. Those decisions require separate maintainer approval. A version label does not turn this engineering preview into a clinical or broadly verified product.

## Contents and guarantees

The builder writes these files into a new output directory outside the checkout:

- `Imagery-Field.html`: the tested self-contained runtime, byte-for-byte identical to `imagery-app/index.html`.
- `Imagery-Field-portable.zip`: that HTML, `START-HERE.txt`, `USAGE.txt`, current and legacy synthetic examples, metadata and an internal checksum list.
- `release-metadata.json`: version, source commit, runtime hash and supplied evidence URL.
- `SHA256SUMS.txt`: checksums for the external release files.

The ZIP includes `release-metadata.json` and `CHECKSUMS.txt`. A checksum file does not hash itself; metadata must not claim its own hash. Fixed ordering and timestamps make packaging deterministic for identical inputs. The exact allowed files and archive structure are checked by the verifier. No development dependencies are bundled and no network access is needed to open the HTML.

Checksums detect byte changes, not the trustworthiness of a source or the truth of a test result. The builder records the operator-supplied CI URL without contacting GitHub. Independently verify that run's source, result and runtime hash before relying on it.

## 1. Verify the exact source

Use an existing permitted Git/Node 22+ environment and a clean Git checkout containing the packaging tools. A downloaded source snapshot without `.git` is suitable for using the app, not this provenance-checked packaging command.

1. Identify the exact source commit intended for distribution. Review its changes and privacy boundaries; do not package an arbitrary dirty worktree.
2. Run the assembler and confirm generated HTML matches the reviewed source. If assembly changes the tracked runtime, stop, review and commit the intended correction before obtaining new exact-head evidence.
3. Run all local checks and the complete native browser suite using the [browser procedure](../imagery-app/tests/BROWSER-TEST-PROCEDURE.md).
4. Verify the final source commit's CI and actual screenshots, including interrupted flows and any changed layout. Preserve failed attempts and unresolved limits.
5. Record the final HTML SHA-256 and complete test/evidence identifiers. Confirm the app contains no new runtime network/storage behavior and all bundled examples are synthetic.

Useful local commands, from the repository root:

```sh
node imagery-app/src/assemble.cjs
node --test imagery-app/tests/*.test.cjs
node scripts/check-docs.cjs
node --check imagery-app/tests/browser-cdp.cjs
node imagery-app/tests/browser-cdp.cjs --check-fixtures
CHROME_PATH=/path/to/google-chrome node imagery-app/tests/browser-cdp.cjs
```

The environment-variable syntax above is POSIX-shell syntax. Use your shell's equivalent where needed. An unavailable permitted browser is BLOCKED, not a reason to disable sandboxing or claim a pass.

## 2. Build locally

Use the approved version label, the full tested 40-character commit, its measured 64-character runtime SHA-256 and its verified successful evidence URL. The values below are placeholders, not a claim that a release exists:

```sh
node scripts/build-release.cjs \
  --version 0.7.0-preview.1 \
  --source-commit FULL_TESTED_40_CHARACTER_COMMIT \
  --tested-html-sha256 MEASURED_64_CHARACTER_RUNTIME_SHA256 \
  --evidence-url https://github.com/woodkill00/aphantasia_build/actions/runs/VERIFIED_RUN_ID \
  --output ../imagery-field-release-candidate
node scripts/verify-release.cjs ../imagery-field-release-candidate
```

The output path must be new and outside the checkout. The builder rejects an existing destination, a dirty checkout, a source-commit mismatch, a runtime-hash mismatch or nonregular/changed packaged inputs. It must not silently rebuild a different runtime or replace an existing release directory.

Run the build a second time into a different new directory when verifying reproducibility; compare both HTML and ZIP SHA-256 values. Do not use a prior runtime's test count as evidence for changed code. A packaging-only change still requires its own checks and an honest final-source record.

## 3. Review the package as a user

- Run the verifier against the actual prepared directory, not just the source files.
- Extract the ZIP into a fresh directory and inspect its allowlisted contents. Open its HTML using the ordinary local-file route where the platform is actually available.
- Verify startup is static, Hide remains reachable, a valid color change is live, and Apply then Download produces a usable scene file. Reopen it explicitly; imports must stay hidden.
- Use the example files with their correct Open scene/sequence JSON controls. Confirm item playback and snapshot playback are described separately.
- Check START-HERE, USAGE, version/provenance, hashes and every referenced URL. Inspect all files for private content.
- Record any platform/file-dialog step not actually exercised as NOT RUN. Test scripts and archive validation do not replace physical-device acceptance.

## 4. Publication is a separate gate

Before publishing, obtain the owner's decisions on the project license and the exact Release/tag, audience and assets. No license is selected by this guide or the builder. Do not imply “open source” merely because the repository is public.

If publication is approved, prepare a draft GitHub Release targeting the verified source. Use a prerelease label while this is an engineering preview. Review the release notes, known limitations and exact asset list; verify the uploaded assets by downloading them and rerunning checksum/archive checks before publication when the platform permits. Do not replace an existing published asset silently; issue a new version with an explanation when bytes change.

After publication, verify the public tag, release page and each asset's download. Only then update the README's download links to those real destinations. A Release is not a Pages deployment. No hosted preview, automatic publishing workflow, persistent token or new package service is required by this guide.

See [GitHub's release-management guide](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) for platform mechanics and the [compatibility record](compatibility.md) for the current evidence scope.
