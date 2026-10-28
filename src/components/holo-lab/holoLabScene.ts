import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FOIL_BASE, FOIL_FLOOR } from '@/lib/holo/holoShade';

export interface LabTextures {
  card: string;
  mask: string | null;
  area: string;
  strength: number;
}

const W = 0.63;
const H = 0.88;

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  varying vec3 vViewLocal;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec3 cameraLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vViewLocal = normalize(cameraLocal - position);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uCard;
  uniform sampler2D uMask;
  uniform sampler2D uArea;
  uniform float uHasMask;
  uniform float uStrength;
  uniform vec2 uBleed;
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  varying vec3 vViewLocal;

  vec3 hue2rgb(float h) {
    vec3 k = mod(vec3(5.0, 3.0, 1.0) + h * 6.0, 6.0);
    return 1.0 - clamp(min(k, 4.0 - k), 0.0, 1.0);
  }

  void main() {
    vec4 card = texture2D(uCard, vUv);
    if (card.a < 0.01) discard;
    vec2 muv = (vUv + uBleed) / (1.0 + 2.0 * uBleed);
    vec4 m = uHasMask > 0.5 ? texture2D(uMask, muv) : vec4(1.0, 0.0, 0.0, 1.0);
    float cover = m.a;
    float glint = m.r;
    float hueOff = m.g;
    float area = texture2D(uArea, vUv).r;

    vec3 n = normalize(vNormal);
    vec3 v = normalize(vView);
    vec3 l = normalize(vec3(-0.4, 0.7, 0.9));
    vec3 r = reflect(-l, n);
    vec3 vl = normalize(vViewLocal);
    float tiltX = vl.x;
    float tiltY = vl.y;

    float phase = (vUv.x * 0.8 + vUv.y * 1.1) + tiltX * 1.6 + tiltY * 1.2 + hueOff * 0.35;
    vec3 rainbow = mix(vec3(1.0), hue2rgb(fract(phase)), 0.75);
    float sheen = 0.5 + 0.5 * cos(6.2832 * (vUv.x * 0.5 - vUv.y * 0.35 + tiltX * 0.9 - tiltY * 0.7));
    float lum = mix(0.55, 1.0, sheen * mix(0.4, 1.0, glint));
    vec3 base = vec3(${(FOIL_BASE / 255).toFixed(4)});
    vec3 foil = mix(base, mix(vec3(${(FOIL_FLOOR / 255).toFixed(4)}), vec3(1.0), lum) * rainbow, cover);

    float k = uStrength * area;
    vec3 col = card.rgb * mix(vec3(1.0), foil, k);
    float spec = pow(max(dot(r, v), 0.0), 24.0);
    col += spec * cover * k * glint * rainbow * 0.55;
    gl_FragColor = vec4(col, card.a);
  }
`;

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
  setTextures(t: LabTextures): void;
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
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  blank.needsUpdate = true;
  const uniforms = {
    uCard: { value: blank as THREE.Texture },
    uMask: { value: blank as THREE.Texture },
    uArea: { value: blank as THREE.Texture },
    uHasMask: { value: 0 },
    uStrength: { value: 0 },
    uBleed: { value: new THREE.Vector2(13 / 238, 13 / 333) },
  };
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment, transparent: true }),
  );
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

  const load = (url: string) => new Promise<THREE.Texture>((resolve) => {
    loader.load(url, (t) => {
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      resolve(t);
    });
  });

  return {
    async setTextures(t) {
      const [c, m, a] = await Promise.all([
        load(t.card),
        t.mask ? load(t.mask) : Promise.resolve(blank),
        load(t.area),
      ]);
      for (const key of ['uCard', 'uMask', 'uArea'] as const) {
        const old = uniforms[key].value;
        if (old !== blank) old.dispose();
      }
      uniforms.uCard.value = c;
      uniforms.uMask.value = m;
      uniforms.uArea.value = a;
      uniforms.uHasMask.value = t.mask ? 1 : 0;
      uniforms.uStrength.value = t.strength;
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
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
