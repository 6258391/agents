---
name: compare-screenshot
description: "Capture email screenshot. Compare against image ref. Return diff report."
allowed-tools: [Bash, Read]
---

compare-screenshot — diff rendered email into per-zone fix report.

## Flow

1. Run `compare-screenshot.sh dimensions IMAGE_REF` to read dimensions.
2. Run `compare-screenshot.sh capture HTML_PATH WIDTH HEIGHT` to produce screenshot.
3. Run `compare-screenshot.sh diff SCREENSHOT IMAGE_REF` to produce diff artifacts.
4. Label each diff zone via vision.
5. Return zones ordered by structural-fix priority.

## Params

| name | required | default | description |
|------|----------|---------|-------------|
| HTML_PATH | yes | — | Path to HTML email file |
| IMAGE_REF | yes | — | Path to reference image |
| WIDTH | yes | — | Viewport width in pixels |
| HEIGHT | yes | — | Viewport height in pixels |
| SCREENSHOT | yes | — | Path to captured screenshot |

## Examples

### Measure reference image

```bash
compare-screenshot.sh dimensions ./assets/hero.png
```

### Capture HTML screenshot

```bash
compare-screenshot.sh capture ./email.html 600 800
```

### Diff shot against ref

```bash
compare-screenshot.sh diff ./email-screenshot.png ./assets/hero.png
```

## Gotchas

- Set viewport to reference dimensions instead of a default like 1280x800 because size difference produces false diffs on every pixel row.
- Read `zones[]` from the diff JSON instead of acting on `total_diff_pct` alone because each zone carries geometric and photometric fields (`area`, `aspect_ratio`, `diff_pct`, `avg_luma_shift`, `non_white_pct`) that let the caller distinguish image tone shift from layout shift.
- Treat a stderr `WARNING: ref ... != shot ...` as evidence of wrong capture viewport because the script resizes the ref to match the shot and the resized diff will mislead.
- Return the diff PNG and diff JSON paths instead of inlining content because the annotated image is binary and the zones JSON grows long.
