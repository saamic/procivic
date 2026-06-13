// Procivic — ballot-tailored issue set for the June 2, 2026 SF (CA-11) ballot.
//
// Derived BOTTOM-UP from the actual ballot so every issue maps to >=1 real item
// (DESIGN.md §9, §16). Each issue is a NEUTRAL axis in [-1, +1]; the pole labels are
// descriptive coordinates, NOT value judgments — alignment is distance-based, so which
// pole is "left/right" is irrelevant to the math (DESIGN.md §8.1).
//
// `mapsTo` documents which ballot item(s) each issue informs — this is the "efficient
// elicitation" guarantee: we don't ask about anything that can't move a recommendation.

export type IssueId =
  | 'housing'
  | 'homelessness_safety'
  | 'business_tax'
  | 'inequality_labor'
  | 'city_fiscal'
  | 'govt_reform'
  | 'climate'
  | 'healthcare'
  | 'immigration'
  | 'civil_democracy';

export interface Issue {
  id: IssueId;
  label: string;
  /** Shown in the quiz. */
  question: string;
  /** The -1 end of the axis. */
  poleNeg: string;
  /** The +1 end of the axis. */
  polePos: string;
  /** Ballot items this issue helps decide (for the quiz's "why we're asking"). */
  mapsTo: string[];
}

export const ISSUES: Issue[] = [
  {
    id: 'housing',
    label: 'Housing & development',
    question: 'How should the city and region handle housing and new development?',
    poleNeg: 'Protect existing neighborhoods; slow or limit new development',
    polePos: 'Build much more housing, including dense and market-rate',
    mapsTo: ['US House CA-11 (Wiener vs. Chan)', 'Supervisor races', 'Governor'],
  },
  {
    id: 'homelessness_safety',
    label: 'Homelessness & public safety',
    question: 'What is the right approach to homelessness and public safety?',
    poleNeg: 'Services-first; less policing and incarceration',
    polePos: 'More enforcement, policing, and mandated treatment',
    mapsTo: ['Supervisor races', 'US House CA-11'],
  },
  {
    id: 'business_tax',
    label: 'Business taxes & regulation',
    question: 'How should government tax and regulate business?',
    poleNeg: 'Lower business taxes and regulation to spur growth',
    polePos: 'Higher taxes on large business; more regulation',
    mapsTo: ['Prop C (small-business tax cuts)', 'Prop D (business/CEO tax)', 'Governor'],
  },
  {
    id: 'inequality_labor',
    label: 'Economic inequality & workers',
    question: 'How far should government go to reduce inequality and protect workers?',
    poleNeg: 'Limit intervention; rely on markets',
    polePos: 'Actively redistribute; strong labor and worker protections',
    mapsTo: ['Prop D (overpaid-CEO tax)', 'US House CA-11'],
  },
  {
    id: 'city_fiscal',
    label: 'City spending, debt & big projects',
    question: 'How willing should government be to borrow and spend on big public projects?',
    poleNeg: 'Fiscal restraint; minimize new debt and bonds',
    polePos: 'Borrow and invest in major public infrastructure',
    mapsTo: ['Prop A (earthquake-safety bond)', 'Governor'],
  },
  {
    id: 'govt_reform',
    label: 'Government reform & accountability',
    question: 'How much should we change government rules to increase accountability?',
    poleNeg: 'Keep current structures and let voters decide via elections',
    polePos: 'Strong structural reforms — term limits, transparency, accountability',
    mapsTo: ['Prop B (lifetime term limits)'],
  },
  {
    id: 'climate',
    label: 'Climate & environment',
    question: 'How aggressive should climate and environmental policy be?',
    poleNeg: 'Prioritize affordability and cost over climate mandates',
    polePos: 'Aggressive climate action even at higher near-term cost',
    mapsTo: ['US House CA-11', 'Governor'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    question: 'What role should government play in healthcare?',
    poleNeg: 'Market-based; limited government role',
    polePos: 'Government-guaranteed coverage (e.g., single-payer)',
    mapsTo: ['US House CA-11', 'Governor'],
  },
  {
    id: 'immigration',
    label: 'Immigration',
    question: 'What is your stance on immigration policy?',
    poleNeg: 'Tighter enforcement and lower limits',
    polePos: 'More open and pro-immigrant; sanctuary protections',
    mapsTo: ['US House CA-11'],
  },
  {
    id: 'civil_democracy',
    label: 'Civil liberties, tech & democracy',
    question: 'How should we balance security, technology, and civil liberties?',
    poleNeg: 'Prioritize order/security; lighter tech regulation',
    polePos: 'Strong civil-liberties protections; rein in surveillance and big tech',
    mapsTo: ['US House CA-11'],
  },
];

export const ISSUE_IDS: IssueId[] = ISSUES.map((i) => i.id);
