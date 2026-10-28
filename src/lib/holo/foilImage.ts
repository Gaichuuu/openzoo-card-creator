import { useEffect, useState } from 'react';
import type { HoloPatternId, HoloSettings } from '@/types/card';
import { foilKey } from './holoShade';
import type { FoilBlobs } from './foilBuild';
import type { FoilRequest, FoilResponse } from './foil.worker';

export interface FoilImage {
  url: string;
  maskUrl: string | null;
  blob: Blob;
}

const MAX_FOILS = 4;

const foils = new Map<string, Promise<FoilImage>>();
const pins = new Map<string, number>();
const maskUrls = new Map<HoloPatternId, string | null>();

let worker: Worker | null | undefined;
let nextId = 0;
const pending = new Map<number, { resolve: (b: FoilBlobs) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return (worker = null);
  try {
    const w = new Worker(new URL('./foil.worker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (e: MessageEvent<FoilResponse>) => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      if ('error' in e.data) job.reject(new Error(e.data.error));
      else job.resolve({ foil: e.data.foil, mask: e.data.mask });
    };
    w.onerror = () => {
      worker = null;
      for (const job of pending.values()) job.reject(new Error('foil worker failed'));
      pending.clear();
    };
    return (worker = w);
  } catch {
    return (worker = null);
  }
}

async function buildOnMainThread(h: HoloSettings): Promise<FoilBlobs> {
  const { buildFoilBlobs } = await import('./foilBuild');
  return buildFoilBlobs(h.pattern, h.angle);
}

function buildBlobs(h: HoloSettings): Promise<FoilBlobs> {
  const w = getWorker();
  if (!w) return buildOnMainThread(h);
  const id = nextId++;
  const viaWorker = new Promise<FoilBlobs>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, pattern: h.pattern, angle: h.angle } satisfies FoilRequest);
  });
  return viaWorker.catch(() => buildOnMainThread(h));
}

async function buildFoil(h: HoloSettings): Promise<FoilImage> {
  const { foil, mask } = await buildBlobs(h);
  if (!maskUrls.has(h.pattern)) maskUrls.set(h.pattern, mask ? URL.createObjectURL(mask) : null);
  return { url: URL.createObjectURL(foil), maskUrl: maskUrls.get(h.pattern) ?? null, blob: foil };
}

function evict(): void {
  for (const key of foils.keys()) {
    if (foils.size <= MAX_FOILS) return;
    if (pins.has(key)) continue;
    const p = foils.get(key);
    foils.delete(key);
    p?.then((f) => URL.revokeObjectURL(f.url), () => {});
  }
}

function pin(key: string): void {
  pins.set(key, (pins.get(key) ?? 0) + 1);
}

function unpin(key: string): void {
  const n = (pins.get(key) ?? 0) - 1;
  if (n > 0) pins.set(key, n);
  else pins.delete(key);
  evict();
}

export function ensureFoil(h: HoloSettings): Promise<FoilImage> {
  const key = foilKey(h);
  const hit = foils.get(key);
  if (hit) {
    foils.delete(key);
    foils.set(key, hit);
    return hit;
  }
  const p = buildFoil(h);
  foils.set(key, p);
  p.catch(() => { if (foils.get(key) === p) foils.delete(key); });
  evict();
  return p;
}

export function useFoil(h: HoloSettings | null): FoilImage | null {
  const key = h ? foilKey(h) : null;
  const [shown, setShown] = useState<{ key: string; foil: FoilImage } | null>(null);

  useEffect(() => {
    if (!h || !key) return;
    let live = true;
    ensureFoil(h).then((foil) => { if (live) setShown({ key, foil }); }, () => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const shownKey = shown?.key;
  useEffect(() => {
    if (!shownKey) return;
    pin(shownKey);
    return () => unpin(shownKey);
  }, [shownKey]);

  return key ? shown?.foil ?? null : null;
}
