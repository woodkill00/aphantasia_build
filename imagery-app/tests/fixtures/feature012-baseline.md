# Frozen Feature 012 comparison fixture

`feature012-baseline.html` is an exact, test-only copy of the assembled Feature
012 portable artifact at the publicly reviewed
[PR 15 source head](https://github.com/woodkill00/aphantasia_build/commit/e819df22d6a6e01414e58468a55ae7da628d47b1),
`e819df22d6a6e01414e58468a55ae7da628d47b1`. The identical bytes were copied from the
frozen editor-aids checkout without editing it. Its SHA-256 is
`bfb0470286be0cda2233cfa0ece7c4248f3b224bdf2851821223a7317fdf2735`.

Copyright (c) 2026 woodkill00. MIT-licensed repository-authored software; the
complete notice is retained in `feature012-baseline.LICENSE.txt`. The source
repository is `https://github.com/woodkill00/aphantasia_build`. This is neither a
new release nor a current runtime. It is not assembled, imported by production
code, or included in the explicit portable-package allowlist.

The browser test verifies the exact bytes before navigating to this local file.
It does not fetch a baseline, relax the sandbox, change the clocks, or substitute
old results for candidate checks. The default `Page.fresh()` still loads the
candidate; an alternate local file requires an explicit matching SHA-256.

## Predeclared comparison

Use the same Chrome target, device settings, local synthetic 12-item
maximum-effects scene and native inputs. Alternate baseline/candidate order for
six pairs. Each observation executes one singleton nudge, one three-event rapid
singleton drag and the first native Hide. Preserve ordinary import/reveal
guards. Retain every trusted handler-plus-forced-layout measurement and the
actual first-Hide outcome. Report median, p95 and maximum; one drag sample is the
maximum of its three event measurements.

Before any native result, the investigation gates are:

- Candidate minus baseline p95 is at most 10 ms for each comparable route.
- Every candidate sampled handler, including Hide, is below 50 ms.
- All measured input events are trusted, the last move-to-release interval is
  below 80 ms, and the first Hide actually conceals the field.

These small synthetic samples do not establish calibrated display latency,
general device performance, physical touch behavior, or accessibility/sensory
acceptance. Feature 012 has no batch alignment/equal-gap operation. New batch
commands are explicitly reported as candidate-only costs, never as an invented
baseline comparison.
