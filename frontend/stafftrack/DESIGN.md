---
name: Earth & Terra Kiosk
colors:
  surface: '#FFFDF5'
  surface-dim: '#dbdcc3'
  surface-bright: '#fbfbe2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f5dc'
  surface-container: '#FDF6E3'
  surface-container-high: '#eaead1'
  surface-container-highest: '#e4e4cc'
  on-surface: '#4A3728'
  on-surface-variant: '#7A6A53'
  inverse-surface: '#303221'
  inverse-on-surface: '#f2f2d9'
  outline: '#D2B48C'
  outline-variant: '#ddc0ba'
  surface-tint: '#9f402d'
  primary: '#9f402d'
  on-primary: '#ffffff'
  primary-container: '#e2725b'
  on-primary-container: '#5a0d02'
  inverse-primary: '#ffb4a5'
  secondary: '#56642b'
  on-secondary: '#ffffff'
  secondary-container: '#d6e7a1'
  on-secondary-container: '#5a682f'
  tertiary: '#904d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#dd7900'
  on-tertiary-container: '#462200'
  error: '#D9534F'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a5'
  on-primary-fixed: '#3e0500'
  on-primary-fixed-variant: '#802918'
  secondary-fixed: '#d9eaa3'
  secondary-fixed-dim: '#bdce89'
  on-secondary-fixed: '#161f00'
  on-secondary-fixed-variant: '#3e4c16'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fbfbe2'
  on-background: '#1b1d0e'
  surface-variant: '#e4e4cc'
typography:
  display-lg:
    fontFamily: Syne
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  technical-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
spacing:
  margin-edge: 32px
  base: 8px
  admin-gutter: 16px
  touch-target: 48px
  kiosk-gap: 24px
---

## Brand & Style

The brand identity is "Warm Industrial" – a fusion of high-utility kiosk functionality with a grounded, organic aesthetic. It targets frontline staff and administrators in physical work environments, evoking a sense of reliability and approachability. 

The design style is **Modern Brutalism with a Soft Palette**. It utilizes heavy borders and structured grids to signify durability and precision, while the "Cream and Terracotta" color scheme softens the technological edge. This creates an environment that feels both professional and human-centric, avoiding the cold sterility of typical enterprise software.

## Colors

The palette is inspired by natural pigments and earth tones.
- **Primary (Terracotta):** Used for essential actions and brand identifiers. It provides high visibility against the neutral background without the aggression of pure red.
- **Secondary (Sage):** Employed for positive states and successful attendance markers.
- **Tertiary (Sunset Orange):** Reserved for transitional states like breaks or warnings.
- **Background & Surface (Cream/Beige):** The base is a warm cream (#F5F5DC), reducing eye strain compared to pure white and reinforcing the organic theme.
- **Typography (Deep Umber):** Instead of black, a deep brown (#4A3728) is used to maintain warmth and contrast.

## Typography

The typography system uses three distinct families to separate hierarchy and intent:
- **Syne:** Used for large display and headline elements. Its geometric, bold character provides a strong editorial feel.
- **DM Sans:** The workhorse for body text and descriptions, chosen for its clarity and neutral modernism.
- **JetBrains Mono:** Used for technical data, status labels, and timestamps. The monospaced nature emphasizes the "kiosk" utility and precision.
- **Internationalization:** All fonts are paired with *Noto Sans Devanagari* to ensure seamless rendering of Hindi and other Indic scripts while maintaining the weight of the Latin counterparts.

## Layout & Spacing

The system follows a **Fluid Grid with Touch-Optimized Spacing**.
- **The 8px Rhythm:** All spacing and component heights are multiples of 8px.
- **Touch Targets:** A minimum height of 48px is enforced for all interactive elements to accommodate kiosk usage.
- **Grid System:** On desktop, a 4-column layout is used for cards; on mobile, this collapses to a single column.
- **Margins:** High-density content is protected by a generous 32px edge margin to ensure visibility and prevent accidental touches near the screen bezel.

## Elevation & Depth

This system avoids soft, floating shadows in favor of **Structural Layering and Tonal Depth**.
- **Surface Tiers:** Depth is communicated through color shifts (e.g., `surface-container` to `surface-container-high`) rather than shadows.
- **Hard Outlines:** All containers use a 1px solid border (`#D2B48C`) to define boundaries, creating a "blueprint" or "industrial" feel.
- **Focus States:** Interactivity is signaled by color-shifting the border to the Primary hue (`#E2725B`) and applying a subtle `shadow-md` for a tactile "pressed" or "elevated" effect upon hover/focus.
- **Status Indicators:** 4px color bars are used at the bottom of cards to indicate status without cluttering the UI with heavy gradients.

## Shapes

The shape language is strictly **Geometric and Sharp**. 
- **Square Corners:** Buttons, cards, and input fields use a 2px (Sharp/Minimal) radius to maintain the industrial, architectural aesthetic.
- **Exception (Avatars):** Personal profiles use perfect circles to provide a human contrast to the rigid UI grid.
- **Exception (Primary Action):** The main "Report" button uses a full pill shape to distinguish it as the global floating action.

## Components

- **Buttons:** Primary buttons are solid Terracotta with white `label-caps` text. Secondary buttons use a hollow border style or a subtle container fill with a reactive hover state that changes the border color.
- **Cards:** Staff cards are the primary interface unit. They feature a centered avatar, a prominent `headline-lg` name, and a specific status chip. They utilize a bottom-aligned status bar (Sage for present, Error for absent).
- **Status Chips:** Small, square-edged labels using `technical-sm` monospaced text. Backgrounds are 10% opacity versions of the status color with a 20% opacity border.
- **Top App Bar:** Fixed at the top, utilizing a simple border-bottom for separation. It houses the brand mark on the left and a high-visibility digital clock (JetBrains Mono) on the right.
- **Overlays:** Biometric or processing screens use a 95% opacity background blur of the `background` color to focus the user on the central scanning animation.