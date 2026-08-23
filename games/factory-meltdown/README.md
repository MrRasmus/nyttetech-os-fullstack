# Factory Meltdown

Python/Pygame arcade game prepared for Pygbag WebAssembly packaging.

Desktop test (with pygame-ce installed):

```bash
python main.py
```

Browser dev test:

```bash
pip install pygbag==0.9.3
cd ..
python -m pygbag factory-meltdown
```

The Docker image uses `pygbag --archive` and serves the generated web build with nginx.
