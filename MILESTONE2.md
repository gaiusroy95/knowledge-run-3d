# Milestone 2 — Desert Completion + City Transition (3D)

Complete Stage 1 desert events and transition into Stage 2 city in 3D mode.

## Enable 3D mode

```env
VITE_RENDER_MODE=3d
```

## Milestone 2 checklist

| Item | Status |
|------|--------|
| Extended session model (stats, puzzles, stage results) | Done |
| Storm puzzle builder (`game3d/core/stormPuzzles.ts`) | Done |
| Sandstorm @ 230m (VFX, audio, phase chain) | Done |
| Bedouin tent shelter + 5-puzzle sequence | Done |
| Level-end gate @ 450m + cinematic | Done |
| `StageResultsUI` with correct/wrong/time stats | Done |
| Continue → city transition fade | Done |
| City chunks + skyline + purple theme | Done |
| `STAGE_2_INTRO` + city spawns | Done |
| Stage 2 progress + BGM swap via `currentStage` | Done |
| App wiring (puzzles, stage results continue) | Done |

## Out of scope (Milestone 3+)

- Library @ 420m + `LIBRARY_*` phases
- Magic carpet / dual-path gate
- Stage 2 end @ 600m + `بيت الحكمة` results
- GLB character model
- Removing Phaser

## Manual QA

1. Set `VITE_RENDER_MODE=3d`, run `npm run dev`
2. Start game → M1 gate @ ~80m still works (MCQ)
3. Run to ~230m → sandstorm VFX + `sandstorm.wav`, slowdown
4. Reach tent → 5 puzzles (ONE_LINE, MEMORY, MATCH) via `GameUI`
5. After storm → run resumes; hearts replenished in tent
6. Run to ~450m → level-end gate cinematic → `StageResultsUI`
7. Tap **متابعة** → gold fade → city visuals + stage 2 intro
8. Run 50m+ in city: purple ground, skyline, pillars, stage-2 BGM
9. Pause / restart / menu work mid-city
10. `VITE_RENDER_MODE=2d` → Phaser unchanged

## Key files

- `game3d/systems/EventManager3D.ts` — sandstorm, level end, city transition state machine
- `game3d/world/GameWorld.tsx` — orchestration loop
- `game3d/world/CityChunk.tsx`, `CitySkyline.tsx`, `SandstormOverlay.tsx`
- `game3d/entities/BedouinTent.tsx`
- `game3d/core/stormPuzzles.ts`
