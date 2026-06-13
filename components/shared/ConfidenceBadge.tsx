import * as React from "react";
import { Gauge } from "lucide-react";
import { confidenceBucket } from "@/lib/scores";
import { cn } from "@/lib/utils";

const BUCKET_STYLES: Record<
  "High" | "Med" | "Low",
  { cls: string; label: string }
> = {
  High: { cls: "bg-brand-100 text-brand-800 border-brand-200", label: "High confidence" },
  Med: { cls: "bg-accent-100 text-accent-800 border-accent-200", label: "Medium confidence" },
  Low: { cls: "bg-signal-100 text-signal-800 border-signal-200", label: "Low confidence" },
};

/** Confidence shown as a bucket (High/Med/Low) per config thresholds, optionally with %. */
export function ConfidenceBadge({
  value,
  showValue = false,
  size = "md",
  className,
}: {
  value: number;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const bucket = confidenceBucket(value);
  const s = BUCKET_STYLES[bucket];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        s.cls,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
      title={`Confidence: ${Math.round(value)} / 100`}
    >
      <Gauge className="h-3.5 w-3.5" aria-hidden />
      <span>{bucket}</span>
      {showValue && <span className="tabular opacity-70">{Math.round(value)}</span>}
    </span>
  );
}
