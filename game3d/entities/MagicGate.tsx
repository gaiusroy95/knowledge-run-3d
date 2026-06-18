import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import type * as THREE from 'three';
import { THEME } from '../core/config';

interface MagicGateProps {
  position: [number, number, number];
  onReach?: () => void;
  playerBodyRef: React.RefObject<RapierRigidBody | null>;
  active: boolean;
  passed: boolean;
  opened?: boolean;
  /** When true, gate triggers level-end cinematic instead of MCQ */
  isLevelEnd?: boolean;
}

export function MagicGate({
  position,
  onReach,
  playerBodyRef,
  active,
  passed,
  opened = false,
  isLevelEnd = false,
}: MagicGateProps) {
  const triggeredRef = useRef(false);
  const glowRef = useRef<THREE.Group>(null);
  const portalScaleRef = useRef(1);

  useFrame((_, delta) => {
    if (glowRef.current && active && !passed) {
      glowRef.current.rotation.y += delta * 0.5;
    }
    if (opened && portalScaleRef.current < 1.4) {
      portalScaleRef.current = Math.min(1.4, portalScaleRef.current + delta * 0.8);
      if (glowRef.current) {
        glowRef.current.scale.setScalar(portalScaleRef.current);
      }
    }
    if (isLevelEnd || !onReach) return;
    if (!active || passed || triggeredRef.current || !playerBodyRef.current) return;
    const p = playerBodyRef.current.translation();
    if (p.z >= position[2] - 1) {
      triggeredRef.current = true;
      onReach();
    }
  });

  if (passed && !isLevelEnd) return null;

  return (
    <group position={position}>
      {!isLevelEnd && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[2.5, 2.5, 0.3]} sensor />
        </RigidBody>
      )}
      <group ref={glowRef}>
        <mesh position={[-1.8, 2, 0]}>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial
            color={THEME.GOLD}
            emissive={THEME.GOLD}
            emissiveIntensity={opened ? 0.9 : 0.5}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[1.8, 2, 0]}>
          <boxGeometry args={[0.4, 4, 0.4]} />
          <meshStandardMaterial
            color={THEME.GOLD}
            emissive={THEME.GOLD}
            emissiveIntensity={opened ? 0.9 : 0.5}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0, 3.8, 0]}>
          <boxGeometry args={[4, 0.35, 0.35]} />
          <meshStandardMaterial
            color={THEME.GOLD}
            emissive={THEME.GOLD}
            emissiveIntensity={opened ? 1 : 0.7}
            metalness={0.7}
          />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffaa00"
            emissiveIntensity={opened ? 0.7 : 0.3}
            transparent
            opacity={opened ? 0.45 : 0.25}
            side={2}
          />
        </mesh>
      </group>
    </group>
  );
}
