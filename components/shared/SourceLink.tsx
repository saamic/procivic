import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The trust primitive — every fact carries one. Renders an external link to the
 * underlying source (OpenStates vote, FEC/SF-Ethics record, official summary).
 */
export function SourceLink({
  href,
  children,
  className,
  showIcon = true,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}) {
  let host = "";
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    host = "source";
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-brand-600 underline-offset-2 transition-colors hover:text-brand-700 hover:underline",
        className
      )}
    >
      {children ?? host}
      {showIcon && <ExternalLink className="h-3 w-3" aria-hidden />}
    </a>
  );
}
