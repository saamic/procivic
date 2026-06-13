"use client";

/**
 * FundingGraphInteractive (DESIGN §10) — the interactive "lean-in" layer.
 *
 * This is the force-directed money hero that animates a candidate's donors flowing
 * money toward them. It layers ON TOP of the always-present ranked-bar fallback in
 * `components/shared/FundingGraph.tsx` (the candidate profile renders that bar-list
 * separately as the never-breaks baseline), so this file only owns the rich, optional,
 * interactive view. Sizing is pure viewBox math (the SVG scales to its container via
 * `w-full h-auto`); no hardcoded pixel canvas. Every node is keyboard-focusable and
 * carries a SourceLink in its detail. Honors prefers-reduced-motion.
 */

import * as React from "react";
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { Network, Coins } from "lucide-react";
import { SourceLink } from "@/components/shared/SourceLink";
import { formatUSD, cn, clamp } from "@/lib/utils";
import { PALETTE, GRAPH_NODE_COLORS } from "@/lib/palette";

export interface InteractiveDonor {
  name: string;
  amount: number;
  employer?: string;
}

export interface FundingGraphInteractiveProps {
  candidateName: string;
  donors: InteractiveDonor[];
  total?: number;
  sourceUrl?: string;
  className?: string;
}

/** viewBox coordinate space — the simulation runs in these units; the SVG scales to fit. */
const VB_W = 800;
const VB_H = 600;
const CX = VB_W / 2;
const CY = VB_H / 2;
const MAX_NODES = 15;

/** Node radii (in viewBox units). Donor radius is a sqrt scale so whales don't dominate. */
const CANDIDATE_R = 46;
const DONOR_R_MIN = 14;
const DONOR_R_MAX = 40;
const EDGE_W_MIN = 1.5;
const EDGE_W_MAX = 9;

type Kind = "candidate" | "donor";

interface GraphNode extends SimulationNodeDatum {
  id: string;
  kind: Kind;
  label: string;
  amount: number;
  employer?: string;
  r: number;
  color: string;
  /** index into the donor list (donors only) for stable color cycling */
  donorIndex?: number;
}

type GraphLink = SimulationLinkDatum<GraphNode> & { width: number };

/** Map a value in [inMin,inMax] onto [outMin,outMax] using a sqrt transfer (area-fair). */
function sqrtScale(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax <= inMin) return outMin;
  const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
  return outMin + Math.sqrt(t) * (outMax - outMin);
}

/** Deterministic seeded jitter so first paint (pre-settle) is stable across renders/SSR. */
function seededOffset(i: number): { x: number; y: number } {
  // Golden-angle placement on a ring around the center — deterministic, no Math.random.
  const golden = 2.399963229728653; // ~137.5° in radians
  const a = i * golden;
  const radius = 150 + (i % 5) * 24;
  return { x: CX + Math.cos(a) * radius, y: CY + Math.sin(a) * radius };
}

interface SettledNode extends GraphNode {
  x: number;
  y: number;
}

/** Build nodes/links and run the d3-force sim synchronously to a settled layout. */
function useGraphLayout(candidateName: string, donors: InteractiveDonor[]) {
  return React.useMemo(() => {
    const capped = [...donors]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, MAX_NODES);

    const amounts = capped.map((d) => d.amount);
    const amtMin = amounts.length ? Math.min(...amounts) : 0;
    const amtMax = amounts.length ? Math.max(...amounts) : 1;

    const candidate: GraphNode = {
      id: "__candidate__",
      kind: "candidate",
      label: candidateName,
      amount: capped.reduce((s, d) => s + d.amount, 0),
      r: CANDIDATE_R,
      color: PALETTE.brand[700],
      x: CX,
      y: CY,
      // Pin the candidate to the center so donors orbit it (the "flowing money" read).
      fx: CX,
      fy: CY,
    };

    const donorNodes: GraphNode[] = capped.map((d, i) => {
      const seed = seededOffset(i);
      return {
        id: `donor-${i}-${d.name}`,
        kind: "donor",
        label: d.name,
        amount: d.amount,
        employer: d.employer,
        donorIndex: i,
        r: sqrtScale(d.amount, amtMin, amtMax, DONOR_R_MIN, DONOR_R_MAX),
        color: GRAPH_NODE_COLORS[i % GRAPH_NODE_COLORS.length],
        x: seed.x,
        y: seed.y,
      };
    });

    const nodes: GraphNode[] = [candidate, ...donorNodes];
    const links: GraphLink[] = donorNodes.map((n) => ({
      source: n.id,
      target: candidate.id,
      width: sqrtScale(n.amount, amtMin, amtMax, EDGE_W_MIN, EDGE_W_MAX),
    }));

    if (donorNodes.length >= 2) {
      const sim: Simulation<GraphNode, GraphLink> = forceSimulation<GraphNode>(nodes)
        .force(
          "link",
          forceLink<GraphNode, GraphLink>(links)
            .id((d) => d.id)
            // Bigger donors sit a touch closer (stronger tie); all comfortably orbiting.
            .distance((l) => {
              const s = l.source as GraphNode;
              return 150 - (s.r ?? DONOR_R_MIN);
            })
            .strength(0.35)
        )
        .force("charge", forceManyBody<GraphNode>().strength(-340))
        .force("center", forceCenter(CX, CY).strength(0.05))
        .force(
          "collide",
          forceCollide<GraphNode>()
            .radius((d) => d.r + 10)
            .strength(0.9)
        )
        .stop();

      // Run to a settled state synchronously so first paint is deterministic (SSR-safe).
      const ticks = Math.ceil(
        Math.log(sim.alphaMin()) / Math.log(1 - sim.alphaDecay())
      );
      sim.tick(Math.max(120, ticks));

      // Keep everything inside the viewBox (with node radius padding).
      for (const n of nodes) {
        if (n.kind === "candidate") continue;
        n.x = clamp(n.x ?? CX, n.r + 6, VB_W - n.r - 6);
        n.y = clamp(n.y ?? CY, n.r + 6, VB_H - n.r - 6);
      }
    }

    const settled = nodes.map((n) => ({
      ...n,
      x: n.x ?? CX,
      y: n.y ?? CY,
    })) as SettledNode[];

    const byId = new Map(settled.map((n) => [n.id, n]));
    const settledLinks = links.map((l) => {
      const s = typeof l.source === "object" ? (l.source as GraphNode).id : (l.source as string);
      const t = typeof l.target === "object" ? (l.target as GraphNode).id : (l.target as string);
      return {
        source: byId.get(s)!,
        target: byId.get(t)!,
        width: l.width,
      };
    });

    return {
      nodes: settled,
      links: settledLinks,
      candidate: byId.get("__candidate__")!,
      donorCount: donorNodes.length,
      truncated: donors.length > capped.length,
      totalDonors: donors.length,
    };
  }, [candidateName, donors]);
}

export function FundingGraphInteractive({
  candidateName,
  donors,
  total,
  sourceUrl,
  className,
}: FundingGraphInteractiveProps) {
  const { nodes, links, candidate, donorCount, truncated, totalDonors } =
    useGraphLayout(candidateName, donors);

  // Active = hovered/focused (transient); pinned = clicked (sticky). Detail shows pinned ?? active.
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [pinnedId, setPinnedId] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const titleId = React.useId();

  React.useEffect(() => {
    const mq =
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq) {
      setReduceMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mq.addEventListener?.("change", onChange);
      // Trigger the entry animation one frame after mount.
      const id = requestAnimationFrame(() => setMounted(true));
      return () => {
        mq.removeEventListener?.("change", onChange);
        cancelAnimationFrame(id);
      };
    }
    setMounted(true);
    return undefined;
  }, []);

  // Graceful degradation: the page renders the bar-list FundingGraph as the fallback,
  // so here we only need a quiet note when there isn't enough to make a graph.
  if (donorCount < 2) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center",
          className
        )}
      >
        <Network className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Not enough itemized donors to map the funding network.
        </p>
      </div>
    );
  }

  const selectedId = pinnedId ?? activeId;
  const selected = selectedId
    ? nodes.find((n) => n.id === selectedId && n.kind === "donor")
    : undefined;

  const edgeColor = PALETTE.slate[300];
  const edgeColorActive = PALETTE.brand[500];

  const handleSelect = (id: string) => {
    setPinnedId((cur) => (cur === id ? null : id));
  };

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-elev-2",
        className
      )}
      aria-labelledby={titleId}
    >
      {/* Header */}
      <figcaption className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-100 text-accent-700">
            <Network className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p id={titleId} className="text-sm font-semibold leading-tight">
              Funding network
            </p>
            <p className="tabular text-xs text-muted-foreground">
              {total != null ? `${formatUSD(total)} total · ` : ""}
              {donorCount} donor{donorCount === 1 ? "" : "s"} shown
              {truncated ? ` of ${totalDonors}` : ""}
            </p>
          </div>
        </div>
        {sourceUrl && <SourceLink href={sourceUrl}>source</SourceLink>}
      </figcaption>

      {/* The graph — pure viewBox sizing, scales to container. */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full select-none"
          role="group"
          aria-label={`Force-directed funding graph: ${donorCount} donors connected to ${candidateName}`}
          onMouseLeave={() => setActiveId(null)}
        >
          <defs>
            {/* Soft drop for the candidate node so the hero pops without a hex literal. */}
            <radialGradient id={`${titleId}-cand`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor={PALETTE.brand[500]} />
              <stop offset="100%" stopColor={PALETTE.brand[700]} />
            </radialGradient>
          </defs>

          {/* Edges (donor -> candidate). Drawn first so nodes sit on top. */}
          <g>
            {links.map((l, i) => {
              const isActive =
                selectedId != null && l.source.id === selectedId;
              return (
                <line
                  key={`edge-${i}`}
                  x1={l.source.x}
                  y1={l.source.y}
                  x2={l.target.x}
                  y2={l.target.y}
                  stroke={isActive ? edgeColorActive : edgeColor}
                  strokeWidth={isActive ? l.width + 1.5 : l.width}
                  strokeLinecap="round"
                  opacity={
                    selectedId != null && !isActive ? 0.25 : mounted ? 0.7 : 0
                  }
                  style={{
                    transition: reduceMotion
                      ? undefined
                      : `opacity 600ms ease ${120 + i * 40}ms, stroke 200ms ease, stroke-width 200ms ease`,
                  }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((n, i) => {
              const isCandidate = n.kind === "candidate";
              const isSelected = selectedId === n.id;
              const dimmed = selectedId != null && !isSelected && !isCandidate;
              const delay = reduceMotion ? 0 : 140 + i * 55;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  tabIndex={isCandidate ? -1 : 0}
                  role={isCandidate ? "img" : "button"}
                  aria-label={
                    isCandidate
                      ? `${n.label} (candidate)`
                      : `Donor ${n.label}${n.employer ? `, ${n.employer}` : ""}, ${formatUSD(n.amount)}`
                  }
                  aria-pressed={isCandidate ? undefined : pinnedId === n.id}
                  className={cn(
                    "outline-none",
                    !isCandidate && "cursor-pointer"
                  )}
                  onMouseEnter={
                    isCandidate ? undefined : () => setActiveId(n.id)
                  }
                  onFocus={isCandidate ? undefined : () => setActiveId(n.id)}
                  onBlur={isCandidate ? undefined : () => setActiveId(null)}
                  onClick={
                    isCandidate ? undefined : () => handleSelect(n.id)
                  }
                  onKeyDown={
                    isCandidate
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelect(n.id);
                          }
                        }
                  }
                  style={{
                    opacity: mounted ? (dimmed ? 0.4 : 1) : 0,
                    transform: mounted
                      ? `translate(${n.x}px, ${n.y}px) scale(1)`
                      : `translate(${n.x}px, ${n.y}px) scale(0.2)`,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                    transition: reduceMotion
                      ? undefined
                      : `opacity 500ms ease ${delay}ms, transform 600ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
                  }}
                >
                  {/* Focus ring (brand, semantic) — only visual on focus/selection. */}
                  {!isCandidate && (
                    <circle
                      r={n.r + 5}
                      fill="none"
                      stroke={PALETTE.brand[500]}
                      strokeWidth={2}
                      opacity={isSelected ? 0.5 : 0}
                      className="transition-opacity duration-200"
                    />
                  )}
                  <circle
                    r={n.r}
                    fill={isCandidate ? `url(#${titleId}-cand)` : n.color}
                    stroke={PALETTE.white}
                    strokeWidth={isCandidate ? 3 : 2}
                    style={{
                      filter: isCandidate
                        ? "drop-shadow(0 6px 14px rgba(31,51,112,0.28))"
                        : "drop-shadow(0 2px 5px rgba(31,51,112,0.16))",
                    }}
                  />
                  {/* Candidate label sits inside the central node. */}
                  {isCandidate && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={PALETTE.white}
                      style={{ fontSize: 15, fontWeight: 700 }}
                    >
                      {n.label.length > 14
                        ? `${n.label.slice(0, 13)}…`
                        : n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Detail panel — pinned (click) or hovered/focused donor. */}
        {selected ? (
          <div
            className="pointer-events-auto absolute bottom-2 left-2 right-2 mx-auto max-w-sm rounded-lg border border-border bg-white/80 p-3 shadow-elev-2 backdrop-blur-md sm:left-2 sm:right-auto"
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selected.label}
                </p>
                {selected.employer && (
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.employer}
                  </p>
                )}
              </div>
              <span className="tabular shrink-0 text-sm font-bold text-brand-700">
                {formatUSD(selected.amount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5" aria-hidden /> to {candidate.label}
              </span>
              {sourceUrl && <SourceLink href={sourceUrl}>FEC record</SourceLink>}
            </div>
            {pinnedId === selected.id && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Pinned · click the node again to release
              </p>
            )}
          </div>
        ) : (
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs text-muted-foreground">
            Hover or tap a donor to see the receipt
          </p>
        )}
      </div>
    </figure>
  );
}

export default FundingGraphInteractive;
