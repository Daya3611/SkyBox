---
name: SkyBox
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  container_max: 1440px
  gutter: 24px
  margin_mobile: 16px
  margin_desktop: 32px
---

## Brand & Style
The design system is built on a foundation of "Aero-Minimalism"—a style that prioritizes clarity, depth, and a sense of lightness. It is designed for high-performance cloud storage, where the interface should feel as expansive and organized as the sky itself.

The aesthetic blends **Minimalism** with refined **Glassmorphism**. Key characteristics include:
- **Depth through Transparency:** Using blurred surfaces to maintain context of the underlying layers.
- **Precision Typography:** Leveraging a utilitarian typeface to ensure data density remains legible.
- **Airy Composition:** Generous whitespace (padding and margins) to reduce cognitive load during file management.
- **Subtle Motion:** Transitions should feel fluid and frictionless, mimicking the movement of clouds.

## Colors
The palette is centered around "Sky Blue," evoking trust and reliability. 

**Light Mode** utilizes a cool-toned neutral scale to maintain a crisp, clean environment. Surfaces are pure white to provide maximum contrast against the soft grey background.

**Dark Mode** shifts to deep navy and charcoal tones. The sidebar is slightly darker than the main surface area to provide a clear structural anchor. Semantic colors (Success, Warning, Danger) remain consistent across both modes but may utilize a 10% higher saturation in Dark Mode to maintain accessibility.

## Typography
This design system exclusively employs **Inter** for its systematic, utilitarian qualities. 

- **Weight Strategy:** Use `SemiBold` (600) for section headers and `Medium` (500) for interactive labels. `Regular` (400) is reserved for body text and descriptions.
- **Hierarchy:** Display sizes use tight letter spacing (-0.02em) to feel premium and intentional. Small labels use slight tracking (+0.01em) to maintain legibility at low point sizes.
- **Responsive:** Headlines scale down significantly on mobile to prevent awkward text wrapping in dashboard widgets.

## Layout & Spacing
The system utilizes a **12-column fluid grid** for the main content area with a fixed-width sidebar (280px). 

- **Rhythm:** An 8px linear scale governs all padding and margins to ensure mathematical harmony.
- **Density:** Dashboard views should prioritize a "comfortable" density setting, using `lg` (24px) spacing between major cards and `md` (16px) for internal card padding.
- **Sidebar:** On tablet, the sidebar collapses to an icon-only rail (80px). On mobile, it transitions to a bottom-navigation bar or a full-screen overlay.

## Elevation & Depth
Depth is created through a combination of **Ambient Shadows** and **Backdrop Blurs**.

1.  **Level 0 (Base):** The main background.
2.  **Level 1 (Cards/Surfaces):** White (Light) or Dark Navy (Dark) with a 1px border. No shadow or a very faint 2px blur.
3.  **Level 2 (Floating/Glass):** Used for navigation bars and dropdowns. Uses `backdrop-filter: blur(12px)` and a semi-transparent background (e.g., `rgba(255, 255, 255, 0.7)`).
4.  **Level 3 (Modals/Overlays):** High-diffusion shadows: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`.

Borders are essential for glass elements; use a "Glass Stroke"—a top-weighted linear gradient border that mimics light catching the edge of a pane.

## Shapes
The shape language is modern and approachable. 

- **Primary Radius:** A base of `16px` (rounded-lg) is applied to all primary containers and file cards to create a "soft-tech" feel.
- **Component Radius:** Interactive elements like buttons and inputs use a tighter `8px` radius to feel more precise and "clickable."
- **Icons:** Use icons with rounded terminals (2px stroke) to match the UI's rounded corners.

## Components

### Buttons
- **Primary:** Solid #2563EB with white text. Subtle inner-glow on hover.
- **Secondary:** Transparent background with a 1px #E5E7EB border.
- **Glass Action:** For use on top of imagery or gradients. `blur(8px)` with white text and a thin white border.

### File Cards
- **Structure:** 16px padding, 16px corner radius.
- **Interaction:** On hover, the card should lift slightly (y-axis -4px) and the shadow should deepen.
- **Visuals:** Large file-type icons in the center or a high-quality thumbnail preview.

### Inputs & Search
- **Search Bar:** Glassmorphic background with a 24px left-padding for the search icon. 
- **States:** Focus state uses a 2px primary color outer ring with 4px offset.

### Theme Switcher
- **Style:** A pill-shaped segmented control (toggle) with "Sun" and "Moon" icons. The active state is indicated by a white (or dark grey) "sliding" surface that moves behind the icons.

### Progress Bars (Storage Usage)
- **Design:** Thick 8px bars with fully rounded caps. Use a subtle gradient from Primary to Secondary colors to indicate "filling."