import React, { Suspense, forwardRef, Component, ErrorInfo, ReactNode, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameWorld } from '../game3d/world/GameWorld';
import { IdleDesertScene } from '../game3d/world/IdleDesertScene';
import type { GameWorldHandle } from '../game3d/GameWorldHandle';
import type { GameState } from '../types';

interface GameCanvas3DProps {
  /** When true, full gameplay (player, spawns, gate). When false, ambient menu backdrop. */
  gameplayActive: boolean;
  onStateUpdate: (data: Partial<GameState> & { returnToMenu?: boolean }) => void;
}

interface BoundaryProps {
  children: ReactNode;
  resetKey: string;
}

interface BoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GameCanvas3D]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1625] text-amber-400 gap-4 px-6 text-center">
          <p className="text-lg font-bold">تعذر تحميل العالم ثلاثي الأبعاد</p>
          <button
            type="button"
            className="px-6 py-2 rounded-full bg-amber-400 text-slate-900 font-bold"
            onClick={() => this.setState({ hasError: false })}
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const GameCanvas3D = forwardRef<GameWorldHandle, GameCanvas3DProps>(
  function GameCanvas3D({ gameplayActive, onStateUpdate }, ref) {
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);
    const resetKey = gameplayActive ? 'gameplay' : 'idle';
    const [screenFade, setScreenFade] = useState(0);
    const onScreenFade = useCallback((opacity: number) => {
      setScreenFade(opacity);
    }, []);

    return (
      <>
        <CanvasErrorBoundary resetKey={resetKey}>
          <Canvas
            className="absolute inset-0"
            dpr={dpr}
            shadows={false}
            camera={{ fov: 52, near: 0.1, far: 250, position: [-10, 5, -4] }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ background: '#1a1625' }}
          >
            <Suspense fallback={null}>
              {gameplayActive ? (
                <GameWorld
                  ref={ref}
                  active={gameplayActive}
                  onStateUpdate={onStateUpdate}
                  onScreenFade={onScreenFade}
                />
              ) : (
                <IdleDesertScene />
              )}
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
        {gameplayActive && screenFade > 0.01 && (
          <div
            className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300"
            style={{
              background: `rgba(255, 220, 150, ${Math.min(1, screenFade)})`,
            }}
          />
        )}
      </>
    );
  }
);
