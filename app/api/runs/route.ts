import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  // Explicit columns only — never SELECT *. The `notes` column is free text
  // and could be written with sensitive content by future runs; it is
  // intentionally excluded from this public API.
  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, run_ts, window_start, window_end, sessions_graded, mean_rule_adherence, mean_plan_delivery, mean_composite, total_cost_usd, total_tokens, harness_version, aof_version, trigger_kind, github_run_id"
    )
    .order("run_ts", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: error.message, runs: [] }, { status: 500 });
  }
  return NextResponse.json({ runs: data ?? [] });
}
