import type { GameState, PuzzleAnswerPayload } from '../../types';

export interface GameWorldHandle {
  pauseGame: () => void;
  resumeGame: () => void;
  restartStage: () => void;
  returnToMainMenu: () => void;
  resumeGameFromNoor: (isCorrect: boolean) => void;
  dismissMessage: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  startSession: () => void;
  continueAfterStageResults: () => void;
  resolvePuzzleAnswer: (answer: number | PuzzleAnswerPayload) => void;
}

export type GameStateUpdate = Partial<GameState> & { returnToMenu?: boolean };
