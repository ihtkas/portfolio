import { fourier } from './fourier';
import { harmonograph } from './harmonograph';
import { lorenz } from './lorenz';
import { createPalette } from './palette';
import { isSettled, stepSpring, type SpringState } from './spring';
import type { BarGeometry, Box, Instrument } from './types';

/*
 * Header instruments. Ambient: harmonograph, Fourier epicycles or Lorenz attractor, random start,
 * rotated every ROTATE seconds with a crossfade, drawn at 30 fps on its own canvas. Spring underline
 * on a second canvas, animated only while moving. No ambient under prefers-reduced-motion (the spring
 * snaps) or at 640px and below.
 */
const ROTATE = 40;
const FADE = 1.2;
const AMBIENT_FRAME = 1 / 30;

const AMBIENT: readonly Instrument[] = [harmonograph, fourier, lorenz];

function canvas(
  bar: HTMLElement,
  cls: string,
): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  const c = document.createElement('canvas');
  c.className = `bfx ${cls}`;
  c.setAttribute('aria-hidden', 'true');
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  bar.prepend(c);
  return [c, ctx];
}

function mount(bar: HTMLElement, markEl: HTMLElement, navEl: HTMLElement): void {
  const a = canvas(bar, 'bfx-ambient');
  const s = canvas(bar, 'bfx-spring');
  if (!a || !s) return;
  const [cvA, ctxA] = a;
  const ctxS = s[1];
  const layers = [a, s];

  const root = document.documentElement;
  const rm = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 640px)');
  const palette = createPalette(root);
  const linkEls = [...navEl.querySelectorAll<HTMLAnchorElement>('a')];

  const rel = (b: DOMRect, el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  };
  const geom: BarGeometry = {
    W: 0,
    H: 0,
    mark: { x: 0, y: 0, w: 0, h: 0 },
    nav: { x: 0, y: 0, w: 0, h: 0 },
    links: [],
    rgba: (k, al) => palette.rgba(k, al),
  };
  function measure(): void {
    const b = bar.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    geom.W = bar.clientWidth;
    geom.H = bar.clientHeight;
    for (const [cv, ctx] of layers) {
      cv.width = Math.round(geom.W * dpr);
      cv.height = Math.round(geom.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    geom.mark = rel(b, markEl);
    geom.nav = rel(b, navEl);
    geom.links = linkEls.map((l) => rel(b, l));
  }

  let current = Math.floor(Math.random() * AMBIENT.length);
  let since = 0;
  let lastA = 0;

  let spring: SpringState | null = null;
  let target = -1;
  let rest = -1;
  let springMoving = true;

  function drawSpring(dt: number): boolean {
    ctxS.clearRect(0, 0, geom.W, geom.H);
    const L = geom.links[target];
    if (!L || !L.w) {
      spring = null;
      return false;
    }
    const goal = { x: L.x + L.w / 2, w: L.w };
    const y = L.y + L.h + 0.5;
    spring =
      spring === null || rm.matches ? { ...goal, vx: 0, vw: 0 } : stepSpring(spring, goal, dt);
    ctxS.fillStyle = geom.rgba('mute', 0.45);
    for (const x of [goal.x - goal.w / 2, goal.x + goal.w / 2]) {
      ctxS.fillRect(Math.round(x) - 0.5, y + 2.5, 1, 3);
    }
    const half = Math.max(0, spring.w) / 2;
    ctxS.strokeStyle = geom.rgba('lamp', 0.95);
    ctxS.lineWidth = 1.5;
    ctxS.lineCap = 'round';
    ctxS.beginPath();
    ctxS.moveTo(spring.x - half, y);
    ctxS.lineTo(spring.x + half, y);
    ctxS.stroke();
    return !isSettled(spring, goal);
  }

  let raf = 0;
  let last = 0;
  const ambientOn = (): boolean => !rm.matches && !narrow.matches;
  function loop(ms: number): void {
    raf = 0;
    const t = ms / 1000;
    const dt = last ? Math.min(0.05, t - last) : 1 / 60;
    last = t;
    if (springMoving) springMoving = drawSpring(dt);
    if (ambientOn()) {
      if (t - lastA >= AMBIENT_FRAME - 0.002) {
        const adt = lastA ? Math.min(0.1, t - lastA) : AMBIENT_FRAME;
        lastA = t;
        since += adt;
        if (since > ROTATE) {
          since = 0;
          current = (current + 1) % AMBIENT.length;
        }
        cvA.style.opacity = Math.min(1, since / FADE, (ROTATE - since) / FADE).toFixed(3);
        ctxA.clearRect(0, 0, geom.W, geom.H);
        AMBIENT[current]?.(ctxA, t, adt, geom);
      }
      raf = requestAnimationFrame(loop);
    } else {
      ctxA.clearRect(0, 0, geom.W, geom.H);
      lastA = 0;
      if (springMoving) raf = requestAnimationFrame(loop);
      else last = 0;
    }
  }
  const nudge = (): void => {
    springMoving = true;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  linkEls.forEach((link, i) => {
    const aim = (): void => {
      target = i;
      nudge();
    };
    const home = (): void => {
      target = rest;
      nudge();
    };
    link.addEventListener('pointerenter', aim);
    link.addEventListener('focus', aim);
    link.addEventListener('pointerleave', home);
    link.addEventListener('blur', home);
  });

  const onTheme = (): void => {
    palette.read();
    nudge();
  };
  new MutationObserver(onTheme).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  rm.addEventListener('change', nudge);
  narrow.addEventListener('change', nudge);
  new ResizeObserver(() => {
    measure();
    nudge();
  }).observe(bar);

  bar.classList.add('has-fx');
  palette.read();
  measure();
  rest = target = linkEls.findIndex((l) => l.getAttribute('aria-current') === 'page');
  nudge();
}

function start(): void {
  const bar = document.querySelector<HTMLElement>('.bar');
  const markEl = bar?.querySelector<HTMLElement>('.mark');
  const navEl = bar?.querySelector<HTMLElement>('nav');
  if (bar && markEl && navEl) mount(bar, markEl, navEl);
}

const begin = (): void => {
  setTimeout(start, 0);
};
if (window.HTMLCanvasElement) {
  if (document.fonts?.ready) void document.fonts.ready.then(begin);
  else begin();
}
