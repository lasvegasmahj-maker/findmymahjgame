export const meta = {
  name: 'weekly-checkin',
  description: 'Weekly read-only health check for findmymahjgame: GSC, deploy, sitemap, links, schema, CWV, advertiser funnel, per-state gaps. Emails Shauna, then opens a draft PR of safe non-content fixes.',
  phases: [
    { title: 'Probe', detail: 'parallel read-only health probes' },
    { title: 'Digest', detail: 'synthesize into Healthy / Needs attention / Proposed fixes' },
    { title: 'Notify', detail: 'email the digest to Shauna via Resend' },
    { title: 'DraftFixes', detail: 'open a draft PR with safe, non-content fixes only' },
  ],
}

const REPO = '/Users/shaunabruckman/Projects/findmymahjgame'
const SITE = 'https://findmymahjgame.com'
const RECIPIENT = 'hello@findmymahjgame.com'

// Email always sends (that is the point). Draft PR is created only if safe mechanical
// fixes exist. Content and listing approvals are NEVER auto-applied.
const SEND_EMAIL = true
const OPEN_DRAFT_PR = true

const PROBE_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['healthy', 'needs_attention', 'broken'] },
    findings: { type: 'array', items: { type: 'string' } },
    proposedFixes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          change: { type: 'string' },
          safe: { type: 'boolean', description: 'true only for mechanical non-content fixes (broken href, malformed schema JSON, route conflict, missing alt)' },
        },
        required: ['file', 'change', 'safe'],
      },
    },
  },
  required: ['status', 'findings', 'proposedFixes'],
}

phase('Probe')

const [gsc, deploy, sitemap, links, schema, cwv, funnel, gaps] = await parallel([
  () => agent(
    `Read-only. Pull Google Search Console data for findmymahjgame (sc-domain:findmymahjgame.com or https://findmymahjgame.com). ` +
    `Look for GSC credentials: a service-account JSON or OAuth token referenced in ${REPO}/.env.local or ~/.claude/tokens.env (grep for SEARCH_CONSOLE, GSC, GOOGLE_APPLICATION_CREDENTIALS, gsc). ` +
    `If credentials exist, report last 7 days vs prior 7 days: total clicks, impressions, top 10 queries, coverage/indexing errors, and indexed-page count vs the number of URLs in the sitemap. ` +
    `If NO credentials are configured, set status "needs_attention" and add a finding that GSC is not yet connected (needs a one-time Google service-account setup) so SEO numbers are unavailable. Do not fail the run. Propose no code fixes for this probe.`,
    { label: 'gsc', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Check Vercel deploy health for findmymahjgame. Source ~/.claude/tokens.env for VERCEL_TOKEN. ` +
    `Use the Vercel REST API (https://api.vercel.com/v6/deployments?app=findmymahjgame&limit=5) with Authorization: Bearer $VERCEL_TOKEN. ` +
    `Report latest deployment state (READY/ERROR/BUILDING), its age, and whether recent deploys failed. Change nothing.`,
    { label: 'deploy', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Fetch ${SITE}/sitemap.xml and ${SITE}/robots.txt. Extract every sitemap URL. ` +
    `Fetch homepage, /states, 3 sample /states/[state] pages, /advertise, /advertise/submit, /faq, /privacy and confirm 200. ` +
    `Read ${REPO}/app/sitemap.ts and the ${REPO}/app/states directory listing. Flag any static route under app/states/ that collides with the dynamic [state] route (this previously happened with /states/florida and /states/nevada). ` +
    `Any such conflict is a safe mechanical fix (delete the static duplicate). Report non-200s and conflicts.`,
    { label: 'sitemap', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Crawl ${SITE} (homepage, /states, /advertise, /faq, /how-it-works) plus any advertiser-submitted URLs you can find by reading the listing_submissions table. ` +
    `For listing_submissions: read RESEND/SUPABASE keys from ${REPO}/.env.local (do not print them), query Supabase REST (\${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listing_submissions?select=website,registration_url,logo_url,status) with the service role key, and verify each advertiser URL loads (expect 200). ` +
    `Report broken internal links (a safe fix) and dead external/advertiser links (flag only, do not edit advertiser data).`,
    { label: 'links', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Fetch homepage, /faq, and a sample /states/[state] page. Extract every JSON-LD block. ` +
    `Validate: parseable JSON, required fields for the declared @type (FAQPage needs mainEntity Question/acceptedAnswer; directory/collection schema needs its required fields), no empty or placeholder values. ` +
    `A malformed JSON-LD literal in a source file is a safe mechanical fix. Report breakage with the source file.`,
    { label: 'schema', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Assess Core Web Vitals for ${SITE} homepage and one /states/[state] page. ` +
    `Try \`npx lighthouse ${SITE} --only-categories=performance --output=json --quiet --chrome-flags="--headless"\`. ` +
    `If lighthouse cannot run here, say so and instead flag obvious perf risks in the HTML (oversized images, missing width/height, render-blocking). Do not install global tools.`,
    { label: 'cwv', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only advertiser-funnel health for findmymahjgame.\n` +
    `1) GET ${SITE}/advertise and ${SITE}/advertise/submit must be 200.\n` +
    `2) The POST APIs (/api/advertise-inquiry, /api/advertise-submit) must reject an empty/malformed body with a 4xx JSON error. Send only a malformed probe; do NOT create a real record, do NOT send a real submission.\n` +
    `3) /api/advertise-approve with a missing/garbage token must NOT approve anything (expect redirect to an invalid result). Confirm a forged token is rejected.\n` +
    `4) Query listing_submissions for rows with status='pending' (read keys from ${REPO}/.env.local, do not print them; Supabase REST select=id,display_name,contact_email,created_at,status&status=eq.pending). List how many are stuck pending and the oldest few, so Shauna can approve or reject them. Do NOT approve or reject any listing yourself.\n` +
    `Report funnel health and the pending list.`,
    { label: 'funnel', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
  () => agent(
    `Read-only. Read ${REPO}/lib/states-data.ts. For all 50 states, identify which are "thin": few or no cities, groups, players, events, or instructors in the seed data. ` +
    `Return a short ranked list of the thinnest states so Shauna knows where to add real content. Remember this is seed data, never describe it as real listings. Propose no code fixes.`,
    { label: 'gaps', phase: 'Probe', schema: PROBE_SCHEMA }
  ),
])

phase('Digest')

const sections = { gsc, deploy, sitemap, links, schema, cwv, funnel, gaps }
const anyBroken = Object.values(sections).some((s) => s && s.status === 'broken')
const anyAttention = Object.values(sections).some((s) => s && s.status === 'needs_attention')
const overall = anyBroken || anyAttention ? 'Needs attention' : 'Healthy'

const digest = await agent(
  `Write a concise weekly health digest email for Shauna (non-technical owner of findmymahjgame). ` +
  `Overall status: "${overall}". Plain language, no jargon, no em dashes, no en dashes, no emojis. ` +
  `Three sections: "Healthy" (what is fine), "Needs attention" (problems in plain English with the real-world impact), "Proposed fixes" (only the safe mechanical fixes that will be in the draft PR; list them so she knows what to expect). ` +
  `Call out separately: any listing_submissions stuck pending (she needs to approve/reject those herself), the thinnest states, and whether GSC is connected yet. ` +
  `Probe data as JSON:\n${JSON.stringify(sections, null, 2)}\n` +
  `Return { subject, html }. html: clean simple email, navy #1a1f5e header bar, white body, no external CSS.`,
  { label: 'digest', phase: 'Digest',
    schema: { type: 'object', properties: { subject: { type: 'string' }, html: { type: 'string' } }, required: ['subject', 'html'] } }
)

phase('Notify')

if (SEND_EMAIL) {
  await agent(
    `Send exactly one email via the Resend API. Read RESEND_API_KEY from ${REPO}/.env.local (gitignored, server-side, do not print it). ` +
    `POST https://api.resend.com/emails, Authorization: Bearer <key>, JSON body: ` +
    `{"from":"Find My Mahj Game <hello@findmymahjgame.com>","to":"${RECIPIENT}","subject":${JSON.stringify(digest.subject)},"html":<the html>}. ` +
    `The html:\n${digest.html}\n` +
    `Confirm a 200/202 with an id. Send only one email.`,
    { label: 'send-email', phase: 'Notify' }
  )
}

phase('DraftFixes')

const safeFixes = Object.values(sections)
  .flatMap((s) => (s && s.proposedFixes ? s.proposedFixes : []))
  .filter((f) => f && f.safe)

let prResult = 'skipped (no safe fixes found)'
if (OPEN_DRAFT_PR && safeFixes.length > 0) {
  prResult = await agent(
    `Open a DRAFT pull request on findmymahjgame (${REPO}) containing ONLY these safe, non-content mechanical fixes:\n` +
    `${JSON.stringify(safeFixes, null, 2)}\n\n` +
    `Rules:\n` +
    `- Create a new branch named weekly-checkin-fixes-$(date +%Y%m%d). Never commit to main.\n` +
    `- Apply ONLY the mechanical fixes above (broken internal hrefs, malformed schema JSON, delete static/dynamic route-conflict duplicates, missing alt/dimensions). Do NOT change marketing copy, mahjong content, pricing, or any advertiser data. Do NOT approve or reject any listing.\n` +
    `- Follow the repo CLAUDE.md hard rules: no em dashes, no emojis, no gratuitous comments.\n` +
    `- Run \`npx tsc --noEmit\` and confirm it is clean BEFORE committing. If it does not pass, do not commit; report what failed.\n` +
    `- Commit, push the branch, and open the PR as a DRAFT with \`gh pr create --draft\`. Title: "Weekly check-in: safe automated fixes". Body: list each fix and note it is auto-generated and awaiting Shauna's review.\n` +
    `Return the PR URL, or an explanation if you stopped (e.g. tsc failed).`,
    { label: 'draft-pr', phase: 'DraftFixes' }
  )
}

log(`Weekly check-in complete. Overall: ${overall}. Safe fixes: ${safeFixes.length}. PR: ${typeof prResult === 'string' ? prResult : 'opened'}`)

return { overall, sections, digest, emailed: SEND_EMAIL, safeFixes, prResult }
