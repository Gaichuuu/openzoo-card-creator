import { MAX_TILT, SHEEN_SWEEP } from './galleryFoilTuning';

export type Vec3 = readonly [number, number, number];

export const FOIL_LIGHT: Vec3 = [-0.4, 0.7, 0.9];

export interface TiltView {
  view: Vec3;
  light: Vec3;
}

function unit(v: Vec3): Vec3 {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
}

export function tiltView(rxDeg: number, ryDeg: number): TiltView {
  const rx = (rxDeg * Math.PI) / 180;
  const ry = (ryDeg * Math.PI) / 180;
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  const rows: Vec3[] = [[cy, 0, sy], [sx * sy, cx, -sx * cy], [-cx * sy, sx, cx * cy]];
  const toCard = (u: Vec3): Vec3 => {
    const css: Vec3 = [u[0], -u[1], u[2]];
    const out = [0, 1, 2].map((k) => css[0] * rows[0][k] + css[1] * rows[1][k] + css[2] * rows[2][k]);
    return unit([out[0], -out[1], out[2]]);
  };
  return { view: toCard([0, 0, 1]), light: toCard(unit(FOIL_LIGHT)) };
}

export function tiltPointer(rxDeg: number, ryDeg: number): readonly [number, number] {
  return [0.5 + ryDeg / MAX_TILT / 2, 0.5 + rxDeg / MAX_TILT / 2];
}

export function sheenCenter(rxDeg: number, ryDeg: number): readonly [number, number] {
  const [x, y] = tiltPointer(rxDeg, ryDeg);
  return [0.5 - SHEEN_SWEEP * (x - 0.5), 0.5 - SHEEN_SWEEP * (y - 0.5)];
}
