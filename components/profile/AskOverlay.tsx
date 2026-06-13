"use client";

// Procivic — the floating, always-reachable "Ask Procivic" overlay (DESIGN §8.4).
//
// A fixed floating action button that stays visible while the user scrolls
// anywhere on a profile. Clicking it opens a Radix Dialog hosting the existing
// <ProfileAsk/> panel — Radix handles the focus trap, Esc, and overlay-click
// close for free.

import * as React from "react";
import { MessageSquareQuote } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileAsk } from "@/components/profile/ProfileAsk";
import { cn } from "@/lib/utils";

export function AskOverlay({
  entityType,
  slug,
  entityName,
  starters,
}: {
  entityType: "candidate" | "measure";
  slug: string;
  entityName: string;
  starters: string[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Ask about ${entityName}'s record`}
          className={cn(
            "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2",
            "rounded-full bg-gradient-decoded px-5 py-3 text-sm font-medium text-white",
            "shadow-glow transition-all hover:brightness-[1.05]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <MessageSquareQuote className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Ask Procivic</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{`Ask about ${entityName}'s record`}</DialogTitle>
        </DialogHeader>
        <ProfileAsk
          entityType={entityType}
          slug={slug}
          entityName={entityName}
          starters={starters}
        />
      </DialogContent>
    </Dialog>
  );
}
