import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { HoloSettings } from '@/types/card';
import type { LayoutType } from '@/types/layout';
import type { Holo3dImages } from '@/lib/holo/holo3d';
import { foilInputs } from '@/lib/holo/holo3d';
import { createFoilMaterial } from '@/lib/holo/foilMaterial';
import { sheenCenter, tiltPointer, tiltView } from '@/lib/holo/tiltView';
import { HOVER_TAU, LEAVE_TAU, SCATTER } from '@/lib/holo/galleryFoilTuning';

interface FoilCanvasProps {
  images: Holo3dImages;
  holo: HoloSettings;
  layoutType: LayoutType;
  borderless: boolean;
  rx: number;
  ry: number;
  hovering: boolean;
  glare: number;
  onReady: (ok: boolean) => void;
}

export default function FoilCanvas({ images, holo, layoutType, borderless, rx, ry, hovering, glare, onReady }: FoilCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ rx, ry, hovering, glare });
  const kick = useRef(() => {});
  const onReadyRef = useRef(onReady);
  const { card, area } = images;

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    target.current = { rx, ry, hovering, glare };
    kick.current();
  }, [rx, ry, hovering, glare]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      onReadyRef.current(false);
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;
    const foil = createFoilMaterial();
    foil.setScatter(SCATTER);
    const geometry = new THREE.PlaneGeometry(1, 1);
    scene.add(new THREE.Mesh(geometry, foil.material));

    const current = { rx: target.current.rx, ry: target.current.ry, light: target.current.hovering ? 1 : 0 };
    let live = true;
    let ready = false;
    let frame = 0;
    let last = 0;
    const draw = () => {
      foil.setView(tiltView(current.rx, current.ry));
      foil.setShine({ light: sheenCenter(current.rx, current.ry), pointer: tiltPointer(current.rx, current.ry), amount: current.light, glare: target.current.glare });
      renderer.render(scene, camera);
    };
    const step = (now: number) => {
      frame = 0;
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      const t = target.current;
      const k = 1 - Math.exp(-dt / (t.hovering ? HOVER_TAU : LEAVE_TAU));
      current.rx += (t.rx - current.rx) * k;
      current.ry += (t.ry - current.ry) * k;
      current.light += ((t.hovering ? 1 : 0) - current.light) * k;
      draw();
      const moving = Math.abs(t.rx - current.rx) > 0.01 || Math.abs(t.ry - current.ry) > 0.01 || Math.abs((t.hovering ? 1 : 0) - current.light) > 0.002;
      if (moving) frame = requestAnimationFrame(step);
      else last = 0;
    };
    kick.current = () => {
      if (ready && !frame) frame = requestAnimationFrame(step);
    };
    const resize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      if (ready) draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    foilInputs(holo, layoutType, borderless, { card, area })
      .then((inputs) => foil.setInputs(inputs, renderer.capabilities.getMaxAnisotropy()))
      .then(() => {
        if (!live) return;
        ready = true;
        resize();
        onReadyRef.current(true);
        kick.current();
      }, (err: unknown) => {
        console.error('Gallery foil failed:', err);
        if (live) onReadyRef.current(false);
      });

    return () => {
      live = false;
      kick.current = () => {};
      cancelAnimationFrame(frame);
      observer.disconnect();
      foil.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, [card, area, holo, layoutType, borderless]);

  return (
    <canvas
      ref={canvasRef}
      className="card-thumb-round"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
