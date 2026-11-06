import * as THREE from 'three';
import { BLEED, CARD_H, CARD_W } from '@/lib/cardDims';
import { FOIL_BASE, FOIL_FLOOR } from './holoShade';
import type { HoloPatternId } from '@/types/card';
import { RAINBOW, SCATTER_SPREAD, SHEEN_SWEEP, SHINE_BY_PATTERN, SPOT_CORE, SPOT_END, SPOT_MID_AT, TILT_3D, type ShineStyle } from './galleryFoilTuning';
import { FOIL_LIGHT, type TiltView } from './tiltView';

export interface FoilInputs {
  card: string;
  mask: string | null;
  area: string;
  strength: number;
  pattern: HoloPatternId | null;
}

export interface FoilMaterial {
  material: THREE.ShaderMaterial;
  setInputs(inputs: FoilInputs, anisotropy?: number): Promise<void>;
  setView(view: TiltView | null): void;
  setScatter(amount: number): void;
  setShine(shine: { light: readonly [number, number]; pointer: readonly [number, number]; amount: number; glare: number } | null): void;
  dispose(): void;
}

const MODEL = { glitter: 0, rainbow: 1, diagonal: 2 } as const;

function hsl(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))).toFixed(4);
  };
  return `vec3(${f(0)}, ${f(8)}, ${f(4)})`;
}

function palette(name: string, colors: string[], mirrored: boolean): string {
  const n = mirrored ? colors.length - 1 : colors.length;
  const stops = mirrored ? colors.slice(1) : [...colors.slice(1), colors[0]];
  const u = mirrored ? `(1.0 - abs(2.0 * fract(t) - 1.0)) * ${n}.0` : `fract(t) * ${n}.0`;
  return `vec3 ${name}(float t) {
    float u = ${u};
    vec3 c = ${colors[0]};
${stops.map((c, i) => `    c = mix(c, ${c}, clamp(u - ${i}.0, 0.0, 1.0));`).join('\n')}
    return c;
  }`;
}

const GLITTER_HUES = palette('glitterHues', [hsl(53, 0.65, 0.6), hsl(93, 0.56, 0.5), hsl(176, 0.54, 0.49), hsl(228, 0.59, 0.55), hsl(283, 0.6, 0.55), hsl(326, 0.59, 0.51)], true);
const RAINBOW_HUES = palette('rainbowHues', [hsl(283, 0.49, 0.6), hsl(2, 0.74, 0.59), hsl(53, 0.67, 0.53), hsl(93, 0.56, 0.52), hsl(176, 0.38, 0.5), hsl(228, 1, 0.77)], false);
const RAINBOW_LIGHT_MID = 'vec3(0.3329, 0.2, 0.3329)';
const RAINBOW_GLARE_EDGE = hsl(180, 0.11, 0.35);
const DIAGONAL_HUES = palette('diagonalHues', [hsl(2, 1, 0.73), hsl(53, 1, 0.69), hsl(93, 1, 0.69), hsl(176, 1, 0.76), hsl(228, 1, 0.74), hsl(283, 1, 0.73)], false);
const BAND_DARK = 'vec3(0.0549, 0.0824, 0.1804)';
const BAND_MID = hsl(180, 0.1, 0.6);
const BAND_PEAK = hsl(180, 0.29, 0.66);

function dir(cssDeg: number): string {
  const a = (cssDeg * Math.PI) / 180;
  return `vec2(${Math.sin(a).toFixed(4)}, ${Math.cos(a).toFixed(4)})`;
}

const vertex = /* glsl */ `
  uniform float uFixedView;
  uniform vec3 uView;
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  varying vec3 vViewLocal;
  void main() {
  #ifdef OZ_UV_Y_DOWN
    vUv = vec2(uv.x, 1.0 - uv.y);
  #else
    vUv = uv;
  #endif
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = uFixedView > 0.5 ? uView : normalize(cameraPosition - world.xyz);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec3 cameraLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
    vViewLocal = uFixedView > 0.5 ? uView : normalize(cameraLocal - position);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform float uFixedView;
  uniform sampler2D uCard;
  uniform sampler2D uMask;
  uniform sampler2D uArea;
  uniform float uHasMask;
  uniform float uStrength;
  uniform vec2 uBleed;
  uniform vec3 uLight;
  uniform float uShine;
  uniform vec2 uLightPos;
  uniform vec2 uPointer;
  uniform float uScatter;
  uniform float uModel;
  uniform vec2 uBandDir;
  uniform float uShineGain;
  uniform float uGlare;
  uniform float uTravel;
  uniform float uPeriod;
  uniform vec2 uSlide;
  uniform float uSpotMid;
  uniform float uBurn;
  uniform float uSaturate;
  uniform float uGrainHue;
  uniform float uPeriod2;
  uniform float uSlide2;
  uniform float uPeriod3;
  uniform float uGrain;
  varying vec2 vUv;
  varying vec3 vView;
  varying vec3 vNormal;
  varying vec3 vViewLocal;

  ${GLITTER_HUES}
  ${RAINBOW_HUES}
  ${DIAGONAL_HUES}

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 dodge(vec3 b, vec3 s) { return min(b / max(1.0 - s, 0.02), 1.0); }
  vec3 hardLight(vec3 b, vec3 s) {
    return mix(2.0 * s * b, 1.0 - 2.0 * (1.0 - s) * (1.0 - b), step(0.5, s));
  }
  vec3 overlay(vec3 b, vec3 s) { return hardLight(s, b); }
  vec3 softLight(vec3 b, vec3 s) {
    vec3 d = mix(sqrt(b), ((16.0 * b - 12.0) * b + 4.0) * b, step(b, vec3(0.25)));
    return mix(b - (1.0 - 2.0 * s) * b * (1.0 - b), b + (2.0 * s - 1.0) * (d - b), step(0.5, s));
  }
  vec3 bc(vec3 c, float b, float k) { return clamp((c * b - 0.5) * k + 0.5, 0.0, 1.0); }
  vec3 satur(vec3 c, float s) { return clamp(mix(vec3(luma(c)), c, s), 0.0, 1.0); }
  float cornerCircle(vec2 p, vec2 c, vec2 size) { return length(p - c) / length(max(c, size - c)); }
  vec3 clipColor(vec3 c) {
    float l = luma(c);
    float n = min(min(c.r, c.g), c.b);
    float x = max(max(c.r, c.g), c.b);
    if (n < 0.0) c = l + (c - l) * l / max(l - n, 1e-4);
    if (x > 1.0) c = l + (c - l) * (1.0 - l) / max(x - l, 1e-4);
    return c;
  }
  vec3 setLum(vec3 c, float l) { return clipColor(c + (l - luma(c))); }
  float sat(vec3 c) { return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b); }
  vec3 setSat(vec3 c, float s) {
    float n = min(min(c.r, c.g), c.b);
    float x = max(max(c.r, c.g), c.b);
    return x > n ? (c - n) * s / (x - n) : vec3(0.0);
  }
  vec3 hueBlend(vec3 b, vec3 s) { return setLum(setSat(s, sat(b)), luma(b)); }
  vec3 screen(vec3 b, vec3 s) { return 1.0 - (1.0 - b) * (1.0 - s); }
  vec3 diagonalBand(float t) {
    float f = fract(t) * 12.0;
    if (f < 3.8) return mix(${BAND_DARK}, ${BAND_MID}, f / 3.8);
    if (f < 4.5) return mix(${BAND_MID}, ${BAND_PEAK}, (f - 3.8) / 0.7);
    if (f < 5.2) return mix(${BAND_PEAK}, ${BAND_MID}, (f - 4.5) / 0.7);
    if (f < 10.0) return mix(${BAND_MID}, ${BAND_DARK}, (f - 5.2) / 4.8);
    return ${BAND_DARK};
  }
  float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 rainbowShine(vec3 col, vec2 p, vec2 size, vec2 pt, float fromCenter, vec2 lp, float period, vec2 slide, float gain, float opacity) {
    vec3 rb = rainbowHues(dot(p, ${dir(-22)}) / (${CARD_W}.0 * period) + dot(pt, slide));
    float d = length((p - lp) / (size * vec2(2.83, 3.54)));
    vec3 r = d < 0.4 ? mix(vec3(1.0), ${RAINBOW_LIGHT_MID}, clamp((d - 0.05) / 0.35, 0.0, 1.0))
      : mix(${RAINBOW_LIGHT_MID}, vec3(0.22), clamp((d - 0.4) / 0.8, 0.0, 1.0));
    r = bc(r, 0.4 + fromCenter * 0.2, 0.85);
    vec3 shine = bc(hardLight(rb, r), 0.5 + fromCenter * 0.3, 2.3);
    return mix(col, dodge(col, shine * gain), opacity);
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
    vec3 l = normalize(uLight);
    vec3 r = reflect(-l, n);
    vec3 vl = normalize(vViewLocal);

    float rate = 1.0 + uScatter * (glint - 0.5) * ${SCATTER_SPREAD.toFixed(1)};
    float lum = mix(0.55, 1.0, 0.5 * mix(0.4, 1.0, glint));
    vec3 base = vec3(${(FOIL_BASE / 255).toFixed(4)});
    vec3 foil = mix(base, vec3(mix(${(FOIL_FLOOR / 255).toFixed(4)}, 1.0, lum)), cover);

    float k = uStrength * area;
    vec3 col = card.rgb * mix(vec3(1.0), foil, k);
    float spec = pow(max(dot(r, v), 0.0), 24.0);
    col += spec * cover * k * glint * 0.55;
    float shineOn = uFixedView > 0.5 ? uShine : 1.0;
    vec2 pointer = uFixedView > 0.5 ? uPointer
      : 0.5 - clamp(asin(clamp(vl.xy, -1.0, 1.0)) / ${(2 * TILT_3D * Math.PI / 180).toFixed(4)}, -0.75, 0.75);
    vec2 lightPos = uFixedView > 0.5 ? uLightPos : 0.5 - ${SHEEN_SWEEP.toFixed(2)} * (pointer - 0.5);
    if (shineOn > 0.0) {
      vec2 size = vec2(${CARD_W}.0, ${CARD_H}.0);
      vec2 p = vUv * size;
      vec2 pt = pointer - 0.5;
      float fromCenter = clamp(length(pt) * 2.0, 0.0, 1.0);
      vec2 glareAt = lightPos * size;
      vec2 lp = (0.5 + (lightPos - 0.5) * uTravel) * size;
      float amount = shineOn * k * uShineGain;
      float gd = cornerCircle(p, glareAt, size);
      if (uModel < 0.5) {
        float d = cornerCircle(p, lp, size);
        float spot = d < ${SPOT_MID_AT.toFixed(2)}
          ? mix(1.0, uSpotMid, smoothstep(${SPOT_CORE.toFixed(2)}, ${SPOT_MID_AT.toFixed(2)}, d))
          : mix(uSpotMid, 0.0, clamp((d - ${SPOT_MID_AT.toFixed(2)}) / ${(SPOT_END - SPOT_MID_AT).toFixed(2)}, 0.0, 1.0));
        float t = dot(p, uBandDir) / (${CARD_W}.0 * uPeriod) + dot(pt, uSlide) * rate + hueOff * uGrainHue;
        vec3 light = glitterHues(t) * spot;
        float dots = cover * mix(1.0, glint, uBurn);
        vec3 shine = clamp(1.0 - (1.0 - light) / max(dots, 0.001), 0.0, 1.0);
        col = dodge(col, satur(shine, uSaturate) * amount);
        float g = clamp((mix(0.95, 0.2, clamp(gd / 1.5, 0.0, 1.0)) * 0.75 - 0.5) * 2.0 + 0.5, 0.0, 1.0);
        col = mix(col, overlay(col, vec3(g)), clamp(uGlare * shineOn * (0.25 + fromCenter), 0.0, 1.0));
      } else if (uModel > 1.5) {
        col = rainbowShine(col, p, size, pt, fromCenter, (0.5 + (lightPos - 0.5) * ${RAINBOW.lightTravel.toFixed(2)}) * size,
          ${RAINBOW.period.toFixed(3)}, vec2(${RAINBOW.slideX.toFixed(3)}, ${RAINBOW.slideY.toFixed(3)}), ${RAINBOW.gain.toFixed(3)}, 0.75 * shineOn * k * cover);
        float pa = gd < 0.12 ? 0.1 : gd < 0.2 ? mix(0.1, 0.15, (gd - 0.12) / 0.08) : mix(0.15, 0.25, clamp((gd - 0.2) / 1.0, 0.0, 1.0));
        float across = dot(p, ${dir(133)}) / ${CARD_W}.0;
        float up = p.y / (${CARD_W}.0 * uPeriod3);
        vec3 grain = vec3(hash(floor(p * 2.0)) * uGrain);
        vec3 b1 = diagonalBand(across / uPeriod + pt.x * uSlide.x);
        b1 = mix(b1, hardLight(vec3(0.0), b1), pa);
        vec3 s1 = satur(bc(screen(hueBlend(b1, diagonalHues(up + pt.y * uSlide.y)), grain), 0.8, 2.95), 0.65);
        vec3 b2 = diagonalBand(across / uPeriod2 + pt.x * uSlide2);
        b2 = mix(b2, hardLight(vec3(0.0), b2), pa);
        vec3 s2 = satur(bc(screen(hueBlend(b2, diagonalHues(up / 0.57 + pt.y * uSlide.y * 0.88 - 1.0 / 6.0)), grain), 1.0, 2.5), 1.75);
        col = dodge(col, softLight(s1, s2) * amount);
        float ga = gd < 0.45 ? mix(1.0, 0.33, gd / 0.45) : mix(0.33, 0.9, clamp((gd - 0.45) / 0.85, 0.0, 1.0));
        vec3 g = bc(vec3(gd < 0.45 ? mix(1.0, 0.54, gd / 0.45) : mix(0.54, 0.2, clamp((gd - 0.45) / 0.85, 0.0, 1.0))), 0.9, 1.75);
        col = mix(col, hardLight(col, g), clamp(uGlare * shineOn * ga, 0.0, 1.0));
      } else {
        col = rainbowShine(col, p, size, pt, fromCenter, lp, uPeriod, uSlide, uShineGain, 0.75 * shineOn * k * cover);
        vec3 g = gd < 0.1 ? vec3(1.0) : gd < 0.35 ? mix(vec3(1.0), vec3(0.8), (gd - 0.1) / 0.25)
          : mix(vec3(0.8), ${RAINBOW_GLARE_EDGE}, clamp((gd - 0.35) / 0.25, 0.0, 1.0));
        col = mix(col, softLight(col, g), clamp(uGlare * shineOn, 0.0, 1.0));
      }
    }
    gl_FragColor = vec4(col, card.a);
  }
`;

const loader = new THREE.TextureLoader();

function load(url: string, anisotropy: number): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, (t) => {
      t.anisotropy = anisotropy;
      resolve(t);
    }, undefined, reject);
  });
}

export function createFoilMaterial(uvYDown = false): FoilMaterial {
  const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  blank.needsUpdate = true;
  const uniforms = {
    uCard: { value: blank as THREE.Texture },
    uMask: { value: blank as THREE.Texture },
    uArea: { value: blank as THREE.Texture },
    uHasMask: { value: 0 },
    uStrength: { value: 0 },
    uBleed: { value: new THREE.Vector2(BLEED / CARD_W, BLEED / CARD_H) },
    uFixedView: { value: 0 },
    uView: { value: new THREE.Vector3(0, 0, 1) },
    uLight: { value: new THREE.Vector3(...FOIL_LIGHT) },
    uShine: { value: 0 },
    uScatter: { value: 0 },
    uLightPos: { value: new THREE.Vector2(0.5, 0.5) },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uModel: { value: 0 },
    uBandDir: { value: new THREE.Vector2(1, 0) },
    uShineGain: { value: 1 },
    uGlare: { value: 0 },
    uTravel: { value: 1 },
    uPeriod: { value: 2.5 },
    uSlide: { value: new THREE.Vector2(0, 0) },
    uSpotMid: { value: 0.5 },
    uBurn: { value: 1 },
    uSaturate: { value: 1 },
    uGrainHue: { value: 0 },
    uPeriod2: { value: 1 },
    uSlide2: { value: 0 },
    uPeriod3: { value: 1 },
    uGrain: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    defines: uvYDown ? { OZ_UV_Y_DOWN: '' } : {},
  });
  let styleGlare = 0;
  const setShineStyle = (style: ShineStyle) => {
    uniforms.uModel.value = MODEL[style.model];
    const band = (style.bandAngle * Math.PI) / 180;
    uniforms.uBandDir.value.set(Math.sin(band), Math.cos(band));
    uniforms.uShineGain.value = style.gain;
    styleGlare = style.glare;
    uniforms.uTravel.value = style.lightTravel;
    uniforms.uPeriod.value = style.period;
    uniforms.uSlide.value.set(style.slideX, style.slideY);
    if (style.model === 'glitter') {
      uniforms.uSpotMid.value = style.spotMid;
      uniforms.uBurn.value = style.burn;
      uniforms.uSaturate.value = style.saturate;
      uniforms.uGrainHue.value = style.grainHue;
    }
    if (style.model === 'diagonal') {
      uniforms.uPeriod2.value = style.backPeriod;
      uniforms.uSlide2.value = style.backSlide;
      uniforms.uPeriod3.value = style.rainbowPeriod;
      uniforms.uGrain.value = style.grain;
    }
  };
  const release = () => {
    for (const key of ['uCard', 'uMask', 'uArea'] as const) {
      const old = uniforms[key].value;
      if (old !== blank) old.dispose();
    }
  };
  return {
    material,
    async setInputs(inputs, anisotropy = 1) {
      const [c, m, a] = await Promise.all([
        load(inputs.card, anisotropy),
        inputs.mask ? load(inputs.mask, anisotropy) : Promise.resolve(blank),
        load(inputs.area, anisotropy),
      ]);
      release();
      uniforms.uCard.value = c;
      uniforms.uMask.value = m;
      uniforms.uArea.value = a;
      uniforms.uHasMask.value = inputs.mask ? 1 : 0;
      uniforms.uStrength.value = inputs.strength;
      if (inputs.pattern) setShineStyle(SHINE_BY_PATTERN[inputs.pattern]);
    },
    setView(view) {
      uniforms.uFixedView.value = view ? 1 : 0;
      uniforms.uView.value.set(...(view?.view ?? [0, 0, 1]));
      uniforms.uLight.value.set(...(view?.light ?? FOIL_LIGHT));
    },
    setScatter(amount) {
      uniforms.uScatter.value = amount;
    },
    setShine(shine) {
      uniforms.uShine.value = shine ? shine.amount : 0;
      if (!shine) return;
      uniforms.uLightPos.value.set(...shine.light);
      uniforms.uPointer.value.set(...shine.pointer);
      uniforms.uGlare.value = styleGlare * shine.glare;
    },
    dispose() {
      release();
      blank.dispose();
      material.dispose();
    },
  };
}
