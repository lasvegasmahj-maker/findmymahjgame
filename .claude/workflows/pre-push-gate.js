export const meta = {
  name: 'pre-push-gate',
  description: 'Typecheck + Technical and Brand review of the current diff before pushing findmymahjgame to main',
  phases: [
    { title: 'Typecheck', detail: 'npx tsc --noEmit must be clean' },
    { title: 'Review', detail: 'Technical and Brand reviewers run in parallel on the diff' },
  ],
}

const REPO = '/Users/shaunabruckman/Projects/findmymahjgame'

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'warning', 'nit'] },
          file: { type: 'string' },
          issue: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'file', 'issue', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

phase('Typecheck')

const typecheck = await agent(
  `In ${REPO}, run \`npx tsc --noEmit\` and report the exact result. ` +
  `Return clean=true only if there are zero type errors. Put the raw error output (if any) in errors.`,
  {
    label: 'typecheck',
    schema: {
      type: 'object',
      properties: { clean: { type: 'boolean' }, errors: { type: 'string' } },
      required: ['clean', 'errors'],
    },
  }
)

phase('Review')

const diffInstr =
  `You are reviewing uncommitted and unpushed changes in ${REPO}. ` +
  `First run \`git diff main\` and \`git status\` (also \`git diff\` for unstaged) to see exactly what changed. ` +
  `Review ONLY the changed lines and their direct blast radius, not the whole repo.`

const [technical, brand] = await parallel([
  () =>
    agent(
      `${diffInstr}\n\n` +
      `You are the TECHNICAL reviewer. Check for:\n` +
      `- Type errors, regressions, runtime risk (null derefs, unhandled promise, bad await).\n` +
      `- API routes: input validation present, rate limiting present, no stack traces leaked to client, JSON errors only.\n` +
      `- Supabase: any new table or query that needs RLS; service-role key used server-side only.\n` +
      `- The HMAC approve/reject flow if touched: timing-safe compare, expiry enforced, no replay, reject path safe.\n` +
      `- Secrets: SUPABASE_SERVICE_ROLE_KEY and HMAC_SECRET never imported into a "use client" file or a NEXT_PUBLIC_ var.\n` +
      `- Hard rules from CLAUDE.md: no code comments unless why is non-obvious, no dead imports.\n` +
      `Mark anything that could break prod or leak data as severity "blocker". Return structured findings.`,
      { label: 'technical', phase: 'Review', schema: REVIEW_SCHEMA }
    ),
  () =>
    agent(
      `${diffInstr}\n\n` +
      `You are the BRAND and CONTENT reviewer. Check for:\n` +
      `- No em dashes or en dashes anywhere in changed copy (use commas, periods, parentheses). This is a blocker.\n` +
      `- Active voice, plain language, no emojis unless the change is explicitly about emojis.\n` +
      `- Design system: colors (--navy #1a1f5e, --pink #e91e8c, --green #2ec95c, --gold #f5c842), Playfair Display headings, DM Sans body, existing .form-* and .btn-* classes reused (no ad-hoc gray dropdowns).\n` +
      `- Mobile: any new layout works at narrow width (grid collapses, no fixed widths that overflow).\n` +
      `- Mahjong fact accuracy against CLAUDE.md hard rules (152 tiles, dragons Red=Crak/Green=Bam/White=Soap, flowers interchangeable, card releases every spring, 13 tiles except East=14, set sizes as numbers not letter codes, open vs closed hands).\n` +
      `- Data honesty: nothing presents lib/states-data.ts seed data as real listings or real counts.\n` +
      `- Any new external link must be verified live (expect 200); flag unverified advertiser URLs.\n` +
      `Mark a shipped mahjong factual error or an em dash in user-facing copy as severity "blocker". Return structured findings.`,
      { label: 'brand', phase: 'Review', schema: REVIEW_SCHEMA }
    ),
])

const all = [...technical.findings, ...brand.findings]
const blockers = all.filter((f) => f.severity === 'blocker')
const verdict = typecheck.clean && blockers.length === 0 ? 'PASS' : 'FAIL'

log(`Gate verdict: ${verdict} (typecheck ${typecheck.clean ? 'clean' : 'FAILED'}, ${blockers.length} blockers, ${all.length} total findings)`)

return { verdict, typecheck, blockers, technical, brand }
