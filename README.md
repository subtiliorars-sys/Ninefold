# Ninefold

**Ninefold** is a Zelda-like 2D top-down action-adventure: explore an island paradise,
meet folksy characters and creatures, collect tools, swing a sword, and walk through
**nine living philosophies** — each a region, a mentor, and a way of seeing.

Inspired by *Link's Awakening* (Wind Fish), *Ocarina of Time*, and *The Wind Waker*:
intimate island exploration, musical motifs, and a world that teaches by wandering.

## Play

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

**Build / preview**

```bash
npm run build
npm run preview
```

## Controls (keyboard + mouse + gamepad + touch)

| Action | Keys / mouse | Gamepad | Touch |
|--------|----------------|---------|-------|
| Move | WASD / Arrows | Left stick | Virtual stick |
| Sword | Space / Click | A | Sword |
| Talk / Shrine | E / Enter | X | Talk |
| Fold notebook | N | Y | Fold |
| Pause | Esc | Start | — |
| Mute | M | Select | — |

## Stack

- **Phaser 3** + **TypeScript** + **Vite**
- Procedural pixel art + Web Audio (no heavy binary assets required to run)
- Deploy target: **GitHub Pages** (`./` base path)

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/gdd.md`](docs/gdd.md) | Game design document |
| [`docs/nine-philosophies.md`](docs/nine-philosophies.md) | The nine schools / regions |
| [`docs/world.md`](docs/world.md) | Island geography & tone |
| [`docs/controls.md`](docs/controls.md) | Input map (KB/mouse + future gamepad/mobile) |
| [`docs/audio-art.md`](docs/audio-art.md) | Art & sound direction |
| [`docs/references.md`](docs/references.md) | Zelda inspirations (design lessons, not assets) |

## License

Source code: MIT (see `LICENSE`).  
Game name, story, and original design: © subtiliorars-sys / JimmyTheHat Games — all rights reserved unless noted.
