import { TAU, type Instrument } from './types';

const RATIOS: readonly (readonly [number, number])[] = [
  [3, 2],
  [4, 3],
  [5, 4],
  [2, 1],
  [5, 3],
];
const CYCLE = 36;
const TRAIL = 24;
const W0 = 0.5;
const DECAY = 14;
const SEGMENTS = 16;

/** Decaying, slightly detuned Lissajous figure. */
export const harmonograph: Instrument = (ctx, t, _dt, g) => {
  const { H, mark, nav } = g;
  const k = Math.floor(t / CYCLE);
  const tau = t - k * CYCLE;
  const [ra = 3, rb = 2] = RATIOS[k % RATIOS.length] ?? [];
  const a = ra * 1.004;
  const b = rb;
  const d = Math.PI / 4 + k * 0.7;
  const g0 = mark.x + mark.w;
  const g1 = nav.x;
  const cx = (g0 + g1) / 2;
  const Ax = Math.min(200, Math.max(24, (g1 - g0) / 2 - 16));
  const Ay = H * 0.36;
  const fade = Math.min(1, tau / 1.5) * Math.min(1, (CYCLE - tau) / 3);
  const pos = (s: number): [number, number] => {
    const e = Math.exp(-s / DECAY);
    return [cx + Ax * e * Math.sin(a * W0 * s + d), H / 2 + Ay * e * Math.sin(b * W0 * s)];
  };

  const pts: [number, number][] = [];
  for (let s = Math.max(0, tau - TRAIL); s <= tau; s += 0.035) pts.push(pos(s));
  pts.push(pos(tau));

  const per = Math.ceil(pts.length / SEGMENTS);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (let j = 0; j < SEGMENTS; j++) {
    const i0 = j * per;
    const i1 = Math.min(pts.length - 1, i0 + per);
    if (i1 <= i0) break;
    ctx.strokeStyle = g.rgba('lamp', fade * (0.04 + 0.42 * Math.pow(i1 / pts.length, 1.6)));
    ctx.beginPath();
    const first = pts[i0];
    if (first) ctx.moveTo(first[0], first[1]);
    for (let i = i0 + 1; i <= i1; i++) {
      const p = pts[i];
      if (p) ctx.lineTo(p[0], p[1]);
    }
    ctx.stroke();
  }
  const head = pts[pts.length - 1];
  if (head) {
    ctx.fillStyle = g.rgba('lamp-hot', 0.9 * fade);
    ctx.beginPath();
    ctx.arc(head[0], head[1], 1.5, 0, TAU);
    ctx.fill();
  }
};
