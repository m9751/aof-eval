"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Row = { session_date: string; rule_adherence_score: number | null };

export function RuleAdherenceChart({ sessions }: { sessions: Row[] }) {
  // Reverse so chart reads left-to-right oldest→newest
  const data = [...sessions]
    .filter((s) => s.rule_adherence_score !== null)
    .reverse();
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No graded sessions yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="session_date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="rule_adherence_score"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
