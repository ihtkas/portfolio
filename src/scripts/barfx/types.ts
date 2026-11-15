import type { PaletteKey } from './palette';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BarGeometry {
  W: number;
  H: number;
  mark: Box;
  nav: Box;
  links: readonly Box[];
  rgba: (key: PaletteKey, alpha: number) => string;
}

export type Instrument = (
  ctx: CanvasRenderingContext2D,
  t: number,
  dt: number,
  geom: BarGeometry,
) => void;

export const TAU = Math.PI * 2;
