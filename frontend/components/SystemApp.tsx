"use client";

import { useEffect, useMemo, useState } from "react";

type Telemetry = {
  cpu: number; memory: number; disk: number; temperature: number;
  memory_used_gb: number; memory_total_gb: number; uptime: number;
  hostname: string; platform: string; python: string;
};

function wsUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_WS_BASE?.replace(/\/$/, "");
  if (configured) return `${configured}${path}`;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

function fmtUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function SystemApp() {
  const [data, setData] = useState<Telemetry | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(wsUrl("/ws/telemetry"));
    ws.onopen = () => setOnline(true);
    ws.onclose = () => setOnline(false);
    ws.onmessage = event => {
      const next = JSON.parse(event.data) as Telemetry;
      setData(next);
      setHistory(old => [...old, next.cpu].slice(-48));
    };
    return () => ws.close();
  }, []);

  const points = useMemo(() => {
    if (!history.length) return "";
    return history.map((v, i) => `${(i / Math.max(1, history.length - 1)) * 100},${96 - v * .9}`).join(" ");
  }, [history]);

  if (!data) return <div className="app-pad"><p className="app-sub">Forbinder til Python telemetry…</p></div>;

  const metrics = [
    ["CPU", `${data.cpu}%`, data.cpu],
    ["RAM", `${data.memory}%`, data.memory],
    ["Disk", `${data.disk}%`, data.disk],
    ["Lab temp", `${data.temperature}°C`, Math.min(100, data.temperature)],
  ] as const;

  return (
    <div className="app-pad">
      <h2 className="app-title">System telemetry <span style={{ color: online ? "var(--green)" : "var(--red)", fontSize: 12 }}>●</span></h2>
      <p className="app-sub">Live målinger fra FastAPI-containeren via WebSocket.</p>
      <div className="card-grid">
        {metrics.map(([label, value, pct]) => (
          <div className="metric" key={label}>
            <label>{label}</label><strong>{value}</strong>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        ))}
      </div>
      <svg className="chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="CPU historik">
        <polyline points={points} fill="none" stroke="var(--cyan)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="card-grid" style={{ marginTop: 10 }}>
        <div className="metric"><label>Host</label><strong style={{ fontSize: 15 }}>{data.hostname}</strong></div>
        <div className="metric"><label>Runtime</label><strong style={{ fontSize: 15 }}>{data.platform} / Py {data.python}</strong></div>
        <div className="metric"><label>API uptime</label><strong style={{ fontSize: 15 }}>{fmtUptime(data.uptime)}</strong></div>
        <div className="metric"><label>RAM used</label><strong style={{ fontSize: 15 }}>{data.memory_used_gb} / {data.memory_total_gb} GB</strong></div>
      </div>
    </div>
  );
}
