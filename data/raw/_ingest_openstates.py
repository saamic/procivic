#!/usr/bin/env python3
"""Throttled OpenStates v3 ingest for Scott Wiener's CA Senate votes.

ONE representative bill per Procivic issue. Serializes calls >=1s apart, caches raw
JSON to data/raw/, reads Wiener's individual vote from each bill's votes[].

Constraints (NOTES.md): 500/day + 1 req/sec; no per-person votes endpoint -> votes
live on /bills (include=votes). Re-runs must NOT re-fetch if cache exists.
"""
import json, os, sys, time, urllib.parse, urllib.request

OS = "https://v3.openstates.org"
KEY = os.environ["OPENSTATES_API_KEY"]
WIENER = "ocd-person/de84277e-1c23-4036-bd64-b27c310a1c0e"
RAW = os.path.dirname(os.path.abspath(__file__))

# Curated issue -> {session, identifier} for one representative CA-Senate bill Wiener voted on.
# Direction = does a YES vote move toward the issue's POSITIVE pole (config/issues.ts)?
# Chosen so a real Senate-floor vote by Wiener exists for each.
BILLS = [
    # housing: +pole = build much more housing (dense/market-rate). SB 423 = streamlined housing approvals. YES -> +1
    {"issue": "housing", "session": "20232024", "identifier": "SB 423", "direction": 1,
     "note": "Streamlined/by-right multifamily housing approvals; Wiener author."},
    # homelessness_safety: +pole = more enforcement/mandated treatment. SB 43 = broaden conservatorship (grave disability) -> mandated treatment. YES -> +1
    {"issue": "homelessness_safety", "session": "20232024", "identifier": "SB 43", "direction": 1,
     "note": "Expands conservatorship/grave-disability for severe mental illness & substance use; Wiener author. YES = more mandated treatment."},
    # business_tax: +pole = higher taxes on large business / more regulation. SB 584 = short-term rental tax to fund housing. YES -> +1
    {"issue": "business_tax", "session": "20232024", "identifier": "SB 584", "direction": 1,
     "note": "New 15% short-term-rental (lodging) business tax to fund affordable housing; Wiener author. YES = higher business tax."},
    # inequality_labor: +pole = strong labor/worker protections. SB 799 = unemployment benefits for striking workers. YES -> +1
    {"issue": "inequality_labor", "session": "20232024", "identifier": "SB 799", "direction": 1,
     "note": "Unemployment insurance eligibility for workers on strike. YES = pro-labor/worker protection."},
    # city_fiscal: +pole = borrow & invest in major infrastructure. SB 1 (2023-24) was a special-session bill; use a transportation/climate bond-aligned bill.
    # Use SB 867 (2023-24) Safe Drinking Water, Wildfire Prevention... Bond Act of 2024 -> places a GO bond. YES -> +1
    {"issue": "city_fiscal", "session": "20232024", "identifier": "SB 867", "direction": 1,
     "note": "Safe Drinking Water, Wildfire Prevention, Drought, Flood, Clean Air bond ($10B GO bond placed on ballot). YES = borrow & invest."},
    # govt_reform: +pole = strong structural reform/transparency/accountability. SB 1100? Use SB 1126 (CalSavers) is not reform.
    # Use SB 1439 (2022) campaign-contribution recusal? session 20212022. Prefer 20232024: SB 42? Use AB? must be a bill he voted on.
    # Use SB 1439 conflict-of-interest reform is 2022. For govt_reform use SB 1131 (address confidentiality)? Not clean.
    # Use SB 1100 (2024) "removal of disruptive individuals from public meetings" weakens openness; instead SB 411 (Brown Act remote teleconf) transparency.
    {"issue": "govt_reform", "session": "20232024", "identifier": "SB 411", "direction": 1,
     "note": "Open-meeting (Brown Act) remote-participation rules for neighborhood councils; government-transparency/access reform. YES = pro-access reform."},
    # climate: +pole = aggressive climate action. SB 253 = Climate Corporate Data Accountability (mandatory GHG disclosure). YES -> +1
    {"issue": "climate", "session": "20232024", "identifier": "SB 253", "direction": 1,
     "note": "Climate Corporate Data Accountability Act: mandatory corporate GHG-emissions disclosure. YES = aggressive climate action."},
    # healthcare: +pole = government-guaranteed coverage. SB 770 = pathway to unified/single-payer financing. YES -> +1
    {"issue": "healthcare", "session": "20232024", "identifier": "SB 770", "direction": 1,
     "note": "Directs pursuit of federal waivers toward unified health-care financing (single-payer pathway). YES = expand govt role."},
    # immigration: +pole = more open/pro-immigrant. SB 227 (Safety Net for All) UI for undocumented? session 20232024. YES -> +1
    {"issue": "immigration", "session": "20232024", "identifier": "SB 227", "direction": 1,
     "note": "Safety Net for All: unemployment-style benefits for excluded (incl. undocumented) workers. YES = pro-immigrant."},
    # civil_democracy: +pole = strong civil-liberties / rein in surveillance & big tech. SB 1076? Use SB 362 (Delete Act) data-broker privacy. YES -> +1
    {"issue": "civil_democracy", "session": "20232024", "identifier": "SB 362", "direction": 1,
     "note": "California Delete Act: one-stop data-broker deletion; consumer data-privacy / rein-in-data-brokers. YES = strong civil-liberties/tech reform."},
]

LAST = [0.0]
def throttle():
    dt = time.time() - LAST[0]
    if dt < 1.15:
        time.sleep(1.15 - dt)
    LAST[0] = time.time()

def get(url, cache):
    path = os.path.join(RAW, cache)
    if os.path.exists(path) and os.path.getsize(path) > 2:
        return json.load(open(path))
    throttle()
    req = urllib.request.Request(url, headers={"X-API-KEY": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read().decode())
    json.dump(data, open(path, "w"))
    return data

def find_wiener_vote(bill):
    """Return (option, vote_obj) for the Senate-floor passage vote where Wiener voted, else best available."""
    best = None
    for v in bill.get("votes", []):
        org = (v.get("organization") or {}).get("classification")
        for cast in v.get("votes", []):
            voter = cast.get("voter") or {}
            if voter.get("id") == WIENER:
                cand = (cast.get("option"), v, org, "passage" in (v.get("motion_classification") or []))
                # prefer Senate (upper) passage votes
                if best is None:
                    best = cand
                else:
                    # rank: upper+passage > upper > passage > other
                    def rank(c):
                        return (1 if c[2] == "upper" else 0) + (1 if c[3] else 0)
                    if rank(cand) > rank(best):
                        best = cand
    if best:
        return best[0], best[1]
    return None, None

out = []
for spec in BILLS:
    ident = spec["identifier"]
    safe = ident.replace(" ", "_")
    q = urllib.parse.urlencode({
        "jurisdiction": "California", "session": spec["session"],
        "identifier": ident, "include": "votes", "per_page": 5,
    }, doseq=True)
    # include must repeat; urlencode handles single. add sponsorships too via manual
    url = f"{OS}/bills?{q}"
    cache = f"os_{spec['issue']}_{safe}.json"
    try:
        d = get(url, cache)
    except Exception as e:
        out.append({"issue": spec["issue"], "identifier": ident, "error": str(e)})
        continue
    results = d.get("results", [])
    # exact-identifier match
    bill = None
    for b in results:
        if b.get("identifier") == ident:
            bill = b
            break
    if bill is None and results:
        bill = results[0]
    rec = {"issue": spec["issue"], "identifier": ident, "session": spec["session"],
           "direction": spec["direction"], "note": spec["note"]}
    if bill is None:
        rec["found"] = False
        out.append(rec)
        continue
    opt, vote = find_wiener_vote(bill)
    rec.update({
        "found": True,
        "bill_id": bill.get("id"),
        "title": bill.get("title"),
        "subjects": bill.get("subject"),
        "openstates_url": bill.get("openstates_url"),
        "n_votes": len(bill.get("votes", [])),
        "wiener_option": opt,
        "vote_motion": (vote or {}).get("motion_text") if vote else None,
        "vote_date": (vote or {}).get("start_date") if vote else None,
        "vote_result": (vote or {}).get("result") if vote else None,
        "vote_org": ((vote or {}).get("organization") or {}).get("classification") if vote else None,
        "vote_counts": (vote or {}).get("counts") if vote else None,
        "vote_sources": (vote or {}).get("sources") if vote else None,
    })
    out.append(rec)

json.dump(out, open(os.path.join(RAW, "_wiener_votes_summary.json"), "w"), indent=2)
for r in out:
    print(r["issue"], "|", r["identifier"], "|", r.get("wiener_option"), "|",
          r.get("vote_org"), "|", (r.get("vote_motion") or "")[:50], "|", r.get("vote_result"),
          ("" if r.get("found") else "NOT FOUND"))
