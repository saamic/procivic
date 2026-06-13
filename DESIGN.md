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
- **Not a banned project.** We are **not**: a RAG app, a Streamlit app, an image analyzer, a chatbot, a personality/sports analyzer, or a medical/mental-health/nutrition bot. *(The profile Q&A in §8.4 is a cited, evidence-scoped **feature**, not the product — the centerpiece stays the personalized ballot verdict, not a chat interface.)*

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
- **The marquee race — U.S. House CA-11:** Pelosi's **open seat** (she retired after ~40 years). The June top-two primary advanced **Scott Wiener** (CA State Senator) and **Connie Chan** (SF Supervisor). *(CA-15 / Rep. Mullin covers only a small slice of SF.)*
- **Statewide** primary races (Governor, etc.).

**Demo precinct = CA-11** (most of SF). **Tier-1 deep profile = Scott Wiener** — his real **CA State Senate** voting record (OpenStates) + his **congressional funding** (OpenFEC `H8CA11116`) + the consistency between the two. **Connie Chan** is the local contrast (SF Supervisor; SF-Ethics funding, BOS record). Pelosi's open seat is also the single most demo-compelling item on the ballot. *(Tier-1 needs a free OpenStates API key — see `NOTES.md`.)*

### 3.2 Tiered data strategy = the confidence score, for free

Data quality varies by item type. Rather than hide that, we surface it as a **confidence score** — honest *and* differentiating. The tiers literally define confidence:

| Tier | Items | Evidence available | Confidence |
|---|---|---|---|
| **1 — Deep showcase** | **Scott Wiener** (CA-11 candidate for Pelosi's seat): CA State Senate votes via **OpenStates** + congressional funding via **OpenFEC** (`H8CA11116`) | roll-call votes + money + vote-derived stances + consistency + transparency | **High** |
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
6. **Ask anything →** on any profile, ask a question ("how did they vote on housing?", "who funds the NO side?") and get a **cited answer** grounded in that item's evidence — it refuses rather than guesses when the record is silent.
7. **Change an answer →** everything re-scores live (personalization is real, not static).

### 4.2 Screen map & routes (Next.js App Router)

| Route | Screen | Notes |
|---|---|---|
| `/` | Landing | value prop; CTA → quiz (or → `/ballot` if a saved vector exists) |
| `/quiz` | Onboarding quiz | ballot-tailored issues × {stance, importance}; writes the vector |
| `/ballot` | **Your Ballot (home/spine)** | every contest + measure; per-item recommendation pill + why; "ballot at a glance" summary |
| `/candidate/[slug]` | Candidate profile | identity, alignment, stances, votes, funding graph, consistency, transparency, **Ask panel** |
| `/measure/[slug]` | Measure profile | summary, for/against funding, alignment, **Ask panel** |
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
- **Config:** `/config/issues.ts` (the ballot-tailored issue axes + poles — derived from the ballot, see §9), `/config/scoring.config.ts` (weights, thresholds) — *all weighting lives here, nothing hidden.*
- **Scoring engine:** `/lib/scoring.ts` — pure functions (alignment, confidence, consistency, transparency), used identically by the app and the verifier.
- **Recommendation:** deterministic scores client-side; AI rationale via `/api/recommend` (server route → Claude), with a deterministic templated fallback so the demo never breaks.
- **Presentation:** Next.js App Router, mostly static; client components for quiz, live scoring, funding graph.

---

## 6. Data model (sketch)

```ts
type IssueId = 'healthcare'|'climate_energy'|'immigration'|'taxes_economy'
             | 'guns'|'reproductive'|'foreign_defense'|'civil_tech';

// PROVISIONAL IssueId list above — REPLACED by the ballot-tailored issue set derived
// in Task 4 (issues chosen bottom-up from the actual June-2026 SF ballot; see §9 + §16).
// Each issue is a neutral axis with two labeled poles (-1 ↔ +1). Political
// labeling of poles is irrelevant to the math; only consistent mapping matters.
interface Issue { id: IssueId; label: string; poleNeg: string; polePos: string; }

interface UserValues {
  stances: Record<IssueId, number>;     // -1..+1
  importance: Record<IssueId, number>;  // 0..1  ("how much you care")
  nuance?: Record<IssueId, {            // OPTIONAL agentic deepening (§9)
    refinements?: Record<string, number>; // structured sub-positions → feed the REPRODUCIBLE score
    note?: string;                        // free-text values note → conditions the AI rationale only
  }>;
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
| State legislator votes (Wiener) | **OpenStates v3 API** | the Tier-1 voting record. ✅ key in `.env.local`. **500 req/day + 1 req/sec** → serialize + cache raw responses; pull only curated issue-tagged key votes. See `NOTES.md`. |
| Congress ↔ FEC ID join | **unitedstates/congress-legislators** (GitHub) | the crosswalk that makes joins correct |
| SF measure funding (for/against) | **SF Ethics via DataSF SODA** — Filers `4c8t-ngau`, Summary `9ggq-m8hp`, Transactions `pitq-e56w` | ✅ verified. Committee→measure link is by **committee name** (curate a small map at ingest); donor detail in Transactions. See `NOTES.md`. |
| SF measure plain-language | **SF.gov official + SPUR + Ballotpedia** | summaries traceable to an official source |
| Statewide / local candidate funding | SF Ethics + CA money sources | Tier 3, labeled |
| ❌ Do **not** use | ProPublica Congress API (dead 2024), OpenSecrets API (dead 2025), Google Civic reps (dead 2025) | |

**Ingestion = the dynamic workflow.** For each ballot item, an agent fetches ground truth, derives stances/scores via `/lib/scoring.ts`, and a **fresh verifier agent re-fetches from source and grades the result** before it's written. Output is the static store. (Full workflow in §13.)

---

## 8. The recommendation engine (the heart)

Three layers, plus a shared Q&A surface (§8.4). The math is reproducible; the AI is grounded; the verifier guarantees no hallucination. This unifies your asks — *AI recommendations*, *confidence on everything*, *a breakdown of why*, and *ask-anything, with citations*.

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

### 8.4 "Ask Procivic" — grounded Q&A on any profile

Every candidate and measure profile has an **Ask** affordance: the user types a question — *"How did they vote on housing?"*, *"Who are their biggest donors?"*, *"Is this consistent with what they said?"*, *"What does a YES on Measure A actually fund?"* — and gets a **cited answer**.

- **Grounded, not open-ended.** Generated by Claude (`/api/ask`) **constrained to that entity's evidence bundle** — the same verified `GroundedDigest` + structured votes/funding/statements/official summary that powers the recommendation (§8.2). No outside knowledge; **every claim carries a `SourceLink`** to the underlying vote / FEC or SF-Ethics record / official summary.
- **Refuses rather than guesses.** If the evidence doesn't contain the answer, it says so (*"I don't have a record on that"*) and points to what *is* available — never fabricates. Enforced by the same groundedness check as §8.3.
- **Personalized when useful.** The user's value vector is in context, so answers can connect to the user (*"you marked climate high-importance — here are their three climate votes"*) while staying factual and cited.
- **Reuses the AI stack — no second pipeline.** Same evidence bundle, same citation components, same groundedness guarantee as the recommendation engine. One grounding contract, two surfaces: the auto recommendation *and* the user-asked answer.
- **Intelligently-selected starter questions** seed the box — *chosen per profile, not hardcoded.* At ingest, a small pool of candidate questions is generated from that entity's grounded evidence (so every suggestion is guaranteed answerable with citations — no dead ends); at view time the top ~3–5 are **ranked by the user's value vector + the entity's most notable facts** (a big consistency gap, lopsided funding, a pivotal vote). So a housing-focused user sees housing questions first, and a measure with one-sided money surfaces *"who's funding the opposition?"* Same evidence bundle — no separate pipeline.

**Why this is NOT a banned "RAG app" or "education chatbot":** it's a scoped, cited affordance *inside* a profile, secondary to the ballot-verdict centerpiece — the product's primary action stays "values in → ballot decoded," not "chat with a bot." Answers are grounded in a small, curated, verified evidence set with mandatory citations: a trust feature, not the product.

---

## 9. Preference elicitation (the quiz)

- **v1:** the **ballot-tailored issue set** (derived bottom-up from the enumerated ballot so every question moves ≥1 real recommendation — see Task 4; ~8–12 issues spanning federal + state + local), each a single question with **a stance input (Likert slider, −1..+1) + an importance control** ("how much do you care": low/med/high → 0/0.5/1). ~60s. The importance weights make alignment dramatically more personal for little build cost.
- **Persisted** to `localStorage`; **refinable anytime** (a "tune your values" affordance on the ballot); changing answers **re-scores everything live**.
- **Efficient by design:** importance weighting means low-care issues barely move results, so the user's attention is spent where it changes the answer.
- **Nuance beyond the slider (agentic elicitation).** A slider flattens conditional views (*"pro-climate — but not if it raises costs on working families"*). So any issue can be **deepened by chatting with an agent** that asks targeted clarifying questions and extracts two things: (a) *structured* refinements — sub-positions / conditional weights that feed the **reproducible** alignment score; and (b) a short free-text **values note** that conditions the live recommendation's "why for you." Optional and efficient — deepen only where it would change a recommendation. **Reproducibility-safe:** the score still computes from structured values; the free-text only enriches the already-AI-generated rationale. This is the inverse of the profile Q&A (§8.4) — there *you* ask about a candidate; here the agent asks about *you*. (Component: `PreferenceChat`.)
- **Stretch (post-MVP):** adaptive follow-ups that only appear for high-importance issues; a "ballot at a glance" that highlights which 2–3 of your answers most drove your ballot.
- **Beyond the quiz (roadmap → §17):** progressively enrich a user's profile over time — passively (which issues/candidates they explore in-app) and via opt-in connected sources — to sharpen alignment and *raise confidence* without more upfront questions. Consent-first and transparent (see §17).

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

**Reusable components (build once):** `IssueBadge`, `ScoreChip`/`ScoreMeter` (one visual language for Alignment/Consistency/Transparency/Confidence), `ConfidenceBadge`, `BallotItemCard` (candidate + measure variants), `RecommendationPill` ("YES · 82% · High"), `StanceBar`, `VoteRow`, `SourceLink`/`CitationChip` (reused everywhere — trust), `ContradictionCallout` (the receipt), `FundingGraph`, `WhyBreakdown` (the expandable rationale), `AskPanel` (ask-a-question box + intelligently-selected starter prompts), `CitedAnswer` (answer with inline `SourceLink` citations — shared by `WhyBreakdown` and the Ask panel).

---

## 12. Tech stack (locked)

| Concern | Choice |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** |
| UI | **Tailwind + shadcn/ui** |
| Graph | react-force-graph / d3-force |
| Data store | **Static JSON in-repo** (`/data`) — no DB |
| User state | `localStorage` + React context — no auth, no DB |
| AI rationale & Q&A | **Claude via Next.js route handlers** (`/api/recommend`, `/api/ask`), build-day credits; both constrained to a verified evidence bundle; `recommend` has a deterministic fallback |
| Deploy | **Vercel** (GitHub integration; every push auto-deploys) |
| Data keys | `api.data.gov` (Congress.gov + OpenFEC) in `.env.local` (gitignored) |

*No Supabase/Postgres/auth — the dataset is small and fixed; a DB would cost time and add demo-day failure surface for zero benefit.*

> **Scaffold reconciliation (6/13):** repo `github.com/saamic/procivic` is scaffolded with **Next.js 15 + React 19 + TypeScript + Tailwind v3** at the repo root (no `src/`). **shadcn/ui not yet initialized** (`npx shadcn@latest init`); `node_modules` not yet installed (`npm install` + `npm run build` before any push). Build the app *on* this scaffold — do not re-scaffold.

---

## 13. Build & orchestration plan

### 13.1 Vertical slices (each independently demo-able; cut from the bottom if time runs short)

0. **Brand & design-system foundation** — `BRAND.md` (palette: light-blue/purple/red, gradient + blur tokens, type, logo, icons) + the themed design system (Tailwind tokens + shadcn + base primitives + the §11 shared components). **Build FIRST** so every later slice ships polished. Kickoff: `kickoff-slice-0-brand.md`; orchestration: `ORCHESTRATION.md`.
1. **Tier-1 candidate profile** — clean federal/state data: identity + votes + vote-derived stances + funding graph, deployed & verified. *Ships by midday.*
2. **Quiz → alignment + confidence** on that candidate (live re-scoring).
3. **Full ballot view** — every June-2026 SF item listed, each with a recommendation pill + why → drill-in. **(Goal 2 — the spine.)**
4. **Measure profiles** — plain-language + for/against funding + alignment for the 4 measures.
5. **Consistency + transparency** (Tier-1) + the **receipt** + **AI rationale** + the **Ask-a-profile grounded Q&A** (reuses the §8 evidence bundle).
6. **UI polish pass + methodology page + share card.** **(Goal 3.)**

> **Slice 0 (brand) is the foundation** — it makes slices 1–6 look finished *as they're built* (replacing the old "polish last" approach). Slices 1–3 are the real target (a personalized ballot with deep profiles + funding graph); 4–6 are layered wins. You always have a complete, beautiful, demo-able product.

### 13.2 The loop (Autonomy + Orchestration)

- **`/goal` = `RUBRIC.md`.** The builder hillclimbs until every gate passes; it may **not** self-certify.
- **Verifier sub-agent** (fresh context) grades each slice against the rubric, re-fetching from source — `{id, pass, evidence}`, default FAIL if unconfirmed.
- **Dynamic workflow `ingest-ballot`** — `pipeline` over ballot items: *fetch → derive → adversarially verify → write JSON*. Saved to `workflows/` as the reusable artifact (rerunnable on a new ballot = the Orchestration story). A fresh rewrite supersedes the archived draft. **Throttle OpenStates to ≤1 req/sec, serialized, with cached raw responses** (500/day + 1/sec cap — `NOTES.md`); other sources can parallelize.
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
- **AI groundedness:** every claim in a recommendation *and every answer in the Ask panel* traces to a cited source in the item's evidence bundle; the Ask panel **refuses** (rather than fabricates) when the evidence lacks the answer; recommendation direction matches the alignment math.
- **UI quality:** layout holds at 375px + 1280px; Lighthouse a11y ≥90 on home + a profile; one design system.
- **Demo readiness:** the scripted ~60s path runs end-to-end on the live URL with no code change.
- **Orchestration evidence (scored, not gates):** `RUBRIC.md` was the `/goal` and is in the repo; the verify workflow is in the repo; the session log shows ≥1 verifier-caught failure the builder then fixed.

---

## 15. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Live API fails/rate-limits on stage | **Precompute + commit the data store**; app reads static JSON, hits no source API at request time. |
| Member-level vote data thin via Congress.gov | Fall back to House Clerk roll-call XML; resolve endpoint at ingest, record in `NOTES.md`. |
| AI hallucinates a recommendation **or Q&A answer** | Both constrained to the pre-verified evidence bundle; verifier checks groundedness; mandatory citations; the Ask panel refuses when evidence is absent; `recommend` has a deterministic fallback. |
| Non-incumbents have no voting record | Tier-3 fallback (funding + stated positions + endorsements), **labeled**, with low confidence shown honestly. |
| Scope creep (solo, ~6 hr) | Vertical slices 1–3 are the target; 4–6 are bonus; cut from the bottom. |
| "Dashboard" / "editorializing" perception | Input→derived-verdict centerpiece; never the app's own opinion; methodology page shows every formula. |
| Q&A reads as a banned "RAG app" / chatbot | Cited, evidence-scoped affordance *inside* a profile, secondary to the ballot-verdict centerpiece; primary action stays "values in → ballot decoded." |
| Funding-graph polish eats time | One reusable `FundingGraph`; graceful bar-list fallback; fixed polish slice, not endless fiddling. |

---

## 16. Key decisions (resolved 2026-06-13)

1. **Demo precinct/district** — *in flight:* being chosen now in **Task 2** (enumerate the ballot → pick the precinct whose congressional race gives the richest Tier-1 incumbent record).
2. **AI rationale: live vs. precomputed** — ✅ **Live** `/api/recommend`, with the deterministic fallback as the safety net. Shows the AI working on stage. 
3. **Issue set** — ✅ **Ballot-tailored.** Issues are derived **bottom-up from the enumerated ballot** so every quiz question moves ≥1 real recommendation and every item has alignment signal (spans federal + state + local). The concrete list is finalized in **Task 4**, fed by Task 2 — *supersedes the provisional 8 national issues sketched in §6.*
4. **Recommendation language** — ✅ **Alignment-forward** wording (e.g., "Strongly aligns with you"); exact phrasing finalized after seeing it live. Grounded/non-editorializing either way.
5. **Share card** — ✅ **Stretch / nice-to-have** (in §17 roadmap; build only if time allows).
6. **Ask-a-profile Q&A** — ✅ **Personalized + cited**, with **intelligently-selected starter questions** (§8.4) — generated then ranked per user, never hardcoded.
7. **`RUBRIC.md`** — ✅ Extracting §14 into a standalone `RUBRIC.md` (the `/goal`) now that the doc is locked (Task 5).

---

## 17. Roadmap (post-v1 — pitch-worthy "where this goes")

Not in the demo, but the natural next steps — worth highlighting in the pitch to show Procivic is a *platform*, not a one-ballot toy.

- **Progressive user enrichment (the flagship next feature).** The initial quiz is just the cold-start. Over time Procivic learns a richer, more accurate value profile so recommendations get sharper and **confidence rises** — with *no* extra upfront burden on the user:
  - **Passive / behavioral:** which issues, candidates, and measures the user explores in-app refine the inferred importance weights.
  - **Active / deepening:** optional longer questionnaires and adaptive follow-ups, focused on the issues that most move *their* ballot.
  - **Connected (opt-in):** with explicit consent, sources that reveal civic priorities — exact address (precise ballot), registration/party, causes followed — fill in the vector.
  - **Privacy-first, non-negotiable:** consent-gated, transparent ("here's what we used and why"), user-inspectable and deletable, local-first where possible. A political-values profile is sensitive; trust *is* the product, so enrichment is always opt-in and explained. This guardrail is part of the feature, not a footnote.
- **Address-based ballot lookup** — any voter's exact ballot, not just the demo precinct.
- **Multi-jurisdiction** — generalize the pipeline to other CA/US ballots (the architecture already supports it; it's a data-coverage problem).
- **"Donations → contracts" edge** — extend the funding graph via USAspending ("donated, then won a contract").
- **Richer money & influence data** — sources that are alive but out-of-scope for the one-day CA-11 build: **Stanford DIME** (donor + candidate ideology / CFscores), **LittleSis** (who's-connected-to-whom networks), **ProPublica Nonprofit Explorer** (990s → which orgs fund which nonprofits), **Senate LDA** (lobbying), **Cal-Access** (CA state campaign finance). *(Note: **OpenSecrets' API is dead as of 2025** — its industry classifications aren't available; we approximate "industry" by clustering FEC `employer`/`occupation`.)*
- **Shareable result card** — export "my ballot / my rep's alignment" as an image.
- **Local-first depth** — SF Board of Supervisors voting records (legistar) for true local accountability profiles.
