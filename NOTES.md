# Procivic — Build Notes & Data De-risk Log

> Memory file. Append API quirks, IDs, and decisions so they're never re-derived. `DESIGN.md` is the spec; this is the running ground-truth.

## Target ballot — June 2, 2026 SF Consolidated Statewide Direct Primary
**Demo precinct = CA-11** (covers most of SF — Pelosi's open seat).

### Contests + measures (enumerated)
- **U.S. House CA-11 (OPEN — Pelosi retired):** top-two June primary → **Scott Wiener (D)** and **Connie Chan (D)** advanced to Nov. Full field was 8 D / 2 R / 1 I (incl. Saikat Chakrabarti, Marie Hurabiell, Cole Bettles, Omed Hamid, Darren Helton, Daniel Wheeler, Jingchao Xiong, David Ganezer-R).
- **Board of Supervisors:** D4 — Stephen Sherrill (appointed Dec 2024) won ~70–30 vs. Lori Brooke; D8 — Phil Kim (incumbent) won ~63%.
- **Statewide:** Governor primary + other statewide + state legislature.
- **4 SF measures:** **Prop A** (Earthquake Bond), **Prop B** (Lifetime Term Limits), **Prop C** (Small Business Tax Cuts), **Prop D** (Business Tax Increase / "overpaid CEO tax").

### Tier-1 deep-profile subject = Scott Wiener
- **Voting record:** CA State Senate → **OpenStates v3** (key ✅ in `.env.local`). Wiener person id **`ocd-person/de84277e-1c23-4036-bd64-b27c310a1c0e`** (CA State Senate District 11). Verified 6/13 — reuse this id; don't re-resolve it.
- **Congressional funding:** OpenFEC candidate id **`H8CA11116`** (WIENER, SCOTT; office H; CA-11; Democratic; status C).
- **Consistency angle:** his CA-11 campaign stated positions vs. his actual state-senate votes.
- **Local contrast = Connie Chan** (SF Supervisor): BOS record (legistar, no clean API → Tier 3), SF-Ethics funding.

## API de-risk (2026-06-13) — verified
- **api.data.gov key (`.env.local`): WORKS.** Congress.gov → HTTP 200, OpenFEC → HTTP 200. (40-char key.)
- **congress-legislators crosswalk: WORKS.** Resolved: Pelosi CA-11 `P000197` / FEC `H8CA05035`; Mullin CA-15 `M001225` / `H2CA14162`; Kiley CA-3 `K000401` / `H2CA03157`. (Wiener absent — he's a state legislator, correct.)
- **OpenFEC funding shape: WORKS.** `candidate/{id}/totals` (Pelosi 2024: $10.2M receipts), `candidate/{id}/committees` (principal `C00213512`), `schedules/schedule_a` returns rows.
  - **QUIRK:** the largest Schedule A rows are committee→committee transfers with `contributor_employer`/`occupation` = null. For the funding graph's donor/employer grouping, **filter to itemized INDIVIDUAL contributions** — those carry `contributor_employer` + `contributor_occupation`.
  - **No industry codes in FEC data** (OpenSecrets, which provided them, is dead) → approximate "industry" by clustering employer/occupation strings.

## Open data items (resolve before the dependent slice)
1. **OpenStates API key — ✅ OBTAINED** (stored in `.env.local` as `OPENSTATES_API_KEY`; gitignored — NEVER commit, NEVER paste into NOTES/DESIGN/BRIEF). Base `https://v3.openstates.org/`; key via `X-API-KEY` header (or `?apikey=`).
   - **⚠️ HARD LIMITS: 500 requests/day AND 1 request/second.** Ingest implications: (a) fetch only the **curated issue-tagged key votes** for Wiener, not his whole record; (b) **cache raw responses to disk; do NOT re-fetch on every workflow run** (a re-run must not re-burn the budget); (c) v3 has no per-person votes endpoint — votes live on `/bills` (each bill carries `votes[]`), so pull a small set of target bills and read Wiener's vote from each; (d) resolve Wiener's `ocd-person` id **once** and store it; (e) **serialize OpenStates calls with ≥1s spacing — do NOT parallelize that source** in the workflow (Congress.gov / OpenFEC / DataSF can still parallelize).
2. **SF measure/candidate funding — ✅ RESOLVED.** DataSF SODA datasets (no key needed), base `https://data.sfgov.org/resource/<id>.json` (`$q`, `$where`, `$select`, `$limit`):
   - **Filers** `4c8t-ngau` — committee identity (`filer_nid`, `fppc_id`, `filer_name`, `candidate_name`).
   - **Summary Totals** `9ggq-m8hp` — Form 460 summary lines per filing (contribution/expenditure totals).
   - **Transactions** `pitq-e56w` — donor-level line items (`transaction_last_name`, `transaction_amount_1`, `transaction_date`, `transaction_description`) → funding-graph nodes/edges.
   - **Committee→measure link is by NAME, not a structured field.** Verified committee names embed the side: *"Yes on A, San Franciscans for Fire, Earthquake, and Disaster Preparedness…"*, *"Term Limits Now – Yes on B!"*, *"YES ON C, NO ON D …"*, *"San Francisco Municipal Executives' PAC"* (Prop D). A committee may cover multiple measures (e.g. Yes-C/No-D). → **Curate a small committee→{measure, side} map for the 4 measures at ingest**, then pull totals (Summary) + donors (Transactions) per committee.

## Decisions
- Scope locked (DESIGN §16): CA-11 SF ballot, tiered data + confidence, **live** AI recommendations + verifier, ballot-tailored issues, alignment-forward language, personalized + intelligently-selected Q&A.
