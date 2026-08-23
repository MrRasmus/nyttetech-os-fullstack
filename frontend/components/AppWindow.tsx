"use client";

import { PointerEvent, ReactNode, useRef, useState } from "react";

type Props = {
  title: string;
  children: ReactNode;
  z: number;
  initial: { x: number; y: number; w: number; h: number };
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
};

export default function AppWindow({ title, children, z, initial, onClose, onMinimize, onFocus }: Props) {
  const [pos, setPos] = useState({ x: initial.x, y: initial.y });
  const [maximized, setMaximized] = useState(false);
  const drag = useRef<{ pointerId: number; sx: number; sy: number; ox: number; oy: number } | null>(null);

  function pointerDown(e: PointerEvent<HTMLDivElement>) {
    if (maximized || (e.target as HTMLElement).closest("button")) return;
    onFocus();
    drag.current = { pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function pointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const x = Math.max(0, Math.min(window.innerWidth - 120, drag.current.ox + e.clientX - drag.current.sx));
    const y = Math.max(0, Math.min(window.innerHeight - 100, drag.current.oy + e.clientY - drag.current.sy));
    setPos({ x, y });
  }

  function pointerUp(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  }

  return (
    <section
      className={`window ${maximized ? "max" : ""}`}
      style={{ left: pos.x, top: pos.y, width: initial.w, height: initial.h, zIndex: z }}
      onPointerDown={onFocus}
      aria-label={title}
    >
      <div
        className="window-titlebar"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onDoubleClick={() => setMaximized(v => !v)}
      >
        <div className="window-title">{title}</div>
        <div className="window-controls">
          <button type="button" title="Minimer" onClick={onMinimize}>—</button>
          <button type="button" title="Maksimer" onClick={() => setMaximized(v => !v)}>□</button>
          <button type="button" className="close" title="Luk" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="window-body">{children}</div>
    </section>
  );
}
