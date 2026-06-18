import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { THEME_CITY, WORLD } from '../core/config';

interface CityChunkProps {
  position: [number, number, number];
  index: number;
}

export function CityChunk({ position, index }: CityChunkProps) {
  const stoneColor = index % 2 === 0 ? THEME_CITY.GROUND : THEME_CITY.GROUND_DARK;

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider
          args={[WORLD.CHUNK_WIDTH / 2, 0.25, WORLD.CHUNK_LENGTH / 2]}
          position={[0, -0.25, WORLD.CHUNK_LENGTH / 2]}
        />
      </RigidBody>

      <mesh receiveShadow position={[0, -0.02, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[WORLD.CHUNK_WIDTH, 0.08, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color={stoneColor} roughness={0.88} />
      </mesh>

      <mesh receiveShadow position={[0, 0.01, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[3.2, 0.04, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial color="#4a3568" roughness={0.82} />
      </mesh>

      {/* Gold lane markers */}
      <mesh position={[-1.7, 0.04, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.06, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial
          color={THEME_CITY.GOLD}
          emissive={THEME_CITY.GOLD}
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[1.7, 0.04, WORLD.CHUNK_LENGTH / 2]}>
        <boxGeometry args={[0.08, 0.06, WORLD.CHUNK_LENGTH]} />
        <meshStandardMaterial
          color={THEME_CITY.GOLD}
          emissive={THEME_CITY.GOLD}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Window lights on chunk sides */}
      {index % 3 === 0 && (
        <>
          <mesh position={[-5, 1.2, WORLD.CHUNK_LENGTH * 0.3]}>
            <planeGeometry args={[0.4, 0.6]} />
            <meshStandardMaterial
              color={THEME_CITY.GOLD}
              emissive={THEME_CITY.GOLD}
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[5, 1.5, WORLD.CHUNK_LENGTH * 0.65]}>
            <planeGeometry args={[0.35, 0.5]} />
            <meshStandardMaterial
              color={THEME_CITY.ACCENT}
              emissive={THEME_CITY.ACCENT}
              emissiveIntensity={0.6}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
