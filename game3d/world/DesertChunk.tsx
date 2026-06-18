import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { THEME, WORLD } from '../core/config';

interface DesertChunkProps {
  position: [number, number, number];
  index: number;
}

export function DesertChunk({ position, index }: DesertChunkProps) {
  const sandColor = index % 2 === 0 ? THEME.GROUND : THEME.GROUND_DARK;

  return (
    <group position={position}>
      {/* Collision floor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[WORLD.CHUNK_WIDTH / 2, 0.25, WORLD.CHUNK_LENGTH / 2]}
          position={[0, -0.25, WORLD.CHUNK_LENGTH / 2]}
        />
      </RigidBody>

      {/* Main sand surface */}
      <mesh receiveShadow position={[0, -0.02, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[WORLD.CHUNK_WIDTH, 0.08, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color={sandColor} roughness={0.92} />
      </mesh>

      {/* Run path — clearer lane for the player */}
      <mesh receiveShadow position={[0, 0.01, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[3.2, 0.04, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color="#b8a070" roughness={0.85} />
      </mesh>

      {/* Path edge markers */}
      <mesh position={[-1.7, 0.04, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.06, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color={THEME.GOLD} emissive={THEME.GOLD} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[1.7, 0.04, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.06, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color={THEME.GOLD} emissive={THEME.GOLD} emissiveIntensity={0.15} />
      </mesh>

      {/* Dunes beside the path */}
      <mesh position={[-4.5, 0.45, WORLD.CHUNK_LENGTH * 0.25]}>
        <sphereGeometry args={[1.4, 10, 8]} />
        <meshStandardMaterial color={THEME.GROUND_DARK} roughness={1} />
      </mesh>
      <mesh position={[4.2, 0.35, WORLD.CHUNK_LENGTH * 0.7]}>
        <sphereGeometry args={[1.1, 10, 8]} />
        <meshStandardMaterial color={THEME.GROUND} roughness={1} />
      </mesh>
      <mesh position={[-3.8, 0.25, WORLD.CHUNK_LENGTH * 0.75]}>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshStandardMaterial color={THEME.GROUND_DARK} roughness={1} />
      </mesh>
    </group>
  );
}
