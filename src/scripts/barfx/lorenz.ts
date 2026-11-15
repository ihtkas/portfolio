import { TAU, type Instrument } from './types';

const N = 3000;
const H_STEP = 0.005;
const SEGMENTS = 40;

type Vec = [number, number, number];

function deriv(x: number, y: number, z: number, o: Vec): void {
  o[0] = 10 * (y - x);
  o[1] = x * (28 - z) - y;
  o[2] = x * y - (8 / 3) * z;
}

const k1: Vec = [0, 0, 0];
const k2: Vec = [0, 0, 0];
const k3: Vec = [0, 0, 0];
const k4: Vec = [0, 0, 0];
const P: Vec = [0.1, 0, 0];

/** One RK4 step of sigma 10, rho 28, beta 8/3. */
function step(): void {
  const h = H_STEP;
  const [x, y, z] = P;
  deriv(x, y, z, k1);
  deriv(x + (h / 2) * k1[0], y + (h / 2) * k1[1], z + (h / 2) * k1[2], k2);
  deriv(x + (h / 2) * k2[0], y + (h / 2) * k2[1], z + (h / 2) * k2[2], k3);
  deriv(x + h * k3[0], y + h * k3[1], z + h * k3[2], k4);
  for (let i = 0; i < 3; i++) {
    P[i] =
      (P[i] ?? 0) + (h / 6) * ((k1[i] ?? 0) + 2 * (k2[i] ?? 0) + 2 * (k3[i] ?? 0) + (k4[i] ?? 0));
  }
}

interface Ring {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  head: number;
  acc: number;
}

let ring: Ring | null = null;

function init(): Ring {
  const r: Ring = {
    x: new Float32Array(N),
    y: new Float32Array(N),
    z: new Float32Array(N),
    head: 0,
    acc: 0,
  };
  for (let i = 0; i < 1500; i++) step();
  for (let i = 0; i < N; i++) {
    step();
    r.x[i] = P[0];
    r.y[i] = P[1];
    r.z[i] = P[2];
  }
  return r;
}

/** Lorenz attractor drawn from a 3000-point ring buffer (allocated on first use). */
export const lorenz: Instrument = (ctx, t, dt, g) => {
  const r = (ring ??= init());
  const { W, H } = g;
  r.acc += dt * 90;
  while (r.acc >= 1) {
    r.acc--;
    step();
    r.x[r.head] = P[0];
    r.y[r.head] = P[1];
    r.z[r.head] = P[2];
    r.head = (r.head + 1) % N;
  }

  const phi = t * 0.06;
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const kx = Math.min((W * 0.4) / 26, ((H * 0.84) / 50) * 3.2);
  const per = Math.ceil(N / SEGMENTS);
  let hx = 0;
  let hy = 0;
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  for (let j = 0; j < SEGMENTS; j++) {
    const i0 = j * per;
    const i1 = Math.min(N - 1, i0 + per);
    ctx.strokeStyle =
      j > SEGMENTS - 3
        ? g.rgba('lamp', 0.55)
        : g.rgba('mute', 0.03 + 0.3 * Math.pow(j / SEGMENTS, 1.5));
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const q = (r.head + i) % N;
      const X = W / 2 + ((r.x[q] ?? 0) * cp + (r.y[q] ?? 0) * sp) * kx;
      const Y = H * 0.92 - ((r.z[q] ?? 0) / 50) * H * 0.84;
      if (i === i0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
      hx = X;
      hy = Y;
    }
    ctx.stroke();
  }
  ctx.fillStyle = g.rgba('lamp-hot', 0.95);
  ctx.beginPath();
  ctx.arc(hx, hy, 1.5, 0, TAU);
  ctx.fill();
};
