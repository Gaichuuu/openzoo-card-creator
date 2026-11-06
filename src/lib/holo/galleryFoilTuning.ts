import type { HoloPatternId } from '@/types/card';

// --- Tilt

export const MAX_TILT = 15;
export const TILT_3D = 45;
export const HOVER_TAU = 0.05;
export const LEAVE_TAU = 0.2;

// --- Light

export const SHEEN_SWEEP = 1;
export const SPOT_CORE = 0.05;
export const SPOT_MID_AT = 0.4;
export const SPOT_END = 1.3;

interface ShineBase {
  gain: number;
  glare: number;
  lightTravel: number;
  period: number;
  slideX: number;
  slideY: number;
  bandAngle: number;
}

export interface GlitterShine extends ShineBase {
  model: 'glitter';
  spotMid: number;
  burn: number;
  saturate: number;
  grainHue: number;
}

export interface RainbowShine extends ShineBase {
  model: 'rainbow';
}

export interface DiagonalShine extends ShineBase {
  model: 'diagonal';
  backPeriod: number;
  backSlide: number;
  rainbowPeriod: number;
  grain: number;
}

export type ShineStyle = GlitterShine | RainbowShine | DiagonalShine;

const GLITTER: GlitterShine = {
  model: 'glitter',
  bandAngle: 90,
  gain: 1,
  glare: 0.35,
  lightTravel: 1,
  period: 2.5,
  slideX: 0.95,
  slideY: 0.5,
  spotMid: 0.55,
  burn: 1,
  saturate: 0.8,
  grainHue: 0.15,
};

export const RAINBOW: RainbowShine = {
  model: 'rainbow',
  bandAngle: 90,
  gain: 1.1,
  glare: 1,
  lightTravel: -2,
  period: 1.9,
  slideX: 0.1,
  slideY: 0.55,
};

const DIAGONAL: DiagonalShine = {
  model: 'diagonal',
  bandAngle: 90,
  gain: 0.75,
  glare: 0.5,
  lightTravel: 1,
  period: 0.38,
  slideX: 1,
  slideY: 0.74,
  backPeriod: 0.29,
  backSlide: -0.63,
  rainbowPeriod: 2.9,
  grain: 0.25,
};

export const SHINE_BY_PATTERN: Record<HoloPatternId, ShineStyle> = {
  rainbow: RAINBOW,
  diamond: { ...GLITTER, bandAngle: 82 },
  diagonal: DIAGONAL,
  sand: { ...GLITTER, bandAngle: 82 },
  stars: GLITTER,
  shards: { ...GLITTER, bandAngle: 82 },
  bubbles: GLITTER,
  streaks: { ...GLITTER, burn: 0.7 },
};

export const SPARKLE_LO = 0.2;

// --- Grain scatter

export const SCATTER = 1;
export const SCATTER_SPREAD = 1;

// --- Fallback shimmer

export const SHIMMER_GAIN = 1.3;
export const SHEEN_FLOOR = 0.15;
