# STATUS — aof-eval

**Current state:** Live and serving at https://aof-eval.vercel.app/. Reads smokin-ops `eval` schema
(read-only, anon key), renders rule-adherence / plan-gap / cost / composite trends. Vercel auto-deploy on push to main.

## Open items
- None blocking. Harness is manual-trigger (no cron, by operator preference).

## Scope decisions (declined audit items)
- **No `spec/` tree.** PRM-CDXP-002 flags missing `spec/README.md`/`spec/lessons.md` as P1, but that is the
  docs-INDEX pattern (smokin-os/smokin-knowledge). This is a thin Next.js app, not a docs index — it has no
  specs to index. Adding empty spec/ folders would be the empty-ceremony the auditor exists to prevent
  (scope-discipline Gate 1). Declined deliberately.
