import { useEffect, useRef, useState } from 'react';
import '@google/model-viewer';
import type { SavedCard } from '@/types/card';

type ModelViewer = HTMLElement & {
  model?: { materials: any[] };
  createTexture: (uri: string) => Promise<any>;
};

interface Card3DHeroProps {
  className?: string;
  frontCard?: SavedCard | null;
  frontPending?: boolean;
}

function waitForModel(viewer: ModelViewer): Promise<void> {
  return new Promise((resolve) => {
    if (viewer.model) {
      resolve();
    } else {
      viewer.addEventListener('load', () => resolve(), { once: true });
    }
  });
}

function applyTexture(
  viewer: ModelViewer,
  materialIndex: number,
  url: string,
  onFail: () => void,
  onApplied?: () => void,
): () => void {
  let cancelled = false;

  (async () => {
    await waitForModel(viewer);
    if (cancelled) return;

    const materials = viewer.model?.materials;
    if (!materials || materials.length < 2) {
      onFail();
      return;
    }

    const texture = await viewer.createTexture(url);
    if (cancelled) return;
    if (texture) {
      materials[materialIndex].pbrMetallicRoughness.baseColorTexture.setTexture(texture);
    }
    onApplied?.();
  })().catch((e) => {
    console.error('Failed to apply card texture:', e);
    if (!cancelled) onFail();
  });

  return () => { cancelled = true; };
}

export function Card3DHero({ className = 'w-65 h-92.5 md:w-95 md:h-135', frontCard, frontPending = false }: Card3DHeroProps) {
  const viewerRef = useRef<ModelViewer>(null);
  const [failed, setFailed] = useState(false);
  const [backApplied, setBackApplied] = useState(false);
  const [frontApplied, setFrontApplied] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    return applyTexture(viewer, 1, '/assets/OPZDexCardBack.png', () => setFailed(true), () => setBackApplied(true));
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !frontCard?.thumbnailUrl) return;
    const onFail = () => {
      viewer.model?.materials?.[0]?.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 1]);
      setFrontApplied(true);
    };
    return applyTexture(viewer, 0, frontCard.thumbnailUrl, onFail, () => setFrontApplied(true));
  }, [frontCard]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || frontPending || frontCard?.thumbnailUrl) return;
    let cancelled = false;
    (async () => {
      await waitForModel(viewer);
      if (cancelled) return;
      viewer.model?.materials?.[0]?.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 1]);
    })().catch(() => { /* leave the default material */ });
    return () => { cancelled = true; };
  }, [frontPending, frontCard]);

  if (failed) return null;

  const revealed = backApplied
    && (frontApplied || (!frontPending && !frontCard?.thumbnailUrl));

  return (
    <div className={`relative ${className}`}>
      {!revealed && (
        <div className="animate-pulse absolute inset-0 flex items-center justify-center">
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
        loading="eager"
        reveal="auto"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="30deg"
        camera-orbit="0deg 90deg 2.5m"
        field-of-view="25deg"
        disable-zoom
        disable-pan
        interaction-prompt="none"
        shadow-intensity="1.4"
        shadow-softness="0.9"
        alt="3D OpenZoo card"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          opacity: revealed ? 1 : 0,
          transition: 'opacity 0.5s ease-in',
          '--poster-color': 'transparent',
          '--progress-bar-color': 'transparent',
        } as any}
      />
    </div>
  );
}
