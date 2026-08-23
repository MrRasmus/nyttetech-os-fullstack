"use client";

import { useEffect, useMemo, useState } from "react";

type Node = { id: string; label: string; kind: string; x: number; y: number; status: string };
type Network = { nodes: Node[]; links: [string, string][] };

export default function NetworkApp() {
  const [network, setNetwork] = useState<Network | null>(null);
  const [selected, setSelected] = useState<Node | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "/api";
    fetch(`${base.replace(/\/$/, "")}/network`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((data: Network) => setNetwork(data))
      .catch(() => setNetwork({ nodes: [], links: [] }));
  }, []);

  const byId = useMemo(() => new Map(network?.nodes.map(n => [n.id, n]) ?? []), [network]);

  if (!network) return <div className="app-pad"><p className="app-sub">Henter topologi fra Python API…</p></div>;
  if (!network.nodes.length) return <div className="app-pad"><p className="app-sub">Netværks-API kunne ikke nås.</p></div>;

  return (
    <div className="network-wrap">
      <svg className="network-svg" viewBox="0 0 100 100" role="img" aria-label="Nyttetech service topologi">
        {network.links.map(([a, b]) => {
          const from = byId.get(a), to = byId.get(b);
          if (!from || !to) return null;
          return <line key={`${a}-${b}`} className="network-link" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
        })}
        {network.nodes.map(node => (
          <g
            className={`network-node ${node.status}`}
            key={node.id}
            transform={`translate(${node.x} ${node.y})`}
            onClick={() => setSelected(node)}
            style={{ cursor: "pointer" }}
          >
            <circle r="6" />
            <text y="-0.4">{node.kind === "service" ? "▣" : node.kind === "device" ? "◇" : "◎"}</text>
            <text className="sub" y="10">{node.label}</text>
          </g>
        ))}
      </svg>
      {selected && (
        <div style={{ position:"absolute", left:20, bottom:18, padding:"9px 11px", border:"1px solid var(--line)", background:"#0b1119", borderRadius:10, fontSize:12 }}>
          <b>{selected.label}</b> · {selected.kind} · <span style={{ color:selected.status === "online" ? "var(--green)" : "var(--amber)" }}>{selected.status}</span>
        </div>
      )}
    </div>
  );
}
