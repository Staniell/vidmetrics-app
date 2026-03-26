/**
 * Light-mode CSS variable overrides as hex values.
 * html2canvas cannot resolve oklch() colors, so we apply these
 * as inline styles on the off-screen export container.
 */
export const PDF_THEME_VARS: Record<string, string> = {
  "--background": "#ffffff",
  "--foreground": "#1a1a1a",
  "--card": "#ffffff",
  "--card-foreground": "#1a1a1a",
  "--popover": "#ffffff",
  "--popover-foreground": "#1a1a1a",
  "--primary": "#2b2b2b",
  "--primary-foreground": "#fbfbfb",
  "--secondary": "#f5f5f5",
  "--secondary-foreground": "#2b2b2b",
  "--muted": "#f5f5f5",
  "--muted-foreground": "#737373",
  "--accent": "#f5f5f5",
  "--accent-foreground": "#2b2b2b",
  "--border": "#e5e5e5",
  "--input": "#e5e5e5",
  "--ring": "#a3a3a3",
  "--chart-1": "#e1580b",
  "--chart-2": "#2d8f7b",
  "--chart-3": "#2f4f5f",
  "--chart-4": "#d4a017",
  "--chart-5": "#d48a0b",
}

// Direct hex constants for Recharts stroke/fill props (SVG doesn't reliably
// inherit CSS custom properties when captured by html2canvas)
export const CHART_1 = "#e1580b"
export const CHART_2 = "#2d8f7b"
export const CHART_3 = "#2f4f5f"
export const CHART_4 = "#d4a017"
export const CHART_5 = "#d48a0b"

export const FOREGROUND = "#1a1a1a"
export const MUTED_FOREGROUND = "#737373"
export const BORDER = "#e5e5e5"
export const GREEN_600 = "#16a34a"
