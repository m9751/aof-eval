import { NextResponse } from "next/server";
import { DPMO_MIN_N } from "@/lib/supabase";
import { DPMO_WINDOWS, fetchRules } from "@/lib/fetchRules";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ruleId = new URL(request.url).searchParams.get("rule_id") ?? undefined;
  const rules = await fetchRules({ ruleId: ruleId ?? undefined });

  return NextResponse.json({
    rules,
    windows: DPMO_WINDOWS,
    min_n: DPMO_MIN_N,
  });
}