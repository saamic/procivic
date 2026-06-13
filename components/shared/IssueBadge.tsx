import * as React from "react";
import {
  Home,
  Shield,
  Coins,
  Scale,
  Landmark,
  Gavel,
  Leaf,
  HeartPulse,
  Globe,
  Vote,
  type LucideIcon,
} from "lucide-react";
import type { IssueId } from "@/config/issues";
import { ISSUES } from "@/config/issues";
import { cn } from "@/lib/utils";

/** One canonical icon per issue axis — reused anywhere an issue is shown. */
export const ISSUE_ICONS: Record<IssueId, LucideIcon> = {
  housing: Home,
  homelessness_safety: Shield,
  business_tax: Coins,
  inequality_labor: Scale,
  city_fiscal: Landmark,
  govt_reform: Gavel,
  climate: Leaf,
  healthcare: HeartPulse,
  immigration: Globe,
  civil_democracy: Vote,
};

const LABELS: Record<IssueId, string> = Object.fromEntries(
  ISSUES.map((i) => [i.id, i.label])
) as Record<IssueId, string>;

export function issueLabel(id: IssueId): string {
  return LABELS[id] ?? id;
}

export function IssueBadge({
  issue,
  className,
  showLabel = true,
  size = "md",
}: {
  issue: IssueId;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const Icon = ISSUE_ICONS[issue] ?? Vote;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/80 font-medium text-brand-800",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Icon
        className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", "text-brand-500")}
        aria-hidden
      />
      {showLabel && <span>{issueLabel(issue)}</span>}
    </span>
  );
}
