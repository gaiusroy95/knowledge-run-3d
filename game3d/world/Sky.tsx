import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { EnvironmentZone } from '../core/types';
import { THEME, THEME_CITY } from '../core/config';

interface SkyProps {
  zone?: EnvironmentZone;
}

export function Sky({ zone = 'DESERT' }: SkyProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(THEME.SKY) },
        bottomColor: { value: new THREE.Color(THEME.SKY_BOTTOM) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y * 0.5 + 0.5;
          gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }, []);

  useFrame(() => {
    if (!matRef.current) return;
    const isCity = zone === 'CITY' || zone === 'TRANSITION';
    const targetTop = new THREE.Color(isCity ? THEME_CITY.SKY : THEME.SKY);
    const targetBottom = new THREE.Color(isCity ? THEME_CITY.SKY_BOTTOM : THEME.SKY_BOTTOM);
    matRef.current.uniforms.topColor.value.lerp(targetTop, 0.02);
    matRef.current.uniforms.bottomColor.value.lerp(targetBottom, 0.02);
  });

  return (
    <mesh renderOrder={-100} material={material} ref={(m) => { if (m) matRef.current = material; }}>
      <sphereGeometry args={[200, 32, 16]} />
    </mesh>
  );
}
