export type {
  GameState,
  Question,
  QuestionOption,
  NoorMessage,
  AgeGroup,
  StageResultsData,
  ActivePuzzle,
  PuzzleAnswerPayload,
} from '../../types';

export type EntityKind = 'star' | 'obstacle';

export type ObstacleVariant = 'cart' | 'city_pillar';

export interface SpawnedEntity {
  id: string;
  kind: EntityKind;
  x: number;
  y: number;
  z: number;
  collected?: boolean;
  obstacleVariant?: ObstacleVariant;
}

export type EnvironmentZone = 'DESERT' | 'TRANSITION' | 'CITY';

export type PendingTransition = 'DESERT_END' | 'LIBRARY_END' | null;

export type EventPhase3D =
  | 'NUR_INTRO'
  | 'INTRO_RUN'
  | 'RUNNING'
  | 'GATE_APPROACH'
  | 'GATE_QUESTION'
  | 'SANDSTORM_ONSET'
  | 'SANDSTORM_WALK'
  | 'SANDSTORM_APPROACH'
  | 'SANDSTORM_SHELTER'
  | 'SANDSTORM_EXIT'
  | 'LEVEL_END_APPROACH'
  | 'LEVEL_END_GATE'
  | 'LEVEL_END_RESULTS'
  | 'LEVEL_TRANSITION'
  | 'STAGE_2_INTRO'
  | 'PAUSED';

export interface SessionState {
  hearts: number;
  stars: number;
  distance: number;
  isGameOver: boolean;
  isPaused: boolean;
  activeQuestion: import('../../types').Question | null;
  activePuzzle: import('../../types').ActivePuzzle | null;
  noorMessage: import('../../types').NoorMessage | null;
  stageProgressPercent: number;
  currentStage: number;
  stageTitle: string | null;
  stageResults: import('../../types').StageResultsData | null;
  pendingTransition: PendingTransition;
  soundEnabled: boolean;
  musicEnabled: boolean;
  eventPhase: EventPhase3D;
  environmentZone: EnvironmentZone;
  gate80Triggered: boolean;
  gate80Passed: boolean;
  sandstormTriggered: boolean;
  levelEndTriggered: boolean;
  correctAnswers: number;
  wrongAnswers: number;
  stageStartTime: number;
  cityStartZ: number;
  cityStageStartTime: number;
  invulnerableUntil: number;
  playerZ: number;
  /** 0–1 sandstorm overlay intensity */
  sandstormIntensity: number;
  /** Screen fade overlay 0–1 (warm gold) */
  screenFade: number;
  playerHidden: boolean;
  /** Tent world Z when spawned during sandstorm approach */
  tentZ: number;
  levelEndGateOpen: boolean;
}
