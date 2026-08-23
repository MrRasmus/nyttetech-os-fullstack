FROM python:3.12-slim AS builder
WORKDIR /game
RUN pip install --no-cache-dir pygbag==0.9.3
COPY main.py ./main.py
RUN python -m pygbag --archive /game/main.py
RUN python - <<'PY'
from pathlib import Path
import zipfile
src = Path('/game/build/web.zip')
out = Path('/out')
out.mkdir(parents=True, exist_ok=True)
if not src.exists():
    raise SystemExit(f'Expected Pygbag archive not found: {src}')
with zipfile.ZipFile(src) as z:
    z.extractall(out)
PY

FROM nginx:1.29-alpine
COPY --from=builder /out /usr/share/nginx/html
EXPOSE 80
