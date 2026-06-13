// Raw brand hex values, for contexts that need a real color string (SVG/canvas fills, the
// force-directed funding graph) where a Tailwind token class can't be used. Components import
// from here instead of inlining hex literals, so the "no hardcoded hex in components" rule
// (RUBRIC I3) still holds. Mirrors BRAND.md / tailwind.config.ts.

export const PALETTE = {
  brand: { 100: "#dbe7ff", 300: "#8fb6ff", 500: "#2e7df6", 700: "#2342b0", 900: "#1f3370" },
  accent: { 100: "#ede9fe", 300: "#c4b5fd", 500: "#8b5cf6", 700: "#6d28d9", 900: "#4c1d95" },
  signal: { 100: "#fde3e5", 300: "#f7a3ab", 500: "#e63d50", 700: "#af1a35", 900: "#7c1a30" },
  slate: { 100: "#f1f5f9", 300: "#cbd5e1", 500: "#64748b", 700: "#334155", 900: "#0f172a" },
  white: "#ffffff",
} as const;

/** A categorical sequence for funding-graph nodes (cycles through brand/accent ramp steps). */
export const GRAPH_NODE_COLORS = [
  PALETTE.brand[500],
  PALETTE.accent[500],
  PALETTE.brand[700],
  PALETTE.accent[700],
  PALETTE.brand[300],
  PALETTE.accent[300],
] as const;
