# Milestone 1 — 3D Foundation (Complete)

Desert vertical slice running alongside the legacy Phaser game.

## Enable 3D mode

```env
# .env or .env.local
VITE_RENDER_MODE=3d
```

Default (omit variable or set `2d`) keeps the original Phaser game.

## Milestone 1 checklist

| Item | Status |
|------|--------|
| R3F + Rapier stack | Done |
| Parallel 2D/3D via env flag | Done |
| Engine-agnostic core (`game3d/core/`) | Done |
| Desert chunks + sky + fog | Done |
| Side-follow camera | Done |
| Auto-run + jump (coyote/buffer) | Done |
| Stars + obstacle collect/damage | Done |
| Magic gate @ 80m + text MCQ | Done |
| Nur welcome + jump hint | Done |
| React HUD (hearts, stars, distance) | Done |
| BGM + SFX (jump, star, damage, gate) | Done |
| Pause / resume / restart / menu | Done |
| Tab visibility auto-pause | Done |
| Menu desert backdrop (3D idle scene) | Done |
| Text-only gate questions (no missing images) | Done |
| Extracted systems (spawn, events, progress) | Done |
| Performance budget (dpr cap, no shadows) | Done |

## Out of scope (Milestone 2+)

- Sandstorm @ 230m
- Stage 1 end @ 450m + stage results
- City / library (Stage 2)
- GLB character models
- Removing Phaser

## Manual QA

1. Set `VITE_RENDER_MODE=3d`, run `npm run dev`
2. Home screen shows scrolling desert backdrop
3. Complete menu → tap **اضغط للانطلاق** or wait 2s
4. Player runs; distance increases (~4–5 m/s)
5. Collect stars; hit obstacle → lose heart
6. Gate at ~80m → Arabic question → answer → resume
7. Pause menu works; return to menu shows home + desert
8. Set `VITE_RENDER_MODE=2d` → Phaser game unchanged
