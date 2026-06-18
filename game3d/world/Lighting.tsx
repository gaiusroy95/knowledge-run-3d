import { THEME, WORLD } from '../core/config';

export function Lighting() {
  return (
    <>
      <color attach="background" args={[THEME.SKY]} />
      <fog attach="fog" args={[THEME.SKY, WORLD.FOG_NEAR, WORLD.FOG_FAR]} />
      <ambientLight intensity={0.45} color="#8a7aa8" />
      <hemisphereLight args={['#4a3b69', '#2a1f18', 0.55]} />
      <directionalLight
        position={[-12, 22, 8]}
        intensity={1.1}
        color="#ffe8c0"
        castShadow={false}
      />
      <pointLight position={[0, 3, 15]} intensity={0.4} color="#ffd700" distance={25} />
    </>
  );
}
