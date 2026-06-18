import type { SpawnedEntity } from '../core/types';
import {
  createStar,
  createObstacle,
  createCityObstacle,
  canSpawnObstacleAt,
  randomInRange,
  STAR_MIN_SPACING_M,
  STAR_MAX_SPACING_M,
  OBSTACLE_MIN_SPACING_M,
  OBSTACLE_MAX_SPACING_M,
  resetSpawnIds,
} from '../core/spawnRules';

const DESPAWN_BEHIND_M = 20;
const SPAWN_AHEAD_M = 60;
const GATE_CLEARANCE_M = 5;

export class SpawnManager3D {
  private entities: SpawnedEntity[] = [];
  private nextStarAt = 8;
  private nextObstacleAt = 28;
  private cityMode = false;
  private cityStartZ = -1;

  reset(): void {
    resetSpawnIds();
    this.entities = [];
    this.nextStarAt = 8;
    this.nextObstacleAt = 28;
    this.cityMode = false;
    this.cityStartZ = -1;
  }

  setCityMode(enabled: boolean, cityStartZ = -1): void {
    this.cityMode = enabled;
    if (enabled && cityStartZ >= 0) {
      this.cityStartZ = cityStartZ;
      this.nextStarAt = cityStartZ + 15;
      this.nextObstacleAt = cityStartZ + 35;
    }
  }

  getEntities(): readonly SpawnedEntity[] {
    return this.entities;
  }

  /** Spawn ahead of player and despawn behind; returns true if entity list changed. */
  update(
    playerZ: number,
    gate80Z: number,
    levelEndGateZ: number,
    spawningAllowed: boolean
  ): boolean {
    const despawnBehind = playerZ - DESPAWN_BEHIND_M;
    const prevCount = this.entities.length;
    this.entities = this.entities.filter((e) => e.z > despawnBehind && !e.collected);

    if (!spawningAllowed) {
      return this.entities.length !== prevCount;
    }

    const prevStar = this.nextStarAt;
    const prevObstacle = this.nextObstacleAt;

    while (this.nextStarAt < playerZ + SPAWN_AHEAD_M) {
      this.entities.push(createStar(this.nextStarAt, 0));
      this.nextStarAt += randomInRange(STAR_MIN_SPACING_M, STAR_MAX_SPACING_M);
    }

    while (this.nextObstacleAt < playerZ + SPAWN_AHEAD_M) {
      const z = this.nextObstacleAt;
      const distInCity = this.cityMode && this.cityStartZ >= 0 ? z - this.cityStartZ : z;
      const canSpawn =
        canSpawnObstacleAt(z) &&
        Math.abs(z - gate80Z) > GATE_CLEARANCE_M &&
        Math.abs(z - levelEndGateZ) > GATE_CLEARANCE_M &&
        (!this.cityMode || distInCity >= 20);

      if (canSpawn) {
        this.entities.push(
          this.cityMode ? createCityObstacle(z, 0) : createObstacle(z, 0)
        );
      }
      const spacing = this.cityMode
        ? randomInRange(25, 40)
        : randomInRange(OBSTACLE_MIN_SPACING_M, OBSTACLE_MAX_SPACING_M);
      this.nextObstacleAt += spacing;
    }

    return (
      this.entities.length !== prevCount ||
      this.nextStarAt !== prevStar ||
      this.nextObstacleAt !== prevObstacle
    );
  }

  markCollected(id: string): void {
    const entity = this.entities.find((e) => e.id === id);
    if (entity) entity.collected = true;
  }

  visibleEntities(): SpawnedEntity[] {
    return this.entities.filter((e) => !e.collected);
  }
}
