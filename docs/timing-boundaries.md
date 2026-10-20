# Timed presentation scope and review

Reviewed 2026-10-20. Design proposal pending implementation and independent checks. These are engineering constraints, not medically safe exposure settings or evidence of imagery improvement.

## Proposed first increment

A finite, manually started, single-pass list of scenes with explicit ordering, hold durations, and adjacent object crossfades. Keep one shared background across the sequence. Pause holds the current visible frame; Stop/Hide clears it immediately and invalidates all delayed work. Editing, imports, lifecycle interruption and fullscreen transitions stop playback and never automatically resume it. Reduced-motion preference uses manual stepping rather than replacing fades with rapid automatic cuts.

No autoplay, loop, ping-pong, contrast reversal, strobe frequency, repetitive pulse generator or intensity escalation. Repeatedly fading each scene to blank and back can itself form pulsing, so this is not the proposed transition pattern. Any broader temporal capability requires renewed output, accessibility and content review.

## Evidence and limits

W3C notes that an off switch may be too late to prevent a seizure and that flash evaluation must consider the largest supported display. Its conformance thresholds are not individual medical clearance. See [WCAG flash guidance](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html).

Specialist guidance discusses individual susceptibility and the relevance of high-contrast patterns, brightness, screen size and dark-room viewing. See the [2025 specialist FAQ](https://pmc.ncbi.nlm.nih.gov/articles/PMC11995705/) and [Epilepsy Foundation consensus](https://onlinelibrary.wiley.com/doi/10.1111/epi.18702). The consensus abstract/metadata were reviewed; detailed unexamined full-text claims are not adopted here.

A smooth fade, static image, low nominal change rate, warning, or successful software test does not guarantee comfort or safety. CSS colors do not measure display luminance, hardware flicker, viewing distance, or individual susceptibility. This project provides no therapeutic timing prescription and has not established efficacy for aphantasia.

## Comparable engineering QA

Two independent scripted user journeys use the same synthetic circle/square/triangle composition, with exact geometry/color expectations and screenshots. They must distinguish native browser interaction, rendered-pixel inspection, source review, emulation and physical-device testing. Agent critique is not a human usability study or physiological safety assessment. No personal observations are included in test fixtures or public logs.
