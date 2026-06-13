// Procivic — the four SF measures on the June 2, 2026 ballot, with their YES-position
// per issue. This is the "issue -> measure" tagging (DESIGN.md §8.1): for each measure we
// encode the direction a YES vote moves on each relevant issue axis, so alignment can tell
// a user whether YES or NO fits their values.
//
// Funding (who's for/against) is fetched at ingest from DataSF (NOTES.md): committees are
// matched to a measure by NAME, so `committeeNameHints` seeds that curated lookup.

import type { IssueId } from './issues';

export interface MeasurePosition {
  issue: IssueId;
  /** Direction a YES vote moves this issue axis. */
  yesDirection: -1 | 1;
  /** How strongly this measure loads on the issue (0..1). */
  weight: number;
  rationale: string;
}

export interface MeasureDef {
  code: string; // ballot letter, e.g. "A"
  slug: string;
  shortTitle: string;
  subject: string;
  /** What a YES vote means, per issue. */
  yesPositions: MeasurePosition[];
  /** Name fragments used to match for/against committees in DataSF (verified in NOTES.md). */
  committeeNameHints: { support: string[]; oppose: string[] };
}

export const MEASURES: MeasureDef[] = [
  {
    code: 'A',
    slug: 'prop-a-earthquake-bond',
    shortTitle: 'Earthquake Safety Bond',
    subject: 'General-obligation bond for earthquake, fire, and disaster preparedness.',
    yesPositions: [
      {
        issue: 'city_fiscal',
        yesDirection: 1,
        weight: 1.0,
        rationale: 'YES authorizes new city debt (a bond) to fund major public-safety infrastructure.',
      },
    ],
    committeeNameHints: {
      support: ['Yes on A', 'Earthquake', 'Fire, Earthquake, and Disaster', 'Firefighters'],
      oppose: ['No on A'],
    },
  },
  {
    code: 'B',
    slug: 'prop-b-term-limits',
    shortTitle: 'Lifetime Term Limits',
    subject: 'Imposes lifetime term limits on the office.',
    yesPositions: [
      {
        issue: 'govt_reform',
        yesDirection: 1,
        weight: 1.0,
        rationale: 'YES adds stricter term limits — a structural accountability reform.',
      },
    ],
    committeeNameHints: {
      support: ['Yes on B', 'Term Limits', 'Coalition for Effective Term Limits'],
      oppose: ['No on B'],
    },
  },
  {
    code: 'C',
    slug: 'prop-c-small-business-tax-cuts',
    shortTitle: 'Small-Business Tax Cuts',
    subject: 'Cuts taxes/fees on small businesses.',
    yesPositions: [
      {
        issue: 'business_tax',
        yesDirection: -1,
        weight: 1.0,
        rationale: 'YES lowers business taxes — the lower-tax end of the axis.',
      },
    ],
    committeeNameHints: {
      support: ['Yes on C', "Protect San Francisco's Small Businesses"],
      oppose: ['No on C'],
    },
  },
  {
    code: 'D',
    slug: 'prop-d-business-tax',
    shortTitle: 'Business / "Overpaid CEO" Tax',
    subject: "Raises the top executive-pay tax on large businesses whose top manager earns >100x the median employee.",
    yesPositions: [
      {
        issue: 'business_tax',
        yesDirection: 1,
        weight: 0.7,
        rationale: 'YES raises taxes on large business — the higher-tax end of the axis.',
      },
      {
        issue: 'inequality_labor',
        yesDirection: 1,
        weight: 1.0,
        rationale: 'YES targets CEO-to-worker pay inequality directly.',
      },
    ],
    committeeNameHints: {
      // Note: a single committee can span measures (e.g. "Yes on C, No on D").
      support: ['Yes on D'],
      oppose: ['No on D', "Municipal Executives' PAC", 'Stop the'],
    },
  },
];
