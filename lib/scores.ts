// UI helpers for the ONE score visual language (BRAND.md): a diverging in-palette scale
// signal(low) -> accent(mid) -> brand(high), shared by Alignment / Confidence /
// Consistency / Transparency. The scoring MATH lives in lib/scoring.ts (Slice 2); this is
// purely how a 0..100 number maps to color + label.

import { SCORING } from "@/config/scoring.config";
import { clamp } from "@/lib/utils";

export type ScoreTone = "low" | "mid" | "high";

export interface ScoreVisual {
  tone: ScoreTone;
  /** Tailwind text color class. */
  text: string;
  /** Tailwind bg tint class (soft). */
  bgSoft: string;
  /** Tailwind solid bg class (for filled meters / pills). */
  bgSolid: string;
  /** Tailwind border class. */
  border: string;
  /** Hex for inline SVG / canvas fills. */
  hex: string;
}

export function scoreTone(value: number): ScoreTone {
  const v = clamp(value, 0, 100);
  if (v >= 67) return "high";
  if (v >= 40) return "mid";
  return "low";
}

const VISUALS: Record<ScoreTone, ScoreVisual> = {
  high: {
    tone: "high",
    text: "text-brand-700",
    bgSoft: "bg-brand-100",
    bgSolid: "bg-brand-500",
    border: "border-brand-200",
    hex: "#2e7df6",
  },
  mid: {
    tone: "mid",
    text: "text-accent-700",
    bgSoft: "bg-accent-100",
    bgSolid: "bg-accent-500",
    border: "border-accent-200",
    hex: "#8b5cf6",
  },
  low: {
    tone: "low",
    text: "text-signal-700",
    bgSoft: "bg-signal-100",
    bgSolid: "bg-signal-500",
    border: "border-signal-200",
    hex: "#e63d50",
  },
};

export function scoreVisual(value: number): ScoreVisual {
  return VISUALS[scoreTone(value)];
}

/** Confidence bucket from config thresholds (High >=70, Med 40-69, Low <40). */
export function confidenceBucket(value: number): "High" | "Med" | "Low" {
  if (value >= SCORING.confidence.highMin) return "High";
  if (value >= SCORING.confidence.medMin) return "Med";
  return "Low";
}

/** A gradient stop set for a continuous meter fill, low->high. */
export const SCORE_GRADIENT =
  "linear-gradient(90deg, #e63d50 0%, #8b5cf6 50%, #2e7df6 100%)";

export function pct(value: number): string {
  return `${Math.round(clamp(value, 0, 100))}%`;
}
