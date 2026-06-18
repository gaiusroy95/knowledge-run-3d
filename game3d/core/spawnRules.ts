import { INTRO_SAFE_DISTANCE_M } from './config';
import type { SpawnedEntity } from './types';

let entityCounter = 0;

const nextId = (kind: string) => `${kind}_${++entityCounter}`;

export const STAR_MIN_SPACING_M = 15;
export const STAR_MAX_SPACING_M = 25;
export const OBSTACLE_MIN_SPACING_M = 30;
export const OBSTACLE_MAX_SPACING_M = 45;

export const randomInRange = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const canSpawnObstacleAt = (distanceM: number) =>
  distanceM >= INTRO_SAFE_DISTANCE_M;

export const createStar = (z: number, x = 0): SpawnedEntity => ({
  id: nextId('star'),
  kind: 'star',
  x,
  y: 1.2,
  z,
});

export const createObstacle = (z: number, x = 0): SpawnedEntity => ({
  id: nextId('obstacle'),
  kind: 'obstacle',
  x,
  y: 0.5,
  z,
  obstacleVariant: 'cart',
});

export const createCityObstacle = (z: number, x = 0): SpawnedEntity => ({
  id: nextId('obstacle'),
  kind: 'obstacle',
  x,
  y: 0.75,
  z,
  obstacleVariant: 'city_pillar',
});

export const resetSpawnIds = () => {
  entityCounter = 0;
};
