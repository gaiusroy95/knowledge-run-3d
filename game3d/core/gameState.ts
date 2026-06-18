import type {
  GameState,
  NoorMessage,
  Question,
  ActivePuzzle,
  StageResultsData,
  PuzzleAnswerPayload,
} from '../../types';
import type { SessionState, PendingTransition } from './types';
import { PROGRESS } from './config';

export const createInitialSession = (): SessionState => ({
  hearts: 3,
  stars: 0,
  distance: 0,
  isGameOver: false,
  isPaused: false,
  activeQuestion: null,
  activePuzzle: null,
  noorMessage: null,
  stageProgressPercent: 0,
  currentStage: 1,
  stageTitle: null,
  stageResults: null,
  pendingTransition: null,
  soundEnabled:
    typeof localStorage !== 'undefined' ? localStorage.getItem('soundEnabled') !== '0' : true,
  musicEnabled:
    typeof localStorage !== 'undefined' ? localStorage.getItem('musicEnabled') !== '0' : true,
  eventPhase: 'NUR_INTRO',
  environmentZone: 'DESERT',
  gate80Triggered: false,
  gate80Passed: false,
  sandstormTriggered: false,
  levelEndTriggered: false,
  correctAnswers: 0,
  wrongAnswers: 0,
  stageStartTime: performance.now(),
  cityStartZ: -1,
  cityStageStartTime: 0,
  invulnerableUntil: 0,
  playerZ: 0,
  sandstormIntensity: 0,
  screenFade: 0,
  playerHidden: false,
  tentZ: 0,
  levelEndGateOpen: false,
});

export const applyStarCollect = (session: SessionState): SessionState => ({
  ...session,
  stars: session.stars + 1,
});

export const applyDamage = (session: SessionState, now: number): SessionState => {
  if (now < session.invulnerableUntil) return session;
  const hearts = Math.max(0, session.hearts - 1);
  return {
    ...session,
    hearts,
    isGameOver: hearts === 0,
    invulnerableUntil: now + 1500,
  };
};

export const applyWrongAnswer = (session: SessionState, now: number): SessionState => {
  const damaged = applyDamage(session, now);
  return {
    ...damaged,
    activeQuestion: null,
    isPaused: false,
    wrongAnswers: damaged.wrongAnswers + 1,
    eventPhase: damaged.isGameOver ? damaged.eventPhase : 'RUNNING',
  };
};

export const applyCorrectAnswer = (session: SessionState): SessionState => ({
  ...session,
  correctAnswers: session.correctAnswers + 1,
});

export const setActiveQuestion = (session: SessionState, question: Question): SessionState => ({
  ...session,
  activeQuestion: question,
  eventPhase: 'GATE_QUESTION',
  isPaused: true,
});

export const clearQuestion = (session: SessionState): SessionState => ({
  ...session,
  activeQuestion: null,
  isPaused: false,
  eventPhase: 'RUNNING',
});

export const setActivePuzzle = (session: SessionState, puzzle: ActivePuzzle): SessionState => ({
  ...session,
  activePuzzle: puzzle,
  isPaused: true,
});

export const clearActivePuzzle = (session: SessionState): SessionState => ({
  ...session,
  activePuzzle: null,
  isPaused: false,
});

export const setNoorMessage = (
  session: SessionState,
  message: NoorMessage | null
): SessionState => ({
  ...session,
  noorMessage: message,
});

export const replenishHearts = (session: SessionState): SessionState => ({
  ...session,
  hearts: 3,
});

export const setStageResults = (
  session: SessionState,
  data: StageResultsData,
  pending: PendingTransition
): SessionState => ({
  ...session,
  stageResults: data,
  pendingTransition: pending,
  isPaused: true,
  eventPhase: 'LEVEL_END_RESULTS',
});

export const clearStageResults = (session: SessionState): SessionState => ({
  ...session,
  stageResults: null,
  pendingTransition: null,
});

export const updateDistance = (session: SessionState, playerZ: number): SessionState => {
  const distance = Math.max(0, playerZ);
  const stageProgressPercent = Math.min(
    100,
    (distance / PROGRESS.STAGE_1_LENGTH_M) * 100
  );
  return { ...session, distance, playerZ, stageProgressPercent };
};

export const sessionToGameState = (session: SessionState): Partial<GameState> => ({
  distance: session.distance,
  hearts: session.hearts,
  stars: session.stars,
  isGameOver: session.isGameOver,
  activeQuestion: session.activeQuestion,
  activePuzzle: session.activePuzzle,
  noorMessage: session.noorMessage,
  stageProgressPercent: session.stageProgressPercent,
  currentStage: session.currentStage,
  stageTitle: session.stageTitle,
  stageResults: session.stageResults,
  soundEnabled: session.soundEnabled,
  musicEnabled: session.musicEnabled,
  isPaused: session.isPaused,
});

/** Evaluate puzzle answer correctness (mirrors MainScene.resolvePuzzleAnswer). */
export function evaluatePuzzleAnswer(
  puzzle: ActivePuzzle,
  answer: number | PuzzleAnswerPayload
): boolean {
  if (typeof answer === 'number') {
    if (puzzle.mode !== 'MCQ') return false;
    return answer === puzzle.correctIndex;
  }
  if (puzzle.mode === 'MCQ' && answer.mode === 'MCQ') {
    return answer.selectedIndex === puzzle.correctIndex;
  }
  if (puzzle.mode === 'ONE_LINE' && answer.mode === 'ONE_LINE') {
    return answer.success;
  }
  if (puzzle.mode === 'MEMORY' && answer.mode === 'MEMORY') {
    const expected = puzzle.sequence;
    return (
      answer.order.length === expected.length &&
      answer.order.every((value, index) => value === index)
    );
  }
  if (puzzle.mode === 'MATCH' && answer.mode === 'MATCH') {
    const submitted = answer.pairs.map((p) => `${p.leftIndex}-${p.rightIndex}`).sort();
    const required = puzzle.pairs.map((p) => `${p.leftIndex}-${p.rightIndex}`).sort();
    return submitted.length === required.length && submitted.every((p, i) => p === required[i]);
  }
  return false;
}
