import type { HoloPatternId } from '@/types/card';
import { buildFoilBlobs } from './foilBuild';

export interface FoilRequest { id: number; pattern: HoloPatternId; angle: number }
export type FoilResponse = { id: number; foil: Blob; mask: Blob | null } | { id: number; error: string };

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<FoilRequest>) => void) | null;
  postMessage: (msg: FoilResponse) => void;
};

scope.onmessage = (e) => {
  const { id, pattern, angle } = e.data;
  buildFoilBlobs(pattern, angle).then(
    (r) => scope.postMessage({ id, ...r }),
    (err: unknown) => scope.postMessage({ id, error: String(err) }),
  );
};
