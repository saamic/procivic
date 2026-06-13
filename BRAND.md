# Procivic — Brand & Design Guide

> **"Your ballot, decoded."**
> The single source of truth for how Procivic *looks, sounds, and feels*. Every CLAUDE dev agent building a slice reads this first so the product ships **on-brand and finished as it's built** — not polished at the end.

**Palette:** "Civic Daylight" — **LOCKED**. Light-blue (`brand` / trust) + purple (`accent` / "decoded") + red (`signal` / conflict) on a cool-neutral `slate` base, with soft gradients and tasteful glass. Modern, trustworthy, a touch bold.

**How to use this doc:** colors → §2 (tokens) + §3 (the guardrail) + §4 (score language); recipes → §5; type → §6; spacing/a11y → §7; logo/icons → §8. **Never hardcode hex in components** — everything wires through Tailwind theme tokens / CSS variables (see `tailwind.config.ts`). This doc is the *spec*; the config is the *implementation*.

---

## 1. Brand essence + voice/tone

### 1.1 Essence

| Attribute | What it means for Procivic | What it is **not** |
|---|---|---|
| **Trustworthy** | Every claim has a receipt one click away. Calm, legible, evidence-first. | Not flashy-for-its-own-sake; not opaque. |
| **Modern** | Clean type, generous space, soft gradients, subtle glass. 2026, not gov-portal-2008. | Not skeuomorphic; not brutalist; not "enterprise gray." |
| **A touch bold** | Confident color, a hero gradient, a funding graph that leans in. | Not loud; not partisan; not gimmicky. |
| **Non-editorializing** | We compute *your* values vs. *the public record*. The verdict belongs to the user, never to Procivic. | **Never** "this candidate is good." See §1.3 — this is core. |
| **Empowering** | The voter leaves informed and in control (override anytime). | Not preachy; not a nudge-machine. |

**One-line positioning:** *Procivic turns your own values + the public record into a personalized, evidence-backed read on your real ballot — with the receipts one click away.*

### 1.2 Voice & tone

- **Voice (constant):** a sharp, trustworthy civic explainer — plain-spoken, precise, quietly confident. Short sentences. Real nouns ($ amounts, vote counts, dates). No jargon, no spin.
- **Tone (varies by surface):**
  - *Landing / hero* — bold, inviting, benefit-first.
  - *Ballot & profiles* — neutral, factual, calm.
  - *Receipt / contradiction* — direct but never gloating ("said X, voted Y — here's the roll-call").
  - *Confidence & data gaps* — honest, never apologetic ("Lower confidence — we have funding but no voting record").
  - *Ask / refusals* — helpful, candid ("I don't have a record on that — here's what I *do* have").

### 1.3 The non-editorializing rule (load-bearing)

> **The one rule:** never *"this is good/bad."* Always *"this matches / conflicts with what **you** told us — here's the receipt."*

Recommendations are *safe* because they are a **calculation over the user's inputs + cited evidence**, not Procivic's opinion. "Recommended for you: YES (82% aligned, high confidence)" is math, not a value judgment. Always attribute the verdict to *the user's values* and *the record* — never to Procivic.

### 1.4 DO / DON'T copy

| Context | ✅ DO (attribute to user + evidence) | ❌ DON'T (editorialize / spin) |
|---|---|---|
| Recommendation | "Matches what you told us — here's the receipt." | "This candidate is good." |
| Recommendation | "Recommended for you: **YES** · 82% aligned · High confidence." | "You should vote YES." |
| Alignment | "Strongly aligns with your stated values on housing & climate." | "The right choice for housing." |
| Consistency | "Said X, voted Y — here's the roll-call (3 votes)." | "A hypocrite on climate." |
| Funding | "Top donor: Realtors PAC — $24,500 (FEC)." | "Bought by special interests." |
| Confidence | "Lower confidence: funding only, no voting record (labeled)." | "We're not sure, sorry." |
| Conflict (`signal`) | "Conflicts with what you told us on taxes." | "Wrong on taxes." |
| Ask refusal | "I don't have a record on that — here's what I do have." | *(guessing / fabricating an answer)* |
| Data gap | "Data unavailable for this item." | *(silently dropping the item)* |

---

## 2. Color schema — "Civic Daylight"

> 🔒 **Read §3 (the guardrail) before using any color.** Color carries meaning in Procivic, and the meaning is *semantic*, never *partisan*.

Four ramps. `brand` (blue / trust / primary), `accent` (purple / "decoded" / synthesis), `signal` (red / conflict / alert), `neutral` (Tailwind `slate` — surfaces & text). All steps are CSS-variable theme tokens; reference them as Tailwind utilities (`bg-brand-500`, `text-neutral-700`, `ring-brand-500/40`) — **no raw hex in components.**

### 2.1 `brand` — blue · trust · primary

The default action color, links, primary buttons, the "high / strong-alignment" pole of the score scale.

| Step | Hex | Swatch role |
|---|---|---|
| 50  | `#eef4ff` | tint bg (subtle panel / hover wash) |
| 100 | `#dbe7ff` | soft bg / selected row |
| 200 | `#bcd3ff` | border (emphasis) / chip bg |
| 300 | `#8fb6ff` | border / disabled-on-tint |
| 400 | `#5b8eff` | icon accent / chart fill (light) |
| 500 | `#2e7df6` | **primary** — buttons, links, focus ring, brand fill |
| 600 | `#1f63db` | **hover** for 500 (buttons/links) |
| 700 | `#2342b0` | active / pressed; text-on-tint (AA on 50/100) |
| 800 | `#21398c` | strong text on light; dark accents |
| 900 | `#1f3370` | headings on light (high-contrast brand text) |
| 950 | `#161f44` | deepest — dark-surface text / extreme contrast |

**Semantic roles:** text on light → 700/800/900 · primary bg → 500 · hover → 600 · active → 700 · border → 200/300 · tint bg → 50/100 · **focus ring → 500 (at /40 alpha)**.

### 2.2 `accent` — purple · "decoded" · synthesis

The "decoded / synthesis / AI" color. The mid-pole of the score scale, AI-rationale accents, the second stop of the hero gradient, secondary highlights.

| Step | Hex | Swatch role |
|---|---|---|
| 50  | `#f5f3ff` | tint bg (AI / synthesis panel) |
| 100 | `#ede9fe` | soft bg / "decoded" chip bg |
| 200 | `#ddd6fe` | border / chip border |
| 300 | `#c4b5fd` | border / light chart fill |
| 400 | `#a78bfa` | icon accent / chart fill (light) |
| 500 | `#8b5cf6` | **accent fill** — gradient stop, AI badge, mid-score |
| 600 | `#7c3aed` | hover / receipt-gradient start; AA text on 50/100 |
| 700 | `#6d28d9` | active; strong accent text on light |
| 800 | `#5b21b6` | strong text / dark accents |
| 900 | `#4c1d95` | headings (synthesis sections) |
| 950 | `#2e1065` | deepest — dark-surface text |

**Semantic roles:** text on light → 600/700/800 · fill → 500 · hover → 600 · border → 200/300 · tint bg → 50/100 · gradient stop → 500 (decoded) / 600 (receipt).

### 2.3 `signal` — red · conflict · alert ⚠️ (NEVER a party color)

Reserved for **conflict / contradiction / alert** *only* — the low pole of the score scale, the contradiction "receipt," destructive/critical states, validation errors. See §3: this is **never** "Republican," **never** "bad," **never** a party.

| Step | Hex | Swatch role |
|---|---|---|
| 50  | `#fef2f3` | tint bg (alert panel / conflict wash) |
| 100 | `#fde3e5` | soft bg / conflict chip bg |
| 200 | `#fbccd0` | border (alert) / chip border |
| 300 | `#f7a3ab` | border / light chart fill |
| 400 | `#f16f7c` | icon accent / chart fill (light) |
| 500 | `#e63d50` | **signal fill** — conflict marker, low-score, alert icon |
| 600 | `#d12440` | hover / receipt-gradient end; destructive button |
| 700 | `#af1a35` | active; AA conflict text on 50/100 |
| 800 | `#921932` | strong conflict text on light |
| 900 | `#7c1a30` | headings (alert sections) |
| 950 | `#440a16` | deepest — dark-surface text |

**Semantic roles:** text on light → 700/800 (use 700+ for AA on tints) · fill → 500 · hover/destructive → 600 · border → 200/300 · tint bg → 50/100 · gradient stop → 500 (receipt start is `accent-600`).

### 2.4 `neutral` — Tailwind `slate` · surfaces & text

The cool-gray workhorse: page/card surfaces, body text, borders, dividers. Cool slate (not warm gray) keeps the whole UI reading as crisp daylight.

| Step | Hex | Swatch role |
|---|---|---|
| 50  | `#f8fafc` | page background / lightest surface |
| 100 | `#f1f5f9` | subtle surface / hover row / skeleton |
| 200 | `#e2e8f0` | **default border** / divider |
| 300 | `#cbd5e1` | border (emphasis) / disabled fill |
| 400 | `#94a3b8` | placeholder / disabled text / muted icon |
| 500 | `#64748b` | **caption / secondary text** (AA on white) |
| 600 | `#475569` | **body-muted / labels** |
| 700 | `#334155` | **body text** (default copy) |
| 800 | `#1e293b` | strong body / subheads |
| 900 | `#0f172a` | **headings** (primary text) |
| 950 | `#020617` | extreme contrast / near-black |

**Semantic roles:** page bg → 50 · card → white (`#ffffff`) on 50 · border → 200 (default) / 300 (emphasis) · body → 700 · headings → 900 · secondary → 600 · caption → 500 · placeholder/disabled → 400.

---

## 3. ⚠️ CRITICAL guardrail — color is semantic, never partisan

> **Issues are neutral, distance-based axes. Color encodes *relationship to the user's values + the record*, never political identity.**

This is **core to Procivic's non-partisan trust.** Burn it in:

- **`signal` (red) = conflict / contradiction / alert ONLY.** It marks where an item *conflicts with what the user told us*, a *consistency contradiction* (said X, voted Y), or an *error/alert state*. It is **NEVER** "Republican," **NEVER** "bad," **NEVER** a party or a side.
- **`brand` (blue) is NOT "Democrat."** It is the trust/primary color and the *high-alignment* pole of the score scale — i.e. "closely matches **your** values," for *any* candidate or measure of *any* party.
- **`accent` (purple) is NOT "centrist/independent."** It is "decoded / synthesis / AI," and the *mid* pole of the score scale.
- **Party is shown as a neutral text label** (e.g. "Party: D" / "Party: R" in `neutral` text), **never** encoded in `brand`/`signal` color. If a party chip is ever needed, it uses `neutral` tones, not the semantic ramps.
- **Alignment is distance, not endorsement.** A high score means "close to *your* stated values + the record," low means "far." Red on a low score means *"this is far from what **you** told us,"* not *"this is wrong."*

**Litmus test:** if a color choice could be read as "Procivic thinks this party/candidate is good or bad," it's wrong. Color answers *"how does this relate to YOU and the evidence?"* — nothing else.

---

## 4. Score color language (in-palette diverging scale)

One uniform visual language for **every** meter — Confidence, Alignment, Consistency, Transparency — via `ScoreChip` / `ScoreMeter`. A **diverging, in-palette** scale: **`signal` (low) → `accent` (mid) → `brand` (high).** No new hues; the same three semantic ramps do all the work, reinforcing §3 (low = far/conflict, high = aligned/trust).

| Score (0–100) | Band | Token (fill) | Text-on-tint | Reads as |
|---|---|---|---|---|
| **0–39** | Low | `signal-500` | `signal-700` | far from your values / low confidence / inconsistent |
| **40–69** | Mid | `accent-500` | `accent-700` | partial / moderate / mixed evidence |
| **70–100** | High | `brand-500` | `brand-700` | aligns / high confidence / consistent |

- **Meter fills** use the 500 step at the band; **tint backgrounds** use the matching 50/100; **on-tint text** uses 700 (AA — see §7.3).
- **Continuous fills** may interpolate `signal-500 → accent-500 → brand-500` (a smooth diverging gradient) for a meter bar; **chips/badges** snap to the band color above.
- **Confidence buckets** (High ≥70 / Med 40–69 / Low <40) map to the same three colors, so a "High confidence" badge and a "High alignment" meter share one language.
- **Always pair color with text** (the % and the word) — never rely on color alone (a11y + the §3 non-partisan principle).

---

## 5. Gradient + glass recipes

> Defined as theme tokens / utilities; never inline raw hex in a component. Use sparingly — gradients are *moments* (hero, CTA, the receipt), not wallpaper.

### 5.1 Gradients

```css
/* gradient-decoded — the signature. Hero, primary CTA, logo mark, brand moments.
   Blue → purple = "your ballot, decoded." */
--gradient-decoded: linear-gradient(135deg, #2e7df6 0%, #8b5cf6 100%);
/* tokens: brand-500 → accent-500 */

/* gradient-aurora — the page backdrop. Soft, blurred radial blobs of brand + accent
   (+ a faint signal hint) floating on near-white. Calm daylight, never busy. */
--gradient-aurora:
  radial-gradient(40rem 40rem at 12% -10%,  rgba(46,125,246,0.18), transparent 60%),  /* brand-500 */
  radial-gradient(36rem 36rem at 98% 0%,    rgba(139,92,246,0.16), transparent 60%),  /* accent-500 */
  radial-gradient(30rem 30rem at 80% 100%,  rgba(230,61,80,0.06),  transparent 60%),  /* signal-500, faint */
  #f8fafc;                                                                            /* neutral-50 base */
/* Implementation: a fixed/absolute backdrop layer; the blobs are large, low-opacity,
   and heavily soft (large radii do the blurring). Content sits above on white cards. */

/* gradient-receipt — the contradiction "receipt." Purple → red = synthesis meeting conflict.
   Reserved for ContradictionCallout / the consistency receipt. Not a general accent. */
--gradient-receipt: linear-gradient(135deg, #7c3aed 0%, #e63d50 100%);
/* tokens: accent-600 → signal-500 */
```

**Usage rules:** `gradient-decoded` = identity & primary CTA. `gradient-aurora` = page backdrop only (behind content, never on text). `gradient-receipt` = the receipt moment only — its scarcity is what makes it land. Text on a gradient must be white and pass AA (all three gradients are dark enough end-to-end for white text).

### 5.2 Glass (tasteful glassmorphism)

```css
/* Base glass surface — floating panels, sticky headers, the recommendation pill,
   overlays sitting on gradient-aurora. */
.glass {
  background: rgba(255,255,255,0.70);   /* bg-white/70 */
  backdrop-filter: blur(12px);          /* backdrop-blur-md */
  border: 1px solid rgba(255,255,255,0.40); /* border-white/40 */
}
/* Tailwind: bg-white/70 backdrop-blur-md border border-white/40 */
```

Glass is for surfaces that float *over* the aurora backdrop or a gradient — keep it for ~1–2 elements per view (header, a floating CTA/pill). Over plain `neutral-50`, prefer a solid white card. **Always pair glass with a shadow** (below) so it reads as elevated, and ensure text on glass is `neutral-700`+ for AA over the translucent fill.

### 5.3 Elevation / shadow scale (3 steps)

```css
--shadow-sm: 0 1px 2px 0 rgba(15,23,42,0.06),
             0 1px 3px 0 rgba(15,23,42,0.10);   /* cards, inputs, resting */
--shadow-md: 0 4px 12px -2px rgba(15,23,42,0.10),
             0 2px 6px -2px rgba(15,23,42,0.08); /* dropdowns, popovers, hover-lift, glass */
--shadow-lg: 0 16px 40px -8px rgba(15,23,42,0.18),
             0 6px 16px -6px rgba(15,23,42,0.12); /* modals, the funding-graph modal, dialogs */
```

Shadows use `neutral-900` (`#0f172a`) at low alpha — cool, soft, never black. Map: `sm` = resting cards/inputs · `md` = hover & floating glass · `lg` = modals/overlays.

---

## 6. Typography

**Two families, loaded via `next/font`:**

- **Inter** (variable) — the workhorse: all UI, headings, body, labels.
- **JetBrains Mono** (variable, `tabular-nums`) — **reserved for figures only**: $ amounts, %, scores, vote counts, dates-in-tables. Tabular numerals keep meters and tables aligned. Never use mono for prose.

```ts
// next/font (in app/layout.tsx) → CSS variables consumed by Tailwind's font-sans / font-mono
import { Inter, JetBrains_Mono } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
// <html className={`${inter.variable} ${mono.variable}`}> ; body → font-sans
```

### 6.1 Type scale (Inter)

| Token | px / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| **display** | 48 / 52px (1.08) | 800 | −0.02em | landing hero headline |
| **h1** | 36 / 40px (1.11) | 700 | −0.02em | page title (ballot, profile name) |
| **h2** | 28 / 34px (1.21) | 700 | −0.01em | section heading |
| **h3** | 22 / 28px (1.27) | 600 | −0.01em | card / subsection title |
| **body** | 16 / 26px (1.625) | 400 | 0 | default copy, summaries |
| **small** | 14 / 20px (1.43) | 400/500 | 0 | labels, secondary copy, table cells |
| **caption** | 12 / 16px (1.33) | 500 | +0.01em | meta, citations, badge text, timestamps |

- Headings → `neutral-900`; body → `neutral-700`; secondary → `neutral-600`; caption/meta → `neutral-500`.
- Hero `display` may sit on `gradient-decoded` as a text-clip ("decoded" treatment) — keep the rest of the headline solid `neutral-900` for legibility.
- Max line length ~70ch for `body` blocks.

### 6.2 Figures (JetBrains Mono, `tabular-nums`)

| Use | Token | Example |
|---|---|---|
| Money | mono · `small`/`body` · 500 | `$24,500` |
| Percent / score | mono · weight by emphasis | `82%` · `High` |
| Vote tallies / counts | mono · `small` · `tabular-nums` | `47 votes` |
| Roll-call / dates in tables | mono · `caption` | `2025-04-12` · `Roll-call 118` |

Anywhere numbers line up in a column or animate in a meter → mono + `tabular-nums`. Prose numbers ("nearly 40 years") stay in Inter.

---

## 7. Spacing, radius & accessibility

### 7.1 Spacing scale (4px base — Tailwind default)

| Token | px | Typical use |
|---|---|---|
| `1` | 4  | icon-to-label gap, tight chip padding |
| `2` | 8  | inline gaps, badge padding-y |
| `3` | 12 | compact card padding, control padding |
| `4` | 16 | **default** card/section inner padding, stack gap |
| `6` | 24 | card padding (comfortable), gap between cards |
| `8` | 32 | section padding-y |
| `12`| 48 | major section spacing |
| `16`| 64 | page hero / large vertical rhythm |

Generous spacing is part of the brand (calm, daylight). Default to `4`/`6` inside components, `8`/`12` between sections.

### 7.2 Radius scale

| Token | px | Use |
|---|---|---|
| `sm` | 6  | chips, badges, small inputs, `ScoreChip` |
| `md` | 10 | buttons, inputs, `VoteRow` |
| `lg` | 16 | cards, panels, `BallotItemCard`, glass surfaces |
| `xl` | 24 | hero / feature containers, the funding-graph modal |
| `full` | 9999 | pills (`RecommendationPill`, `ConfidenceBadge`), avatars |

Set shadcn's `--radius` to **10px (`md`)** as the base; cards step up to `lg`. Soft-but-not-bubbly = modern + trustworthy.

### 7.3 Accessibility (target: Lighthouse a11y ≥ 90)

- **Always pair color with a label.** Score/confidence/conflict states carry text + (where helpful) an icon — never color alone. (Also serves §3: no color-only meaning.)
- **Contrast (WCAG AA) — verified pairings:**

| Text token | On `white` / `neutral-50` | On its `50` tint | On `100` tint |
|---|---|---|---|
| `neutral-700` (body) | ✅ AA / AAA | ✅ | ✅ |
| `neutral-600` (muted) | ✅ AA | ✅ | ✅ |
| `neutral-500` (caption) | ✅ AA (large/normal ~4.6:1) | ✅ on `neutral-50/100` | ⚠️ verify on colored tints |
| `brand-700` | ✅ AA | ✅ on `brand-50` | ✅ on `brand-100` |
| `accent-700` | ✅ AA | ✅ on `accent-50` | ✅ on `accent-100` |
| `signal-700` | ✅ AA | ✅ on `signal-50` | ✅ on `signal-100` |
| white | ✅ on `*-600`/`*-700` fills & all 3 gradients | — | — |

- **Rule of thumb:** for colored text on a colored tint, use the **700** step on the **50/100** tint (all three semantic ramps pass AA there). Body copy = `neutral-700` on white. White text only on `500`+ fills / gradients.
- **Focus:** visible focus ring on every interactive element — `ring-2 ring-brand-500/40 ring-offset-2`. Never remove outlines without a replacement.
- **Motion:** honor `prefers-reduced-motion` (the aurora blobs, funding-graph animation, meter fills should calm/disable).
- **Targets:** interactive hit area ≥ 40×40px. **Semantics:** real headings order, `alt`/`aria-label` on icon-only buttons, labels on all inputs.
- **Responsive:** layouts hold at **375px and 1280px**; size relative to content/containers — **no hardcoded element sizes** (esp. the funding graph → sizes to its container, degrades to a ranked bar list on small screens).

---

## 8. Logo & icon usage

### 8.1 Logo

| Asset | Path | Use |
|---|---|---|
| Wordmark | `/public/logo-wordmark.svg` | header (left), footer, README, share card — "Procivic" lockup |
| Mark | `/public/logo-mark.svg` | compact contexts, square crops, mobile header, avatar |
| Icon (favicon/PWA) | `/public/icon.svg` | browser tab, app icon, OG fallback |

- **Mark concept:** a ballot-check / decoded glyph carried on `gradient-decoded` (blue→purple) — the "your ballot, decoded" idea in one symbol.
- **Wordmark:** Inter-based; "Procivic" in `neutral-900`; an optional `gradient-decoded` accent on the mark or a single letter. Tagline "your ballot, decoded." sits in `neutral-600` `caption`/`small` when paired.
- **Clear space:** ≥ the mark's cap-height on all sides. **Min size:** wordmark ≥ 96px wide; mark ≥ 24px.
- **Don'ts:** don't recolor into a single party color; don't stretch/skew; don't drop the mark on a busy photo without a glass/solid backing; don't add a drop-shadow to the wordmark.
- **SVG, not raster** — crisp at any size; can inherit `currentColor` for monochrome contexts.

### 8.2 Icons — `lucide-react`

Adopt **`lucide-react`** as the only icon library (consistent stroke, tree-shaken, themeable via `currentColor`). Standardize a **~12-icon civic set** so meaning is consistent across every slice. Default: `1.5` stroke, size to context (16 in chips/`caption`, 20 inline, 24 section headers), color = `currentColor` (inherits the text token — so an icon in `signal-700` text is automatically a conflict-red icon).

| Icon (`lucide-react`) | Intended usage |
|---|---|
| `Vote` | the ballot / a contest / "Your Ballot" home |
| `Scale` | alignment / weighing your values vs. the record |
| `Landmark` | government office / legislature / a candidate's seat |
| `Coins` | funding / money / donor totals (with `FundingGraph`) |
| `FileCheck` | measures / official summary / "what a YES funds" |
| `ShieldCheck` | transparency score / disclosure / trust |
| `Search` | the Ask box / lookup / explore |
| `MessageSquareQuote` | the Ask panel / a grounded Q&A answer |
| `TrendingUp` | a score going up / consistency / trends in a record |
| `Network` | the funding graph / who-funds-whom relationships |
| `BadgeCheck` | verified / high confidence / "passes the gate" |
| `Quote` | a cited statement / `SourceLink` / a stated position (vs. a vote) |

- **Consistency rule:** one concept → one icon, everywhere (e.g. `Coins` is *always* money). New concepts get added here first, not ad-hoc in a component.
- **Icon-only buttons** must carry an `aria-label`. **Never** use an icon's color alone to convey state (§3 / §7.3) — pair with text.
- **Semantic color via `currentColor`:** put the icon inside text of the right token (`text-signal-700` for conflict, `text-brand-700` for primary) rather than hardcoding the SVG fill.

---

*Civic Daylight is locked. Build on it — and when in doubt, ask: "does this read as trustworthy, modern, a touch bold, and strictly non-partisan?"*
