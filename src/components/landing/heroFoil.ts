import type { Material, Mesh, Object3D } from 'three';
import type { SavedCard } from '@/types/card';
import { createFoilMaterial } from '@/lib/holo/foilMaterial';
import { foilInputs } from '@/lib/holo/holo3d';

const ANISOTROPY = 16;

function internal(obj: object, name: string): unknown {
  const key = Object.getOwnPropertySymbols(obj).find((s) => s.description === name);
  return key ? (obj as Record<symbol, unknown>)[key] : undefined;
}

export async function applyHeroFoil(viewer: HTMLElement, frontMaterial: object, card: SavedCard, isCancelled: () => boolean): Promise<(() => void) | null> {
  if (!card.holoCardUrl || !card.holoAreaUrl) return null;
  const scene = internal(viewer, 'scene') as (Object3D & { queueRender?: () => void }) | undefined;
  const correlated = internal(frontMaterial, 'correlatedObjects');
  if (!scene?.traverse || !(correlated instanceof Set)) return null;
  const meshes: Mesh[] = [];
  scene.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.isMesh && correlated.has(mesh.material as Material)) meshes.push(mesh);
  });
  if (!meshes.length) return null;

  const foil = createFoilMaterial(true);
  const inputs = await foilInputs(card.holo, card.layoutType, card.borderless ?? false, { card: card.holoCardUrl, area: card.holoAreaUrl });
  await foil.setInputs(inputs, ANISOTROPY);
  if (isCancelled()) {
    foil.dispose();
    return null;
  }
  const originals = meshes.map((m) => m.material);
  for (const m of meshes) m.material = foil.material;
  scene.queueRender?.();
  return () => {
    meshes.forEach((m, i) => { m.material = originals[i]; });
    foil.dispose();
    scene.queueRender?.();
  };
}
