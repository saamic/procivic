# Procivic — Orchestration Playbook (for the execution agent)

> How to build Procivic with maximal, **correct** agentification. Read alongside `BRIEF.md`, `DESIGN.md`, `RUBRIC.md`, `NOTES.md`, `config/`. The build runs in Claude Code inside `Procivic/` with **`/goal RUBRIC.md`**.

## The three primitives — use the right one
- **`/goal RUBRIC.md`** — the **outer loop** for this session: hillclimb until every gate passes; **never self-certify**. This is the Autonomy story.
- **Subagents** (Agent/Task tool) — **fan-out within the session** for bounded construction + verification; the orchestrator integrates.
- **Dynamic workflows** — **background, deterministic, repeatable** pipelines over *items*, with verify built in. Use for **data ingest** (`workflows/ingest-ballot.workflow.js`) and the **final verification sweep** (`workflows/verify-rubric.workflow.js`).

## The one rule that prevents chaos
Parallel subagents editing the **same files collide** (this repo already hit it as a git race). So:
- **Foundation-first the SHARED axis** — brand, design tokens, and shared components are built **once, up front** (Slice 0), never raced.
- **Parallelize only the SAFE axis** — research/verification, and **one component file per builder**. The orchestrator defines the component *contract* (props); each builder owns *one file*; the orchestrator assembles.

> "Maximal agentification" ≠ most agents. Over-parallelizing UI = merge conflicts = more human intervention = **lower** Autonomy.

## The reusable schema (one pattern, every feature)
**Orchestrator** (scaffold the page + define each section's component contract + name the shared components to reuse) → **Section Builders ∥** (each owns ONE component file) → **Verifier** (fresh context; grades the feature's RUBRIC gates; re-fetches source).

Agent-type mapping (types available here):
- contracts / architecture → `feature-dev:code-architect`
- section builders → `general-purpose`
- verifier → `feature-dev:code-reviewer`
- research / source-finding → `Explore`

## Build phases (dependency-ordered)
**Phase 0 — Foundation (sequential, FIRST).** Brand + design system + shared components.
- Slice 0 (`kickoff-slice-0-brand.md`). Subagents: `brand-strategist` (`BRAND.md`), `logo-icon`, `design-system-engineer` (tokens + shadcn + primitives), then the §11 shared components.
- Gate: `/brand` page renders the palette + all shared components, no hardcoded colors, build green.

**Phase A — Data (parallel, background).** Run `ingest-ballot` → verified `/data/*.json`. Independent of UI; can run during Phase 0.

**Phase B — Features (slices, each `/goal`-gated).** Build on the shared components; one route each.

| Slice | Feature | Section builders | Gates |
|---|---|---|---|
| 1 | Candidate profile (Wiener) | identity · alignment+confidence · stances · voting-record · **funding-graph** · consistency+receipt · ask-panel | D1–D4, F1–F4 |
| 2 | Intro quiz | quiz-flow · nuance-chat (`PreferenceChat`) · vector-persistence · live-rescore | B1–B3, G1 |
| 3 | Ballot page | ballot-list · recommendation-pills · at-a-glance | C1–C3 |
| 4 | Measure profiles | summary · for/against-funding · alignment-read · ask-panel | E1–E3, F5 |
| 5 | Scores + receipt + AI rationale + Ask (layered onto profiles) | — | D3, H1–H3 |

**Phase C — Verify (workflow, before "done").** Run `verify-rubric` → fans out one adversarial verifier per RUBRIC section against the live URL + sources. Gate completion on it.

## Why this scores
- **Autonomy (15%):** `/goal` + verifier-gated slices → the model catches & fixes its own failures; humans intervene only to redirect.
- **Orchestration (15%):** `RUBRIC.md` is machine-verifiable "done"; the two workflow scripts are repeatable on a new ballot — exactly what judges reward.
- **Demo (35%) / Impact (35%):** brand-first means it looks finished throughout; precompute+verify means it never breaks live.

## Loop discipline (per slice)
1. Pick the slice. 2. Spawn section builders (isolated files). 3. Orchestrator assembles. 4. Spawn the **verifier subagent** → `{id, pass, evidence}`, default FAIL. 5. Fix failures; repeat until the slice's gates pass. 6. Commit (keep `main` build-green — Vercel auto-deploys). 7. Append any API quirk to `NOTES.md`. 8. Next slice.
