import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { createGame } from './game/game';
import { GameUI } from './components/GameUI';
import { StageResultsUI } from './components/StageResultsUI';
import { HomeUI } from './components/HomeUI';
import { HowToPlayUI } from './components/HowToPlayUI';
import { GameDetailsUI } from './components/GameDetailsUI';
import { AgeSelectionUI } from './components/AgeSelectionUI';
import { GameCanvas3D } from './components/GameCanvas3D';
import { GameState, AgeGroup } from './types';
import { MainScene } from './game/scenes/MainScene';
import { HomeScene } from './game/scenes/HomeScene';
import type { GameWorldHandle } from './game3d/GameWorldHandle';

type GameStatus = 'intro_gate' | 'home' | 'how_to_play' | 'age_select' | 'game_details' | 'loading_play' | 'playing';
type RenderMode = '2d' | '3d';

const RENDER_MODE: RenderMode =
  import.meta.env.VITE_RENDER_MODE === '3d' ? '3d' : '2d';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const game3dRef = useRef<GameWorldHandle | null>(null);
  const renderMode = RENDER_MODE;
  const [isLoaded, setIsLoaded] = useState(false);
  const uiButtonAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const stage2BgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const menuBgmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Game Flow: intro_gate -> home -> how_to_play -> age_select -> game_details -> playing
  const [gameStatus, setGameStatus] = useState<GameStatus>('intro_gate');
  
  const [gameState, setGameState] = useState<GameState>({
    distance: 0,
    hearts: 3,
    stars: 0,
    isGameOver: false,
    activeQuestion: null,
    activeMessage: undefined,
    noorMessage: null,
    ageGroup: undefined
  });

  const applyGameStateUpdate = useCallback((data: Record<string, unknown>) => {
    if (data.returnToMenu) {
      setGameStatus('home');
      try {
        (globalThis as any).__kr_bgm?.stop?.();
      } catch (_) { /* ignore */ }
      try {
        const musicDisabled =
          typeof localStorage !== 'undefined' && localStorage.getItem('musicEnabled') === '0';
        if (!musicDisabled && menuBgmAudioRef.current) {
          void menuBgmAudioRef.current.play();
        }
      } catch {
        // ignore
      }
    }
    if (data.currentStage !== undefined) {
      try { ((globalThis as any).__kr_bgm as any).currentStage = data.currentStage as number; } catch (_) { /* ignore */ }
    }
    setGameState(prev => ({
      ...prev,
      distance: data.distance !== undefined ? (data.distance as number) : prev.distance,
      stars: data.stars !== undefined ? (data.stars as number) : prev.stars,
      hearts: data.hearts !== undefined ? (data.hearts as number) : prev.hearts,
      isGameOver: data.isGameOver !== undefined ? (data.isGameOver as boolean) : prev.isGameOver,
      activeQuestion: data.activeQuestion as GameState['activeQuestion'],
      activeMessage: data.activeMessage as GameState['activeMessage'],
      noorMessage: data.noorMessage as GameState['noorMessage'],
      stageResults: data.stageResults as GameState['stageResults'],
      isHanging: data.isHanging !== undefined ? (data.isHanging as boolean) : prev.isHanging,
      climbProgress: data.climbProgress !== undefined ? (data.climbProgress as number) : prev.climbProgress,
      stageProgressPercent: data.stageProgressPercent !== undefined ? (data.stageProgressPercent as number) : prev.stageProgressPercent,
      currentStage: data.currentStage !== undefined ? (data.currentStage as number) : prev.currentStage,
      stageTitle: 'stageTitle' in data ? (data.stageTitle as string | null) : prev.stageTitle,
      soundEnabled: data.soundEnabled !== undefined ? (data.soundEnabled as boolean) : prev.soundEnabled,
      musicEnabled: data.musicEnabled !== undefined ? (data.musicEnabled as boolean) : prev.musicEnabled,
      activePuzzle: 'activePuzzle' in data ? (data.activePuzzle as GameState['activePuzzle']) : prev.activePuzzle,
      isPaused: 'isPaused' in data ? (data.isPaused as boolean) : prev.isPaused
    }));
  }, []);

  useEffect(() => {
    if (renderMode !== '2d') return;
    if (gameRef.current) return;

    const game = createGame('game-container', (data) => {
      applyGameStateUpdate(data as Record<string, unknown>);
    });

    gameRef.current = game;

    const waitForAudio = (audio: HTMLAudioElement | null): Promise<void> =>
      new Promise((resolve) => {
        if (!audio) return resolve();
        const onReady = () => {
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('loadeddata', onReady);
          resolve();
        };
        audio.addEventListener('canplaythrough', onReady);
        audio.addEventListener('loadeddata', onReady);
        // Fallback in case events never fire
        setTimeout(() => {
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('loadeddata', onReady);
          resolve();
        }, 4000);
        try {
          audio.load();
        } catch {
          resolve();
        }
      });

    const preloadUiAndMenuAudio = async () => {
      // Prepare UI button sound
      if (!uiButtonAudioRef.current) {
        const btn = new Audio('/audio/button.wav');
        btn.preload = 'auto';
        btn.volume = 0.6;
        uiButtonAudioRef.current = btn;
      }

      // Prepare main menu BGM
      if (!menuBgmAudioRef.current) {
        const menu = new Audio('/audio/mainMenu.mp3');
        menu.preload = 'auto';
        menu.loop = true;
        menu.volume = 0.28;
        menuBgmAudioRef.current = menu;
      }

      await Promise.all([
        waitForAudio(uiButtonAudioRef.current),
        waitForAudio(menuBgmAudioRef.current)
      ]);
    };

    void (async () => {
      try {
        await preloadUiAndMenuAudio();
      } finally {
        setIsLoaded(true);
      }
    })();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [renderMode, applyGameStateUpdate]);

  // 3D mode: preload UI/menu audio without Phaser
  useEffect(() => {
    if (renderMode !== '3d') return;

    const waitForAudio = (audio: HTMLAudioElement | null): Promise<void> =>
      new Promise((resolve) => {
        if (!audio) return resolve();
        const onReady = () => {
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('loadeddata', onReady);
          resolve();
        };
        audio.addEventListener('canplaythrough', onReady);
        audio.addEventListener('loadeddata', onReady);
        setTimeout(() => {
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('loadeddata', onReady);
          resolve();
        }, 4000);
        try {
          audio.load();
        } catch {
          resolve();
        }
      });

    void (async () => {
      if (!uiButtonAudioRef.current) {
        const btn = new Audio('/audio/button.wav');
        btn.preload = 'auto';
        btn.volume = 0.6;
        uiButtonAudioRef.current = btn;
      }
      if (!menuBgmAudioRef.current) {
        const menu = new Audio('/audio/mainMenu.mp3');
        menu.preload = 'auto';
        menu.loop = true;
        menu.volume = 0.28;
        menuBgmAudioRef.current = menu;
      }
      await Promise.all([
        waitForAudio(uiButtonAudioRef.current),
        waitForAudio(menuBgmAudioRef.current)
      ]);
      setIsLoaded(true);
    })();
  }, [renderMode]);

  // Global BGM controller (HTMLAudio): Stage 1 = background-music.mp3, Stage 2 = stage2BackgroundMusic.mp3.
  useEffect(() => {
    try {
      if (!bgmAudioRef.current) {
        const a = new Audio('/audio/background-music.mp3');
        a.preload = 'auto';
        a.loop = true;
        a.volume = 0.28;
        bgmAudioRef.current = a;
      }
      if (!stage2BgmAudioRef.current) {
        const a2 = new Audio('/audio/stage2BackgroundMusic.mp3');
        a2.preload = 'auto';
        a2.loop = true;
        a2.volume = 0.28;
        stage2BgmAudioRef.current = a2;
      }
      const api = (globalThis as any).__kr_bgm = {
        currentStage: 1 as number,
        start: async () => {
          const stage = (api.currentStage ?? 1) as number;
          bgmAudioRef.current?.pause();
          stage2BgmAudioRef.current?.pause();
          try { if (bgmAudioRef.current) bgmAudioRef.current.currentTime = 0; } catch (_) { /* ignore */ }
          try { if (stage2BgmAudioRef.current) stage2BgmAudioRef.current.currentTime = 0; } catch (_) { /* ignore */ }
          const a = stage === 2 ? stage2BgmAudioRef.current : bgmAudioRef.current;
          if (a) try { await a.play(); } catch (_) { /* autoplay blocked */ }
        },
        pause: () => {
          bgmAudioRef.current?.pause();
          stage2BgmAudioRef.current?.pause();
        },
        resume: async () => {
          const stage = (api.currentStage ?? 1) as number;
          const a = stage === 2 ? stage2BgmAudioRef.current : bgmAudioRef.current;
          if (a) try { await a.play(); } catch (_) { /* autoplay blocked */ }
        },
        stop: () => {
          bgmAudioRef.current?.pause();
          stage2BgmAudioRef.current?.pause();
          try { if (bgmAudioRef.current) bgmAudioRef.current.currentTime = 0; } catch (_) { /* ignore */ }
          try { if (stage2BgmAudioRef.current) stage2BgmAudioRef.current.currentTime = 0; } catch (_) { /* ignore */ }
        }
      };
    } catch (_) {
      // ignore
    }
    return () => {
      try { delete (globalThis as any).__kr_bgm; } catch (_) { /* ignore */ }
    };
  }, []);

  // Auto-attempt to start main menu BGM as soon as LOADING WORLD finishes
  // and the home screen is visible. Browsers may still block this on
  // very first load; we catch and ignore that case so it doesn't log errors.
  useEffect(() => {
    if (!isLoaded || gameStatus !== 'home') return;

    const musicDisabled =
      typeof localStorage !== 'undefined' && localStorage.getItem('musicEnabled') === '0';
    if (musicDisabled) return;

    if (!menuBgmAudioRef.current) {
      const menu = new Audio('/audio/mainMenu.mp3');
      menu.preload = 'auto';
      menu.loop = true;
      menu.volume = 0.28;
      menuBgmAudioRef.current = menu;
    }

    const menu = menuBgmAudioRef.current;
    if (!menu) return;

    void menu.play().catch(() => {
      // Autoplay blocked – will be retried on first button click.
    });
  }, [isLoaded, gameStatus]);

  // When game is ready, leave loading screen.
  useEffect(() => {
    if (gameStatus !== 'loading_play') return;
    if (renderMode === '3d') {
      const t = setTimeout(() => setGameStatus('playing'), 300);
      return () => clearTimeout(t);
    }
    if (gameState.noorMessage) {
      setGameStatus('playing');
    }
  }, [gameStatus, gameState.noorMessage, renderMode]);

  // Switch BGM track when stage changes during gameplay (Stage 1 vs Stage 2).
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const musicDisabled = typeof localStorage !== 'undefined' && localStorage.getItem('musicEnabled') === '0';
    if (musicDisabled) return;
    const stage = gameState.currentStage ?? 1;
    if (stage === 2) {
      bgmAudioRef.current?.pause();
      try { if (stage2BgmAudioRef.current) void stage2BgmAudioRef.current.play(); } catch (_) { /* ignore */ }
    } else {
      stage2BgmAudioRef.current?.pause();
      try { if (bgmAudioRef.current) void bgmAudioRef.current.play(); } catch (_) { /* ignore */ }
    }
  }, [gameStatus, gameState.currentStage]);

  const playUIButton = () => {
    try {
      if (!uiButtonAudioRef.current) {
        const a = new Audio('/audio/button.wav');
        a.preload = 'auto';
        a.volume = 0.6;
        uiButtonAudioRef.current = a;
      }
      const a = uiButtonAudioRef.current;
      a.currentTime = 0;
      void a.play();
    } catch (_) {
      // ignore (browser policy / missing audio device)
    }
  };

  // Intro gate: shown once after LOADING WORLD, before the animated home menu.
  // Starts menu music and resumes Phaser audio context on the very first user tap.
  const handleIntroGateClick = () => {
    playUIButton();

    try {
      const musicDisabled =
        typeof localStorage !== 'undefined' && localStorage.getItem('musicEnabled') === '0';
      if (!musicDisabled) {
        if (!menuBgmAudioRef.current) {
          const menu = new Audio('/audio/mainMenu.mp3');
          menu.preload = 'auto';
          menu.loop = true;
          menu.volume = 0.28;
          menuBgmAudioRef.current = menu;
        }
        void menuBgmAudioRef.current?.play();
      }

      // Also resume Phaser's Web Audio context on the first click to avoid warnings.
      const anyGame = gameRef.current as any;
      const audioCtx = anyGame?.sound?.context as AudioContext | undefined;
      if (audioCtx && audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }
    } catch {
      // ignore – browser may still block, but subsequent clicks can retry
    }

    setGameStatus('home');
  };

  // 1. Home -> How To Play
  const handleStartGameClick = () => {
      playUIButton();

      if (renderMode === '3d') {
          setGameStatus('how_to_play');
          return;
      }

      if (gameRef.current) {
          const homeScene = gameRef.current.scene.getScene('HomeScene') as HomeScene;
          
          if (homeScene) {
              homeScene.startGameTransition(() => {
                  setGameStatus('how_to_play');
              });
          } else {
              setGameStatus('how_to_play');
          }
      }
  };

  // 2. How To Play -> Age Selection
  const handleHowToPlayNext = () => {
      playUIButton();
      setGameStatus('age_select');
  };

  // 3. Age Selection -> Game Details
  const handleAgeSelect = (age: AgeGroup) => {
      playUIButton();
      setGameState(prev => ({ ...prev, ageGroup: age }));
      setGameStatus('game_details');
  };

  // 4. Game Details -> Playing (show loading while MainScene create() runs)
  const handleGameDetailsNext = () => {
      playUIButton();
      try {
        if (menuBgmAudioRef.current) {
          menuBgmAudioRef.current.pause();
          try { menuBgmAudioRef.current.currentTime = 0; } catch { /* ignore */ }
        }
        void (globalThis as any).__kr_bgm?.start?.();
      } catch (_) {
        /* ignore */
      }
      setGameStatus('loading_play');

      if (renderMode === '3d') {
        setGameState(prev => ({
          ...prev,
          distance: 0,
          hearts: 3,
          stars: 0,
          isGameOver: false,
          activeQuestion: null,
          activeMessage: undefined,
          noorMessage: null,
          stageResults: undefined,
          currentStage: 1,
          isPaused: false,
        }));
        return;
      }

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (gameRef.current) {
            gameRef.current.scene.stop('HomeScene');
            gameRef.current.scene.start('MainScene');
          }
        }, 0);
      });
  };

  const handleRestart = () => {
    playUIButton();
    try { void (globalThis as any).__kr_bgm?.start?.(); } catch (_) { /* ignore */ }
    if (renderMode === '3d') {
      game3dRef.current?.restartStage();
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene');
      if (scene) {
        scene.scene.restart();
      }
    }
    setGameState(prev => ({
      ...prev,
      distance: 0,
      hearts: 3,
      stars: 0,
      isGameOver: false,
      activeQuestion: null,
      activeMessage: undefined,
      noorMessage: null,
      stageResults: undefined
    }));
  };
  
  const handleNoorAnswer = (isCorrect: boolean) => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.resumeGameFromNoor(isCorrect);
    } else if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
        if (scene) {
            scene.resumeGameFromNoor(isCorrect);
        }
    }
  };

  const handleMessageDismiss = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.dismissMessage();
    } else if (gameRef.current) {
        const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
        if (scene) {
            scene.dismissMessage();
        }
    }
  };

  const handleStageResultsContinue = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.continueAfterStageResults();
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      if (scene) {
        scene.continueAfterStageResults();
      }
    }
  };

  const handleSoundToggle = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.setSoundEnabled(!(gameState.soundEnabled !== false));
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      if (scene?.setSoundEnabled) scene.setSoundEnabled(!(gameState.soundEnabled !== false));
    }
  };

  const handlePuzzleAnswer = (answer: unknown) => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.resolvePuzzleAnswer(answer as number | import('./types').PuzzleAnswerPayload);
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      if (scene && typeof (scene as any).resolvePuzzleAnswer === 'function') {
        (scene as any).resolvePuzzleAnswer(answer);
      }
    }
  };

  const handleMusicToggle = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.setMusicEnabled(!(gameState.musicEnabled !== false));
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      if (scene?.setMusicEnabled) scene.setMusicEnabled(!(gameState.musicEnabled !== false));
    }
  };

  const handlePauseClick = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.pauseGame();
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      scene?.pauseGame?.();
    }
  };

  const handleResumeClick = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.resumeGame();
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      scene?.resumeGame?.();
    }
  };

  const handleRestartStageClick = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.restartStage();
      setGameState((prev) => ({
        ...prev,
        distance: 0,
        hearts: 3,
        stars: 0,
        isGameOver: false,
        activeQuestion: null,
        activeMessage: undefined,
        noorMessage: null,
        stageResults: undefined,
        isPaused: false,
        stageProgressPercent: 0,
      }));
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      scene?.restartStage?.();
    }
  };

  const handleReturnToMenuClick = () => {
    playUIButton();
    if (renderMode === '3d') {
      game3dRef.current?.returnToMainMenu();
    } else if (gameRef.current) {
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
      scene?.returnToMainMenu?.();
    }
  };

  // Auto-pause when the user leaves the game (switch tab, minimize, another app). Game does not run in background.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      if (renderMode === '3d') {
        if (gameStatus === 'playing') game3dRef.current?.pauseGame();
        return;
      }
      if (!gameRef.current) return;
      if (!gameRef.current.scene.isActive('MainScene')) return;
      const scene = gameRef.current.scene.getScene('MainScene') as MainScene | undefined;
      if (scene?.pauseGame && typeof scene.pauseGame === 'function') scene.pauseGame();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [renderMode, gameStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isGameOver && e.key.toLowerCase() === 'r') {
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState.isGameOver]);

  const game3dGameplayActive =
    renderMode === '3d' && (gameStatus === 'loading_play' || gameStatus === 'playing');

  return (
    <div className="relative w-full h-screen bg-[#1a1625] overflow-hidden select-none touch-none">
       {/* 2D Phaser canvas */}
      {renderMode === '2d' && (
        <div id="game-container" className="absolute inset-0 z-0" />
      )}

      {/* 3D R3F canvas */}
      {renderMode === '3d' && (
        <GameCanvas3D
          ref={game3dRef}
          gameplayActive={game3dGameplayActive}
          onStateUpdate={applyGameStateUpdate}
        />
      )}
      
      {/* Intro Gate: subtle tap-to-begin screen before main menu */}
      {isLoaded && gameStatus === 'intro_gate' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1625] z-20">
          <div className="flex flex-col items-center gap-6 px-4 text-center">
            <div className="text-yellow-300 text-2xl md:text-3xl font-bold tracking-wide">
              اضغط لبدء المغامرة
            </div>
            <button
              type="button"
              onClick={handleIntroGateClick}
              className="px-10 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-lg shadow-lg shadow-amber-500/40 transition transform hover:-translate-y-0.5"
            >
              ابدأ المغامرة
            </button>
          </div>
        </div>
      )}
      
      {/* 1. Home Screen UI */}
      {isLoaded && gameStatus === 'home' && (
          <HomeUI onStart={handleStartGameClick} />
      )}
      
      {/* 2. How To Play */}
      {isLoaded && gameStatus === 'how_to_play' && (
          <HowToPlayUI onNext={handleHowToPlayNext} />
      )}

      {/* 3. Age Selection */}
      {isLoaded && gameStatus === 'age_select' && (
          <AgeSelectionUI onSelect={handleAgeSelect} />
      )}

      {/* 4. Game Details */}
      {isLoaded && gameStatus === 'game_details' && (
          <GameDetailsUI onNext={handleGameDetailsNext} />
      )}

      {/* 4b. Loading before play (MainScene create / Nur intro prep) */}
      {isLoaded && gameStatus === 'loading_play' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1625] z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-amber-400 font-bold text-xl tracking-widest">جاري تحضير مغامرتك</div>
          </div>
        </div>
      )}
      
      {/* 3D: tap to start running during Nur welcome */}
      {isLoaded && renderMode === '3d' && gameStatus === 'playing' && gameState.noorMessage?.isSoftPause && (
        <div className="absolute inset-0 z-30 flex items-end justify-center pb-32 pointer-events-none">
          <button
            type="button"
            onClick={() => game3dRef.current?.dismissMessage()}
            className="pointer-events-auto px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-lg shadow-lg shadow-amber-500/50 animate-pulse"
          >
            اضغط للانطلاق
          </button>
        </div>
      )}

      {/* 5. Gameplay UI Overlay */}
      {isLoaded && gameStatus === 'playing' && (
        <>
          <GameUI 
            gameState={gameState} 
            onRestart={handleRestart} 
            onAnswer={handleNoorAnswer} 
            onMessageDismiss={handleMessageDismiss}
            onPuzzleAnswer={handlePuzzleAnswer}
            onSoundToggle={handleSoundToggle}
            onMusicToggle={handleMusicToggle}
            onPauseClick={handlePauseClick}
            onResumeClick={handleResumeClick}
            onRestartStageClick={handleRestartStageClick}
            onReturnToMenuClick={handleReturnToMenuClick}
          />
          {gameState.stageResults && (
            <StageResultsUI
              data={gameState.stageResults}
              onContinue={handleStageResultsContinue}
            />
          )}
        </>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1625] z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-yellow-400 font-bold text-xl tracking-widest">جاري تحميل العالم</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;