import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { PlayerVisual } from './PlayerVisual';
import { PHYSICS_3D, WORLD } from '../core/config';

export interface PlayerControllerHandle {
  getBody: () => RapierRigidBody | null;
  getPosition: () => THREE.Vector3;
  reset: () => void;
}

interface PlayerControllerProps {
  runSpeedRef: React.RefObject<number>;
  canRunRef: React.RefObject<boolean>;
  gameOver: boolean;
  invulnerable: boolean;
  hidden?: boolean;
  onJump?: () => void;
  onPositionUpdate?: (z: number, y: number) => void;
}

const GROUND_CENTER_Y =
  WORLD.GROUND_Y + WORLD.PLAYER_CAPSULE_HALF_HEIGHT + WORLD.PLAYER_CAPSULE_RADIUS;

export const PlayerController = forwardRef<PlayerControllerHandle, PlayerControllerProps>(
  function PlayerController(
    { runSpeedRef, canRunRef, gameOver, invulnerable, hidden, onJump, onPositionUpdate },
    ref
  ) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const positionRef = useRef(new THREE.Vector3(0, GROUND_CENTER_Y, 0));
    const jumpBufferRef = useRef(0);
    const coyoteRef = useRef(0);
    const groundedRef = useRef(true);
    const verticalVelRef = useRef(0);

    useImperativeHandle(ref, () => ({
      getBody: () => bodyRef.current,
      getPosition: () => {
        if (bodyRef.current) {
          const t = bodyRef.current.translation();
          positionRef.current.set(t.x, t.y, t.z);
        }
        return positionRef.current;
      },
      reset: () => {
        verticalVelRef.current = 0;
        jumpBufferRef.current = 0;
        coyoteRef.current = PHYSICS_3D.COYOTE_TIME_MS;
        groundedRef.current = true;
        bodyRef.current?.setTranslation({ x: 0, y: GROUND_CENTER_Y, z: 0 }, true);
        bodyRef.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      },
    }));

    const tryJump = useCallback(() => {
      if (!canRunRef.current || gameOver) return;
      jumpBufferRef.current = PHYSICS_3D.BUFFER_TIME_MS;
    }, [canRunRef, gameOver]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          tryJump();
        }
      };
      const onPointer = (e: PointerEvent) => {
        if ((e.target as HTMLElement)?.closest?.('button, a, input, [role="button"]')) return;
        tryJump();
      };
      window.addEventListener('keydown', onKey);
      window.addEventListener('pointerdown', onPointer);
      return () => {
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('pointerdown', onPointer);
      };
    }, [tryJump]);

    useFrame((_, delta) => {
      const body = bodyRef.current;
      if (!body || gameOver) return;

      const canRun = canRunRef.current ?? false;
      const speed = canRun ? (runSpeedRef.current ?? 0) : 0;
      const dtMs = delta * 1000;
      const trans = body.translation();

      const isGrounded = trans.y <= GROUND_CENTER_Y + 0.08 && verticalVelRef.current <= 0.1;

      if (isGrounded) {
        coyoteRef.current = PHYSICS_3D.COYOTE_TIME_MS;
        groundedRef.current = true;
        verticalVelRef.current = 0;
      } else {
        coyoteRef.current = Math.max(0, coyoteRef.current - dtMs);
        groundedRef.current = coyoteRef.current > 0;
        verticalVelRef.current += PHYSICS_3D.GRAVITY * delta;
      }

      if (jumpBufferRef.current > 0) {
        jumpBufferRef.current = Math.max(0, jumpBufferRef.current - dtMs);
        if (groundedRef.current) {
          verticalVelRef.current = PHYSICS_3D.JUMP_VELOCITY;
          jumpBufferRef.current = 0;
          groundedRef.current = false;
          onJump?.();
        }
      }

      let newY = trans.y + verticalVelRef.current * delta;
      if (newY < GROUND_CENTER_Y) {
        newY = GROUND_CENTER_Y;
        verticalVelRef.current = 0;
        groundedRef.current = true;
      }

      const newZ = trans.z + speed * delta;
      body.setNextKinematicTranslation({ x: 0, y: newY, z: newZ });
      body.setLinvel({ x: 0, y: verticalVelRef.current, z: speed }, true);

      positionRef.current.set(0, newY, newZ);
      onPositionUpdate?.(newZ, newY);
    });

    return (
      <RigidBody
        ref={bodyRef}
        type="kinematicPosition"
        colliders={false}
        lockRotations
        position={[0, GROUND_CENTER_Y, 0]}
      >
        <CapsuleCollider
          args={[WORLD.PLAYER_CAPSULE_HALF_HEIGHT, WORLD.PLAYER_CAPSULE_RADIUS]}
        />
        <PlayerVisual invulnerable={invulnerable} hidden={hidden} canRunRef={canRunRef} />
      </RigidBody>
    );
  }
);
