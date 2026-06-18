import { THEME } from '../core/config';

interface BedouinTentProps {
  position: [number, number, number];
  occupied?: boolean;
}

export function BedouinTent({ position, occupied }: BedouinTentProps) {
  return (
    <group position={position}>
      {/* Main tent body */}
      <mesh position={[0, 1.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.2, 2.4, 4]} />
        <meshStandardMaterial color="#c47840" roughness={0.85} />
      </mesh>
      {/* Fabric drape */}
      <mesh position={[0, 0.6, 0.8]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[3.5, 0.08, 1.8]} />
        <meshStandardMaterial color="#a06030" roughness={0.9} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 3, 8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.8} />
      </mesh>
      {/* Occupied glow */}
      {occupied && (
        <pointLight position={[0, 1.5, 0]} color={THEME.GOLD} intensity={0.8} distance={6} />
      )}
      {/* Ground mat */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 16]} />
        <meshStandardMaterial color="#8b6914" roughness={0.95} />
      </mesh>
    </group>
  );
}
