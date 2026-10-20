# Timed presentation scope and review

Reviewed 2026-10-20. This is a product-design and accessibility evidence note, not clinical clearance, a therapeutic protocol, or a whole-app WCAG conformance claim.

## Current ordinary-animation scope

The item-timeline increment extends the earlier one-pass scene sequence with independent item start times, fade-in, hold and fade-out. Items may overlap. Timed preview requires an explicit Play action, runs once, and ends at the latest item endpoint. Static live editing remains separate; changing a timing value must not start animation. The background stays fixed during playback.

Opacity pulse is an optional ordinary animation effect, not a strobe, afterimage exercise or treatment mode. It is disabled on new items. This replaces the earlier blanket deferral of any pulse generator with a deliberately limited effect family:

- One shared scene pulse cycle, 2–60 seconds; default 4 seconds. All pulsing items use the same absolute timeline clock. There are no independent pulse frequencies or phase offsets.
- Each item can enable pulse and set its minimum opacity multiplier from 50–100%; default 80%. The maximum multiplier is 100% of that item's base opacity, not a brightness increase.
- With elapsed time `t`, shared cycle `P` and item minimum `m`, the multiplier is `m + (1-m) * (1+cos(2*pi*t/P))/2`. It starts at its maximum, reaches its minimum halfway through a cycle, and returns smoothly.
- The multiplier applies throughout the item's finite lifetime and multiplies its fade envelope. Fill, outline and shadow share the item's final opacity; they do not pulse on independent clocks.
- Item starts and fades remain independently authorable, so sequential or concurrent compositions are possible. Shared pulse timing reduces independent beating; it is not a mathematical proof about every composited pixel.
- No automatic repeat, hard blink/strobe effect, color inversion, pulsing background, exposure escalation or recommended viewing regimen is added.

The cycle and opacity bounds are explicit engineering choices for this implemented effect family, not values established to be medically safe. Fast fades, overlapping differently colored items, shadows and the initial/final transitions can still create changing luminance or color. A dark default background does not establish safety.

## Interaction and cancellation

Play, Pause, Resume and immediate Stop/Hide remain distinct. Pause keeps the current frame visible. Stop/Hide and Escape clear the field immediately rather than completing a configured fade, invalidate delayed work, and never automatically restart. Editing, imports, preference changes, fullscreen transitions and handled lifecycle interruptions cancel/conceal; returning requires a fresh explicit action. Completion does not replay. Timed preview stays windowed with controls reachable.

Reduced-motion mode retains a static/manual inspection path rather than substituting rapid automatic cuts. This is an additional product choice for this editor. W3C explicitly distinguishes opacity-only effects from motion animation and gives animation-authoring preview as an essential-animation example; neither point exempts flashing content from the separate flash criterion. [W3C interaction-animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

## Evidence and honest limits

WCAG's flash criterion permits no more than three flashes in any one-second interval, or output below its specified general/red flash thresholds. Evaluation concerns the combined displayed content, not a pulse setting alone, and must consider the largest supported view. Warnings and Stop controls cannot be relied on to prevent a reaction. These accessibility criteria do not provide individual medical clearance. [W3C flash guidance](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html)

W3C's simpler rate-based technique checks opposing transitions in every one-second interval, including the interval endpoints. It is not merely a check of nominal average frequency. [Technique G19](https://www.w3.org/WAI/WCAG22/Techniques/general/G19)

For more complex output, W3C describes analysis of both general and red flash behavior. Counting item starts, checking average brightness, or enforcing a per-item period is not a substitute for that analysis. No custom flash analyzer or automatic safety certification is shipped by this increment. [Technique G15](https://www.w3.org/WAI/WCAG22/Techniques/general/G15)

Individual susceptibility, high-contrast patterns and viewing conditions also matter. The specialist FAQ combines research evidence with expert opinion where evidence is limited; it does not validate this app's settings. CSS HSL values do not measure a physical display's luminance or flicker. [2025 specialist FAQ](https://pmc.ncbi.nlm.nih.gov/articles/PMC11995705/)

## Required engineering evidence

Tests must cover exact item endpoints and total duration, overlapping layers, fade/pulse composition, shared phase at different item starts, quarter/half/full pulse cycles, differing minimum multipliers, and fill/outline/shadow opacity together. Include saturated-red and contrasting synthetic fixtures without claiming their successful rendering proves sensory safety. Verify invalid imports, clocks, cancellation, reduced motion, pause/resume, immediate Stop and no delayed repaint. Native rendered-pixel checks and real scheduling are separate from model tests and screenshots.

Inspect actual final output and controls at supported window sizes. Agent review and synthetic software tests are not human tolerance studies, calibrated-display measurements or clinical evidence. Do not label results “epilepsy safe,” “safe below a rate,” or “clinically validated,” and do not claim imagery improvement from external visual effects. Qualified pattern/content assessment, physical devices and full accessibility evaluation remain separate limits.
