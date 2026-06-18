import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import type { Mesh } from 'three';
import { THEME } from '../core/config';

interface StarEntityProps {
  id: string;
  position: [number, number, number];
  onCollect: (id: string) => void;
  playerBodyRef: React.RefObject<RapierRigidBody | null>;
  disabled?: boolean;
}

export function StarEntity({
  id,
  position,
  onCollect,
  playerBodyRef,
  disabled,
}: StarEntityProps) {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const collectedRef = useRef(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.004) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 2;
    }
    if (disabled || collectedRef.current || !playerBodyRef.current) return;
    const p = playerBodyRef.current.translation();
    const dx = p.x - position[0];
    const dy = p.y - position[1];
    const dz = p.z - position[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 1.4) {
      collectedRef.current = true;
      onCollect(id);
    }
  });

  if (collectedRef.current) return null;

  return (
    <group position={[position[0], 0, position[2]]}>
      <mesh ref={glowRef} position={[0, position[1], 0]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial
          color={THEME.GOLD}
          emissive={THEME.GOLD}
          emissiveIntensity={0.25}
          transparent
          opacity={0.2}
        />
      </mesh>
      <mesh ref={meshRef} position={[0, position[1], 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color={THEME.GOLD}
          emissive={THEME.GOLD}
          emissiveIntensity={0.85}
          metalness={0.65}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}
