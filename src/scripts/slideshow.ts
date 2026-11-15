// Featured reel: scroll-snap strip with autoplay. Pauses on hover, focus, a hidden tab and
// while a video is playing; never autoplays under reduced motion.
const DURATION = 7000;

const reel = document.querySelector<HTMLElement>('.reel');
const track = reel?.querySelector<HTMLElement>('.strip');

if (reel && track) {
  const slideCount = reel.querySelectorAll('.slide').length;
  const dots = [...reel.querySelectorAll<HTMLButtonElement>('.dots button')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer: number | undefined;
  let settle: number | undefined;
  let hovered = false;
  let focused = false;
  let bar: Animation | undefined;

  // Restarts the timer and the current dot's progress bar. The bar is a transform animation on the
  // dot's ::after, so it runs on the compositor and restarting it never forces a layout.
  const restart = (): void => {
    window.clearTimeout(timer);
    bar?.cancel();
    bar = undefined;
    const hidden = document.hidden || !(reel.checkVisibility?.() ?? true);
    const idle = motion.matches || hovered || focused || hidden;
    if (idle || reel.querySelector('iframe') || slideCount < 2) return;
    bar = dots[index]?.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: DURATION,
      easing: 'linear',
      fill: 'forwards',
      pseudoElement: '::after',
    });
    timer = window.setTimeout(() => go(index + 1), DURATION);
  };

  const mark = (): void => {
    dots.forEach((dot, k) => dot.setAttribute('aria-current', String(k === index)));
    restart();
  };

  const go = (n: number): void => {
    index = (n + slideCount) % slideCount;
    track.scrollTo({
      left: track.clientWidth * index,
      behavior: motion.matches ? 'auto' : 'smooth',
    });
    mark();
  };

  dots.forEach((dot, k) => dot.addEventListener('click', () => go(k)));
  reel.querySelectorAll<HTMLElement>('[data-step]').forEach((button) => {
    button.addEventListener('click', () => go(index + Number(button.dataset['step'])));
  });

  // keep the dots in step when the reader swipes or scrolls the strip
  track.addEventListener('scroll', () => {
    window.clearTimeout(settle);
    settle = window.setTimeout(() => {
      const n = Math.round(track.scrollLeft / track.clientWidth);
      if (n !== index) {
        index = n;
        mark();
      }
    }, 120);
  });

  reel.addEventListener('pointerenter', () => ((hovered = true), restart()));
  reel.addEventListener('pointerleave', () => ((hovered = false), restart()));
  reel.addEventListener('focusin', () => ((focused = true), restart()));
  reel.addEventListener('focusout', () => ((focused = false), restart()));
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', restart);
  restart();
}
