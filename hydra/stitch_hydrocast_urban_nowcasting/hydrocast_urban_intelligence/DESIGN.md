---
name: Hydrocast Urban Intelligence
colors:
  surface: '#0f141b'
  surface-dim: '#0f141b'
  surface-bright: '#343941'
  surface-container-lowest: '#090f15'
  surface-container-low: '#171c23'
  surface-container: '#1b2027'
  surface-container-high: '#252a32'
  surface-container-highest: '#30353d'
  on-surface: '#dee2ec'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#dee2ec'
  inverse-on-surface: '#2c3138'
  outline: '#859399'
  outline-variant: '#3c494e'
  surface-tint: '#47d6ff'
  primary: '#a5e7ff'
  on-primary: '#003543'
  primary-container: '#00d2ff'
  on-primary-container: '#00566a'
  inverse-primary: '#00677f'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffd6a7'
  on-tertiary: '#472a00'
  tertiary-container: '#ffb148'
  on-tertiary-container: '#704500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b6ebff'
  primary-fixed-dim: '#47d6ff'
  on-primary-fixed: '#001f28'
  on-primary-fixed-variant: '#004e60'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#0f141b'
  on-background: '#dee2ec'
  surface-variant: '#30353d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-lg-mono:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-page: 24px
  card-padding: 16px
  stack-gap: 8px
---

## Brand & Style

This design system is engineered for high-stakes urban monitoring and emergency response. The aesthetic is **Corporate / Modern** with a focus on **Minimalism** and high information density. It prioritizes clarity, data integrity, and rapid scanning over decorative elements.

The interface evokes a sense of calm authority and technical precision. It utilizes a sophisticated dark palette to reduce eye strain during long monitoring shifts, while employing high-contrast status colors to direct immediate attention to critical environmental threats. The visual language avoids "gamer" aesthetics, instead opting for a refined, engineering-grade interface that feels like a professional mission-control tool.

## Colors

The palette is anchored by a deep charcoal and navy foundation to provide maximum contrast for data overlays. 

- **Primary (Water/Logic):** Cyan is used for active states, water level indicators, and AI prediction paths.
- **Semantic Status:** A standard traffic-light system is extended for flood specificities:
    - **Safe (Green):** Normal drainage and river levels.
    - **Moderate (Yellow):** Advisory levels, monitoring required.
    - **High (Orange):** Pre-flood conditions, localized street ponding.
    - **Critical (Red):** Severe flooding, immediate life-safety risk.
- **Surface Strategy:** Use the neutral charcoal (#161b22) for card backgrounds, accented by thin 1px borders to define structure without adding visual bulk.

## Typography

The system utilizes **Inter** for its exceptional legibility in UI contexts and **JetBrains Mono** for technical data readouts.

- **Headlines:** Reserved for dashboard section titles and critical alert headers.
- **Data Mono:** Used for sensor readings, coordinates, and timestamps. The monospaced nature ensures that fluctuating numbers do not cause layout jitter.
- **Label Caps:** Used for metadata, table headers, and small categorization tags to provide a distinct visual hierarchy from body text.
- **Mobile Scaling:** Large displays are reduced by 15% on mobile devices, though the system is primarily optimized for desktop command centers.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a heavy emphasis on a modular "bento-box" arrangement. 

- **Grid:** A 12-column layout for the main dashboard, allowing for flexible arrangements of maps, telemetry feeds, and alert lists.
- **Density:** High information density is achieved through tight 4px increments. Gutters are kept at 16px to maximize the screen real estate for map-based visualizations.
- **Responsiveness:** On tablet devices, the side panel (Alerts) collapses into a drawer. On mobile, the map remains the primary focus with telemetry cards stacked below.

## Elevation & Depth

This system avoids heavy shadows to maintain a clean, technical appearance. Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**:

- **Level 0 (Background):** #0a0e17 (The canvas).
- **Level 1 (Surface):** #161b22 with a 1px border (#2d333b) to define component boundaries.
- **Level 2 (Hover/Active):** Subtle lightening of the surface or the addition of a primary-colored glow (10% opacity) to indicate selection.
- **Popovers/Modals:** Use a slight backdrop blur (8px) to push the map into the background during focused interactions.

## Shapes

The shape language is **Soft** but disciplined. 

- **Containers:** Cards and primary UI panels use a 0.25rem (4px) radius. This provides a modern feel while maintaining a professional, structured edge.
- **Interactive Elements:** Buttons and input fields follow the same 4px radius. 
- **Status Indicators:** Small circular pips are used for "live" status indicators to contrast against the predominantly rectangular UI.

## Components

- **Buttons:** Primary buttons use a solid Cyan (#00d2ff) with black text for maximum contrast. Secondary buttons use a ghost style (thin border, no fill).
- **Telemetry Cards:** Feature a label-caps header, a large monospaced value, and a small sparkline chart showing the 1-hour trend.
- **Alert List:** Individual items should have a vertical color-coded stripe on the left edge corresponding to the severity (Safe to Critical).
- **Input Fields:** Dark fills (#0d1117) with subtle borders. The focus state should use a sharp Cyan glow.
- **Chips/Tags:** Used for filtering sensor types (e.g., "Rain Gauge," "River Level"). These are low-profile with small font sizes to avoid distracting from primary data.
- **Data Maps:** The core component. Map styles should be "Dark/Mono" to allow the Cyan and Orange flood overlays to be the focal point.
- **AI Prediction Toggle:** A specialized switch component that highlights predicted versus historical data on charts.