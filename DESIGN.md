# Procivic — Product Design Document

> **"Your ballot, decoded."**
> A civic web app that turns *your own values* + *the public record* into a personalized, evidence-backed recommendation on **every item of a real ballot** — with the receipts one click away.

**Status:** v1 design, for review/edit. This is the source of truth. (Pre-build brainstorming lives in `archive/` and is *not* spec.)
**Build context:** Claude Fable 5 Build Day, 2026-06-13 · solo · ~6 hr build · **hard submit 5:00 PM** · model **Opus 4.8** (the available model on this account) · public GitHub repo required.

---

## 0. How to read this doc

| Section | What it pins down |
|---|---|
| 1. Vision & goals | What Procivic is and who it's for |
| 2. Hackathon fit | How every design choice maps to the scoring rubric + rules (read this — it's why the rest is shaped the way it is) |
| 3. Scope | The one real ballot we cover, and the tiered data strategy |
| 4. User experience | The journey, screen map, routes |
| 5. System architecture | Precompute-and-verify pipeline → static store → app |
| 6. Data model | The entities |
| 7. Data sources & ingestion | Where each fact comes from, and how it's verified |
| 8. Recommendation engine | The heart: deterministic scores + AI rationale + verifier + confidence |
| 9. Preference elicitation | The quiz |
| 10. Funding graph | The visual hero |
| 11. Design system | Components + the shared profile shell |
| 12. Tech stack | Locked choices |
| 13. Build & orchestration plan | Slices, `/goal`, verifier, workflow, deploy |
| 14. Definition of done | Machine-verifiable gates (extracted to `RUBRIC.md`) |
| 15. Risks | What could sink it, and the mitigation |
| 16. Open decisions | Calls I made that you may want to change |

---

## 1. Vision & goals

**The problem.** A voter staring at a ballot has three unmet needs: (1) *who/what am I even voting on?*, (2) *which choice actually fits my values?*, and (3) *can I trust the answer?* Today this is scattered across 3–5 sites, none of them personalized, and every alignment quiz that exists matches you to what politicians **say**, never how they **vote** or who **funds** them.

**Procivic's answer — three goals, one nested product:**

1. **Educate** — every candidate and every measure has a profile: voting record, money ties, standardized issue stances, and data-grounded consistency/transparency scores.
2. **Guide** — for the user's *whole* ballot, suggest what to do on each item, grounded in the user's own stated values + the public record, with a confidence score and a reviewable breakdown.
3. **Delight** — a genuinely beautiful, trustworthy UI (Demo is 35% of the score — polish is load-bearing).

They nest cleanly: **the ballot is the home screen** (Goal 2) → **each item drills into a profile** (Goal 1) → **the finish is the craft** (Goal 3).

**North star (stated, not v1 scope):** local politics. v1 demonstrates the pattern on a real **San Francisco** ballot; the architecture generalizes to any jurisdiction, but we cover *one ballot completely* rather than everywhere shallowly.

**Who it's for.**
- **Primary:** a San Francisco voter who wants a trustworthy, personalized read on their entire ballot before voting.
- **Secondary:** journalists / civically-engaged people who want the receipts (the contradicting vote, the donor link).

---

## 2. Hackathon fit (this section drives the rest)

### 2.1 Scoring traceability

| Axis (weight) | What judges reward | How Procivic earns it |
|---|---|---|
| **Impact (35%)** | Useful to real people, high-quality output | Real civic tool on real public data; outputs a *personalized, actionable verdict* a voter can use, not a data dump. Broad, sympathetic audience. |
| **Demo (35%)** | Working, impressive, holds up live | A tight "values in → ballot decoded → drill to the receipt → funding graph" flow. **Precomputed + verified data means zero live-API risk on stage.** The funding graph is the lean-in moment. |
| **Autonomy (15%)** | Few human interventions; model catches its own failures | `RUBRIC.md` is the `/goal`; a **verifier sub-agent** (fresh context) must pass every gate before "done." Interventions are for *new direction*, not bug-spotting. |
| **Orchestration (15%)** | Simple, repeatable, machine-verifiable "done" | `RUBRIC.md` + the **ingest-and-verify dynamic workflow** + `NOTES.md` memory. Another team could rerun it on a new ballot. |

### 2.2 Rules we must honor (Participant Guide)

- **Public repo**, all demoed code in it, judges can clearly see what was built **today**. → Fresh repo, clean commit history, `README` states what's new.
- **Live URL** is the submission. → Deploy to Vercel first thing (hello-world before there's anything to lose).
- **1-minute demo video** + brief + rubric + session log submitted. → `BRIEF.md`/`RUBRIC.md` live in the repo; record the verifier-catches-a-bug moment.
- **Not a banned project.** We are **not**: a RAG app, a Streamlit app, an image analyzer, a chatbot, a personality/sports analyzer, or a medical/mental-health/nutrition bot.

### 2.3 The two framing risks, and how we neutralize them

- **"Dashboard as main feature" (banned).** The centerpiece **takes an input (your values) and returns a derived verdict (your ballot, with recommendations).** Profiles, scores, and the funding graph are the "show me why," one click in — never a passive wall of panels. *Test we pass:* delete every chart and there's still a working tool (the personalized ballot verdict).
- **Editorializing (a self-imposed trust principle, not a literal rule).** Procivic **never expresses its own values.** It computes alignment between the **user's** stated values and the **public record**, shows the rationale, and lets the user override. The recommendation belongs to the user's values, never to Procivic.
  - **The one rule:** never *"this is good/bad"* — always *"this matches/conflicts with what **you** told us — here's the receipt."*
  - This is why explicit recommendations are *safe here*: "Recommended for you: YES (82% aligned, high confidence)" is a calculation over the user's inputs + cited evidence, not an opinion.

---

## 3. Scope

### 3.1 The one ballot: the real June 2, 2026 SF consolidated primary

A San Franciscan's actual June 2, 2026 ballot was a **consolidated statewide direct primary** — it stacks federal + state + local contests **and ~4 local measures** on one ballot. That's the unlock: we don't choose between "local" and "clean data"; this single real ballot has both. Known contents include:

- **4 local SF measures** — e.g. **Measure A** (earthquake-safety bond), **Prop D** ("overpaid CEO tax"), + two more.
- **2 Supervisor races** — Districts 4 and 8.
- **A congressional primary** — CA-11 (most of SF) and CA-15 (Rep. Kevin Mullin, incumbent), depending on precinct.
- **Statewide** primary races (Governor, etc.).

We pick **one representative precinct/district** so the ballot is concrete and complete (default: a district whose congressional race has an incumbent with a real legislative record for the Tier-1 showcase).

### 3.2 Tiered data strategy = the confidence score, for free

Data quality varies by item type. Rather than hide that, we surface it as a **confidence score** — honest *and* differentiating. The tiers literally define confidence:

| Tier | Items | Evidence available | Confidence |
|---|---|---|---|
| **1 — Deep showcase** | A federal incumbent (Rep. Mullin, CA-15 via Congress.gov) — or State Sen. Wiener running in CA-11, whose **state** record is in OpenStates | roll-call votes + OpenFEC money + vote-derived stances + consistency + transparency | **High** |
| **2 — The local heart** | The 4 SF measures | official + SPUR/Ballotpedia plain-language summaries + SF Ethics funding (for/against) + alignment | **High/Med** (measures need *no* voting record) |
| **3 — Honest fallbacks** | Supervisor D4/D8, statewide races, challengers w/o records | funding + curated stated positions + endorsements, **labeled** | **Lower, labeled** |

**Insight:** measures are the sweet spot — deeply *local* yet the *easiest* data on the ballot (no voting record required; funding is a SODA API; summaries are abundant). They carry the "local politics" promise. The Tier-1 incumbent carries the "deep accountability profile + funding graph" wow.

### 3.3 In scope vs. out

- **In:** one real SF ballot, every contest + measure listed (nothing silently dropped); quiz → value vector; per-item recommendation + confidence + breakdown; candidate & measure profiles; funding graph; consistency + transparency (Tier 1); methodology page.
- **Out (v1):** address-based ballot lookup for arbitrary voters; multiple jurisdictions; user accounts/auth; historical elections beyond the demo ballot; mobile-native app (responsive web instead).

---

## 4. User experience

### 4.1 Core journey (also the 60-sec demo)

1. **Land →** "See how your *actual* ballot fits your values — backed by votes and money, not talking points." → Start.
2. **Quiz →** ~8 issues, each with a stance + an *importance* weight. ~60 seconds.
3. **Your Ballot →** every item on the real SF ballot, each with a **recommendation pill** (e.g. "YES — 82% · High confidence") and a one-line why. *This is the "decoded ballot" wow.*
4. **Drill into a candidate →** alignment + the standardized stances, the voting record, and the **funding graph** animating out. The **consistency "receipt"** ("said X, voted Y — and here's the donor who benefited") is the emotional beat.
5. **Drill into a measure →** plain-language summary, who funds each side, and your alignment.
6. **Change an answer →** everything re-scores live (personalization is real, not static).

### 4.2 Screen map & routes (Next.js App Router)

| Route | Screen | Notes |
|---|---|---|
| `/` | Landing | value prop; CTA → quiz (or → `/ballot` if a saved vector exists) |
| `/quiz` | Onboarding quiz | 8 issues × {stance, importance}; writes the vector |
| `/ballot` | **Your Ballot (home/spine)** | every contest + measure; per-item recommendation pill + why; "ballot at a glance" summary |
| `/candidate/[slug]` | Candidate profile | identity, alignment, stances, votes, funding graph, consistency, transparency |
| `/measure/[slug]` | Measure profile | summary, for/against funding, alignment |
| `/methodology` | How scores work | the formulas + the "no hidden weighting" promise — doubles as a trust artifact for judges |

Funding graph = a section/modal inside profiles (not its own route). State: a `UserValues` React context backed by `localStorage` (no auth). Scores are computed **client-side** from {user vector} × {stored item stances}, so changing answers re-scores instantly with no refetch.

---

## 5. System architecture

### 5.1 The core decision: precompute-and-verify, then read static

The single biggest demo risk is a live API failing or rate-limiting on stage. So **all source data is fetched + verified *offline* (by the ingest workflow) and written to a versioned static store in the repo.** The app reads that store; it does **not** hit Congress.gov/OpenFEC/SF Ethics at request time.

```
 ┌─────────────────────────┐     offline, run by the dynamic workflow
 │  INGEST + VERIFY (agents)│  →  fetch · join IDs · derive stances · verify vs source
 └────────────┬────────────┘
              │ writes
              ▼
 ┌─────────────────────────┐     committed to the repo (the artifact judges can inspect)
 │  STATIC DATA STORE       │     /data/*.json  +  /config/*.ts
 └────────────┬────────────┘
              │ read at build / request time (SSG)
              ▼
 ┌─────────────────────────┐     deterministic alignment + confidence (client)
 │  NEXT.JS APP (Vercel)    │  +  /api/recommend → Claude (AI rationale, live, with fallback)
 └─────────────────────────┘
```

Why this wins on every scored axis: **Demo** (bulletproof — no live dependency), **Orchestration** (the workflow's output *is* a verifiable artifact; "done" = the verifier passes against the store), **Autonomy** (the verifier gates completion), **Impact** (fast, reliable UX).

### 5.2 Layers

- **Ingestion (offline):** the `ingest-ballot` dynamic workflow — one pipeline per ballot item: *fetch ground truth → derive stances/scores → adversarially verify against source → write JSON*. (See §13.)
- **Data store:** `/data/ballot.json`, `/data/candidates/<slug>.json`, `/data/measures/<slug>.json`, `/data/meta.json` (ballot id, generated-at, source versions).
- **Config:** `/config/issues.ts` (the 8 issue axes + poles), `/config/scoring.config.ts` (weights, thresholds) — *all weighting lives here, nothing hidden.*
- **Scoring engine:** `/lib/scoring.ts` — pure functions (alignment, confidence, consistency, transparency), used identically by the app and the verifier.
- **Recommendation:** deterministic scores client-side; AI rationale via `/api/recommend` (server route → Claude), with a deterministic templated fallback so the demo never breaks.
- **Presentation:** Next.js App Router, mostly static; client components for quiz, live scoring, funding graph.

---

## 6. Data model (sketch)

```ts
type IssueId = 'healthcare'|'climate_energy'|'immigration'|'taxes_economy'
             | 'guns'|'reproductive'|'foreign_defense'|'civil_tech';

// Each issue is a neutral axis with two labeled poles (-1 ↔ +1). Political
// labeling of poles is irrelevant to the math; only consistent mapping matters.
interface Issue { id: IssueId; label: string; poleNeg: string; polePos: string; }

interface UserValues {
  stances: Record<IssueId, number>;     // -1..+1
  importance: Record<IssueId, number>;  // 0..1  ("how much you care")
  updatedAt: string;
}

interface Vote { billId: string; title: string; date: string;
  position: 'Yea'|'Nay'|'Present'|'NotVoting'; rollCall: string;
  issue: IssueId; direction: -1|1;       // does a Yea move toward poleNeg/polePos?
  sourceUrl: string; }

interface Stance { issue: IssueId; value: number;  // -1..+1
  basis: 'votes'|'stated'|'funding';     // evidence type → drives confidence
  derivedFrom: string[];                 // bill/source ids — traceability
}

interface FundingNode { id: string; label: string;
  kind: 'donor'|'pac'|'industry'|'committee'; }
interface FundingEdge { from: string; to: string; amount: number;
  side?: 'support'|'oppose'; sourceUrl: string; }

interface Score { value: number;        // 0..100
  inputs: Record<string, number|string>; // shown in the UI (no black box)
  sourceUrls: string[]; }

interface Candidate { slug: string; name: string; party: string; office: string;
  incumbent: boolean; photoUrl?: string;
  stances: Stance[]; votes: Vote[];
  funding: { nodes: FundingNode[]; edges: FundingEdge[]; total: number };
  consistency?: Score; transparency?: Score;
  statements?: { issue: IssueId; text: string; sourceUrl: string }[];
  digest: GroundedDigest;                // AI, verified at ingest (see §8)
}

interface Measure { slug: string; code: string; title: string;
  plainSummary: string; sourceUrls: string[];
  yesPosition: Stance[];                 // what a YES vote means, per issue
  funding: { support: FundingEdge[]; oppose: FundingEdge[] };
  digest: GroundedDigest;
}

type BallotItem =
  | { kind: 'candidateRace'; office: string; candidateSlugs: string[]; dataTier: 1|2|3 }
  | { kind: 'measure'; measureSlug: string; dataTier: 1|2|3 };
interface Ballot { id: string; jurisdiction: string; date: string; items: BallotItem[]; }
```

---

## 7. Data sources & ingestion

| Entity | Source (verified alive, June 2026) | Notes |
|---|---|---|
| Federal member identity & votes | **Congress.gov API** | needs free api.data.gov key (already in `.env.local`). *Member-level vote positions can be thin via Congress.gov — fall back to House Clerk roll-call XML; resolve the exact endpoint at ingest and record it in `NOTES.md`.* |
| Federal money (candidate funding) | **OpenFEC API** | same key |
| State legislator votes (e.g. Wiener) | **OpenStates v3 API** | for the state-record angle |
| Congress ↔ FEC ID join | **unitedstates/congress-legislators** (GitHub) | the crosswalk that makes joins correct |
| SF measure funding (for/against) | **SF Ethics / DataSF SODA API** — FPPC Form 460 **Schedule D** | itemized support/oppose spend, 1998→present, queryable |
| SF measure plain-language | **SF.gov official + SPUR + Ballotpedia** | summaries traceable to an official source |
| Statewide / local candidate funding | SF Ethics + CA money sources | Tier 3, labeled |
| ❌ Do **not** use | ProPublica Congress API (dead 2024), OpenSecrets API (dead 2025), Google Civic reps (dead 2025) | |

**Ingestion = the dynamic workflow.** For each ballot item, an agent fetches ground truth, derives stances/scores via `/lib/scoring.ts`, and a **fresh verifier agent re-fetches from source and grades the result** before it's written. Output is the static store. (Full workflow in §13.)

---

## 8. The recommendation engine (the heart)

Three layers. The math is reproducible; the AI is grounded; the verifier guarantees no hallucination. This unifies your three asks — *AI recommendations*, *confidence on everything*, *a breakdown of why*.

### 8.1 Layer 1 — Deterministic scores (reproducible, no black box)

All weights live in `scoring.config.ts`. All formulas in `lib/scoring.ts`.

- **Standardized stance (item, per issue).**
  - Candidate (incumbent): for issue *i*, over the key votes tagged to *i*, `stance_i = mean(direction × votedYea?+1:-1) ∈ [-1,+1]`. Vote-derived, each traceable to a roll-call.
  - Candidate (non-incumbent): `stance_i` from curated stated positions (`basis:'stated'`, lower confidence).
  - Measure: `yesPosition_i` = the direction a **YES** vote moves issue *i*.
- **Alignment (user ↔ item), 0–100.** Per issue, `agree_i = 1 − |u_i − stance_i| / 2` (identical→1, opposite→0).
  `alignment = 100 × Σ(w_i · agree_i) / Σ(w_i)` over issues where the item has a stance.
  - Candidate → higher = voting *for* this candidate aligns with you.
  - Measure → `alignment` of the YES position; ≥50 ⇒ lean **YES** (strength = alignment−50), else **NO**.
- **Confidence, 0–100 → High/Med/Low.** A function of:
  - `coverage` = Σ(w_i over issues the item HAS evidence on) / Σ(w_i over all issues the user cares about) — *do we have data on what **you** care about?*
  - `evidence_strength` = avg evidence weight (votes 1.0 > funding 0.7 > stated 0.6).
  - `decisiveness` = |alignment−50|/50 (how far from a coin-flip).
  - `confidence = 100 × (0.5·coverage + 0.3·evidence_strength + 0.2·decisiveness)`; buckets High ≥70 / Med 40–69 / Low <40. **Always shown with its inputs** ("based on 47 votes covering 6/8 of your priority issues").
- **Consistency (Tier-1 candidate), 0–100.** Over issues with *both* a stated position `s_i` and a vote-derived `c_i`: fraction where `sign(s_i)=sign(c_i)`. The **receipt** = the issue with the largest opposite-sign gap, shown with the *specific* statement source + the *specific* roll-call(s).
- **Transparency (Tier-1 candidate), 0–100.** Weighted composite of vote-attendance %, on-time FEC filing %, disclosure completeness — each component shown individually.

### 8.2 Layer 2 — AI agent rationale (grounded, the "suggestion")

At **ingest** (offline, verifiable): an agent writes a **GroundedDigest** per item — a plain-language summary + per-issue notes + funding summary + (candidates) the consistency receipt — **constrained to cite only the fetched evidence** (mandatory `sourceUrl`s, no outside knowledge). The verifier checks every claim traces to a citation.

At **runtime** (live, personalized): `/api/recommend` sends {user values + the item's GroundedDigest + the computed scores} to **Claude**, which returns the **personalized recommendation + "why for you" breakdown** — referencing the user's top issues and the cited evidence. Because it can only use the pre-verified digest, it's fast and can't invent facts.
**Demo-safety fallback:** if the live call fails, the UI renders the deterministic recommendation + a templated breakdown from the digest. The demo never breaks.

### 8.3 Layer 3 — Verifier (groundedness + correctness gate)

A fresh agent (a) re-fetches sources and confirms the deterministic scores recompute, and (b) confirms every AI claim traces to a cited source and the recommendation direction matches the alignment math. Default **FAIL** if it can't confirm. This is both the trust guarantee *and* the Autonomy/Orchestration evidence (the "verifier caught it, builder fixed it" session-log moment).

---

## 9. Preference elicitation (the quiz)

- **v1:** ~8 issues, each a single question with **a stance input (Likert slider, −1..+1) + an importance control** ("how much do you care": low/med/high → 0/0.5/1). ~60s. The importance weights make alignment dramatically more personal for little build cost.
- **Persisted** to `localStorage`; **refinable anytime** (a "tune your values" affordance on the ballot); changing answers **re-scores everything live**.
- **Efficient by design:** importance weighting means low-care issues barely move results, so the user's attention is spent where it changes the answer.
- **Stretch (post-MVP):** adaptive follow-ups that only appear for high-importance issues; a "ballot at a glance" that highlights which 2–3 of your answers most drove your ballot.

---

## 10. Funding graph (visual hero)

- **Model:** nodes = donors/PACs/industries/committees; edges = $ → a target. Two flavors, one component:
  - Candidate: funders → candidate (sized by amount; colored by industry).
  - Measure: funders → **YES** side / **NO** side.
- **Interaction:** hover/click a node for detail + source link; filter by amount; animate on entry (the "lean-in" beat).
- **Tech:** a force-directed graph (`react-force-graph` / d3-force) — sized to its container (no hardcoded dimensions; responsive). Degrade gracefully to a ranked bar list on very small screens.
- **Trust:** every edge carries a `sourceUrl`; totals match OpenFEC / SF Ethics within rounding (a verifier gate).

---

## 11. Design system & components

**One design system** (shadcn/ui + Tailwind tokens) — no ad-hoc styling drift. **Responsive** (holds at 375px and 1280px; no hardcoded element sizes — size relative to content/containers). Accessibility target Lighthouse ≥90.

**One shared profile shell, two content variants** (candidates and measures are both first-class profiles):
- Shell: header · alignment + confidence · evidence sections · source citations.
- Candidate variant: stances · voting record · funding graph · consistency · transparency.
- Measure variant: plain-language summary · for/against funding · alignment.

**Reusable components (build once):** `IssueBadge`, `ScoreChip`/`ScoreMeter` (one visual language for Alignment/Consistency/Transparency/Confidence), `ConfidenceBadge`, `BallotItemCard` (candidate + measure variants), `RecommendationPill` ("YES · 82% · High"), `StanceBar`, `VoteRow`, `SourceLink`/`CitationChip` (reused everywhere — trust), `ContradictionCallout` (the receipt), `FundingGraph`, `WhyBreakdown` (the expandable rationale).

---

## 12. Tech stack (locked)

| Concern | Choice |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** |
| UI | **Tailwind + shadcn/ui** |
| Graph | react-force-graph / d3-force |
| Data store | **Static JSON in-repo** (`/data`) — no DB |
| User state | `localStorage` + React context — no auth, no DB |
| AI rationale | **Claude via a Next.js route handler** (`/api/recommend`), build-day credits; deterministic fallback |
| Deploy | **Vercel** (GitHub integration; every push auto-deploys) |
| Data keys | `api.data.gov` (Congress.gov + OpenFEC) in `.env.local` (gitignored) |

*No Supabase/Postgres/auth — the dataset is small and fixed; a DB would cost time and add demo-day failure surface for zero benefit.*

---

## 13. Build & orchestration plan

### 13.1 Vertical slices (each independently demo-able; cut from the bottom if time runs short)

1. **Tier-1 candidate profile** — clean federal/state data: identity + votes + vote-derived stances + funding graph, deployed & verified. *Ships by midday.*
2. **Quiz → alignment + confidence** on that candidate (live re-scoring).
3. **Full ballot view** — every June-2026 SF item listed, each with a recommendation pill + why → drill-in. **(Goal 2 — the spine.)**
4. **Measure profiles** — plain-language + for/against funding + alignment for the 4 measures.
5. **Consistency + transparency** (Tier-1) + the **receipt** + **AI rationale** polish.
6. **UI polish pass + methodology page + share card.** **(Goal 3.)**

> Slices 1–3 are the real target (a personalized ballot with deep profiles + funding graph). 4–6 are layered wins. You always have a complete, beautiful, demo-able product.

### 13.2 The loop (Autonomy + Orchestration)

- **`/goal` = `RUBRIC.md`.** The builder hillclimbs until every gate passes; it may **not** self-certify.
- **Verifier sub-agent** (fresh context) grades each slice against the rubric, re-fetching from source — `{id, pass, evidence}`, default FAIL if unconfirmed.
- **Dynamic workflow `ingest-ballot`** — `pipeline` over ballot items: *fetch → derive → adversarially verify → write JSON*. Saved to `workflows/` as the reusable artifact (rerunnable on a new ballot = the Orchestration story). A fresh rewrite supersedes the archived draft.
- **Memory `NOTES.md`** — every API quirk / ID-join gotcha becomes a written rule, not a re-derivation.
- **Deploy first:** hello-world to Vercel before there's anything to lose; every slice auto-deploys.

### 13.3 Day-of sequence

`api.data.gov` key in `.env.local` ✓ → deploy hello-world → slice 1 (+ verifier) → slices 2→6, verifier-gated → pre-submit checklist (repo public, live URL loads elsewhere, 1-min video, brief+rubric+log+workflow in repo) → submit by **5:00 PM**.

---

## 14. Definition of done (extract to `RUBRIC.md` as the `/goal`)

Machine-verifiable PASS/FAIL gates; a verifier re-fetches source + the live URL and returns `{id, pass, evidence}`; default FAIL when unconfirmed.

- **Build/deploy:** `npm run build` clean; live URL 200; core pages no console errors; **repo public** with a README of what was built today.
- **Onboarding:** quiz renders ≥8 issues incl. importance; outputs a saved vector; changing answers changes downstream recommendations.
- **Ballot coverage (spine):** home lists **every** item on the real ballot — nothing silently dropped; gaps labeled "data unavailable." Each item shows a recommendation + confidence + one-line why; each links to a profile.
- **Profiles:** candidate → vote-derived stances, voting record, funding graph; measure → plain-language summary + for/against funding + alignment. Both share the profile shell.
- **Data correctness (N=5 seeded items):** identity matches source; ≥5 displayed votes match the real roll-call; top donors/funding match OpenFEC/SF-Ethics within rounding; the Congress↔FEC join is correct; measure funding matches SF Ethics within rounding.
- **Score reproducibility:** alignment recomputes from (vector × stances); confidence inputs shown; consistency traces to a specific statement + roll-call(s); transparency components shown individually; **no hidden weighting** (all weights in config / methodology page).
- **AI groundedness:** every claim in a recommendation traces to a cited source in the item's digest; recommendation direction matches the alignment math.
- **UI quality:** layout holds at 375px + 1280px; Lighthouse a11y ≥90 on home + a profile; one design system.
- **Demo readiness:** the scripted ~60s path runs end-to-end on the live URL with no code change.
- **Orchestration evidence (scored, not gates):** `RUBRIC.md` was the `/goal` and is in the repo; the verify workflow is in the repo; the session log shows ≥1 verifier-caught failure the builder then fixed.

---

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Live API fails/rate-limits on stage | **Precompute + commit the data store**; app reads static JSON, hits no source API at request time. |
| Member-level vote data thin via Congress.gov | Fall back to House Clerk roll-call XML; resolve endpoint at ingest, record in `NOTES.md`. |
| AI hallucinates a recommendation | AI constrained to the pre-verified digest; verifier checks groundedness; deterministic fallback. |
| Non-incumbents have no voting record | Tier-3 fallback (funding + stated positions + endorsements), **labeled**, with low confidence shown honestly. |
| Scope creep (solo, ~6 hr) | Vertical slices 1–3 are the target; 4–6 are bonus; cut from the bottom. |
| "Dashboard" / "editorializing" perception | Input→derived-verdict centerpiece; never the app's own opinion; methodology page shows every formula. |
| Funding-graph polish eats time | One reusable `FundingGraph`; graceful bar-list fallback; fixed polish slice, not endless fiddling. |

---

## 16. Open decisions (for your review/edit)

1. **Demo precinct/district** — which SF precinct's exact ballot to feature, chosen for the richest Tier-1 incumbent record. *(Default: a CA-15/Mullin or CA-11/Wiener-state-record precinct — pick at ingest.)*
2. **AI rationale: live vs. precomputed.** Design says **live `/api/recommend` with a deterministic fallback** (shows the AI working — good for demo). Alternative: precompute per-item rationales for a demo profile (max robustness, less "live AI"). 
3. **The 8 issues** — list is `healthcare, climate/energy, immigration, taxes/economy, guns, reproductive rights, foreign policy/defense, civil liberties & tech`. Edit to taste; some map awkwardly onto *local* measures (a local-issues set — housing, transit, public safety, taxes — may fit SF measures better; we could use a hybrid issue set).
4. **How directive the recommendation reads** — confirmed *explicit but grounded* ("Recommended for you: YES"). Dial the wording warmer/cooler here.
5. **Share card** (stretch) — "my ballot / my rep's alignment" as an exportable image. In or out?
6. **`RUBRIC.md`** — I'll extract §14 into a standalone `RUBRIC.md` (the `/goal`) after you've reviewed this doc, so the two stay in sync.
