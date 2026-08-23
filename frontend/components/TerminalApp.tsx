"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

type Line = { text: string; kind?: "prompt" | "system" };

function wsUrl(path: string) {
  const configured = process.env.NEXT_PUBLIC_WS_BASE?.replace(/\/$/, "");
  if (configured) return `${configured}${path}`;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export default function TerminalApp({ onCommand }: { onCommand?: (command: string) => void }) {
  const [lines, setLines] = useState<Line[]>([{ text: "Connecting to Python backend…", kind: "system" }]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const socket = useRef<WebSocket | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ws = new WebSocket(wsUrl("/ws/terminal"));
    socket.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setLines(old => [...old, { text: "[connection closed]", kind: "system" }]);
    };
    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data) as { lines?: string[] };
        if (!data.lines) return;
        if (data.lines.includes("__CLEAR__")) setLines([]);
        else setLines(old => [...old, ...data.lines!.map(text => ({ text }))]);
      } catch {
        setLines(old => [...old, { text: String(event.data) }]);
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [lines]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;
    setLines(old => [...old, { text: `guest@nyttetech:~$ ${command}`, kind: "prompt" }]);
    setHistory(old => [command, ...old].slice(0, 50));
    setHistoryIndex(-1);
    socket.current?.send(JSON.stringify({ command }));
    onCommand?.(command);
    setInput("");
  }

  function keyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const next = e.key === "ArrowUp"
      ? Math.min(history.length - 1, historyIndex + 1)
      : Math.max(-1, historyIndex - 1);
    setHistoryIndex(next);
    setInput(next === -1 ? "" : history[next] ?? "");
  }

  return (
    <div className="terminal">
      <div className="term-lines" ref={scroller} aria-live="polite">
        {lines.map((line, i) => <div key={`${i}-${line.text}`} className={`term-row ${line.kind ?? ""}`}>{line.text}</div>)}
      </div>
      <form className="term-input-row" onSubmit={submit}>
        <span>{connected ? "●" : "○"}</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={keyDown}
          aria-label="Terminalkommando"
          placeholder={connected ? "help" : "backend offline"}
          disabled={!connected}
          autoComplete="off"
        />
      </form>
    </div>
  );
}
