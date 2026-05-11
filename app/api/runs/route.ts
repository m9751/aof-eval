import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

export async function GET() {
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("run_ts", { ascending: false })
    .limit(20);
  if (error) {
    return NextResponse.json({ error: error.message, runs: [] }, { status: 500 });
  }
  return NextResponse.json({ runs: data ?? [] });
}
