// The elections directory shown on the home page — San Francisco / California, across
// federal + state + local levels (CA runs consolidated ballots, so one election spans all
// three). Only the June 2, 2026 primary has a decoded ballot in this build; the rest are
// listed honestly as upcoming or past-not-yet-decoded (no fabricated coverage).

export type ElectionLevel = "Federal" | "State" | "Local";
export type ElectionStatus = "decoded" | "upcoming" | "past";

export interface ElectionEntry {
  id: string;
  date: string; // ISO, for sorting
  dateLabel: string;
  name: string;
  jurisdiction: string;
  levels: ElectionLevel[];
  status: ElectionStatus;
  /** Set only when a decoded ballot exists. */
  href?: string;
  /** The marquee contests/measures on this ballot, shown as a bulleted list. */
  items: string[];
  /**
   * ILLUSTRATIVE per-election civic status (e.g. "Registered", "Voted", "Didn't vote").
   * These are demo placeholders — Procivic does not have the user's real
   * voter-registration or turnout data. Labeled as illustrative in the UI.
   */
  civicStatus: string;
}

export const ELECTIONS: ElectionEntry[] = [
  {
    id: "ca-2026-general",
    date: "2026-11-03",
    dateLabel: "November 3, 2026",
    name: "California General Election",
    jurisdiction: "San Francisco · California",
    levels: ["Federal", "State", "Local"],
    status: "upcoming",
    civicStatus: "Registered",
    items: [
      "U.S. House CA-11 runoff — Wiener vs. Chan",
      "Governor of California",
      "Statewide propositions",
      "SF local measures",
    ],
  },
  {
    id: "sf-2026-06-02-primary",
    date: "2026-06-02",
    dateLabel: "June 2, 2026",
    name: "SF Consolidated Statewide Primary",
    jurisdiction: "San Francisco · California (CA-11)",
    levels: ["Federal", "State", "Local"],
    status: "decoded",
    href: "/ballot",
    civicStatus: "Voted",
    items: [
      "U.S. House CA-11 — Pelosi's open seat",
      "Governor (primary)",
      "Board of Supervisors — Districts 4 & 8",
      "SF Props A, B, C & D",
    ],
  },
  {
    id: "ca-2024-general",
    date: "2024-11-05",
    dateLabel: "November 5, 2024",
    name: "General Election",
    jurisdiction: "San Francisco · California",
    levels: ["Federal", "State", "Local"],
    status: "past",
    civicStatus: "Voted",
    items: [
      "President of the United States",
      "U.S. House & Senate",
      "Statewide measures",
      "SF Mayor & local measures",
    ],
  },
  {
    id: "ca-2024-03-05-primary",
    date: "2024-03-05",
    dateLabel: "March 5, 2024",
    name: "Presidential Primary",
    jurisdiction: "California",
    levels: ["Federal", "State"],
    status: "past",
    civicStatus: "Didn't vote",
    items: [
      "Presidential primary",
      "U.S. Senate",
      "State legislative contests",
    ],
  },
];

export const UPCOMING_ELECTIONS = ELECTIONS.filter((e) => e.status === "upcoming");
/** Decoded + past, newest first — the decoded ballot leads. */
export const PAST_ELECTIONS = ELECTIONS.filter((e) => e.status !== "upcoming").sort(
  (a, b) => b.date.localeCompare(a.date)
);
