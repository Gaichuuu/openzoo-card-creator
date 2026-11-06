import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createFoilMaterial, type FoilInputs } from '@/lib/holo/foilMaterial';

const W = 0.63;
const H = 0.88;

export interface RecordOptions {
  seconds: number;
  width: number;
  height: number;
  fps: number;
  background?: HTMLCanvasElement;
}

export interface Recording {
  blob: Blob;
  extension: 'mp4' | 'webm';
}

export interface LabScene {
  setTextures(t: FoilInputs): Promise<void>;
  setAutoRotate(on: boolean): void;
  record(opts: RecordOptions): Promise<Recording>;
  dispose(): void;
}

const STAGE_COLOR = '#05060f';
const MIME_TYPES = ['video/mp4;codecs=avc1.640028', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

export function createLabScene(host: HTMLElement): LabScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 20);
  camera.position.set(0, 0, 2.1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 0.8;
  controls.maxDistance = 4;
  controls.autoRotateSpeed = 2.2;

  const loader = new THREE.TextureLoader();
  const foil = createFoilMaterial();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), foil.material);
  const backTex = loader.load('/assets/OPZDexCardBack.png');
  backTex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: backTex, transparent: true, alphaTest: 0.01 }),
  );
  back.rotation.y = Math.PI;
  back.position.z = -0.002;
  const card = new THREE.Group();
  card.add(front, back);
  scene.add(card);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let spin: { start: number; seconds: number; done: () => void } | null = null;
  let raf = 0;
  const tick = () => {
    if (spin) {
      const t = (performance.now() - spin.start) / 1000 / spin.seconds;
      if (t >= 1) {
        const done = spin.done;
        spin = null;
        done();
      } else {
        card.rotation.y = -Math.PI / 2 + t * Math.PI;
        renderer.render(scene, camera);
      }
    } else {
      controls.update();
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    setTextures(t) {
      return foil.setInputs(t, renderer.capabilities.getMaxAnisotropy());
    },
    setAutoRotate(on) {
      controls.autoRotate = on;
    },
    async record({ seconds, width, height, fps, background }) {
      const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
      if (!mimeType) throw new Error('This browser cannot record video from a canvas');
      const saved = {
        camera: camera.position.clone(),
        target: controls.target.clone(),
        rotation: card.rotation.clone(),
        pixelRatio: renderer.getPixelRatio(),
        enabled: controls.enabled,
      };
      controls.enabled = false;
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const margin = 1.18;
      const dist = Math.max((H * margin) / 2 / half, (W * margin) / 2 / (half * camera.aspect));
      camera.position.set(0, 0, dist);
      controls.target.set(0, 0, 0);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      card.rotation.set(0, 0, 0);
      let backdrop: THREE.CanvasTexture | null = null;
      if (background) {
        backdrop = new THREE.CanvasTexture(background);
        backdrop.colorSpace = THREE.SRGBColorSpace;
      }
      scene.background = backdrop ?? new THREE.Color(STAGE_COLOR);
      card.rotation.y = -Math.PI / 2;

      const stream = renderer.domElement.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
      try {
        recorder.start();
        await new Promise<void>((resolve) => { spin = { start: performance.now(), seconds, done: resolve }; });
        recorder.stop();
        await stopped;
      } finally {
        stream.getTracks().forEach((t) => t.stop());
        scene.background = null;
        backdrop?.dispose();
        card.rotation.copy(saved.rotation);
        camera.position.copy(saved.camera);
        controls.target.copy(saved.target);
        controls.enabled = saved.enabled;
        renderer.setPixelRatio(saved.pixelRatio);
        resize();
      }
      return { blob: new Blob(chunks, { type: mimeType.split(';')[0] }), extension: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm' };
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      foil.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
