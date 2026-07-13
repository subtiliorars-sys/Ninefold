# First session — Ninefold

**Repo:** `subtiliorars-sys/Ninefold`  
**Local:** clone anywhere; house path hint `games/Ninefold`  
**Goal:** confirm the island boots and the smoke gate is green before play polish.

## Install + smoke

```bash
npm install
npm run smoke    # typecheck + production build
```

`npm run verify` is an alias for `smoke`.

## Play locally

```bash
npm run dev
```

Open Vite’s URL (default `http://localhost:5173`). Prefer a free port if Bocce/DMN/other games already own 3000–3003.

## 60-second playtest checklist

1. Title screen readable; start into the island
2. Move (WASD / stick / touch) — character responds
3. Sword (Space / click / A) — swing lands
4. Talk / shrine (E / Enter / X) — interaction prompt works
5. Mute (M) and pause (Esc) — no hang
6. Reload — save/load does not wipe unexpectedly (see `SaveGame`)

## Docs map

| Doc | Use |
|-----|-----|
| [`gdd.md`](gdd.md) | Design north star |
| [`nine-philosophies.md`](nine-philosophies.md) | Region / mentor schools |
| [`controls.md`](controls.md) | Full input map |
| [`sprint.md`](sprint.md) | Active sprint notes |

## Do not

- Steal ports from Bocce / DrivingMeNuts while those sprints are ACTIVE
- Merge without Mark
- Copy Zelda assets (design lessons only — see `references.md`)
