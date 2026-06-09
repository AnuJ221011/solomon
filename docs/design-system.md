---
name: Solomon Bharat
colors:
  surface: '#fbf9f4'
  surface-dim: '#dbdad5'
  surface-bright: '#fbf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ee'
  surface-container: '#f0eee9'
  surface-container-high: '#eae8e3'
  surface-container-highest: '#e4e2dd'
  on-surface: '#1b1c19'
  on-surface-variant: '#444748'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f1ec'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#725a3a'
  on-secondary: '#ffffff'
  secondary-container: '#feddb4'
  on-secondary-container: '#786040'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c16'
  on-tertiary-container: '#86847c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#feddb4'
  secondary-fixed-dim: '#e0c29a'
  on-secondary-fixed: '#281801'
  on-secondary-fixed-variant: '#584325'
  tertiary-fixed: '#e6e2d9'
  tertiary-fixed-dim: '#cac6be'
  on-tertiary-fixed: '#1c1c16'
  on-tertiary-fixed-variant: '#484740'
  background: '#fbf9f4'
  on-background: '#1b1c19'
  surface-variant: '#e4e2dd'
  handmade-paper: '#F9F7F2'
  raw-linen: '#FCFAFA'
  aged-brass: '#A68B67'
  charcoal: '#1A1A1A'
  subtle-border: '#E5E1D8'
  success-muted: '#6B7E6B'
  warning-muted: '#C29D72'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.03em
  caption:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  margin-mobile: 1.5rem
  margin-desktop: 4rem
  gutter: 2rem
  section-gap: 6rem
  unit: 4px
---

## Brand & Style

The design system embodies "Premium Indian Editorial," merging the high-utility structure of a global wholesale marketplace with the refined, tactile soul of an artisan magazine. It is built for a discerning B2B audience that values provenance and craftsmanship as much as logistics and reliability.

The aesthetic follows a **Modern Editorial** movement:
- **Atmosphere:** Expensive, calm, and breathable. It avoids the frantic, high-density layouts of traditional wholesale in favor of generous whitespace and a "gallery" approach to commerce.
- **Visual Rhythm:** Balanced and asymmetrical grids inspired by high-end fashion journals.
- **Surface Treatment:** Clean and flat with "barely-there" depth. Interactions are deliberate and soft, mimicking the feel of turning a page in a physical publication.

## Colors

The palette is strictly organic and low-chroma, eschewing digital vibrancy for "warm neutrals."

- **Background Strategy:** Use `handmade-paper` (#F9F7F2) as the primary canvas for the marketplace and `raw-linen` (#FCFAFA) for gated dashboard surfaces to provide a subtle psychological shift between "browsing" and "working."
- **Typography & Details:** Use `charcoal` (#1A1A1A) for all primary text to maintain high contrast and authority.
- **Accents:** `aged-brass` (#A68B67) is reserved for interactive highlights, active states, and achievement-related iconography.
- **Borders:** 1px `subtle-border` (#E5E1D8) should be used instead of shadows to define containers, maintaining a crisp, architectural feel.

## Typography

The typography system relies on the interplay between the traditional elegance of **Playfair Display** and the pragmatic, modern clarity of **Public Sans**.

- **Editorial Headlines:** Use Playfair Display for brand names, section titles, and storytelling elements. Tighten letter-spacing on larger display sizes to enhance the premium feel.
- **Utility UI:** Use Public Sans for all dashboard data, navigation, and product descriptions. It ensures legibility in high-density tables and forms.
- **Hierarchy:** Maintain a clear distinction between the two. Never use Playfair Display for labels or body copy; it is strictly a "voice" for the brand's premium identity.

## Layout & Spacing

The layout is governed by a **fixed-center editorial grid** for the public marketplace and a **responsive dashboard layout** for the gated portals.

- **Marketplace Grid:** A 12-column grid with generous 4rem margins on desktop. Product grids should utilize whitespace as a design element, avoiding overcrowded rows.
- **Dashboard Layout:** A fixed left-sidebar (280px) with a fluid content area.
- **Rhythm:** Use a 4px base unit. Section spacing is intentionally large (6rem+) to enforce the "breathable" atmosphere.
- **Mobile Reflow:** On mobile, margins reduce to 1.5rem and columns collapse to 1 or 2. Horizontal scrolling is prohibited; use vertical stacking for all content modules.

## Elevation & Depth

This design system avoids heavy shadows, opting for **Tonal Layering** and **Subtle Outlines**.

- **Surfaces:** Depth is created by placing white cards (`raw-linen`) on slightly darker off-white backgrounds (`handmade-paper`).
- **Outlines:** Use 1px borders in `subtle-border` (#E5E1D8) for all container definitions.
- **Shadows:** When elevation is necessary (e.g., a hover state on a product card), use a single, extremely diffused shadow: `0 4px 20px rgba(26, 26, 26, 0.04)`.
- **Modals:** The Auth Gate uses a semi-transparent backdrop blur (12px) to keep the product context visible while focusing the user on the gated interaction.

## Shapes

The shape language is architectural and structured.

- **Corner Radius:** A consistent "Soft" (0.25rem / 4px) radius is applied to buttons, input fields, and cards. This provides a hint of approachability without losing the professional, "square" editorial look.
- **Imagery:** Product photos must always be auto-cropped to 1:1 square aspect ratios.
- **Badges:** Achievement badges and status indicators use the same 4px radius; do not use pill shapes or circles for UI elements.

## Components

- **Buttons:** Primary buttons are `charcoal` with white text. Secondary buttons use `subtle-border` with `charcoal` text. All buttons have a 4px–6px radius and no heavy gradients.
- **Tactile Cards:** Product cards feature a 1px border. On hover, the border darkens slightly and a soft-elevation shadow appears to create a "lift" effect.
- **Input Fields:** Flat surfaces with 1px borders. Focus states use a subtle 1px inner stroke of `aged-brass`.
- **Status Indicators:** Use muted, earthy versions of semantic colors (e.g., `success-muted` sage instead of bright green).
- **Sticky Banners:** The 0% commission/invite banner is a slim, persistent bar at the top of the viewport, using a full-width `aged-brass` background with white `label-md` text.
- **Achievement Progress:** Visualized using thin, linear progress bars in `aged-brass` against a `subtle-border` track.

## Implementation Reference

The design tokens above are implemented in the frontend at:

- **`frontend/app/globals.css`** — CSS custom properties (`--bg`, `--accent`, `--border-warm`, etc.) and the `@theme` block mapping to Tailwind utilities
- **`frontend/app/layout.tsx`** — Google Fonts: `Playfair_Display` (`--font-playfair`) + `Public_Sans` (`--font-public-sans`)

### Token mapping (DESIGN.md → codebase)

| DESIGN.md token | CSS variable | Hex |
|---|---|---|
| `handmade-paper` | `--bg` | `#F9F7F2` |
| `raw-linen` | `--surface` | `#FCFAFA` |
| `charcoal` | `--primary` | `#1A1A1A` |
| `aged-brass` | `--accent` | `#A68B67` |
| `aged-brass` (hover) | `--accent-hover` | `#8B7055` |
| `surface-container-low` | `--muted-bg` | `#F5F0E8` |
| `on-surface-variant` | `--muted-text` | `#444748` |
| `subtle-border` | `--border-warm` | `#E5E1D8` |
| `success-muted` | `--success` | `#6B7E6B` |
| `error` | `--error` | `#BA1A1A` |
