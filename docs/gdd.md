# Game Design Document — Ninefold

**Working title:** Ninefold  
**Genre:** 2D top-down action-adventure (Zelda-like)  
**Perspective:** Orthographic / bird's-eye (Link's Awakening / early Zelda feel)  
**Platforms (v0):** Web (desktop keyboard + mouse). Mobile/gamepad mapped for later.  
**Tone:** Warm island paradise; curious, not preachy; philosophy as place and people.

## One-sentence pitch

Wake on a sunlit island where nine philosophies each claim a shore — explore, talk,
fight mild beasts, collect tools, and learn which path (or blend) fits the storm
gathering beyond the horizon.

## Pillars

1. **Wander to understand** — ideas are regions and mentors, not lectures.
2. **Readable craft** — large UI text, clear silhouettes, audible feedback.
3. **Gentle danger** — combat is expressive and fair; exploration is the soul.
4. **Folk + culture** — Greek agora energy meets Chinese garden calm without pastiche parody.
5. **Ninefold structure** — 3×3 mental map humans love; always know which school you're in.

## Fantasy references (design lessons only)

| Game | Steal the feeling |
|------|-------------------|
| *Link's Awakening* / Wind Fish | Intimate island; dreamlike mentors; music as lore |
| *Ocarina of Time* | Tool progression; temples as thesis statements |
| *The Wind Waker* | Sea breeze, cel-friendly color, folksy NPCs, charts of the world |

Do **not** copy Nintendo assets, music, names, or scripts.

## Player fantasy

You are a **Seeker** — washed ashore with a wooden practice blade and a blank notebook.
Locals call the notebook the **Fold** — it fills as you visit each school.

## Core loop

1. Explore a biome / school district  
2. Talk to mentor + townsfolk  
3. Clear a small trial (puzzle, soft combat, or item fetch)  
4. Earn a **Virtue Charm** (collectible + passive)  
5. Unlock a soft shortcut / boat dock toward the center **Agora Grove**  
6. Optional: return later with new tools for deeper dialogue branches  

## Progress structure

- **Hub:** Agora Grove (central plaza, market, ferry)
- **Nine schools:** see `nine-philosophies.md`
- **Finale (later):** The Tenth Fold — choosing synthesis vs single path (player-authored ending)

## Systems (v0 scaffold)

| System | Status in scaffold |
|--------|--------------------|
| Overworld walk + collide | Yes |
| Sword swing | Yes |
| Soft enemies (shade-mites) | Yes |
| NPC dialogue | Yes |
| Item / charm pickup | Yes |
| Region detection (9 schools) | Yes |
| Title / pause / HUD | Yes |
| Procedural art + SFX + bed music | Yes |
| Dungeons / boats / ocarina tools | Docs only |

## Success criteria for this sprint

- [x] Public GitHub repo with docs + playable web build
- [x] Human can move, slash, talk, pick up, and read philosophy blurbs
- [x] Deployed static site (GitHub Pages)
- [ ] Full dungeon set / original composed soundtrack stems (future)
- [ ] Controller + mobile on-screen sticks (mapped, not implemented)

## Non-goals (now)

- Multiplayer
- Monetization
- Photoreal art
- Academic accuracy as a textbook (tone over footnotes)
