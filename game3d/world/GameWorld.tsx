import {

  useRef,

  useState,

  useCallback,

  useEffect,

  forwardRef,

  useImperativeHandle,

} from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { Physics } from '@react-three/rapier';

import * as THREE from 'three';

import { Sky } from './Sky';

import { Lighting } from './Lighting';

import { ChunkStream } from './ChunkStream';

import { CitySkyline } from './CitySkyline';

import { SandstormOverlay } from './SandstormOverlay';

import { FollowCamera } from '../camera/FollowCamera';

import { PlayerController, type PlayerControllerHandle } from '../player/PlayerController';

import { StarEntity } from '../entities/Star';

import { ObstacleEntity } from '../entities/Obstacle';

import { MagicGate } from '../entities/MagicGate';

import { BedouinTent } from '../entities/BedouinTent';

import type { GameWorldHandle } from '../GameWorldHandle';

import type { EventPhase3D, EnvironmentZone } from '../core/types';

import type { GameState } from '../../types';

import {

  createInitialSession,

  applyStarCollect,

  applyDamage,

} from '../core/gameState';

import {

  PHYSICS_3D,

  WORLD,

  THEME,

  THEME_CITY,

} from '../core/config';

import { AudioManager3D } from '../systems/AudioManager3D';

import { SpawnManager3D } from '../systems/SpawnManager3D';

import {

  EventManager3D,

  GATE80_Z,

  LEVEL_END_GATE_Z,

} from '../systems/EventManager3D';

import { trackProgress } from '../systems/ProgressTracker';

import { useGameBridge } from '../hooks/useGameBridge';



interface GameWorldProps {

  active: boolean;

  onStateUpdate: (data: Partial<GameState> & { returnToMenu?: boolean }) => void;

  onScreenFade?: (opacity: number) => void;

}



export const GameWorld = forwardRef<GameWorldHandle, GameWorldProps>(

  function GameWorld({ active, onStateUpdate, onScreenFade }, ref) {

    const sessionRef = useRef(createInitialSession());

    const spawnManagerRef = useRef(new SpawnManager3D());

    const eventManagerRef = useRef(new EventManager3D());

    const [phase, setPhase] = useState<EventPhase3D>('NUR_INTRO');

    const [zone, setZone] = useState<EnvironmentZone>('DESERT');

    const [playerZ, setPlayerZ] = useState(0);

    const [renderTick, setRenderTick] = useState(0);

    const bumpRender = useCallback(() => setRenderTick((n) => n + 1), []);

    void renderTick;



    const playerRef = useRef<PlayerControllerHandle>(null);

    const playerBodyRef = useRef<import('@react-three/rapier').RapierRigidBody | null>(null);

    const cameraTargetRef = useRef(new THREE.Vector3(0, 1.2, 0));

    const sandstormIntensityRef = useRef(0);

    const audioRef = useRef<AudioManager3D | null>(null);

    if (!audioRef.current) {

      const audio = new AudioManager3D();

      audio.setSoundEnabled(sessionRef.current.soundEnabled !== false);

      audioRef.current = audio;

    }

    const runSpeedRef = useRef(PHYSICS_3D.RUN_SPEED_START_MPS);

    const canRunRef = useRef(false);

    const sessionKeyRef = useRef(0);

    const jumpHintShownRef = useRef(false);

    const sessionStartedRef = useRef(false);

    const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const lastDeltaMsRef = useRef(16);

    const cityModeAppliedRef = useRef(false);
    const fogRef = useRef<THREE.Fog | null>(null);
    const puzzleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [puzzleKey, setPuzzleKey] = useState<string>('none');

    const { pushState, pushStateThrottled } = useGameBridge(
      sessionRef,
      onStateUpdate,
      bumpRender
    );



    const { scene } = useThree();

    useEffect(() => {
      if (!fogRef.current) {
        fogRef.current = new THREE.Fog(THEME.GROUND_DARK, WORLD.FOG_NEAR, WORLD.FOG_FAR);
        scene.fog = fogRef.current;
      }
      return () => {
        scene.fog = null;
      };
    }, [scene]);



    const setPhaseSafe = useCallback((next: EventPhase3D) => {

      sessionRef.current.eventPhase = next;

      setPhase(next);

    }, []);



    const setZoneSafe = useCallback((next: EnvironmentZone) => {

      sessionRef.current.environmentZone = next;

      setZone(next);

    }, []);



    const applyEventFlags = useCallback(

      (flags: import('../systems/EventManager3D').EventUpdateFlags) => {

        if (flags.playSandstorm) audioRef.current?.playLoop('sandstorm');

        if (flags.stopSandstorm) audioRef.current?.stopLoop('sandstorm');

        if (flags.playStageSuccess) audioRef.current?.play('stageSuccess');

        if (flags.playGate) audioRef.current?.play('gate');

        if (flags.playDamage) audioRef.current?.play('damage');

        if (flags.pushState) pushState();

        if (flags.bumpRender) bumpRender();

      },

      [pushState, bumpRender]

    );



    const beginRunning = useCallback(() => {

      if (sessionRef.current.eventPhase !== 'NUR_INTRO') return;

      if (introTimerRef.current) clearTimeout(introTimerRef.current);

      const { session, phase: nextPhase } = eventManagerRef.current.dismissIntro(sessionRef.current);

      sessionRef.current = session;

      canRunRef.current = true;

      setPhaseSafe(nextPhase);

      pushState();

      setTimeout(() => {

        sessionRef.current = eventManagerRef.current.clearStageTitle(sessionRef.current);

        pushState();

      }, 2200);

    }, [pushState, setPhaseSafe]);



    const resetSession = useCallback(() => {

      spawnManagerRef.current.reset();

      eventManagerRef.current.reset();

      sessionRef.current = createInitialSession();

      audioRef.current?.setSoundEnabled(sessionRef.current.soundEnabled !== false);

      audioRef.current?.stopLoop('sandstorm');

      runSpeedRef.current = PHYSICS_3D.RUN_SPEED_START_MPS;

      canRunRef.current = false;

      jumpHintShownRef.current = false;

      cityModeAppliedRef.current = false;

      sessionKeyRef.current += 1;

      setPlayerZ(0);

      setPhaseSafe('NUR_INTRO');

      setZoneSafe('DESERT');

      sandstormIntensityRef.current = 0;

      playerRef.current?.reset();

    }, [setPhaseSafe, setZoneSafe]);



    const startSession = useCallback(() => {

      resetSession();

      sessionRef.current = eventManagerRef.current.startIntro(sessionRef.current);

      pushState();

      introTimerRef.current = setTimeout(beginRunning, 2000);

    }, [resetSession, pushState, beginRunning]);



    useImperativeHandle(ref, () => ({

      startSession,

      pauseGame: () => {

        canRunRef.current = false;

        sessionRef.current.isPaused = true;

        setPhaseSafe('PAUSED');

        pushState();

        try {

          (globalThis as { __kr_bgm?: { pause?: () => void } }).__kr_bgm?.pause?.();

        } catch {

          /* ignore */

        }

      },

      resumeGame: () => {

        const s = sessionRef.current;

        if (s.isGameOver || s.stageResults) return;

        canRunRef.current = !s.activeQuestion && !s.activePuzzle;

        s.isPaused = false;

        if (s.activeQuestion) {

          setPhaseSafe('GATE_QUESTION');

        } else if (s.activePuzzle) {

          setPhaseSafe(s.eventPhase);

        } else {

          setPhaseSafe('RUNNING');

        }

        pushState();

        try {

          (globalThis as { __kr_bgm?: { resume?: () => void } }).__kr_bgm?.resume?.();

        } catch {

          /* ignore */

        }

      },

      restartStage: () => {

        sessionStartedRef.current = false;

        startSession();

        sessionStartedRef.current = true;

        try {

          void (globalThis as { __kr_bgm?: { start?: () => void } }).__kr_bgm?.start?.();

        } catch {

          /* ignore */

        }

      },

      returnToMainMenu: () => {

        canRunRef.current = false;

        sessionStartedRef.current = false;

        if (introTimerRef.current) clearTimeout(introTimerRef.current);

        audioRef.current?.stopLoop('sandstorm');

        resetSession();

        pushState({ returnToMenu: true });

        try {

          (globalThis as { __kr_bgm?: { stop?: () => void } }).__kr_bgm?.stop?.();

        } catch {

          /* ignore */

        }

      },

      resumeGameFromNoor: (isCorrect: boolean) => {

        const result = eventManagerRef.current.resolveGate80Answer(

          sessionRef.current,

          isCorrect,

          performance.now()

        );

        sessionRef.current = result.session;

        canRunRef.current = result.canRun;

        setPhaseSafe(result.phase);

        if (!isCorrect) audioRef.current?.play('fail');

        pushState();

        if (sessionRef.current.noorMessage) {

          setTimeout(() => {

            sessionRef.current.noorMessage = null;

            pushState();

          }, isCorrect ? 2500 : 2000);

        }

      },

      dismissMessage: () => beginRunning(),

      setSoundEnabled: (enabled: boolean) => {

        sessionRef.current.soundEnabled = enabled;

        audioRef.current?.setSoundEnabled(enabled);

        if (!enabled) audioRef.current?.stopLoop('sandstorm');

        pushState();

      },

      setMusicEnabled: (enabled: boolean) => {

        sessionRef.current.musicEnabled = enabled;

        if (typeof localStorage !== 'undefined') {

          localStorage.setItem('musicEnabled', enabled ? '1' : '0');

        }

        if (!enabled) {

          try {

            (globalThis as { __kr_bgm?: { pause?: () => void } }).__kr_bgm?.pause?.();

          } catch {

            /* ignore */

          }

        } else {

          try {

            void (globalThis as { __kr_bgm?: { resume?: () => void } }).__kr_bgm?.resume?.();

          } catch {

            /* ignore */

          }

        }

        pushState();

      },

      continueAfterStageResults: () => {

        sessionRef.current = eventManagerRef.current.continueAfterStageResults(

          sessionRef.current

        );

        canRunRef.current = false;

        setPhaseSafe(sessionRef.current.eventPhase);

        setZoneSafe(sessionRef.current.environmentZone);

        pushState();

        onScreenFade?.(sessionRef.current.screenFade);

      },

      resolvePuzzleAnswer: (answer: number | PuzzleAnswerPayload) => {

        const result = eventManagerRef.current.resolvePuzzleAnswer(

          sessionRef.current,

          answer

        );

        sessionRef.current = result.session;

        canRunRef.current = result.canRun;

        setPhaseSafe(result.phase);

        applyEventFlags(result.flags);

      },

    }));



    useEffect(() => {

      if (!active || sessionStartedRef.current) return;

      sessionStartedRef.current = true;

      startSession();

      return () => {

        if (introTimerRef.current) clearTimeout(introTimerRef.current);

      };

    }, [active, startSession]);



    useEffect(() => {

      if (!active || phase !== 'NUR_INTRO') return;

      const onTap = () => beginRunning();

      window.addEventListener('pointerdown', onTap);

      window.addEventListener('keydown', onTap);

      return () => {

        window.removeEventListener('pointerdown', onTap);

        window.removeEventListener('keydown', onTap);

      };

    }, [active, phase, beginRunning]);

    useEffect(() => {
      if (puzzleTimeoutRef.current) {
        clearTimeout(puzzleTimeoutRef.current);
        puzzleTimeoutRef.current = null;
      }
      const puzzle = sessionRef.current.activePuzzle;
      if (!puzzle || !active) return;
      puzzleTimeoutRef.current = setTimeout(() => {
        const failPayload =
          puzzle.mode === 'ONE_LINE'
            ? { mode: 'ONE_LINE' as const, success: false }
            : puzzle.mode === 'MCQ'
              ? { mode: 'MCQ' as const, selectedIndex: -1 }
              : puzzle.mode === 'MEMORY'
                ? { mode: 'MEMORY' as const, order: [] as number[] }
                : { mode: 'MATCH' as const, pairs: [] };
        const result = eventManagerRef.current.resolvePuzzleAnswer(
          sessionRef.current,
          failPayload
        );
        sessionRef.current = result.session;
        canRunRef.current = result.canRun;
        setPhaseSafe(result.phase);
        applyEventFlags(result.flags);
      }, puzzle.timeoutMs);
      return () => {
        if (puzzleTimeoutRef.current) clearTimeout(puzzleTimeoutRef.current);
      };
    }, [puzzleKey, active, applyEventFlags, setPhaseSafe]);

    const handleStarCollect = useCallback(

      (id: string) => {

        spawnManagerRef.current.markCollected(id);

        sessionRef.current = applyStarCollect(sessionRef.current);

        audioRef.current?.play('star');

        bumpRender();

        pushState();

      },

      [pushState, bumpRender]

    );



    const handleObstacleHit = useCallback(() => {

      const s = sessionRef.current;

      if (

        s.isGameOver ||

        s.isPaused ||

        s.activeQuestion ||

        s.activePuzzle ||

        s.eventPhase === 'STAGE_2_INTRO'

      ) {

        return;

      }

      const now = performance.now();

      if (now < s.invulnerableUntil) return;

      sessionRef.current = applyDamage(s, now);

      audioRef.current?.play('damage');

      if (sessionRef.current.isGameOver) canRunRef.current = false;

      pushState();

    }, [pushState]);



    const handleGate80Reach = useCallback(() => {

      const s = sessionRef.current;

      if (s.gate80Triggered || s.gate80Passed || s.activeQuestion) return;

      canRunRef.current = false;

      audioRef.current?.play('gate');

      const result = eventManagerRef.current.triggerGate80(s);

      sessionRef.current = result.session;

      setPhaseSafe(result.phase);

      pushState();

    }, [pushState, setPhaseSafe]);



    const isQuestionActive = phase === 'GATE_QUESTION' || !!sessionRef.current.activeQuestion;

    const isPuzzleActive = !!sessionRef.current.activePuzzle;

    const isResultsFrozen = !!sessionRef.current.stageResults;

    const isPausedRun =

      phase === 'PAUSED' ||

      phase === 'NUR_INTRO' ||

      isQuestionActive ||

      isPuzzleActive ||

      isResultsFrozen ||

      phase === 'LEVEL_END_GATE' ||

      phase === 'LEVEL_END_RESULTS' ||

      phase === 'SANDSTORM_SHELTER';



    useFrame(({ clock }) => {

      if (!active) return;



      const deltaMs = lastDeltaMsRef.current;

      lastDeltaMsRef.current = Math.min(50, clock.getDelta() * 1000);



      playerBodyRef.current = playerRef.current?.getBody() ?? null;



      const s = sessionRef.current;



      if (s.isGameOver) {

        canRunRef.current = false;

        return;

      }



      // Event manager update (always runs for transitions/cinematics)

      const eventResult = eventManagerRef.current.update(s, s.playerZ, deltaMs);

      sessionRef.current = eventResult.session;

      applyEventFlags(eventResult.flags);

      const puzzleId = sessionRef.current.activePuzzle?.id ?? 'none';
      if (puzzleId !== puzzleKey) {
        setPuzzleKey(puzzleId);
      }

      if (sessionRef.current.environmentZone !== zone) {

        setZoneSafe(sessionRef.current.environmentZone);

      }

      if (sessionRef.current.eventPhase !== phase) {

        setPhaseSafe(sessionRef.current.eventPhase);

      }



      sandstormIntensityRef.current = sessionRef.current.sandstormIntensity;

      onScreenFade?.(sessionRef.current.screenFade);



      // Fog color by zone

      const isCity =
        sessionRef.current.environmentZone === 'CITY' ||
        sessionRef.current.environmentZone === 'TRANSITION';
      if (fogRef.current) {
        if (sessionRef.current.sandstormIntensity > 0.05) {
          fogRef.current.color.set(THEME.SANDSTORM_FOG);
          fogRef.current.far = WORLD.FOG_FAR * 0.7;
        } else if (isCity) {
          fogRef.current.color.set(THEME_CITY.GROUND_DARK);
          fogRef.current.far = WORLD.FOG_FAR;
        } else {
          fogRef.current.color.set(THEME.GROUND_DARK);
          fogRef.current.far = WORLD.FOG_FAR;
        }
      }



      // City spawn mode switch

      if (

        sessionRef.current.currentStage >= 2 &&

        sessionRef.current.cityStartZ >= 0 &&

        !cityModeAppliedRef.current

      ) {

        cityModeAppliedRef.current = true;

        spawnManagerRef.current.setCityMode(true, sessionRef.current.cityStartZ);

        bumpRender();

      }



      if (isPausedRun && sessionRef.current.eventPhase !== 'SANDSTORM_APPROACH') {

        if (

          sessionRef.current.eventPhase !== 'LEVEL_TRANSITION' &&

          sessionRef.current.eventPhase !== 'STAGE_2_INTRO' &&

          sessionRef.current.eventPhase !== 'LEVEL_END_GATE'

        ) {

          canRunRef.current = false;

        }

      }



      const speedTarget = eventManagerRef.current.getRunSpeedTarget(

        sessionRef.current,

        PHYSICS_3D.RUN_SPEED_MPS

      );

      runSpeedRef.current = THREE.MathUtils.lerp(

        runSpeedRef.current,

        speedTarget,

        0.04

      );



      if (

        eventManagerRef.current.shouldSlowForGate80(

          sessionRef.current.playerZ,

          sessionRef.current.gate80Passed

        )

      ) {

        runSpeedRef.current = THREE.MathUtils.lerp(

          runSpeedRef.current,

          PHYSICS_3D.RUN_SPEED_START_MPS * 0.55,

          0.06

        );

      }



      if (

        eventManagerRef.current.shouldSlowForLevelEnd(

          sessionRef.current.playerZ,

          sessionRef.current.levelEndTriggered

        )

      ) {

        runSpeedRef.current = THREE.MathUtils.lerp(

          runSpeedRef.current,

          PHYSICS_3D.RUN_SPEED_START_MPS * 0.55,

          0.06

        );

      }



      const canMove =

        !isPausedRun ||

        sessionRef.current.eventPhase === 'SANDSTORM_APPROACH' ||

        sessionRef.current.eventPhase === 'LEVEL_END_APPROACH';

      canRunRef.current = canMove && speedTarget > 0 && !sessionRef.current.stageResults;



      const pos = playerRef.current?.getPosition();

      if (pos) {

        cameraTargetRef.current.copy(pos);

        sessionRef.current = trackProgress(sessionRef.current, pos.z);

        setPlayerZ(pos.z);



        const spawningAllowed = eventManagerRef.current.isSpawningAllowed(

          sessionRef.current.eventPhase

        );

        if (

          spawnManagerRef.current.update(

            pos.z,

            GATE80_Z,

            LEVEL_END_GATE_Z,

            spawningAllowed

          )

        ) {

          bumpRender();

        }



        if (!jumpHintShownRef.current) {

          const hint = eventManagerRef.current.maybeShowJumpHint(sessionRef.current, pos.z);

          if (hint) {

            jumpHintShownRef.current = true;

            sessionRef.current = hint;

            setPhaseSafe('RUNNING');

            pushState();

            setTimeout(() => {

              if (sessionRef.current.noorMessage?.text === hint.noorMessage?.text) {

                sessionRef.current.noorMessage = null;

                pushState();

              }

            }, 2800);

          }

        }

      }



      if (sessionRef.current.eventPhase === 'LEVEL_END_RESULTS') {

        canRunRef.current = false;

      }



      pushStateThrottled(clock.getElapsedTime() * 1000);

    });



    const session = sessionRef.current;

    const visibleEntities = spawnManagerRef.current.visibleEntities();

    const showTent =

      session.tentZ > 0 &&

      (session.eventPhase === 'SANDSTORM_APPROACH' ||

        session.eventPhase === 'SANDSTORM_SHELTER' ||

        session.eventPhase === 'SANDSTORM_EXIT');

    const showLevelEndGate =

      session.levelEndTriggered &&

      session.currentStage === 1 &&

      session.eventPhase !== 'LEVEL_TRANSITION';

    const showCitySkyline =

      session.environmentZone === 'CITY' || session.environmentZone === 'TRANSITION';



    return (

      <Physics gravity={[0, PHYSICS_3D.GRAVITY, 0]}>

        <Sky zone={zone} />

        <Lighting />

        <SandstormOverlay intensityRef={sandstormIntensityRef} />

        {showCitySkyline && <CitySkyline playerZ={playerZ} />}

        <ChunkStream playerZ={playerZ} zone={zone} />

        <FollowCamera targetRef={cameraTargetRef} />

        <PlayerController

          ref={playerRef}

          key={sessionKeyRef.current}

          runSpeedRef={runSpeedRef}

          canRunRef={canRunRef}

          gameOver={session.isGameOver}

          invulnerable={performance.now() < session.invulnerableUntil}

          hidden={session.playerHidden}

          onJump={() => audioRef.current?.play('jump')}

          onPositionUpdate={(z) => {

            sessionRef.current.playerZ = z;

            cameraTargetRef.current.z = z;

          }}

        />

        {visibleEntities.map((e) =>

          e.kind === 'star' ? (

            <StarEntity

              key={e.id}

              id={e.id}

              position={[e.x, e.y, e.z]}

              onCollect={handleStarCollect}

              playerBodyRef={playerBodyRef}

              disabled={isPausedRun}

            />

          ) : (

            <ObstacleEntity

              key={e.id}

              id={e.id}

              variant={e.obstacleVariant}

              position={[e.x, e.y, e.z]}

              onHit={handleObstacleHit}

              playerBodyRef={playerBodyRef}

              disabled={isPausedRun}

            />

          )

        )}

        {!session.gate80Passed && session.currentStage === 1 && (

          <MagicGate

            position={[0, 0, GATE80_Z]}

            onReach={handleGate80Reach}

            playerBodyRef={playerBodyRef}

            active={!session.gate80Triggered}

            passed={session.gate80Passed}

          />

        )}

        {showLevelEndGate && (

          <MagicGate

            position={[0, 0, LEVEL_END_GATE_Z]}

            playerBodyRef={playerBodyRef}

            active={session.eventPhase === 'LEVEL_END_APPROACH'}

            passed={false}

            opened={session.levelEndGateOpen}

            isLevelEnd

          />

        )}

        {showTent && (

          <BedouinTent

            position={[0, 0, session.tentZ]}

            occupied={session.eventPhase === 'SANDSTORM_SHELTER'}

          />

        )}

      </Physics>

    );

  }

);

