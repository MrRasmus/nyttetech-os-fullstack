# Nyttetech OS 3.0 — full stack

Dette er ikke en samling statiske HTML-sider. Projektet består af:

- **Next.js 16 + React 19 + TypeScript** frontend
- **Three.js / React Three Fiber** til Reactor Core 3D-lab
- **Python + FastAPI** backend
- **WebSockets** til live systemtelemetry og terminal
- **Python/Pygame** spillet `Factory Meltdown`
- **Pygbag/WebAssembly** til at køre Pygame i browseren
- **Docker Compose** til deployment
- **Caddy** som intern reverse proxy

## Apps i Nyttetech OS

- Python Terminal — kommandoer håndteres server-side af FastAPI
- System Monitor — faktiske CPU/RAM/disk/uptime data fra Python-containeren
- PLC Lab — interaktiv I/O-/ladder-fejlfinding med injicerede fejl
- Network Map — topologi hentet fra backend API
- Reactor Core — interaktiv Three.js/WebGL simulator
- Factory Meltdown — rigtigt Python/Pygame-spil i browseren
- About — build-info

Desktoppen har bootsekvens, Start-menu, taskbar, XP, app discovery, flytbare/minimerbare/maksimerbare vinduer og Ctrl+K command palette.

## Hurtigste deployment på VPS

Forudsætning: Docker + Docker Compose.

```bash
unzip nyttetech-os-fullstack.zip
cd nyttetech-os-fullstack
docker compose up -d --build
```

Projektets interne edge lytter derefter på:

```text
http://127.0.0.1:8080
```

Hvis du allerede har Caddy på hosten, kan dit eksisterende site pege på den:

```caddy
nyttetech.dk {
    reverse_proxy 127.0.0.1:8080
}
```

Derefter:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Struktur

```text
nyttetech-os-fullstack/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/main.py
│   ├── Dockerfile
│   └── requirements.txt
├── games/
│   └── factory-meltdown/
│       ├── main.py
│       └── Dockerfile
├── Caddyfile
└── docker-compose.yml
```

## Terminalkommandoer

Terminalen er bevidst sandboxed og kører **ikke** vilkårlige shell-kommandoer på VPS'en.

Prøv:

```text
help
status
cpu
memory
uptime
network
scan
reactor
fortune
whoami
date
clear
```

## Pygame lokalt

Spillet er lavet Pygbag-kompatibelt med async game-loop (`asyncio` + `await asyncio.sleep(0)`).

Desktop-test:

```bash
pip install pygame-ce
python games/factory-meltdown/main.py
```

Browser-test:

```bash
pip install pygbag==0.9.3
cd games
python -m pygbag factory-meltdown
```

## Udvikling uden Docker

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Ved separat lokal frontend/backend skal proxy eller miljøvariabler justeres. Docker Compose-konfigurationen er allerede sat op til samme-origin `/api`, `/ws` og `/game`.

## Sikkerhed

Python-terminalen har en whitelist af Nyttetech-kommandoer. Den bruger ikke `subprocess`, `os.system` eller rå shell execution. Det er med vilje, så en offentlig legeplads ikke bliver en kommandolinje ind på serveren.
