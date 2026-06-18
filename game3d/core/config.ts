import { PHYSICS, PROGRESS, INTRO_SAFE_DISTANCE_M } from '../../constants';

/** 2D speed (px/s) → displayed m/s via PROGRESS.DISTANCE_SCALE */
export const RUN_SPEED_MPS = PHYSICS.RUN_SPEED * PROGRESS.DISTANCE_SCALE;
export const RUN_SPEED_START_MPS = PHYSICS.RUN_SPEED_START * PROGRESS.DISTANCE_SCALE;
/** Stage 2 speed bump (+20 px/s in 2D) */
export const RUN_SPEED_STAGE2_MPS =
  (PHYSICS.RUN_SPEED + 20) * PROGRESS.DISTANCE_SCALE;

/** Rapier world units: 1 unit = 1 meter */
export const PHYSICS_3D = {
  GRAVITY: -20,
  JUMP_VELOCITY: 7.5,
  RUN_SPEED_MPS,
  RUN_SPEED_START_MPS,
  RUN_SPEED_STAGE2_MPS,
  COYOTE_TIME_MS: PHYSICS.COYOTE_TIME,
  BUFFER_TIME_MS: PHYSICS.BUFFER_TIME,
  INVULNERABILITY_MS: 1500,
  CITY_SPEED_MODIFIER: 0.8,
};

export { PROGRESS, INTRO_SAFE_DISTANCE_M };

export const WORLD = {
  CHUNK_LENGTH: 40,
  CHUNK_WIDTH: 12,
  CHUNK_COUNT: 5,
  CHUNK_RECYCLE_BUFFER: 10,
  GROUND_Y: 0,
  PLAYER_CAPSULE_HALF_HEIGHT: 0.5,
  PLAYER_CAPSULE_RADIUS: 0.35,
  GATE_DISTANCE_M: 80,
  SANDSTORM_TRIGGER_M: 230,
  STAGE_1_END_GATE_Z: PROGRESS.STAGE_1_LENGTH_M,
  FOG_NEAR: 20,
  FOG_FAR: 120,
};

export const THEME = {
  SKY: '#1a1625',
  SKY_BOTTOM: '#4a3b69',
  GROUND: '#c2b280',
  GROUND_DARK: '#8c7e56',
  GOLD: '#ffd700',
  SANDSTORM_FOG: '#c2a060',
};

export const THEME_CITY = {
  SKY: '#1a0a2e',
  SKY_BOTTOM: '#311b92',
  GROUND: '#3d2a5c',
  GROUND_DARK: '#280659',
  GOLD: '#ffca28',
  ACCENT: '#00e5ff',
  WALL: '#5e35b1',
};

export const UI_UPDATE_INTERVAL_MS = 66;

export const NUR_WELCOME_MESSAGE =
  'مرحبًا بك في مدينة العلم…\nقد لا تكون الرحلة سهلة،\nلكنني سأكون معك في كل خطوة.';

export const NUR_JUMP_HINT = 'اضغط للقفز!';

export const STAGE_1_TITLE = 'الصحراء';
export const STAGE_2_TITLE = 'المرحلة 2 – مدخل المدينة';

export const SANDSTORM_TIMINGS = {
  ONSET_MS: 2500,
  WALK_MS: 5000,
  SHELTER_PUZZLE_DELAY_MS: 1500,
  PUZZLE_ADVANCE_MS: 600,
  EXIT_FADE_MS: 1000,
};

export const TRANSITION_TIMINGS = {
  DESERT_FADE_OUT_MS: 1800,
  CITY_TRANSITION_MS: 4000,
  STAGE2_INTRO_DELAY_MS: 2000,
  STAGE2_FADE_IN_MS: 2000,
  STAGE2_TITLE_MS: 2500,
  STAGE2_NUR_MS: 5000,
};
