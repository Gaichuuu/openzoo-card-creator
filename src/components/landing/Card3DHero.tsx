import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import { fetchRandomCard } from '@/lib/galleryService';

type ModelViewer = HTMLElement & {
  model?: { materials: any[] };
  createTexture: (uri: string) => Promise<any>;
};

export function Card3DHero() {
  const viewerRef = useRef<ModelViewer>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    let cancelled = false;

    async function applyTextures() {
      await new Promise<void>((resolve) => {
        if (viewer!.model) {
          resolve();
        } else {
          viewer!.addEventListener('load', () => resolve(), { once: true });
        }
      });

      if (cancelled) return;

      const materials = viewer!.model?.materials;
      if (!materials || materials.length < 2) {
        setError(true);
        return;
      }

      try {
        const backTexture = await viewer!.createTexture('/assets/OPZDexCardBack.png');
        if (cancelled) return;
        if (backTexture) {
          materials[1].pbrMetallicRoughness.baseColorTexture.setTexture(backTexture);
        }
      } catch (e) {
        console.error('Failed to apply card back texture:', e);
      }

      try {
        const card = await fetchRandomCard();
        if (cancelled) return;
        if (card?.thumbnailUrl) {
          const frontTexture = await viewer!.createTexture(card.thumbnailUrl);
          if (cancelled) return;
          if (frontTexture) {
            materials[0].pbrMetallicRoughness.baseColorTexture.setTexture(frontTexture);
          }
        }
      } catch (e) {
        console.error('Failed to apply card front texture:', e);
      }

      if (!cancelled) setLoaded(true);
    }

    applyTextures().catch(() => setError(true));

    return () => { cancelled = true; };
  }, []);

  if (error) return null;

  return (
    <div className="relative w-65 h-92.5 md:w-95 md:h-135">
      {!loaded && (
        <div
          className="animate-pulse absolute inset-0 flex items-center justify-center"
        >
          <div
            style={{
              width: '78%',
              height: '82%',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%)',
            }}
          />
        </div>
      )}

      <model-viewer
        ref={viewerRef as any}
        src="/models/card.glb?v=3"
        auto-rotate
        rotation-per-second="30deg"
        camera-orbit="0deg 90deg 2.5m"
        field-of-view="25deg"
        disable-zoom
        disable-pan
        interaction-prompt="none"
        alt="3D OpenZoo card"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
          '--poster-color': 'transparent',
        } as any}
      />
    </div>
  );
}
