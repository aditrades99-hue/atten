---
name: Warm Humanist System
colors:
  surface: '#fff8f4'
  surface-dim: '#e1d8d2'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2eb'
  surface-container: '#f5ece5'
  surface-container-high: '#f0e7df'
  surface-container-highest: '#eae1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#56423e'
  inverse-surface: '#34302b'
  inverse-on-surface: '#f8efe8'
  outline: '#89726d'
  outline-variant: '#ddc0bb'
  surface-tint: '#a03f2e'
  primary: '#9d3d2c'
  on-primary: '#ffffff'
  primary-container: '#bd5541'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a5'
  secondary: '#4f6443'
  on-secondary: '#ffffff'
  secondary-container: '#cfe7bd'
  on-secondary-container: '#536947'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ad6214'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3f0400'
  on-primary-fixed-variant: '#802919'
  secondary-fixed: '#d2eac0'
  secondary-fixed-dim: '#b6cea5'
  on-secondary-fixed: '#0e2006'
  on-secondary-fixed-variant: '#384c2d'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fff8f4'
  on-background: '#1f1b17'
  surface-variant: '#eae1da'
typography:
  headline-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: DM Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

This design system is built on the philosophy of "Warm Efficiency." It departs from the cold, industrial aesthetics common in workforce management, opting instead for a tactile, human-centric approach. The brand personality is approachable yet organized, evoke a sense of calm productivity rather than urgent monitoring.

The style leverages **Minimalism** with a **Tactile** twist. It uses a base of organic, warm surfaces (creams and beiges) instead of stark whites or deep blacks. High-quality typography and generous whitespace are used to ensure clarity, while vibrant, nature-inspired accents provide the necessary visual energy for action-oriented tasks.

The emotional response should be one of "supported focus"—where the tool feels less like a surveillance device and more like a helpful, well-designed workspace.

## Colors

The palette is strictly warm and avoids all blue or pure black tones to maintain its "aesthetic" and approachable feel.

- **Surfaces:** Use `#FCF9F2` (Cream) for the primary background and `#F5E6D3` (Beige) for secondary containers or card backgrounds. This creates a soft, paper-like depth.
- **Primary (Terracotta):** Reserved for primary actions, high-level headers, and critical brand moments.
- **Secondary (Sage Green):** Used for positive states, success indicators, and growth-related metrics.
- **Tertiary (Sunset Orange):** Used for warnings, highlights, or to draw attention to secondary interactive elements.
- **Typography (Warm Grey):** Instead of black, `#4A4540` provides high legibility while maintaining the warmth of the surrounding palette.

## Typography

This design system uses a distinctive typographic hierarchy to balance personality with data clarity.

- **Headings (Syne):** Syne brings a modern, avant-garde character to the UI. It should be used for large titles and section headers. Keep letter-spacing tight on larger sizes to emphasize its unique geometric shapes.
- **Body & UI (DM Sans):** For standard interface elements, descriptions, and inputs, DM Sans provides a clean, low-contrast companion that ensures high readability across all languages, including the Hindi and Nepali scripts.
- **Data & Mono (JetBrains Mono):** All technical data, timestamps, ID numbers, and tabular figures must use JetBrains Mono. This ensures that columns of numbers align perfectly and provides a subtle "utility" feel to data-heavy sections.

**Localization Note:** For Hindi and Nepali, ensure line-height is increased by 20% to accommodate the Devanagari script's descenders and upper vowel marks (matras).

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous internal margins to maintain the "airy" and clean feel.

- **Desktop:** 12-column grid with 24px gutters and 64px outer margins. Content should be grouped in cards that span 3, 4, 6, or 12 columns.
- **Mobile:** 4-column grid with 16px margins. 
- **Rhythm:** Use an 8px base unit for all spacing. Vertical rhythm is critical; maintain 48px or 80px gaps between major sections to prevent the UI from feeling cluttered.

**Language Toggle:** The language toggle for Hindi and Nepali should be placed in the top-right utility area of the header. It should use a simple pill-shaped container with `label-caps` typography.

## Elevation & Depth

Depth is conveyed through **Tonal Layers** and **Soft Ambient Shadows**. We avoid high-contrast shadows or harsh borders.

- **Surface Tiers:** Use the primary background (Cream) for the canvas. Interactive cards use a slightly lighter, more luminous version of the background or a subtle 1px border in a darker beige tone.
- **Shadows:** Use a "Sunset Shadow" style—low-opacity, highly diffused shadows with a slight warm tint (`rgba(74, 69, 64, 0.08)`). This makes elements feel like they are resting gently on a soft surface.
- **Active State:** When an element is pressed or active, it should "sink" slightly, reducing its shadow and shifting to a subtly darker tonal background.

## Shapes

The shape language is consistently **Rounded**. Sharp corners are avoided to maintain the friendly and organic personality.

- **Standard Elements:** Buttons, input fields, and small cards use a `0.5rem` (8px) radius.
- **Large Containers:** Dashboard widgets and main content areas use `1rem` (16px) radius.
- **Interactive Indicators:** Selection states (like the active language in the toggle) should use a pill-shape (`rounded-xl` or full 9999px) to contrast against the more structural card shapes.

## Components

- **Buttons:** Primary buttons use the Terracotta background with white text. Secondary buttons use a Sage Green outline with Sage text. All buttons have a subtle "lift" on hover.
- **Chips & Badges:** Use for status or categories. Apply a low-opacity background of the accent colors (e.g., 10% Sage Green background with 100% Sage Green text).
- **Input Fields:** Use a subtle beige background (`#F5E6D3`) rather than white. The bottom border should be slightly thicker (2px) to give a grounded, "form-like" feel.
- **Language Toggle:** A segmented control component. The active language is highlighted with a Terracotta or Sage Green pill background, while the inactive text remains in the warm grey neutral color.
- **Cards:** Cards should not have heavy borders. Instead, use a subtle 1px border in a warm taupe at 10% opacity and the "Sunset Shadow" for depth.
- **Data Tables:** Remove all vertical grid lines. Use horizontal lines in a very light beige. Header rows should use `label-caps` in JetBrains Mono.