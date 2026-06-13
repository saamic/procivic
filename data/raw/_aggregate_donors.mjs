// Re-aggregate Wiener's itemized INDIVIDUAL contributions across ALL pages (keyset
// pagination), summing per contributor — fixes the ingest under-count (NOTES.md, run 1).
// Uses FEC_API_KEY from .env.local; never prints the key. Run: node data/raw/_aggregate_donors.mjs
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const KEY = (env.match(/^FEC_API_KEY=(.+)$/m) || [])[1]?.trim();
if (!KEY) { console.error("no FEC_API_KEY"); process.exit(1); }

const BASE = "https://api.open.fec.gov/v1/schedules/schedule_a/";
const params = {
  committee_id: "C00909283",
  two_year_transaction_period: "2026",
  is_individual: "true",
  per_page: "100",
  sort: "-contribution_receipt_amount",
  api_key: KEY,
};

function url(extra = {}) {
  const u = new URL(BASE);
  for (const [k, v] of Object.entries({ ...params, ...extra })) u.searchParams.set(k, v);
  return u;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const byDonor = new Map();
let total = 0, rows = 0, page = 0;
let lastIndex = null, lastAmount = null, expected = null;

while (true) {
  const extra = lastIndex
    ? { last_index: lastIndex, last_contribution_receipt_amount: lastAmount }
    : {};
  const res = await fetch(url(extra), { headers: { accept: "application/json" } });
  if (!res.ok) { console.error("HTTP", res.status, await res.text()); process.exit(1); }
  const j = await res.json();
  expected = j.pagination?.count ?? expected;
  const results = j.results || [];
  if (!results.length) break;
  for (const r of results) {
    const amt = Number(r.contribution_receipt_amount) || 0;
    total += amt; rows++;
    const name = (r.contributor_name || "UNKNOWN").trim();
    const key = name.toUpperCase();
    const cur = byDonor.get(key) || { name, amount: 0, txns: 0, employer: r.contributor_employer || "", conduit: r.conduit_committee_name || "" };
    cur.amount += amt; cur.txns++;
    if (!cur.employer && r.contributor_employer) cur.employer = r.contributor_employer;
    byDonor.set(key, cur);
  }
  page++;
  const li = j.pagination?.last_indexes;
  if (!li || !li.last_index) break;
  lastIndex = li.last_index;
  lastAmount = li.last_contribution_receipt_amount;
  await sleep(120);
}

const ranked = [...byDonor.values()].sort((a, b) => b.amount - a.amount);
const top = ranked.slice(0, 15).map((d) => ({
  name: d.name,
  amount: Math.round(d.amount * 100) / 100,
  employer: d.employer || undefined,
  txns: d.txns,
}));

const out = {
  source: "OpenFEC schedule_a, committee C00909283, 2026 cycle, itemized individuals",
  sourceUrl: "https://api.open.fec.gov/v1/schedules/schedule_a/?committee_id=C00909283&two_year_transaction_period=2026&is_individual=true",
  fetchedRows: rows,
  expectedRows: expected,
  pages: page,
  itemizedIndividualTotal: Math.round(total * 100) / 100,
  uniqueDonors: byDonor.size,
  topDonors: top,
};
fs.writeFileSync("data/raw/fec_donors_aggregated.json", JSON.stringify(out, null, 2));
console.log(`rows=${rows}/${expected} pages=${page} uniqueDonors=${byDonor.size} itemizedTotal=$${out.itemizedIndividualTotal.toLocaleString()}`);
console.log("TOP 15:");
for (const d of top) console.log(`  $${d.amount.toLocaleString().padStart(10)}  ${d.name}${d.employer ? " — " + d.employer : ""} (${d.txns} txns)`);
