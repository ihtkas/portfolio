const OMEGA = 2 * Math.PI * 1.6;
const ZETA = 0.3;
const SUBSTEPS = 4;
const SETTLE = 0.05;

export interface SpringState {
  x: number;
  w: number;
  vx: number;
  vw: number;
}

export interface SpringTarget {
  x: number;
  w: number;
}

/** Mass-spring-damper on the underline's centre and width, ζ 0.3, ω₀ 2π·1.6. */
export function stepSpring(s: SpringState, target: SpringTarget, dt: number): SpringState {
  const h = Math.min(dt, 0.05) / SUBSTEPS;
  let { x, w, vx, vw } = s;
  for (let i = 0; i < SUBSTEPS; i++) {
    vx += (OMEGA * OMEGA * (target.x - x) - 2 * ZETA * OMEGA * vx) * h;
    x += vx * h;
    vw += (OMEGA * OMEGA * (target.w - w) - 2 * ZETA * OMEGA * vw) * h;
    w += vw * h;
  }
  return { x, w, vx, vw };
}

export function isSettled(s: SpringState, target: SpringTarget): boolean {
  return (
    Math.abs(target.x - s.x) < SETTLE &&
    Math.abs(s.vx) < SETTLE &&
    Math.abs(target.w - s.w) < SETTLE &&
    Math.abs(s.vw) < SETTLE
  );
}
