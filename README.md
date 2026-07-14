# Ninefold

**▶ [Play online](https://subtiliorars-sys.github.io/Ninefold/)** — Zelda-like 2D top-down adventure across nine philosophies on an island paradise.

**Ninefold** is a Zelda-like 2D top-down action-adventure: explore an island paradise,
meet folksy characters and creatures, collect tools, swing a sword, and walk through
**nine living philosophies** — each a region, a mentor, and a way of seeing.

Inspired by *Link's Awakening* (Wind Fish), *Ocarina of Time*, and *The Wind Waker*:
intimate island exploration, musical motifs, and a world that teaches by wandering.


### First-run tip

Open [Play online](https://subtiliorars-sys.github.io/Ninefold/) (or `npm run smoke` then `npm run dev`). Talk with **E**, Fold with **N**, mute music with **M**, Esc pauses — Tab toggles HUD.

## Play

```bash
npm install
npm run smoke    # typecheck + production build (CI-friendly)
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).  
First-session checklist: [`docs/FIRST-SESSION.md`](docs/FIRST-SESSION.md).

**Build / preview**

```bash
npm run build
npm run preview
```

`npm run verify` aliases `smoke`.

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
| [`docs/FIRST-SESSION.md`](docs/FIRST-SESSION.md) | Install, smoke, 60s playtest |
| [`docs/gdd.md`](docs/gdd.md) | Game design document |
| [`docs/nine-philosophies.md`](docs/nine-philosophies.md) | The nine schools / regions |
| [`docs/world.md`](docs/world.md) | Island geography & tone |
| [`docs/controls.md`](docs/controls.md) | Input map (KB/mouse + future gamepad/mobile) |
| [`docs/audio-art.md`](docs/audio-art.md) | Art & sound direction |
| [`docs/references.md`](docs/references.md) | Zelda inspirations (design lessons, not assets) |

## License

Source code: MIT (see `LICENSE`).  
Game name, story, and original design: © subtiliorars-sys / JimmyTheHat Games — all rights reserved unless noted.


## Shared asset libraries

**Agents:** do not invent colored-box placeholders when free art exists.
See [docs/ASSETS.md](docs/ASSETS.md) → `game-visual-assets`, `game-audio-assets`, `game-3d-assets`.
