// Procivic — the ballot route (DESIGN.md §4.2). Thin server component: it only sets page
// metadata and hands off to the client <BallotClient />, which owns reading the user's value
// vector (localStorage) and computing every decoded verdict.

import type { Metadata } from "next";
import BallotClient from "@/components/ballot/BallotClient";

export const metadata: Metadata = {
  title: "Your ballot — Procivic",
  description:
    "Every contest and measure on your June-2026 San Francisco ballot, decoded against your own values — with the receipts.",
};

export default function BallotPage() {
  return <BallotClient />;
}
