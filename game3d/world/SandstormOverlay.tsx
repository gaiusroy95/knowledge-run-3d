import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { THEME } from '../core/config';

interface SandstormOverlayProps {
  intensityRef: React.RefObject<number>;
}

export function SandstormOverlay({ intensityRef }: SandstormOverlayProps) {
  const groupRef = useRef<THREE.Group>(null);
  const count = 120;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 8 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = Math.random() * 0.5;
      velocities[i * 3 + 2] = Math.random() * 3 + 1;
    }
    return { positions, velocities };
  }, []);

  const geomRef = useRef<THREE.BufferGeometry>(null);

  useFrame((_, delta) => {
    const intensity = intensityRef.current ?? 0;
    if (groupRef.current) {
      groupRef.current.visible = intensity > 0.02;
    }
    if (!geomRef.current || intensity <= 0.02) return;

    const pos = geomRef.current.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3] * delta * intensity * 3;
      pos[i * 3 + 1] += velocities[i * 3 + 1] * delta * intensity;
      pos[i * 3 + 2] += velocities[i * 3 + 2] * delta * intensity * 4;
      if (pos[i * 3 + 2] > 25) pos[i * 3 + 2] = -15;
      if (pos[i * 3] > 12) pos[i * 3] = -12;
      if (pos[i * 3] < -12) pos[i * 3] = 12;
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={groupRef} visible={false}>
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={THEME.SANDSTORM_FOG}
          size={0.25}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </points>
      <mesh position={[0, 3, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 60]} />
        <meshBasicMaterial color={THEME.SANDSTORM_FOG} transparent opacity={0.15} depthWrite={false} />
      </mesh>
    </group>
  );
}
