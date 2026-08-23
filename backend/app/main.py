from __future__ import annotations

import asyncio
import os
import platform
import random
import socket
import time
from datetime import datetime, timezone
from typing import Any

import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

STARTED_AT = time.time()
app = FastAPI(title="Nyttetech OS API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def uptime_seconds() -> int:
    return int(time.time() - STARTED_AT)


def system_snapshot() -> dict[str, Any]:
    vm = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    net = psutil.net_io_counters()
    cpu = psutil.cpu_percent(interval=None)
    return {
        "cpu": round(cpu, 1),
        "memory": round(vm.percent, 1),
        "memory_used_gb": round((vm.total - vm.available) / 1024**3, 2),
        "memory_total_gb": round(vm.total / 1024**3, 2),
        "disk": round(disk.percent, 1),
        "temperature": round(38 + cpu * 0.28 + random.uniform(-1.2, 1.2), 1),
        "rx_mb": round(net.bytes_recv / 1024**2, 1),
        "tx_mb": round(net.bytes_sent / 1024**2, 1),
        "uptime": uptime_seconds(),
        "hostname": socket.gethostname(),
        "platform": platform.system(),
        "python": platform.python_version(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


NETWORK = {
    "nodes": [
        {"id": "wan", "label": "Internet", "kind": "wan", "x": 50, "y": 12, "status": "online"},
        {"id": "router", "label": "Nyttetech Gateway", "kind": "router", "x": 50, "y": 32, "status": "online"},
        {"id": "web", "label": "Web / Next.js", "kind": "service", "x": 23, "y": 58, "status": "online"},
        {"id": "api", "label": "Python API", "kind": "service", "x": 50, "y": 58, "status": "online"},
        {"id": "game", "label": "Pygame WASM", "kind": "service", "x": 77, "y": 58, "status": "online"},
        {"id": "lab", "label": "PLC Lab", "kind": "device", "x": 36, "y": 83, "status": "standby"},
        {"id": "reactor", "label": "Reactor Core", "kind": "device", "x": 64, "y": 83, "status": "unstable"},
    ],
    "links": [
        ["wan", "router"], ["router", "web"], ["router", "api"], ["router", "game"],
        ["api", "lab"], ["api", "reactor"],
    ],
}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/system")
async def api_system() -> dict[str, Any]:
    return system_snapshot()


@app.get("/api/network")
async def api_network() -> dict[str, Any]:
    return NETWORK


@app.websocket("/ws/telemetry")
async def ws_telemetry(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(system_snapshot())
            await asyncio.sleep(1)
    except (WebSocketDisconnect, RuntimeError):
        return


HELP = [
    "help                 show commands",
    "status               live server status",
    "cpu | memory         host telemetry",
    "uptime               API process uptime",
    "network              show service network",
    "scan                  scan Nyttetech subsystems",
    "reactor               reactor diagnostics",
    "whoami                definitely important",
    "date                  UTC timestamp",
    "fortune               questionable engineering wisdom",
    "clear                 clear terminal",
]

FORTUNES = [
    "If it only fails on Fridays, it is still a reproducible fault.",
    "A blinking LED is documentation if you are brave enough.",
    "There are two hard problems: cache invalidation, naming things, and off-by-one errors.",
    "24 V present is a measurement. 'It should be there' is a theory.",
]


async def terminal_command(command: str) -> list[str]:
    raw = command.strip()
    cmd = raw.lower()
    snap = system_snapshot()
    if not cmd:
        return []
    if cmd == "help":
        return HELP
    if cmd == "status":
        return [
            "NYTTETECH OS :: ONLINE",
            f"host={snap['hostname']} platform={snap['platform']} python={snap['python']}",
            f"cpu={snap['cpu']}% mem={snap['memory']}% disk={snap['disk']}% temp≈{snap['temperature']}°C",
        ]
    if cmd == "cpu":
        return [f"CPU load: {snap['cpu']}%", f"Estimated lab temp: {snap['temperature']}°C"]
    if cmd == "memory":
        return [f"RAM: {snap['memory_used_gb']} / {snap['memory_total_gb']} GB ({snap['memory']}%)"]
    if cmd == "uptime":
        return [f"Nyttetech API uptime: {snap['uptime']} seconds"]
    if cmd == "network":
        return ["gateway -> web", "gateway -> python-api", "gateway -> pygame-wasm", "python-api -> plc-lab / reactor"]
    if cmd == "scan":
        return [
            "[OK] websocket bus",
            "[OK] telemetry daemon",
            "[OK] PLC I/O simulator",
            "[OK] Pygame runtime route",
            "[WARN] reactor core claims it is 'probably fine'",
        ]
    if cmd == "reactor":
        return ["core.temp=812K", "containment=93%", "flux=nominal-ish", "recommendation: click fewer glowing buttons"]
    if cmd == "whoami":
        return ["guest@nyttetech", "clearance: unnecessarily high"]
    if cmd == "date":
        return [datetime.now(timezone.utc).isoformat()]
    if cmd == "fortune":
        return [random.choice(FORTUNES)]
    if cmd == "clear":
        return ["__CLEAR__"]
    if cmd in {"sudo", "sudo su", "rm -rf /", "sudo rm -rf /"}:
        return ["Nice try. The terminal is intentionally sandboxed."]
    return [f"command not found: {raw}", "type 'help' for commands"]


@app.websocket("/ws/terminal")
async def ws_terminal(websocket: WebSocket) -> None:
    await websocket.accept()
    await websocket.send_json({"type": "lines", "lines": ["Nyttetech Python terminal connected.", "Type 'help'."]})
    try:
        while True:
            payload = await websocket.receive_json()
            command = str(payload.get("command", ""))
            lines = await terminal_command(command)
            await websocket.send_json({"type": "lines", "lines": lines})
    except (WebSocketDisconnect, RuntimeError):
        return
