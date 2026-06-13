import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A small numbered citation marker, e.g. inline in an AI answer ("...housing[1]").
 * Links to the source. Shared by WhyBreakdown + CitedAnswer.
 */
export function CitationChip({
  index,
  href,
  title,
  className,
}: {
  index: number;
  href?: string;
  title?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-100 px-1 align-super text-[10px] font-semibold leading-none text-accent-700 transition-colors",
    href && "hover:bg-accent-200",
    className
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={title}
        className={cls}
      >
        {index}
      </a>
    );
  }
  return (
    <span className={cls} title={title}>
      {index}
    </span>
  );
}
