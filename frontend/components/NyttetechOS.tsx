"use client";

import { useEffect, useMemo, useState } from "react";
import AppWindow from "./AppWindow";
import TerminalApp from "./TerminalApp";
import SystemApp from "./SystemApp";
import PlcLab from "./PlcLab";
import NetworkApp from "./NetworkApp";
import ReactorApp from "./ReactorApp";
import ArcadeApp from "./ArcadeApp";
import AboutApp from "./AboutApp";

type AppId = "terminal" | "system" | "plc" | "network" | "reactor" | "arcade" | "about";
type WinState = { open: boolean; minimized: boolean; z: number };

const APP_META: Record<AppId, { title: string; icon: string; hint: string; initial: { x: number; y: number; w: number; h: number } }> = {
  terminal: { title: "Python Terminal", icon: ">_", hint: "WebSocket shell", initial: { x: 220, y: 90, w: 650, h: 430 } },
  system: { title: "System Monitor", icon: "▥", hint: "Live telemetry", initial: { x: 270, y: 70, w: 700, h: 500 } },
  plc: { title: "PLC Lab", icon: "⚙", hint: "I/O debugging", initial: { x: 180, y: 65, w: 820, h: 520 } },
  network: { title: "Network Map", icon: "⌁", hint: "Topology", initial: { x: 310, y: 70, w: 720, h: 510 } },
  reactor: { title: "Reactor Core", icon: "◉", hint: "Three.js lab", initial: { x: 200, y: 55, w: 860, h: 540 } },
  arcade: { title: "Factory Meltdown", icon: "▰", hint: "Pygame arcade", initial: { x: 170, y: 45, w: 900, h: 570 } },
  about: { title: "About Nyttetech", icon: "N", hint: "Build info", initial: { x: 340, y: 100, w: 650, h: 430 } },
};

const APP_IDS = Object.keys(APP_META) as AppId[];

function emptyWindows(): Record<AppId, WinState> {
  return Object.fromEntries(APP_IDS.map(id => [id, { open: false, minimized: false, z: 20 }])) as Record<AppId, WinState>;
}

export default function NyttetechOS() {
  const [booting, setBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>(["NYTTETECH BIOS 3.0", "Checking questionable engineering decisions…"]);
  const [windows, setWindows] = useState<Record<AppId, WinState>>(emptyWindows);
  const [topZ, setTopZ] = useState(30);
  const [startOpen, setStartOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [xp, setXp] = useState(0);
  const [visited, setVisited] = useState<AppId[]>([]);
  const [clock, setClock] = useState("");
  const [terminalUnlocked, setTerminalUnlocked] = useState(false);

  useEffect(() => {
    const storedXP = Number(localStorage.getItem("nyttetech-xp") || 0);
    const storedVisited = JSON.parse(localStorage.getItem("nyttetech-visited") || "[]") as AppId[];
    setXp(Number.isFinite(storedXP) ? storedXP : 0);
    setVisited(storedVisited.filter(id => APP_IDS.includes(id)));

    const lines = [
      [350, "Loading React desktop compositor…"],
      [700, "Connecting Python telemetry bus…"],
      [1050, "Mounting /dev/coffee… OK"],
      [1450, "Checking reactor containment… probably fine"],
      [1850, "Starting Nyttetech OS…"],
    ] as const;
    const timers = lines.map(([ms, text]) => window.setTimeout(() => setBootLines(old => [...old, text]), ms));
    const end = window.setTimeout(() => setBooting(false), 2250);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat("da-DK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen(v => !v); setQuery("");
      }
      if (e.key === "Escape") { setPaletteOpen(false); setStartOpen(false); }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  function award(amount: number) {
    setXp(old => {
      const next = old + amount;
      localStorage.setItem("nyttetech-xp", String(next));
      return next;
    });
  }

  function openApp(id: AppId) {
    const z = topZ + 1;
    setTopZ(z);
    setWindows(old => ({ ...old, [id]: { open: true, minimized: false, z } }));
    setStartOpen(false); setPaletteOpen(false);
    if (!visited.includes(id)) {
      const nextVisited = [...visited, id];
      setVisited(nextVisited);
      localStorage.setItem("nyttetech-visited", JSON.stringify(nextVisited));
      award(25);
    }
  }

  function closeApp(id: AppId) {
    setWindows(old => ({ ...old, [id]: { ...old[id], open: false, minimized: false } }));
  }

  function minimizeApp(id: AppId) {
    setWindows(old => ({ ...old, [id]: { ...old[id], minimized: true } }));
  }

  function focusApp(id: AppId) {
    const z = topZ + 1; setTopZ(z);
    setWindows(old => ({ ...old, [id]: { ...old[id], minimized: false, z } }));
  }

  function taskClick(id: AppId) {
    const current = windows[id];
    if (current.minimized) focusApp(id);
    else if (current.z === topZ) minimizeApp(id);
    else focusApp(id);
  }

  function terminalCommand(command: string) {
    const cmd = command.toLowerCase();
    if (cmd === "reactor" && !terminalUnlocked) { setTerminalUnlocked(true); award(50); }
    if (cmd === "scan") award(5);
  }

  const filtered = useMemo(() => APP_IDS.filter(id => {
    const hay = `${APP_META[id].title} ${APP_META[id].hint}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  }), [query]);

  const renderApp = (id: AppId) => {
    switch (id) {
      case "terminal": return <TerminalApp onCommand={terminalCommand} />;
      case "system": return <SystemApp />;
      case "plc": return <PlcLab />;
      case "network": return <NetworkApp />;
      case "reactor": return <ReactorApp />;
      case "arcade": return <ArcadeApp />;
      case "about": return <AboutApp />;
    }
  };

  if (booting) {
    return (
      <main className="boot">
        <div className="boot-card">
          <div className="boot-logo">NYTTE<span>TECH</span></div>
          {bootLines.map((line, i) => <div className="boot-line" key={`${i}-${line}`}>{line}</div>)}
          <div className="boot-progress"><i /></div>
          <button className="boot-skip" type="button" onClick={() => setBooting(false)}>Skip boot</button>
        </div>
      </main>
    );
  }

  return (
    <main className="os-root" onPointerDown={() => startOpen && setStartOpen(false)}>
      <div className="top-status"><span className="online-dot" /> Python backend <span style={{ opacity:.4 }}>•</span> OS 3.0</div>

      <div className="desktop-icons">
        {APP_IDS.map(id => (
          <button className="desktop-icon" type="button" key={id} onDoubleClick={() => openApp(id)} onClick={() => { if (window.matchMedia("(pointer: coarse)").matches) openApp(id); }}>
            <span className="glyph">{APP_META[id].icon}</span><span>{APP_META[id].title}</span>
          </button>
        ))}
      </div>

      {APP_IDS.map(id => {
        const w = windows[id];
        if (!w.open || w.minimized) return null;
        return (
          <AppWindow
            key={id}
            title={APP_META[id].title}
            z={w.z}
            initial={APP_META[id].initial}
            onClose={() => closeApp(id)}
            onMinimize={() => minimizeApp(id)}
            onFocus={() => focusApp(id)}
          >
            {renderApp(id)}
          </AppWindow>
        );
      })}

      {startOpen && (
        <div className="start-menu" onPointerDown={e => e.stopPropagation()}>
          <div className="start-head"><div><strong>Nyttetech OS</strong><br/><small>Engineering playground</small></div><small>lvl {Math.floor(xp / 100) + 1}</small></div>
          <div className="start-grid">
            {APP_IDS.map(id => <button className="start-app" type="button" key={id} onClick={() => openApp(id)}><b>{APP_META[id].icon}</b><span>{APP_META[id].title}</span></button>)}
          </div>
          <div className="start-footer"><span>{visited.length}/{APP_IDS.length} apps explored</span><span>{terminalUnlocked ? "reactor clearance ✓" : "clearance: guest"}</span></div>
        </div>
      )}

      {paletteOpen && (
        <div className="palette-backdrop" onPointerDown={() => setPaletteOpen(false)}>
          <div className="palette" onPointerDown={e => e.stopPropagation()}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Åbn en app…" />
            <div className="palette-results">
              {filtered.map(id => <button type="button" className="palette-item" key={id} onClick={() => openApp(id)}><span>{APP_META[id].icon} &nbsp; {APP_META[id].title}</span><small>{APP_META[id].hint}</small></button>)}
            </div>
          </div>
        </div>
      )}

      <nav className="taskbar" onPointerDown={e => e.stopPropagation()}>
        <button className="start-btn" type="button" onClick={() => setStartOpen(v => !v)} aria-label="Start">N</button>
        <div className="task-apps">
          {APP_IDS.filter(id => windows[id].open).map(id => (
            <button type="button" className={`task-item ${!windows[id].minimized && windows[id].z === topZ ? "active" : ""}`} key={id} onClick={() => taskClick(id)}>{APP_META[id].icon} &nbsp; {APP_META[id].title}</button>
          ))}
        </div>
        <div className="tray"><span className="xp-pill">{xp} XP</span><span className="hide-mobile">Ctrl+K</span><span>{clock}</span></div>
      </nav>
    </main>
  );
}
