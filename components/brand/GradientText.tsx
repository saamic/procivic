import * as React from "react";
import { cn } from "@/lib/utils";

/** Brand gradient (blue->purple) clipped to text. Use sparingly for hero moments. */
export function GradientText({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("text-gradient", className)} {...props}>
      {children}
    </span>
  );
}
