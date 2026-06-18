import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface FollowCameraProps {
  targetRef: React.RefObject<THREE.Vector3 | null>;
}

const OFFSET = new THREE.Vector3(-10, 5, -4);
const LOOK_AT_OFFSET = new THREE.Vector3(0, 1.1, 2);
const SMOOTH = 5;

export function FollowCamera({ targetRef }: FollowCameraProps) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3());
  const desiredPos = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const target = targetRef.current;
    if (!target) return;

    desiredPos.current.copy(target).add(OFFSET);
    lookAt.current.copy(target).add(LOOK_AT_OFFSET);

    const t = 1 - Math.exp(-SMOOTH * delta);
    camera.position.lerp(desiredPos.current, t);
    camera.lookAt(lookAt.current);
  });

  return null;
}
