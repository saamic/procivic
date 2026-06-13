"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * The candidate's current role, rendered as a muted badge that reveals a plain-language
 * explanation on hover/focus. The explanation grounds WHY this role's record (its floor
 * votes) is the public source Procivic uses to derive issue stances — keeping the trust
 * chain visible without cluttering the header.
 */
export function RoleBadge({
  role,
  explanation,
}: {
  role: string;
  explanation: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="muted"
            tabIndex={0}
            className="cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {role}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs leading-relaxed">
          {explanation}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
