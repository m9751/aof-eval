"use client";

import { track } from "@vercel/analytics";

export function SourceLinks() {
  return (
    <footer className="text-xs text-slate-500 border-t border-slate-200 pt-4">
      Data live from{" "}
      <a
        href="https://github.com/m9751/smokin-ops"
        className="underline hover:text-slate-700"
        onClick={() => track("source_click", { target: "smokin-ops" })}
      >
        smokin-ops eval schema
      </a>
      . Harness source:{" "}
      <a
        href="https://github.com/m9751/agent-operating-framework/tree/aof-eval-harness-v1/examples/evals"
        className="underline hover:text-slate-700"
        onClick={() => track("source_click", { target: "aof-harness" })}
      >
        agent-operating-framework / examples/evals
      </a>
      .
    </footer>
  );
}
