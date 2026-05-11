import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SMOKIN_OPS_URL!;
const anon = process.env.NEXT_PUBLIC_SMOKIN_OPS_ANON_KEY!;

// Anon client, eval schema, read-only by RLS policy.
export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
  db: { schema: "eval" },
});

export type EvalRun = {
  id: string;
  run_ts: string;
  window_start: string;
  window_end: string;
  sessions_graded: number;
  mean_rule_adherence: number | null;
  mean_plan_delivery: number | null;
  mean_composite: number | null;
  total_cost_usd: number | null;
  total_tokens: number | null;
  harness_version: string;
  aof_version: string;
  trigger_kind: "manual" | "cron" | "backfill";
  github_run_id: string | null;
  notes: string | null;
};

export type EvalSession = {
  id: string;
  run_id: string;
  session_date: string;
  handoff_path: string;
  machine: "mac" | "win" | "unknown";
  rule_adherence_score: number | null;
  plan_delivery_score: number | null;
  session_cost_usd: number | null;
  composite_score: number | null;
  created_at: string;
};
