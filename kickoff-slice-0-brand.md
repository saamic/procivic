# Slice 0 — Brand & design-system kickoff

Paste into Claude Code (inside `Procivic/`) **before slice 1**. This is the foundation every other slice builds on. Follow `ORCHESTRATION.md` for the subagent pattern.

---

> You're building **Procivic** on Opus 4.8. **Read `DESIGN.md`, `ORCHESTRATION.md`, and `RUBRIC.md` (gates H/I) first.** This session is **SLICE 0 ONLY: the brand + design-system foundation** — no product features yet. Build on the existing scaffold (Next 15 + Tailwind v3 at root); do not re-scaffold.
>
> **Brand direction:** modern, trustworthy, a touch bold. A palette built on **light-blue + purple + red hues**, with **soft gradients and subtle blurs** (tasteful glassmorphism accents). Clean typography, generous spacing, accessible contrast (Lighthouse a11y ≥ 90).
>
> **Deliver:**
> 1. **`BRAND.md`** — the guide every CLAUDE dev agent refers to: the **color schema** (named tokens + hex for the blue / purple / red ramps, 2–3 gradient recipes, blur/elevation recipes, semantic roles), typography scale, spacing/radius, **logo** (an SVG wordmark + mark in `/public`), **icon set** (adopt `lucide-react` + a usage list), and voice/tone with do/don't examples.
> 2. **The themed design system in code** — wire the palette into `tailwind.config.ts` as **CSS variables / theme tokens** (NO hardcoded hex in components), initialize **shadcn/ui** and theme it to the brand, and build the **base primitives + the §11 shared components** (`ScoreChip`, `ConfidenceBadge`, `BallotItemCard`, `StanceBar`, `VoteRow`, `RecommendationPill`, `SourceLink`/`CitationChip`, `ContradictionCallout`, `FundingGraph` shell, `WhyBreakdown`, `AskPanel`, `ProfileShell`). **One component per file.**
> 3. A **`/brand` preview page** rendering the palette, gradients, type, and every shared component — so the design system is demo-able in isolation.
>
> **Subagents (see `ORCHESTRATION.md`):** `brand-strategist` → `BRAND.md`; `logo-icon` → logo SVG + icon usage; `design-system-engineer` → tokens + shadcn + primitives; then build the shared components (orchestrator defines each component's props; each builder owns ONE file).
>
> **DONE when:** `BRAND.md` is complete; `npm run build` is green; the `/brand` page renders the palette + all shared components with **no hardcoded colors** (everything via tokens), responsive at 375 + 1280px. Spawn a **verifier sub-agent** to confirm — default FAIL. Then proceed to slice 1.
>
> **Before building:** propose the actual blue/purple/red hex ramps + 2–3 gradient recipes and the component list, confirm with me, then work autonomously.

---

Then run `/goal RUBRIC.md` and proceed to **`kickoff-slice-1.md`** once slice 0's verifier passes.
