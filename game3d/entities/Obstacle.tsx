import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import type { ObstacleVariant } from '../core/types';
import { THEME_CITY } from '../core/config';

interface ObstacleEntityProps {
  id: string;
  position: [number, number, number];
  variant?: ObstacleVariant;
  onHit: () => void;
  playerBodyRef: React.RefObject<RapierRigidBody | null>;
  disabled?: boolean;
}

export function ObstacleEntity({
  position,
  variant = 'cart',
  onHit,
  playerBodyRef,
  disabled,
}: ObstacleEntityProps) {
  const hitRef = useRef(false);

  useFrame(() => {
    if (disabled || hitRef.current || !playerBodyRef.current) return;
    const p = playerBodyRef.current.translation();
    const dx = p.x - position[0];
    const dy = p.y - position[1];
    const dz = p.z - position[2];
    if (Math.abs(dx) < 0.7 && Math.abs(dy) < 1.0 && Math.abs(dz) < 0.7) {
      hitRef.current = true;
      onHit();
    }
  });

  if (hitRef.current) return null;

  if (variant === 'city_pillar') {
    return (
      <group position={position}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[0.35, 0.9, 0.35]} position={[0, 0.9, 0]} />
        </RigidBody>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 1.8, 8]} />
          <meshStandardMaterial color={THEME_CITY.WALL} roughness={0.75} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial
            color={THEME_CITY.GOLD}
            emissive={THEME_CITY.GOLD}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.45, 0.55, 0.45]} position={[0, 0.55, 0]} />
      </RigidBody>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.7, 0.9]} />
        <meshStandardMaterial color="#7a4030" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.95, 0.15, 0.95]} />
        <meshStandardMaterial color="#6b3528" roughness={0.9} />
      </mesh>
      <mesh position={[-0.35, 0.2, 0.35]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#4a2818" />
      </mesh>
      <mesh position={[0.35, 0.2, -0.35]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#4a2818" />
      </mesh>
    </group>
  );
}
