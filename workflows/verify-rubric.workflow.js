// Procivic — verification-sweep workflow (the RUBRIC.md gate grader).
//
// Run AFTER a build slice (or before declaring "done"): fans out one adversarial verifier
// per RUBRIC section; each re-fetches the SOURCE + the live URL and grades its gates. This
// is the machine-verifiable "done" the judges reward (RUBRIC K / Orchestration).
//
// Run from Claude Code: ask to run the `verify-rubric` workflow. Scope a single slice by
// passing  args:{ sections:[{id,title,gates}], liveUrl }.

export const meta = {
  name: 'verify-rubric',
  description: 'Fan out one adversarial verifier per RUBRIC.md section against the live URL + sources; return per-gate pass/fail',
  phases: [{ title: 'Verify', detail: 'one verifier agent per RUBRIC section, re-fetching source + live URL' }],
}

const LIVE_URL = (args && args.liveUrl) || 'https://procivic.vercel.app'

// One verifier per RUBRIC section. Override `sections` (via args) to scope to a slice.
const SECTIONS = (args && args.sections) || [
  { id: 'A', title: 'Build & deploy', gates: 'A1-A4' },
  { id: 'B', title: 'Onboarding & personalization', gates: 'B1-B3' },
  { id: 'C', title: 'Ballot coverage', gates: 'C1-C3' },
  { id: 'D', title: 'Candidate education', gates: 'D1-D4' },
  { id: 'E', title: 'Measure explainer', gates: 'E1-E3' },
  { id: 'F', title: 'Data correctness vs source', gates: 'F1-F5' },
  { id: 'G', title: 'Score reproducibility', gates: 'G1-G4' },
  { id: 'H', title: 'AI groundedness', gates: 'H1-H3' },
  { id: 'I', title: 'UI quality', gates: 'I1-I3' },
  { id: 'J', title: 'Demo readiness', gates: 'J1' },
]

const GATE_SCHEMA = {
  type: 'object',
  required: ['section', 'gates'],
  properties: {
    section: { type: 'string' },
    gates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'pass', 'evidence'],
        properties: {
          id: { type: 'string' },
          pass: { type: 'boolean' },
          evidence: { type: 'string' },
        },
      },
    },
  },
}

phase('Verify')
log(`Grading ${SECTIONS.length} RUBRIC sections against ${LIVE_URL}`)

const results = await parallel(
  SECTIONS.map((s) => () =>
    agent(
      `You are an ADVERSARIAL verifier. Read RUBRIC.md and grade ONLY section ${s.id} ("${s.title}", gates ${s.gates}).\n` +
      `Independently fetch BOTH the source (Congress.gov / OpenFEC / OpenStates / DataSF / official summaries — see NOTES.md) AND the live URL ${LIVE_URL}; compare.\n` +
      `Do NOT trust the build or cached values — re-fetch. Respect the OpenStates 500/day + 1/sec cap (sample, don't re-pull everything).\n` +
      `Return one {id, pass, evidence} per gate in the section. Default pass:false when you cannot independently confirm; put the exact mismatch in evidence.`,
      { label: `verify:${s.id}`, phase: 'Verify', schema: GATE_SCHEMA, agentType: 'feature-dev:code-reviewer' },
    ),
  ),
)

const graded = results.filter(Boolean).flatMap((r) => r.gates.map((g) => ({ section: r.section, ...g })))
const failing = graded.filter((g) => !g.pass)
log(`✅ ${graded.length - failing.length}/${graded.length} gates pass · ❌ ${failing.length} failing`)

return {
  passed: failing.length === 0,
  total: graded.length,
  failing: failing.map((g) => `${g.id}: ${g.evidence}`),
}
