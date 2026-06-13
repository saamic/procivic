import * as React from "react";
import { CitationChip } from "@/components/shared/CitationChip";
import { SourceLink } from "@/components/shared/SourceLink";
import { cn } from "@/lib/utils";

export interface Citation {
  label: string;
  href: string;
}

/**
 * Renders a grounded answer whose text contains [n] markers, turning each into a
 * CitationChip linked to citations[n-1], with a Sources footer. Shared by the AI
 * recommendation rationale and the Ask panel — one citation contract, two surfaces.
 */
export function CitedAnswer({
  text,
  citations = [],
  className,
}: {
  text: string;
  citations?: Citation[];
  className?: string;
}) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm leading-relaxed text-foreground">
        {parts.map((part, i) => {
          const m = part.match(/^\[(\d+)\]$/);
          if (m) {
            const idx = Number(m[1]);
            const c = citations[idx - 1];
            return (
              <CitationChip key={i} index={idx} href={c?.href} title={c?.label} />
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </p>
      {citations.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sources
          </p>
          <ol className="space-y-1">
            {citations.map((c, i) => (
              <li key={i} className="flex items-baseline gap-1.5 text-xs">
                <CitationChip index={i + 1} />
                <SourceLink href={c.href}>{c.label}</SourceLink>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
