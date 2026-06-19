# AGENTS.md — aof-eval

> Authority hierarchy: this file is the routing entry point for any agent working in this repo.
> Read this first. For deeper Claude-specific guidance see `CLAUDE.md`.

## What this is
Public-facing **Next.js (App Router)** dashboard for the Agent Operating Framework self-eval harness.
Live at https://aof-eval.vercel.app/. Reads the `eval` schema of the **smokin-ops** Supabase project via
PostgREST and renders rule-adherence, plan-delivery gap, cost, and composite scores.

## Primary task
Render the AOF self-eval scores publicly and safely. Most edits are dashboard UI (`app/`, `components/`)
or read-only data shaping (`lib/`, `app/api/`). The job is presentation + public-safety, never data mutation.

## NEVER (this repo)
- NEVER add the Supabase **service-role key** here — anon key only (it is public-by-design).
- NEVER add a write path to Supabase — this repo is read-only on the `eval` schema.
- NEVER add a new public `/api/*` surface, column, or `SELECT *` without an RLS/grant review (hard rule #1).
- NEVER add `"use client"` to a file importing `lib/supabase.ts` — it bundles the anon key into public JS.

## Git workflow
Branch + PR for every change (no direct push to `main`). `main` is protected (force-push + deletion blocked).
Vercel auto-deploys `main` on merge — a bad merge ships publicly, so the PR is the gate.

## Topics covered
- Next.js App Router dashboard (`app/`), shared UI (`components/`), data access (`lib/`)
- Supabase read-only access to the `eval` schema (anon key; structural RLS blocks on sibling schemas)
- Vercel deployment (Analytics + Speed Insights + custom footer events)

## Routing — where things live
| Concern | Path |
|---|---|
| Routes + API handlers | `app/` (incl. `app/api/sessions`, `app/api/runs`) |
| Shared components | `components/` |
| Supabase client + queries | `lib/` |
| Build / migration helpers | `scripts/` |
| Tests | `tests/` |
| Framework source of truth | https://github.com/m9751/agent-operating-framework |

## Hard rules (this repo)
1. **No new public data surface without a structural block review.** `/api/*` must never expose filenames,
   paths, or free-text `notes`. New columns/endpoints require confirming the RLS/grant posture first.
2. **Language rules:** TypeScript + Next.js App Router — params/searchParams are Promises (await/`use()`);
   Server Components by default; Server Actions need `"use server"` + in-body auth.
3. **Secrets via env only** — the Supabase anon key is the only credential and is public-by-design;
   never add a service-role key to this repo.

## Reviewers
- `.ts`/`.tsx` → `typescript-reviewer` (language) + `nextjs-reviewer` (framework) — run both.
