import { useEffect, useRef, useState, type ComponentProps, type MutableRefObject } from 'react';
import { CardRenderer } from '@/components/card-renderer/CardRenderer';
import { SiteHeader } from '@/components/SiteHeader';
import { useIsMobile } from '@/lib/useIsMobile';
import { HoloControls } from '@/components/card-editor/HoloControls';
import { CHECK_LABEL, FIELD_LABEL, HINT, SECTION_BUTTON, SECTION_LABEL, SELECT } from '@/components/card-editor/editorStyles';
import { useShallow } from 'zustand/react/shallow';
import { useCardStore } from '@/lib/store';
import { downloadBlob, exportStandardPng, loadImage, renderThumbnailPng, sanitizeCardNameForFilename, thumbnailCanvas, thumbnailJpeg } from '@/lib/exportUtils';
import { CARD_H, CARD_W } from '@/lib/cardDims';
import { ensureFoil } from '@/lib/holo/foilImage';
import { effectiveHoloAreas, shimmerRegions } from '@/lib/holo/holoAreas';
import { measureArtAndBookmark } from '@/lib/artRect';
import type { CardSnapshot, HoloArea } from '@/types/card';
import { withExportState } from '@/lib/useCardExport';
import { TiltCard } from '@/components/gallery/TiltCard';
import { CardWallpaper } from '@/components/landing/CardWallpaper';
import { WALLPAPER_TILE_SRC, WALLPAPER_VIGNETTE, drawCardWallpaper } from '@/components/landing/cardWallpaperDesign';
import { createLabScene, type LabScene } from './holoLabScene';
import { handoffIdFrom, loadLabCardFor, saveLabCard, shouldRestoreLabCard } from './labHandoff';
import { canRecordRegion, recordRegion } from './regionRecorder';

const PX = 4;
const GALLERY_CIRCLE = 0.3;
const GALLERY_STAGE = { portrait: { w: 540, h: 675, card: 'h-[560px]' }, square: { w: 540, h: 540, card: 'h-[440px]' } } as const;
const VIDEO_WALLPAPER_COLS = 6;

async function areaMask(root: HTMLElement, areas: HoloArea[], borderless: boolean, popOutUrl: string | null): Promise<string> {
  const c = document.createElement('canvas');
  c.width = CARD_W * PX;
  c.height = CARD_H * PX;
  const ctx = c.getContext('2d')!;
  ctx.scale(PX, PX);
  ctx.fillStyle = '#fff';
  const { art, bookmark } = measureArtAndBookmark(root);
  const regions = shimmerRegions(areas, art, borderless, bookmark);
  for (const r of regions ?? [{ left: 0, top: 0, width: CARD_W, height: CARD_H }]) ctx.fillRect(r.left, r.top, r.width, r.height);
  if (popOutUrl && !areas.includes('card')) {
    const img = await loadImage(popOutUrl, popOutUrl.startsWith('https://'));
    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(img, 0, 0, CARD_W, CARD_H);
  }
  return c.toDataURL('image/png');
}

async function wallpaperCanvas(width: number, height: number): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  drawCardWallpaper(c.getContext('2d')!, width, height, await loadImage(WALLPAPER_TILE_SRC), VIDEO_WALLPAPER_COLS);
  return c;
}

async function bakedThumbnail(el: HTMLElement, holo: CardSnapshot['holo']): Promise<string> {
  const png = await withExportState(el, holo, () => renderThumbnailPng(el));
  return thumbnailJpeg(thumbnailCanvas(await loadImage(png)).canvas);
}

type Pointer = { x: number; y: number } | null | undefined;

function GalleryTilt({ setPointerRef, ...props }: Omit<ComponentProps<typeof TiltCard>, 'pointer'> & { setPointerRef: MutableRefObject<(p: Pointer) => void> }) {
  const [pointer, setPointer] = useState<Pointer>(undefined);
  useEffect(() => {
    setPointerRef.current = setPointer;
  }, [setPointerRef]);
  return <TiltCard {...props} pointer={pointer} />;
}

export default function HoloLab() {
  const hostRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const holoCardRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState('');
  const sceneRef = useRef<LabScene | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [glare, setGlare] = useState<number | undefined>(undefined);
  const [clipSeconds, setClipSeconds] = useState(6);
  const [clipShape, setClipShape] = useState<'square' | 'portrait'>('portrait');
  const [recording, setRecording] = useState(false);
  const [galleryLoops, setGalleryLoops] = useState(3);
  const [gallerySecondsPerLoop, setGallerySecondsPerLoop] = useState(6);
  const setPointerRef = useRef<(p: Pointer) => void>(() => {});
  const renderChain = useRef<Promise<void>>(Promise.resolve());
  const galleryStageRef = useRef<HTMLDivElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const [rev, setRev] = useState(0);
  const isMobile = useIsMobile();
  const canRecordGallery = !isMobile && canRecordRegion();
  const { holo, layoutType, cardData, borderless, popOutUrl, loadSnapshot, cardName } = useCardStore(useShallow((s) => ({
    holo: s.holo, layoutType: s.layoutType, cardData: s.cardData, borderless: s.borderless,
    popOutUrl: s.popOutUrl, loadSnapshot: s.loadSnapshot, cardName: s.cardName,
  })));

  useEffect(() => {
    if (!hostRef.current) return;
    const scene = createLabScene(hostRef.current);
    sceneRef.current = scene;
    return () => scene.dispose();
  }, []);

  useEffect(() => { sceneRef.current?.setAutoRotate(autoRotate); }, [autoRotate]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      const root = cardRef.current;
      const scene = sceneRef.current;
      if (cancelled || !root || !scene) return;
      setStatus('Rendering card...');
      try {
        const card = await withExportState(root, null, () => exportStandardPng(root, borderless));
        const areas = effectiveHoloAreas(holo, layoutType, borderless);
        const foil = holo && areas.length ? await ensureFoil(holo) : null;
        const area = await areaMask(root, areas, borderless, popOutUrl);
        if (cancelled) return;
        await scene.setTextures({ card, mask: foil?.maskUrl ?? null, area, strength: foil ? holo!.strength / 100 : 0 });
        const holoRoot = holoCardRef.current;
        if (holoRoot && !cancelled) {
          const baked = await bakedThumbnail(holoRoot, holo);
          if (!cancelled) setThumb(baked);
        }
        if (!cancelled) setStatus('');
      } catch (err) {
        console.error('Holo lab render failed:', err);
        if (!cancelled) setStatus(`Could not render the card: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    };
    const t = setTimeout(() => {
      renderChain.current = renderChain.current.then(render);
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [holo, layoutType, cardData, borderless, popOutUrl, rev]);

  const saveVideo = async () => {
    const scene = sceneRef.current;
    if (!scene || recording) return;
    setRecording(true);
    setStatus(`Recording ${clipSeconds}s...`);
    try {
      const width = 1080;
      const height = clipShape === 'square' ? 1080 : 1350;
      const { blob, extension } = await scene.record({
        seconds: clipSeconds,
        width,
        height,
        fps: 60,
        background: await wallpaperCanvas(width, height),
      });
      downloadBlob(blob, `${sanitizeCardNameForFilename(cardName) || 'card'}-holo.${extension}`);
      setStatus('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Recording failed');
    } finally {
      setRecording(false);
    }
  };

  const saveGalleryVideo = async () => {
    const stage = galleryStageRef.current;
    if (!stage || recording) return;
    setRecording(true);
    setStatus('Choose this tab in the share prompt...');
    try {
      const { blob, extension } = await recordRegion(stage, galleryLoops * gallerySecondsPerLoop * 1000, (t) => {
        const a = -Math.PI / 2 + t * galleryLoops * Math.PI * 2;
        setPointerRef.current({ x: 0.5 + GALLERY_CIRCLE * Math.cos(a), y: 0.5 + GALLERY_CIRCLE * Math.sin(a) });
        if (t > 0) setStatus(`Recording ${Math.max(1, Math.ceil((1 - t) * galleryLoops * gallerySecondsPerLoop))}s...`);
      });
      downloadBlob(blob, `${sanitizeCardNameForFilename(cardName) || 'card'}-gallery.${extension}`);
      setStatus('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Recording failed');
    } finally {
      setPointerRef.current(undefined);
      setRecording(false);
    }
  };

  const loadJson = async (file: File) => {
    let snap: CardSnapshot;
    try {
      snap = JSON.parse(await file.text()) as CardSnapshot;
      if (!snap || typeof snap !== 'object') throw new Error('not a card');
      loadSnapshot(snap);
    } catch {
      setStatus('That file is not a card JSON.');
      return;
    }
    void saveLabCard(useCardStore.getState().getSnapshot());
    setStatus('');
    setRev((r) => r + 1);
  };

  useEffect(() => {
    let cancelled = false;
    const handoffId = handoffIdFrom(window.location.search);
    void loadLabCardFor(handoffId).then((saved) => {
      const current = useCardStore.getState().getSnapshot();
      if (cancelled || !saved || !shouldRestoreLabCard(saved, current, handoffId)) return;
      useCardStore.getState().loadSnapshot(saved.snapshot);
      setRev((r) => r + 1);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-navy-950">
    <SiteHeader />
    <div className="relative flex-1 overflow-clip text-white flex flex-col md:flex-row">
      <CardWallpaper tiles={64} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: WALLPAPER_VIGNETTE }} />
      <div className="relative flex-1 flex flex-col lg:flex-row min-w-0">
        <section className="flex-1 flex flex-col min-h-[60vh]">
          <h2 className="px-4 pt-3 text-xs text-gray-400 uppercase tracking-wider">3D view (drag to rotate)</h2>
          <div ref={hostRef} className="flex-1 cursor-grab" />
        </section>
        <section className="flex-1 flex flex-col items-center min-h-[60vh] pb-6">
          <h2 className="self-start px-4 pt-3 text-xs text-gray-400 uppercase tracking-wider">Gallery view ({isMobile ? 'tap' : 'hover'} to tilt)</h2>
          <div className="flex-1 flex items-center justify-center">
            <div
              ref={galleryStageRef}
              className="flex items-center justify-center shrink-0"
              style={isMobile ? { width: '100vw', padding: '24px 0', perspective: '800px' } : { width: GALLERY_STAGE[clipShape].w, height: GALLERY_STAGE[clipShape].h, perspective: '800px' }}
            >
            {thumb && (
              <GalleryTilt
                key={thumb}
                setPointerRef={setPointerRef}
                thumbnailUrl={thumb}
                alt="Holo lab card"
                className={isMobile ? 'w-[70vw]' : GALLERY_STAGE[clipShape].card}
                holo={holo}
                layoutType={layoutType}
                borderless={borderless}
                popOutUrl={popOutUrl}
                measureRoot={holoCardRef}
                measureKey={thumb}
                glare={glare}
              />
            )}
            </div>
          </div>
        </section>
      </div>
      <div className="relative w-full md:w-80 p-4 flex flex-col gap-4 bg-navy-900 overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-bold text-white">Holo Lab</h2>
          <button onClick={() => jsonInputRef.current?.click()} className={SECTION_BUTTON}>Load JSON</button>
          <input
            ref={jsonInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void loadJson(f); e.target.value = ''; }}
          />
        </div>

        <HoloControls collapsible={false} />

        <hr className="border-navy-600" />
        <div className="space-y-2">
          <div className={SECTION_LABEL}>Preview</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} className="accent-gold-400" />
            <span className={CHECK_LABEL}>Auto rotate the 3D card</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>Gallery hover glare</span>
            <select value={glare ?? 'auto'} onChange={(e) => setGlare(e.target.value === 'auto' ? undefined : Number(e.target.value))} className={SELECT}>
              <option value="auto">Auto (off for holo)</option>
              <option value={1}>Full</option>
              <option value={0.5}>Half</option>
              <option value={0}>Off</option>
            </select>
          </div>
        </div>

        <hr className="border-navy-600" />
        <div className="space-y-2">
          <div className={SECTION_LABEL}>Video size</div>
          <select value={clipShape} onChange={(e) => setClipShape(e.target.value as 'square' | 'portrait')} disabled={recording} className={`w-full ${SELECT}`}>
            <option value="portrait">Portrait 1080x1350</option>
            <option value="square">Square 1080x1080</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className={SECTION_LABEL}>3D video</div>
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>Length</span>
            <select value={clipSeconds} onChange={(e) => setClipSeconds(Number(e.target.value))} disabled={recording} className={SELECT}>
              <option value={4}>4s</option>
              <option value={6}>6s</option>
              <option value={8}>8s</option>
            </select>
          </div>
          <button onClick={() => void saveVideo()} disabled={recording} className="btn-gold w-full py-2 text-xs disabled:opacity-50">
            {recording ? 'Recording...' : 'Save 3D video'}
          </button>
        </div>

        <div className="space-y-2">
          <div className={SECTION_LABEL}>Gallery video</div>
          <div className="flex items-center justify-between gap-2">
            <span className={FIELD_LABEL}>Circles</span>
            <span className="flex gap-2">
              <select value={galleryLoops} onChange={(e) => setGalleryLoops(Number(e.target.value))} disabled={recording} className={SELECT}>
                <option value={1}>1 circle</option>
                <option value={2}>2 circles</option>
                <option value={3}>3 circles</option>
                <option value={4}>4 circles</option>
              </select>
              <select value={gallerySecondsPerLoop} onChange={(e) => setGallerySecondsPerLoop(Number(e.target.value))} disabled={recording} className={SELECT}>
                <option value={4}>4s each</option>
                <option value={6}>6s each</option>
                <option value={8}>8s each</option>
              </select>
            </span>
          </div>
          <button onClick={() => void saveGalleryVideo()} disabled={recording || !thumb || !canRecordGallery} className="btn-gold w-full py-2 text-xs disabled:opacity-50">
            {recording ? 'Recording...' : 'Save gallery video'}
          </button>
        </div>

        {status && <div className={HINT}>{status}</div>}
      </div>
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CardRenderer ref={cardRef} layoutType={layoutType} cardData={cardData} scale={1} holoOverride={null} />
        <CardRenderer ref={holoCardRef} layoutType={layoutType} cardData={cardData} scale={1} />
      </div>
    </div>
    </div>
  );
}
