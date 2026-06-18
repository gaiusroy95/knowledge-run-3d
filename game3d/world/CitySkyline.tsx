import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { THEME_CITY } from '../core/config';

interface CitySkylineProps {
  playerZ: number;
}

function Dome({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={THEME_CITY.WALL} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.8, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial
          color={THEME_CITY.GOLD}
          emissive={THEME_CITY.GOLD}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 2, 2.4]} />
        <meshStandardMaterial color={THEME_CITY.GROUND_DARK} roughness={0.85} />
      </mesh>
    </group>
  );
}

export function CitySkyline({ playerZ }: CitySkylineProps) {
  const farRef = useRef<THREE.Group>(null);
  const midRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (farRef.current) farRef.current.position.z = playerZ - 80;
    if (midRef.current) midRef.current.position.z = playerZ - 40;
  });

  return (
    <>
      <group ref={farRef} position={[0, 0, -80]}>
        <Dome position={[-8, 0, 0]} scale={1.8} />
        <Dome position={[6, 0, -15]} scale={1.4} />
        <Dome position={[-4, 0, 20]} scale={1.6} />
        <Dome position={[10, 0, 10]} scale={1.2} />
      </group>
      <group ref={midRef} position={[0, 0, -40]}>
        <Dome position={[-6, 0, 5]} scale={1.1} />
        <Dome position={[5, 0, -8]} scale={0.9} />
        <mesh position={[0, 1.5, 12]}>
          <boxGeometry args={[1.5, 3, 1.5]} />
          <meshStandardMaterial color={THEME_CITY.WALL} roughness={0.75} />
        </mesh>
        <mesh position={[0, 3.2, 12]}>
          <coneGeometry args={[0.5, 1.2, 4]} />
          <meshStandardMaterial
            color={THEME_CITY.GOLD}
            emissive={THEME_CITY.GOLD}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </>
  );
}
