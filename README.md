# Ninefold

**Ninefold** is a Zelda-like 2D top-down adventure on an island paradise. Explore, meet
characters, collect tools, and walk through **nine living philosophies** — each a region,
a mentor, and a way of seeing.

Built with **Phaser 3**, **TypeScript**, and **Vite**. Procedural pixel art and Web Audio;
no heavy binary assets required to run locally.

## Run & verify

```bash
npm install
npm run verify   # typecheck + production build
npm run dev      # default http://localhost:5173
```

`verify` runs `smoke` (`typecheck` then `build`). Production preview: `npm run build && npm run preview`.

More detail: [`docs/controls.md`](docs/controls.md), [`docs/nine-philosophies.md`](docs/nine-philosophies.md), [`docs/gdd.md`](docs/gdd.md).

## Fleet routing

Cross-repo agent work routes through the subtiliorars-sys connectome:

- Hub: [subtiliorars-sys/neural-network](https://github.com/subtiliorars-sys/neural-network)
- Registry: [`connectome/repos.yaml`](https://github.com/subtiliorars-sys/neural-network/blob/main/connectome/repos.yaml)
- Fleet Kanban: [`connectome/fleet-kanban.yaml`](https://github.com/subtiliorars-sys/neural-network/blob/main/connectome/fleet-kanban.yaml)

## License

Source code: MIT (see `LICENSE`). Game name, story, and original design: © subtiliorars-sys / JimmyTheHat Games.
