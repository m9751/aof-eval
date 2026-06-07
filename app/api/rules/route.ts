import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { DPMO_MIN_N } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SMOKIN_OPS_URL!,
  process.env.NEXT_PUBLIC_SMOKIN_OPS_ANON_KEY!,
  { auth: { persistSession: false }, db: { schema: "eval" } }
);

export async function GET() {
  const now = new Date();
  const windows = [7, 30, 60];

  const [rulesResult, ...windowResults] = await Promise.all([
    supabase
      .from("rules")
      .select(
        "rule_id, rule_name, rule_type, repo, lifecycle_state, load_bearing_rare, denominator_type, provenance_event"
      )
      .eq("lifecycle_state", "active")
      .order("rule_id"),
    ...windows.map((days) => {
      const since = new Date(now.getTime() - days * 86400000)
        .toISOString()
        .slice(0, 10);
      return supabase
        .from("opportunities")
        .select("rule_id")
        .gte("session_date", since);
    }),
  ]);

  if (rulesResult.error) {
    return NextResponse.json({ error: rulesResult.error.message }, { status: 500 });
  }

  // Count opportunities per rule per window
  const counts: Record<string, Record<number, number>> = {};
  windows.forEach((days, idx) => {
    const rows = windowResults[idx].data ?? [];
    for (const row of rows) {
      if (!counts[row.rule_id]) counts[row.rule_id] = {};
      counts[row.rule_id][days] = (counts[row.rule_id][days] ?? 0) + 1;
    }
  });

  const rules = (rulesResult.data ?? []).map((r) => ({
    ...r,
    windows: windows.map((days) => {
      const n = counts[r.rule_id]?.[days] ?? 0;
      return {
        days,
        n,
        suppressed: n < DPMO_MIN_N,
      };
    }),
  }));

  return NextResponse.json({ rules, windows, min_n: DPMO_MIN_N });
}
