import type { Question, ActivePuzzle, PuzzleAnswerPayload, StageResultsData } from '../../types';
import type { EventPhase3D, SessionState } from '../core/types';
import {
  setActiveQuestion,
  clearQuestion,
  applyWrongAnswer,
  applyCorrectAnswer,
  setActivePuzzle,
  clearActivePuzzle,
  setNoorMessage,
  replenishHearts,
  setStageResults,
  clearStageResults,
  evaluatePuzzleAnswer,
} from '../core/gameState';
import { createStormPuzzleQueue } from '../core/stormPuzzles';
import { getNextTextQuestion } from '../core/questionFlow';
import {
  NUR_WELCOME_MESSAGE,
  NUR_JUMP_HINT,
  STAGE_1_TITLE,
  STAGE_2_TITLE,
  WORLD,
  SANDSTORM_TIMINGS,
  TRANSITION_TIMINGS,
  PHYSICS_3D,
} from '../core/config';

export const GATE80_Z = WORLD.GATE_DISTANCE_M;
export const LEVEL_END_GATE_Z = WORLD.STAGE_1_END_GATE_Z;
const GATE_SLOWDOWN_DIST_M = 12;
const TENT_SPAWN_AHEAD_M = 35;
const TENT_ARRIVAL_DIST_M = 2;

export interface EventUpdateFlags {
  playSandstorm?: boolean;
  stopSandstorm?: boolean;
  playStageSuccess?: boolean;
  playGate?: boolean;
  playFail?: boolean;
  playDamage?: boolean;
  pushState?: boolean;
  bumpRender?: boolean;
}

export class EventManager3D {
  private sandstormTimer = 0;
  private stormPuzzleQueue: ActivePuzzle[] = [];
  private stormPuzzleIndex = 0;
  private stormSolvedCount = 0;
  private scheduledCallbacks: Array<{ at: number; fn: () => void }> = [];
  private transitionTimer = 0;
  private transitionPhase: 'idle' | 'fade_out' | 'wait' | 'fade_in' | 'title' | 'nur' = 'idle';
  private gateCinematicTimer = 0;
  private gateCinematicPhase: 'idle' | 'message' | 'open' | 'enter' | 'fade' = 'idle';
  private exitStormTimer = 0;
  private shelterStarted = false;
  private pendingShowPuzzle = false;
  private pendingNextPuzzle = false;

  reset(): void {
    this.sandstormTimer = 0;
    this.stormPuzzleQueue = [];
    this.stormPuzzleIndex = 0;
    this.stormSolvedCount = 0;
    this.scheduledCallbacks = [];
    this.transitionTimer = 0;
    this.transitionPhase = 'idle';
    this.gateCinematicTimer = 0;
    this.gateCinematicPhase = 'idle';
    this.exitStormTimer = 0;
    this.shelterStarted = false;
    this.pendingShowPuzzle = false;
    this.pendingNextPuzzle = false;
  }

  schedule(delayMs: number, fn: () => void): void {
    this.scheduledCallbacks.push({ at: performance.now() + delayMs, fn });
  }

  tickScheduled(onFire: (fn: () => void) => void): void {
    const now = performance.now();
    const due = this.scheduledCallbacks.filter((c) => c.at <= now);
    this.scheduledCallbacks = this.scheduledCallbacks.filter((c) => c.at > now);
    due.forEach((c) => onFire(c.fn));
  }

  shouldSlowForGate80(playerZ: number, gatePassed: boolean): boolean {
    const dist = GATE80_Z - playerZ;
    return !gatePassed && dist < GATE_SLOWDOWN_DIST_M && dist > 0;
  }

  shouldSlowForLevelEnd(playerZ: number, triggered: boolean): boolean {
    const dist = LEVEL_END_GATE_Z - playerZ;
    return triggered && dist < GATE_SLOWDOWN_DIST_M && dist > 0;
  }

  isSpawningAllowed(phase: EventPhase3D): boolean {
    const blocked: EventPhase3D[] = [
      'NUR_INTRO',
      'GATE_QUESTION',
      'SANDSTORM_ONSET',
      'SANDSTORM_WALK',
      'SANDSTORM_APPROACH',
      'SANDSTORM_SHELTER',
      'SANDSTORM_EXIT',
      'LEVEL_END_GATE',
      'LEVEL_END_RESULTS',
      'LEVEL_TRANSITION',
      'STAGE_2_INTRO',
      'PAUSED',
    ];
    return !blocked.includes(phase);
  }

  startIntro(session: SessionState): SessionState {
    return {
      ...session,
      stageStartTime: performance.now(),
      eventPhase: 'NUR_INTRO',
      stageTitle: STAGE_1_TITLE,
      noorMessage: { text: NUR_WELCOME_MESSAGE, isSoftPause: true },
    };
  }

  dismissIntro(session: SessionState): { session: SessionState; phase: EventPhase3D } {
    return {
      phase: 'INTRO_RUN',
      session: {
        ...session,
        eventPhase: 'INTRO_RUN',
        noorMessage: null,
        stageTitle: STAGE_1_TITLE,
      },
    };
  }

  clearStageTitle(session: SessionState): SessionState {
    return { ...session, stageTitle: null };
  }

  maybeShowJumpHint(session: SessionState, playerZ: number): SessionState | null {
    if (playerZ <= 4) return null;
    if (session.eventPhase !== 'INTRO_RUN' && session.eventPhase !== 'RUNNING') return null;
    return {
      ...session,
      eventPhase: 'RUNNING',
      noorMessage: { text: NUR_JUMP_HINT, duration: 2800 },
    };
  }

  triggerGate80(session: SessionState): { session: SessionState; phase: EventPhase3D; question: Question } {
    const question = getNextTextQuestion();
    return {
      question,
      phase: 'GATE_QUESTION',
      session: setActiveQuestion({ ...session, gate80Triggered: true }, question),
    };
  }

  resolveGate80Answer(session: SessionState, isCorrect: boolean, now: number): {
    session: SessionState;
    phase: EventPhase3D;
    canRun: boolean;
  } {
    if (isCorrect) {
      const cleared = clearQuestion(applyCorrectAnswer(session));
      return {
        canRun: true,
        phase: 'RUNNING',
        session: {
          ...cleared,
          gate80Passed: true,
          noorMessage: { text: 'أحسنت! لنواصل الرحلة.', duration: 2500 },
        },
      };
    }

    const damaged = applyWrongAnswer(session, now);
    const canRun = !damaged.isGameOver;
    return {
      canRun,
      phase: canRun ? 'RUNNING' : damaged.eventPhase,
      session: {
        ...damaged,
        gate80Passed: true,
        noorMessage: canRun
          ? { text: 'لا بأس، حاول مرة أخرى!', duration: 2000 }
          : damaged.noorMessage,
      },
    };
  }

  /** Per-frame event update; returns updated session and side-effect flags. */
  update(session: SessionState, playerZ: number, deltaMs: number): {
    session: SessionState;
    flags: EventUpdateFlags;
  } {
    let s = { ...session };
    const flags: EventUpdateFlags = {};

    const targetIntensity =
      s.eventPhase === 'SANDSTORM_ONSET' ||
      s.eventPhase === 'SANDSTORM_WALK' ||
      s.eventPhase === 'SANDSTORM_APPROACH' ||
      s.eventPhase === 'SANDSTORM_SHELTER'
        ? s.eventPhase === 'SANDSTORM_SHELTER'
          ? 0.6
          : s.eventPhase === 'SANDSTORM_APPROACH'
            ? 0.85
            : 0.5
        : s.eventPhase === 'SANDSTORM_EXIT'
          ? Math.max(0, s.sandstormIntensity - deltaMs * 0.001)
          : 0;
    s.sandstormIntensity = lerp(s.sandstormIntensity, targetIntensity, deltaMs * 0.002);

    if (s.eventPhase === 'INTRO_RUN' || s.eventPhase === 'RUNNING') {
      const stormDone =
        s.sandstormTriggered &&
        ![
          'SANDSTORM_ONSET',
          'SANDSTORM_WALK',
          'SANDSTORM_APPROACH',
          'SANDSTORM_SHELTER',
          'SANDSTORM_EXIT',
        ].includes(s.eventPhase);
      if (!s.sandstormTriggered && playerZ >= WORLD.SANDSTORM_TRIGGER_M && s.currentStage === 1) {
        s = this.triggerSandstorm(s);
        flags.playSandstorm = true;
        flags.pushState = true;
      } else if (
        !s.levelEndTriggered &&
        playerZ >= LEVEL_END_GATE_Z - 5 &&
        s.currentStage === 1 &&
        stormDone
      ) {
        s = this.triggerLevelEnd(s);
        flags.pushState = true;
        flags.bumpRender = true;
      }
    }

    if (s.eventPhase === 'SANDSTORM_ONSET') {
      this.sandstormTimer += deltaMs;
      if (this.sandstormTimer >= SANDSTORM_TIMINGS.ONSET_MS) {
        s.eventPhase = 'SANDSTORM_WALK';
        this.sandstormTimer = 0;
        flags.pushState = true;
      }
    } else if (s.eventPhase === 'SANDSTORM_WALK') {
      this.sandstormTimer += deltaMs;
      if (this.sandstormTimer >= SANDSTORM_TIMINGS.WALK_MS) {
        s = this.triggerSandstormDiscovery(s, playerZ);
        flags.pushState = true;
        flags.bumpRender = true;
      }
    } else if (s.eventPhase === 'SANDSTORM_APPROACH') {
      if (playerZ >= s.tentZ - TENT_ARRIVAL_DIST_M) {
        s = this.triggerSandstormArrival(s);
        flags.pushState = true;
      }
    } else if (s.eventPhase === 'SANDSTORM_SHELTER') {
      if (!this.shelterStarted) {
        this.shelterStarted = true;
        this.stormPuzzleQueue = createStormPuzzleQueue();
        this.stormPuzzleIndex = 0;
        this.stormSolvedCount = 0;
        s = replenishHearts(
          setNoorMessage(s, { text: 'الحمد لله! نحن في أمان هنا. 🏕️', duration: 3000 })
        );
        this.schedule(SANDSTORM_TIMINGS.SHELTER_PUZZLE_DELAY_MS, () => {
          this.pendingShowPuzzle = true;
        });
        flags.pushState = true;
      }
      if (this.pendingShowPuzzle && !s.activePuzzle) {
        this.pendingShowPuzzle = false;
        const puzzle = this.stormPuzzleQueue[this.stormPuzzleIndex];
        if (puzzle) {
          s = setActivePuzzle(s, puzzle);
          flags.pushState = true;
        }
      }
      if (this.pendingNextPuzzle && !s.activePuzzle) {
        this.pendingNextPuzzle = false;
        const puzzle = this.stormPuzzleQueue[this.stormPuzzleIndex];
        if (puzzle) {
          s = setActivePuzzle(s, puzzle);
          flags.pushState = true;
        }
      }
    } else if (s.eventPhase === 'SANDSTORM_EXIT') {
      this.exitStormTimer += deltaMs;
      if (this.exitStormTimer >= SANDSTORM_TIMINGS.EXIT_FADE_MS) {
        s = {
          ...s,
          eventPhase: 'RUNNING',
          playerHidden: false,
          sandstormIntensity: 0,
          noorMessage: { text: 'الحمد لله! انتهت العاصفة الرملية.', duration: 4500 },
        };
        this.exitStormTimer = 0;
        this.shelterStarted = false;
        flags.stopSandstorm = true;
        flags.pushState = true;
      }
    } else if (s.eventPhase === 'LEVEL_END_APPROACH') {
      if (playerZ >= LEVEL_END_GATE_Z - 1) {
        s = this.triggerLevelEndGate(s);
        flags.playGate = true;
        flags.pushState = true;
      }
    } else if (s.eventPhase === 'LEVEL_END_GATE') {
      s = this.updateGateCinematic(s, deltaMs, flags);
    } else if (s.eventPhase === 'LEVEL_TRANSITION') {
      s = this.updateCityTransition(s, deltaMs, flags);
    } else if (s.eventPhase === 'STAGE_2_INTRO') {
      s = this.updateStage2Intro(s, deltaMs, flags);
    }

    return { session: s, flags };
  }

  private triggerSandstorm(session: SessionState): SessionState {
    this.sandstormTimer = 0;
    return {
      ...session,
      sandstormTriggered: true,
      eventPhase: 'SANDSTORM_ONSET',
      noorMessage: { text: 'عاصفة رملية! ابحث عن مأوى! 🌪️', duration: 3000 },
    };
  }

  private triggerSandstormDiscovery(session: SessionState, playerZ: number): SessionState {
    return {
      ...session,
      eventPhase: 'SANDSTORM_APPROACH',
      tentZ: playerZ + TENT_SPAWN_AHEAD_M,
      noorMessage: { text: 'انظر! خيمة بدوية! لنحتمي بها! ⛺', duration: 4000 },
    };
  }

  private triggerSandstormArrival(session: SessionState): SessionState {
    return {
      ...session,
      eventPhase: 'SANDSTORM_SHELTER',
      playerHidden: true,
    };
  }

  reportPuzzleResolved(
    session: SessionState,
    isCorrect: boolean
  ): { session: SessionState; phase: EventPhase3D; canRun: boolean; flags: EventUpdateFlags } {
    const flags: EventUpdateFlags = { pushState: true };
    let s = clearActivePuzzle(session);

    if (isCorrect) {
      s = applyCorrectAnswer(s);
      s = { ...s, stars: s.stars + 10 };
    } else {
      s = { ...s, wrongAnswers: s.wrongAnswers + 1 };
      flags.playDamage = true;
    }

    if (s.eventPhase === 'SANDSTORM_SHELTER') {
      if (isCorrect) this.stormSolvedCount++;
      this.stormPuzzleIndex++;
      if (this.stormPuzzleIndex < this.stormPuzzleQueue.length) {
        this.schedule(SANDSTORM_TIMINGS.PUZZLE_ADVANCE_MS, () => {
          this.pendingNextPuzzle = true;
        });
        return { session: s, phase: 'SANDSTORM_SHELTER', canRun: false, flags };
      }
      this.stormPuzzleQueue = [];
      if (this.stormSolvedCount >= 5) {
        s = setNoorMessage(s, { text: 'عمل رائع! لقد أثبتَّ حكمتك.', duration: 2500 });
      }
      s = { ...s, eventPhase: 'SANDSTORM_EXIT' };
      this.exitStormTimer = 0;
      flags.stopSandstorm = true;
      return { session: s, phase: 'SANDSTORM_EXIT', canRun: false, flags };
    }

    return { session: s, phase: s.eventPhase, canRun: true, flags };
  }

  resolvePuzzleAnswer(
    session: SessionState,
    answer: number | PuzzleAnswerPayload
  ): { session: SessionState; phase: EventPhase3D; canRun: boolean; flags: EventUpdateFlags } {
    if (!session.activePuzzle) {
      return { session, phase: session.eventPhase, canRun: false, flags: {} };
    }
    const isCorrect = evaluatePuzzleAnswer(session.activePuzzle, answer);
    return this.reportPuzzleResolved(session, isCorrect);
  }

  private triggerLevelEnd(session: SessionState): SessionState {
    return {
      ...session,
      levelEndTriggered: true,
      eventPhase: 'LEVEL_END_APPROACH',
    };
  }

  private triggerLevelEndGate(session: SessionState): SessionState {
    this.gateCinematicPhase = 'message';
    this.gateCinematicTimer = 0;
    return {
      ...session,
      eventPhase: 'LEVEL_END_GATE',
      isPaused: true,
      noorMessage: {
        text: 'هذه بوابة الانتقال... ستقودنا إلى المدينة.',
        duration: 2500,
      },
    };
  }

  private updateGateCinematic(
    session: SessionState,
    deltaMs: number,
    flags: EventUpdateFlags
  ): SessionState {
    this.gateCinematicTimer += deltaMs;
    let s = session;

    if (this.gateCinematicPhase === 'message' && this.gateCinematicTimer >= 2000) {
      this.gateCinematicPhase = 'open';
      this.gateCinematicTimer = 0;
      s = { ...s, levelEndGateOpen: true, noorMessage: null };
      flags.pushState = true;
    } else if (this.gateCinematicPhase === 'open' && this.gateCinematicTimer >= 700) {
      this.gateCinematicPhase = 'enter';
      this.gateCinematicTimer = 0;
      s = { ...s, playerHidden: true };
      flags.pushState = true;
    } else if (this.gateCinematicPhase === 'enter' && this.gateCinematicTimer >= 1600) {
      this.gateCinematicPhase = 'fade';
      this.gateCinematicTimer = 0;
      s = { ...s, screenFade: 1 };
      flags.pushState = true;
    } else if (this.gateCinematicPhase === 'fade' && this.gateCinematicTimer >= 1200) {
      this.gateCinematicPhase = 'idle';
      this.gateCinematicTimer = 0;
      s = this.showDesertStageResults(s);
      flags.playStageSuccess = true;
      flags.pushState = true;
    }

    return s;
  }

  showDesertStageResults(session: SessionState): SessionState {
    const timeSeconds = (performance.now() - session.stageStartTime) / 1000;
    const data: StageResultsData = {
      stageName: 'نهاية الصحراء',
      distance: session.playerZ,
      stars: session.stars,
      correctAnswers: session.correctAnswers,
      wrongAnswers: session.wrongAnswers,
      timeSeconds,
    };
    return setStageResults(
      setNoorMessage(session, {
        text: 'رائع! لقد أنهيت هذه المرحلة بنجاح.',
        duration: 4000,
      }),
      data,
      'DESERT_END'
    );
  }

  continueAfterStageResults(session: SessionState): SessionState {
    if (session.pendingTransition !== 'DESERT_END') return session;
    this.transitionPhase = 'fade_out';
    this.transitionTimer = 0;
    let s = clearStageResults(session);
    s = { ...s, eventPhase: 'LEVEL_TRANSITION', noorMessage: null, screenFade: 0.8 };
    return s;
  }

  private updateCityTransition(
    session: SessionState,
    deltaMs: number,
    flags: EventUpdateFlags
  ): SessionState {
    this.transitionTimer += deltaMs;
    let s = session;

    if (this.transitionPhase === 'fade_out') {
      s.screenFade = Math.min(1, this.transitionTimer / TRANSITION_TIMINGS.DESERT_FADE_OUT_MS);
      if (this.transitionTimer >= TRANSITION_TIMINGS.DESERT_FADE_OUT_MS) {
        this.transitionPhase = 'wait';
        this.transitionTimer = 0;
        s = {
          ...s,
          currentStage: 2,
          cityStartZ: s.playerZ,
          environmentZone: 'TRANSITION',
          levelEndTriggered: false,
          levelEndGateOpen: false,
          playerHidden: false,
          gate80Passed: true,
        };
        flags.bumpRender = true;
        flags.pushState = true;
      }
    } else if (this.transitionPhase === 'wait') {
      const t = this.transitionTimer / TRANSITION_TIMINGS.CITY_TRANSITION_MS;
      if (t >= 1) {
        s.environmentZone = 'CITY';
      }
      if (this.transitionTimer >= TRANSITION_TIMINGS.STAGE2_INTRO_DELAY_MS) {
        this.transitionPhase = 'fade_in';
        this.transitionTimer = 0;
        s.eventPhase = 'STAGE_2_INTRO';
        s.screenFade = 1;
      }
    } else if (this.transitionPhase === 'fade_in') {
      s.screenFade = Math.max(
        0,
        1 - this.transitionTimer / TRANSITION_TIMINGS.STAGE2_FADE_IN_MS
      );
      if (this.transitionTimer >= TRANSITION_TIMINGS.STAGE2_FADE_IN_MS) {
        this.transitionPhase = 'title';
        this.transitionTimer = 0;
        s = {
          ...s,
          cityStageStartTime: performance.now(),
          stageTitle: STAGE_2_TITLE,
          screenFade: 0,
        };
        flags.pushState = true;
      }
    }

    return s;
  }

  private updateStage2Intro(
    session: SessionState,
    deltaMs: number,
    flags: EventUpdateFlags
  ): SessionState {
    this.transitionTimer += deltaMs;
    let s = session;

    if (this.transitionPhase === 'title') {
      if (this.transitionTimer >= TRANSITION_TIMINGS.STAGE2_TITLE_MS) {
        this.transitionPhase = 'nur';
        this.transitionTimer = 0;
        s = { ...s, stageTitle: null, noorMessage: { text: NUR_WELCOME_MESSAGE, duration: 5000 } };
        flags.pushState = true;
      }
    } else if (this.transitionPhase === 'nur') {
      if (this.transitionTimer >= TRANSITION_TIMINGS.STAGE2_NUR_MS) {
        this.transitionPhase = 'idle';
        this.transitionTimer = 0;
        s = {
          ...s,
          eventPhase: 'RUNNING',
          noorMessage: null,
          isPaused: false,
        };
        flags.pushState = true;
      }
    }

    return s;
  }

  getRunSpeedTarget(session: SessionState, baseSpeed: number): number {
    if (session.eventPhase === 'STAGE_2_INTRO' || session.eventPhase === 'LEVEL_END_GATE') {
      return 0;
    }
    if (
      session.eventPhase === 'SANDSTORM_SHELTER' ||
      session.eventPhase === 'LEVEL_END_RESULTS' ||
      session.eventPhase === 'LEVEL_TRANSITION'
    ) {
      return 0;
    }
    if (session.eventPhase === 'SANDSTORM_ONSET' || session.eventPhase === 'SANDSTORM_WALK') {
      return baseSpeed * 0.5;
    }
    if (session.eventPhase === 'SANDSTORM_APPROACH') {
      return baseSpeed * 0.35;
    }
    if (session.currentStage >= 2 && session.environmentZone === 'CITY') {
      return PHYSICS_3D.RUN_SPEED_STAGE2_MPS * PHYSICS_3D.CITY_SPEED_MODIFIER;
    }
    if (session.currentStage >= 2) {
      return PHYSICS_3D.RUN_SPEED_STAGE2_MPS;
    }
    return baseSpeed;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, t);
}
