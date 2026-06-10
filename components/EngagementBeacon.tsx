"use client";

import { useEffect } from "react";

const PID = "aof-eval";
const BEACON = "https://smokin-territory.vercel.app/api/beacon";

function send(eventType: string, fields?: Record<string, unknown>) {
  const meta = ((fields?.metadata as Record<string, unknown>) ?? {}) as Record<string, unknown>;
  const payload = {
    proposal_id: PID,
    session_id: getSessionId(),
    event_type: eventType,
    referrer: getRef(),
    slide_number: (fields?.slide_number as number) ?? 0,
    slide_title: (fields?.slide_title as string) ?? null,
    duration_seconds: (fields?.duration_seconds as number) ?? null,
    metadata: meta,
  };
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(BEACON, new Blob([body], { type: "text/plain;charset=UTF-8" }));
    } else {
      fetch(BEACON, { method: "POST", body, headers: { "Content-Type": "text/plain;charset=UTF-8" }, keepalive: true });
    }
  } catch (_) {}
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("st_sid");
  if (!sid) {
    sid = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("st_sid", sid);
  }
  return sid;
}

function getRef(): string {
  return new URLSearchParams(window.location.search).get("ref") || document.referrer || "";
}

function isReturnVisit(): { isReturn: boolean; visitNumber: number } {
  const key = "st_beacon_" + PID;
  let prior: { last_ts?: number; visit_count?: number } | null = null;
  try { prior = JSON.parse(localStorage.getItem(key) ?? "null"); } catch (_) {}
  let visitNumber = 1;
  let isReturn = false;
  if (prior?.last_ts) {
    const hoursSince = (Date.now() - prior.last_ts) / 3600000;
    if (hoursSince > 1) { isReturn = true; visitNumber = (prior.visit_count ?? 1) + 1; }
  }
  try {
    localStorage.setItem(key, JSON.stringify({ last_ts: Date.now(), visit_count: visitNumber }));
  } catch (_) {}
  return { isReturn, visitNumber };
}

export function EngagementBeacon() {
  useEffect(() => {
    const openedKey = "st_opened_" + PID;
    const { isReturn, visitNumber } = isReturnVisit();

    // Return visit event
    if (isReturn && !sessionStorage.getItem(openedKey + "_return")) {
      sessionStorage.setItem(openedKey + "_return", "1");
      send("return_visit", { metadata: { visit_number: visitNumber } });
    }

    // Page opened (once per session)
    if (!sessionStorage.getItem(openedKey)) {
      sessionStorage.setItem(openedKey, "1");
      send("proposal_opened", {
        metadata: {
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          is_return_visit: isReturn,
        },
      });
    }

    // Scroll depth sentinels
    const depthFired: Record<number, boolean> = {};
    const sentinels: HTMLElement[] = [];
    const observers: IntersectionObserver[] = [];

    function createSentinels() {
      [25, 50, 75, 100].forEach((pct) => {
        const el = document.createElement("div");
        el.style.cssText = "position:absolute;left:0;width:1px;height:1px;pointer-events:none;";
        if (!document.body.style.position) document.body.style.position = "relative";
        document.body.appendChild(el);
        sentinels.push(el);

        function position() {
          const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          el.style.top = Math.round(h * pct / 100) + "px";
        }
        position();
        window.addEventListener("resize", position);

        const obs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && !depthFired[pct]) {
            depthFired[pct] = true;
            send("scroll_depth", { metadata: { depth_pct: pct } });
          }
        }, { threshold: 0 });
        obs.observe(el);
        observers.push(obs);
      });
    }

    if (document.readyState === "complete") createSentinels();
    else window.addEventListener("load", createSentinels);

    // Session summary on exit
    const sessionStart = Date.now();
    let summarySent = false;
    function sendSummary() {
      if (summarySent) return;
      summarySent = true;
      const totalSecs = Math.round((Date.now() - sessionStart) / 1000);
      send("session_summary", { duration_seconds: totalSecs, metadata: { page: "aof-eval-dashboard" } });
    }
    window.addEventListener("pagehide", sendSummary);
    window.addEventListener("beforeunload", sendSummary);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendSummary();
    });

    return () => {
      observers.forEach((o) => o.disconnect());
      sentinels.forEach((s) => s.remove());
      window.removeEventListener("pagehide", sendSummary);
      window.removeEventListener("beforeunload", sendSummary);
    };
  }, []);

  return null;
}
