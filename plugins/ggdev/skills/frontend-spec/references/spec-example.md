# Quick Help

Brief: Full-width section with heading, description, and 3 resource cards in a horizontal grid.

## Structure
- Section (full-width)
  - Heading
  - Description (constrained width)
  - Grid (3 columns)
    - Card ×3 (clickable)
      - Row: Title + Arrow icon
      - Description

## Colors
| Element | Token | Hex | CSS Property | Opacity |
|---------|-------|-----|-------------|---------|
| Section bg | color-bg-muted | #f5f5f5 | background-color | 1 |
| Heading | color-text | #1a1a1a | color | 1 |
| Description | color-text-muted | #555555 | color | 1 |
| Card bg | color-bg | #ffffff | background-color | 1 |
| Card title | color-text | #1a1a1a | color | 1 |
| Card description | color-text-secondary | #666666 | color | 1 |
| Arrow icon | color-text | #1a1a1a | color | 1 |

## Typography
| Element | Token | Font | Size | Weight | Line-height | Letter-spacing | Transform |
|---------|-------|------|------|--------|-------------|---------------|-----------|
| Heading | font-heading | DM Sans | 32px | 700 | 1.2 | 0 | none |
| Description | font-body | DM Sans | 16px | 400 | 1.6 | 0 | none |
| Card title | font-label | DM Sans | 14px | 700 | 1.2 | 0.5px | uppercase |
| Card description | font-body | DM Sans | 14px | 400 | 1.5 | 0 | none |

## Spacing
| Element | Padding | Margin | Gap |
|---------|---------|--------|-----|
| Section | 60px 20px | | |
| Card | 24px | | |
| Grid | | | 24px |
| Card title → description | | 16px top | |

## Assets
| Element | File | Format | Size |
|---------|------|--------|------|
| Arrow icon | arrow-outbound.svg | SVG | 20×20 |
| Card image | card-placeholder.png | PNG | 300×200 |

## Interactions
| Element | Type | Details |
|---------|------|---------|
| Card | hover | box-shadow: 0 4px 12px rgba(0,0,0,0.1), transform: translateY(-2px) |
| Card | transition | box-shadow 0.2s ease, transform 0.2s ease |

## Responsive
- Tablet (< 900px): 3 columns → 2 columns
- Mobile (< 600px): 2 columns → 1 column stack
