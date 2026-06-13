import { cn } from "@/lib/utils";

/** Procivic logo. SVGs live in /public (built on the brand gradient). */
export function Logo({
  variant = "wordmark",
  className,
}: {
  variant?: "wordmark" | "mark";
  className?: string;
}) {
  const src = variant === "mark" ? "/logo-mark.svg" : "/logo-wordmark.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Procivic"
      className={cn(
        variant === "mark" ? "h-9 w-9" : "h-8 w-auto",
        className
      )}
    />
  );
}
