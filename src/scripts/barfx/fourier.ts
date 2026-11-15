import { TAU, type Instrument } from './types';

const K = 6;
const SPEED = 26;

/** Epicycles building a square wave; terms 1..6 fade in and out over 40 s. */
export const fourier: Instrument = (ctx, t, _dt, g) => {
  const { H, mark, nav } = g;
  const cy = H / 2;
  const R = Math.min(H * 0.17, 11);
  const w = TAU / 6;
  const r = (i: number): number => (R * 4) / (Math.PI * (2 * i + 1));
  const s = (t / 4) % 10;
  const L = s < 5 ? 1 + s : 6 - (s - 5);
  const wt = (i: number): number => Math.max(0, Math.min(1, L - i));
  const cx = mark.x + mark.w + 18 + r(0);
  let px = cx;
  let py = cy;

  ctx.lineWidth = 0.75;
  for (let i = 0; i < K; i++) {
    const ri = r(i) * wt(i);
    if (ri < 0.05) continue;
    const n = 2 * i + 1;
    const qx = px + ri * Math.cos(n * w * t);
    const qy = py - ri * Math.sin(n * w * t);
    ctx.strokeStyle = g.rgba('mute', 0.16);
    ctx.beginPath();
    ctx.arc(px, py, ri, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = g.rgba('mute', 0.4);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(qx, qy);
    ctx.stroke();
    px = qx;
    py = qy;
  }

  const xs = cx + r(0) * 1.4 + 8;
  const xe = Math.max(xs + 70, Math.min(nav.x - 20, xs + 420));
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = g.rgba('mute', 0.28);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(xs, py);
  ctx.stroke();
  ctx.setLineDash([]);

  const grad = ctx.createLinearGradient(xs, 0, xe, 0);
  grad.addColorStop(0, g.rgba('lamp', 0.55));
  grad.addColorStop(0.6, g.rgba('lamp', 0.22));
  grad.addColorStop(1, g.rgba('lamp', 0));
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = xs; x <= xe; x += 1.5) {
    const tt = t - (x - xs) / SPEED;
    let y = 0;
    for (let k = 0; k < K; k++) y += r(k) * wt(k) * Math.sin((2 * k + 1) * w * tt);
    if (x === xs) ctx.moveTo(x, cy - y);
    else ctx.lineTo(x, cy - y);
  }
  ctx.stroke();

  ctx.fillStyle = g.rgba('lamp-hot', 0.95);
  ctx.beginPath();
  ctx.arc(px, py, 1.5, 0, TAU);
  ctx.fill();
};
