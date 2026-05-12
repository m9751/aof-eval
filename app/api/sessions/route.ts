import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  // Explicit columns only — never SELECT *. The `handoff_path` column was
  // intentionally removed because it exposed local filesystem paths and
  // account-identifying filenames on this public endpoint.
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, run_id, session_date, machine, rule_adherence_score, plan_delivery_score, session_cost_usd, composite_score, created_at"
    )
    .gte("session_date", since)
    .order("session_date", { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: error.message, sessions: [] },
      { status: 500 }
    );
  }
  return NextResponse.json({ sessions: data ?? [] });
}
