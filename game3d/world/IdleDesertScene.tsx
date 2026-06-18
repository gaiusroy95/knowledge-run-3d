import { Sky } from './Sky';
import { Lighting } from './Lighting';
import { ChunkStream } from './ChunkStream';

/** Ambient desert backdrop on menu screens (static — no per-frame React updates). */
export function IdleDesertScene() {
  return (
    <>
      <Sky />
      <Lighting />
      <ChunkStream playerZ={0} />
    </>
  );
}
