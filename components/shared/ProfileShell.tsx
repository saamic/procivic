import * as React from "react";
import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One profile shell, two content variants (DESIGN §11). Renders a glass header band
 * (identity + the decoded verdict) and a content column of evidence sections. Candidate
 * and measure profiles both compose this — one design system, no drift.
 */
export function ProfileShell({
  title,
  subtitle,
  badges,
  recommendation,
  aside,
  backHref = "/ballot",
  backLabel = "Back to ballot",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  recommendation?: React.ReactNode;
  aside?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8", className)}>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <header className="glass rounded-2xl bg-gradient-decoded-soft p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>
            )}
            {badges && (
              <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
        {recommendation && (
          <div className="mt-4 border-t border-white/40 pt-4">{recommendation}</div>
        )}
      </header>

      <div className="mt-6 space-y-6">{children}</div>
    </div>
  );
}

export function ProfileSection({
  title,
  icon: Icon,
  description,
  aside,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  description?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("scroll-mt-20", className)}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            {Icon && <Icon className="h-5 w-5 text-brand-500" aria-hidden />}
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
