import { useCallback, useRef } from 'react';
import type { GameState } from '../../types';
import { sessionToGameState } from '../core/gameState';
import type { SessionState } from '../core/types';
import { UI_UPDATE_INTERVAL_MS } from '../core/config';

type StateUpdate = Partial<GameState> & { returnToMenu?: boolean };

export function useGameBridge(
  sessionRef: React.RefObject<SessionState>,
  onStateUpdate: (data: StateUpdate) => void,
  bumpRender: () => void
) {
  const lastPushRef = useRef(0);

  const pushState = useCallback(
    (extra?: StateUpdate, force = false) => {
      onStateUpdate({ ...sessionToGameState(sessionRef.current!), ...extra });
      bumpRender();
    },
    [onStateUpdate, sessionRef, bumpRender]
  );

  const pushStateThrottled = useCallback(
    (nowMs: number, extra?: StateUpdate) => {
      if (nowMs - lastPushRef.current < UI_UPDATE_INTERVAL_MS) return;
      lastPushRef.current = nowMs;
      pushState(extra);
    },
    [pushState]
  );

  return { pushState, pushStateThrottled };
}
