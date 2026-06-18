import { useMemo } from 'react';
import { DesertChunk } from './DesertChunk';
import { CityChunk } from './CityChunk';
import { WORLD } from '../core/config';
import type { EnvironmentZone } from '../core/types';

interface ChunkStreamProps {
  playerZ: number;
  zone?: EnvironmentZone;
}

export function ChunkStream({ playerZ, zone = 'DESERT' }: ChunkStreamProps) {
  const chunkIndices = useMemo(() => {
    const centerIndex = Math.floor(playerZ / WORLD.CHUNK_LENGTH);
    const half = Math.floor(WORLD.CHUNK_COUNT / 2);
    const indices: number[] = [];
    for (let i = centerIndex - half; i <= centerIndex + half; i++) {
      indices.push(i);
    }
    return indices;
  }, [Math.floor(playerZ / WORLD.CHUNK_LENGTH)]);

  const isCity = zone === 'CITY' || zone === 'TRANSITION';
  const Chunk = isCity ? CityChunk : DesertChunk;

  return (
    <>
      {chunkIndices.map((index) => (
        <Chunk
          key={index}
          index={index}
          position={[0, WORLD.GROUND_Y, index * WORLD.CHUNK_LENGTH]}
        />
      ))}
    </>
  );
}
