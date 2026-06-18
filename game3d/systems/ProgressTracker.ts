import { PROGRESS } from '../core/config';
import type { SessionState } from '../core/types';

/** Converts player world Z (meters) into HUD distance and stage progress. */
export function trackProgress(session: SessionState, playerZ: number): SessionState {
  if (session.currentStage >= 2 && session.cityStartZ >= 0) {
    const distInCity = Math.max(0, playerZ - session.cityStartZ);
    const stageProgressPercent = Math.min(
      100,
      (distInCity / PROGRESS.STAGE_2_LENGTH_M) * 100
    );
    return { ...session, distance: distInCity, playerZ, stageProgressPercent };
  }

  const distance = Math.max(0, playerZ);
  const stageProgressPercent = Math.min(
    100,
    (distance / PROGRESS.STAGE_1_LENGTH_M) * 100
  );
  return { ...session, distance, playerZ, stageProgressPercent };
}

export function formatSpeedMps(runSpeed: number): number {
  return Math.round(runSpeed * 10) / 10;
}
