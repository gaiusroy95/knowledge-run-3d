import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { THEME } from '../core/config';

interface PlayerVisualProps {
  invulnerable?: boolean;
  hidden?: boolean;
  canRunRef: React.RefObject<boolean>;
}

export function PlayerVisual({ invulnerable, hidden, canRunRef }: PlayerVisualProps) {
  const groupRef = useRef<THREE.Group>(null);
  const runPhase = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (hidden) {
      groupRef.current.visible = false;
      return;
    }
    const running = canRunRef.current ?? false;
    if (running) runPhase.current += delta * 12;
    const bob = running ? Math.sin(runPhase.current) * 0.06 : 0;
    groupRef.current.position.y = bob;
    if (invulnerable) {
      groupRef.current.visible = Math.floor(Date.now() / 120) % 2 === 0;
    } else {
      groupRef.current.visible = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body — thobe */}
      <mesh castShadow position={[0, 0, 0]}>
        <capsuleGeometry args={[0.32, 0.65, 8, 16]} />
        <meshStandardMaterial color="#f0e6d8" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.52, 0.05]}>
        <sphereGeometry args={[0.26, 14, 14]} />
        <meshStandardMaterial color="#e8d4bc" roughness={0.45} />
      </mesh>
      {/* Ghutra / headscarf */}
      <mesh position={[0, 0.62, 0.02]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.52, 0.12, 0.48]} />
        <meshStandardMaterial color="#faf8f5" roughness={0.7} />
      </mesh>
      {/* Agal (black band) */}
      <mesh position={[0, 0.68, 0.02]}>
        <torusGeometry args={[0.22, 0.025, 8, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Running legs hint */}
      <mesh position={[-0.12, -0.35, 0.05]}>
        <boxGeometry args={[0.14, 0.35, 0.14]} />
        <meshStandardMaterial color="#8c7e56" roughness={0.8} />
      </mesh>
      <mesh position={[0.12, -0.35, -0.05]}>
        <boxGeometry args={[0.14, 0.35, 0.14]} />
        <meshStandardMaterial color="#8c7e56" roughness={0.8} />
      </mesh>
      {/* Golden accent */}
      <mesh position={[0.15, 0.05, 0.22]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={THEME.GOLD}
          emissive={THEME.GOLD}
          emissiveIntensity={0.5}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}
