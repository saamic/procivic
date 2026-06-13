# START HERE — Procivic execution kickoff

Paste the block below as the **first message** to a fresh Claude Code session (Opus 4.8) opened **inside `Procivic/`**.

---

You're building **Procivic** — *"your ballot, decoded"* — at a hackathon, on **Opus 4.8**, in Claude Code inside this `Procivic/` repo (Next.js 15 + TS + Tailwind at root; public repo `github.com/saamic/procivic`; deployed at https://procivic.vercel.app).

**1) Read these in full before doing anything** — they are the spec, the goal, and verified ground truth; don't re-derive what they already settle:
- `BRIEF.md` — the brief (problem, scope, how to build)
- `DESIGN.md` — full product design + the §13.1 slice plan
- `RUBRIC.md` — **your `/goal`**: the machine-verifiable definition of done
- `NOTES.md` — verified data IDs, API quirks, **rate limits** (OpenStates 500/day + 1 req/sec)
- `ORCHESTRATION.md` — how to fan out subagents + use workflows correctly
- `config/issues.ts`, `config/measures.ts`, `config/scoring.config.ts` — the scoring backbone (already defined — **build on it, don't redefine**)
- `verifier-prompts.md` — the per-slice adversarial verifier prompts
- `kickoff-slice-0-brand.md`, `kickoff-slice-1.md` — the first two slice kickoffs

**2) Set the goal.** Treat **`RUBRIC.md` as your `/goal`** and hillclimb until every gate passes. You may **not** self-certify: gate each slice with a **fresh verifier subagent** (use `verifier-prompts.md`), and run `workflows/verify-rubric.workflow.js` for the full adversarial sweep before declaring done.

**3) Build in this order** (per `ORCHESTRATION.md` — foundation first, so everything looks finished as it's built):
- **Slice 0 — Brand & design system** (`kickoff-slice-0-brand.md`): `BRAND.md` + themed Tailwind tokens + shadcn + the §11 shared components.
- **Data (parallel):** run the `ingest-ballot` workflow → verified `/data/*.json`.
- **Slices 1–5:** candidate profile (Wiener) → quiz → ballot → measures → scores/receipt/AI/Ask. Each = orchestrator scaffolds the page + defines component contracts → **section-builder subagents (one file each)** → assemble → **verifier subagent gates it**.

**Working rules:**
- **Build on the existing scaffold — do NOT re-scaffold.** shadcn isn't initialized yet (`npx shadcn@latest init`).
- **Precompute-and-verify:** the app reads the static `/data` JSON and makes **no live source-API calls at request time**. Keys are in `.env.local` (`CONGRESS_API_KEY`, `FEC_API_KEY`, `OPENSTATES_API_KEY`) — **never commit or print them** (`.env.local` is gitignored).
- **Respect OpenStates limits** (500/day + 1/sec): serialize + cache raw responses; pull only curated issue-tagged key votes.
- **Don't over-parallelize.** Shared things (brand, tokens, components) are built once, up front; only fan out isolated component files + research + verification — parallel writes to the same file collide.
- **Keep `main` build-green:** run `npm run build` before pushing; commit per slice (Vercel auto-deploys on push).
- **Memory:** append every API quirk / decision to `NOTES.md`.
- **No editorializing:** Procivic computes the *user's* values vs. the public record, every claim cited — never its own opinion.

**4) Start.** Read the docs, then reply with (a) a one-paragraph statement of the goal in your own words, and (b) your Slice-0 proposal: the blue/purple/red hex ramps + 2–3 gradient recipes and the shared-component list. After I confirm, **work autonomously** through the slices — only stop for a genuine blocker, a decision that needs me, or to show a verifier's first pass. Minimize check-ins; let the verifier loop catch and fix issues. (If I'm not responding, proceed with your best judgment rather than idling.)
