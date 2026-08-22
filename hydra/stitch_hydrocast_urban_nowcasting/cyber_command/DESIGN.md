---
name: Cyber-Command
colors:
  surface: '#0e141a'
  surface-dim: '#0e141a'
  surface-bright: '#343a41'
  surface-container-lowest: '#090f15'
  surface-container-low: '#161c23'
  surface-container: '#1a2027'
  surface-container-high: '#252a31'
  surface-container-highest: '#2f353c'
  on-surface: '#dde3ec'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dde3ec'
  inverse-on-surface: '#2b3138'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#ebb2ff'
  on-secondary: '#520071'
  secondary-container: '#ce5dff'
  on-secondary-container: '#480064'
  tertiary: '#fff5f8'
  on-tertiary: '#5e0053'
  tertiary-container: '#ffccee'
  on-tertiary-container: '#af009d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#f8d8ff'
  secondary-fixed-dim: '#ebb2ff'
  on-secondary-fixed: '#320047'
  on-secondary-fixed-variant: '#74009f'
  tertiary-fixed: '#ffd7f0'
  tertiary-fixed-dim: '#fface8'
  on-tertiary-fixed: '#3a0033'
  on-tertiary-fixed-variant: '#840076'
  background: '#0e141a'
  on-background: '#dde3ec'
  surface-variant: '#2f353c'
  absolute-black: '#000000'
  warning-orange: '#ffaa00'
  glow-cyan: rgba(0, 242, 255, 0.4)
  glass-surface: rgba(5, 10, 16, 0.7)
typography:
  display-lg:
    fontFamily: sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: sora
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  data-mono:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 20px
  margin-desktop: 40px
  margin-mobile: 16px
  glass-padding: 24px
---

## Brand & Style

The design system is a high-end, futuristic "Cyber-Command" aesthetic, evolving from urban intelligence into a mission-critical, cinematic command center. The brand personality is authoritative, sophisticated, and technologically advanced, targeting elite operators who require immediate cognitive processing of complex data.

The style is a fusion of **Glassmorphism** and **High-Contrast / Bold** modern design. It utilizes a foundation of deep, "absolute" blacks to create an infinite depth effect, contrasted by vibrant neon accents that mimic light emission. The emotional response is one of controlled power—a digital frontier where data feels tangible, luminous, and predictive. Every interaction should feel like a pulse of energy through a high-tech conduit.

## Colors

The palette is strictly dark-mode, leveraging the "Absolute Black" foundation to make the "Deep Space Navy" surfaces appear as structured layers floating in a vacuum. 

- **Primary (Electric Neon Cyan):** Used for active data paths, primary navigation, and "Live" telemetry.
- **Secondary (Cyber Purple):** Used for analytical overlays, AI-driven insights, and secondary interactive states.
- **Tertiary (Magenta Glow):** Reserved for high-priority alerts and expressive branding moments.
- **Warning Orange:** A non-chromatic functional color used exclusively for system errors or critical thresholds.

The "Cyber-Command" aesthetic relies on glow effects. Gradients should primarily be "Aurora-style"—soft, multi-stop blurs (e.g., Cyan to Purple) used sparingly behind glass surfaces or as subtle animated borders.

## Typography

This design system uses a high-tech typographic hierarchy that balances the bold, geometric presence of **Sora** with the utilitarian precision of **Inter** and **JetBrains Mono**.

- **Sora:** Used for headlines and display values. Its wide, modern stance reinforces the "Cyber-Command" aesthetic. 
- **Inter:** The workhorse for all body copy and descriptions, ensuring legibility against dark, complex backgrounds.
- **JetBrains Mono:** Used for all labels, metadata, and numerical data points. This creates an "engineering-grade" feel where values align perfectly in tables and dashboards.

All labels should be in all-caps with generous letter spacing to evoke the look of a digital instrumentation panel.

## Layout & Spacing

The layout utilizes a **Fixed Grid** for dashboard environments to maintain technical alignment, transitioning to a **Fluid Grid** for content-heavy views. 

- **The 12-Column Command Grid:** Elements are placed on a 12-column grid with 20px gutters. This provides the "Bento Box" structure necessary for complex data visualization.
- **Rhythm:** Spacing follows a 4px base unit. Larger gaps (40px+) should be used between major functional groups to prevent visual clutter.
- **Responsive Reflow:** On Tablet (768px - 1024px), the grid collapses to 6 columns. On Mobile (<768px), it shifts to a single-column stack with margins reduced to 16px to maximize data real estate.

## Elevation & Depth

Hierarchy is achieved through **Glassmorphism** and light-based depth rather than traditional shadows.

- **Surface Layers:** Surfaces use "Deep Space Navy" with 70% opacity and a `backdrop-blur` of 12px to 20px. This allows background "Aurora" gradients to subtly bleed through.
- **Glow Borders:** Instead of shadows, use 1px semi-transparent borders. Primary components feature an animated "scanning" border—a linear gradient that moves along the perimeter.
- **Light Bloom:** High-priority elements use an ambient outer glow (`box-shadow` with high blur, 0px offset, and 30-40% color opacity) to appear as if they are emitting light.
- **Z-Axis:** Modals and popovers should be significantly brighter and have a stronger blur effect (30px+) to isolate them from the command layer.

## Shapes

The shape language is **Soft** but precise. A uniform 0.25rem (4px) radius is applied to most containers to maintain a technical, "machined" appearance.

- **Interactive Elements:** Buttons and inputs utilize the 0.25rem radius.
- **Large Panels:** Major dashboard modules (cards) use a larger `rounded-lg` (0.5rem) to soften the overall composition.
- **Micro-indicators:** Status pips and small notification dots remain sharp or perfectly circular to distinguish them from structural elements.

## Components

- **Cyber Buttons:** Primary buttons feature a solid Electric Cyan fill with a subtle "pulse" animation on the border. Text is #000000 for maximum legibility. Secondary buttons are glass-filled with a 1px Cyan border.
- **Glass Cards:** The core container. Features a subtle gradient background (Deep Navy to Black), a 1px border, and a 20px backdrop blur.
- **Neon Chips:** Used for status. They feature a high-saturation background with 20% opacity and a matching 100% opacity text color (e.g., Magenta text on 20% Magenta background).
- **Command Inputs:** Input fields are absolute black with a 1px Deep Navy border that turns Electric Cyan on focus, accompanied by a subtle outer glow.
- **Animated Lists:** List items should feature a "gradient shift" on hover, where a subtle Cyber Purple highlight slides across the background.
- **Telemetry Readouts:** Large numerical displays using Sora Bold, paired with a JetBrains Mono label. These should include a small "micro-sparkline" that pulses with live data updates.
- **Aurora Dividers:** Instead of flat lines, use thin, horizontal gradients that fade to transparent at both ends to separate content sections.