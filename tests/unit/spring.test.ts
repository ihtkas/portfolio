import { describe, expect, it } from 'vitest';
import { isSettled, stepSpring, type SpringState } from '../../src/scripts/barfx/spring';

const target = { x: 100, w: 100 };
const start: SpringState = { x: 0, w: 100, vx: 0, vw: 0 };

function run(seconds: number): { state: SpringState; peak: number } {
  let state = start;
  let peak = state.x;
  for (let i = 0; i < Math.round(seconds * 60); i++) {
    state = stepSpring(state, target, 1 / 60);
    peak = Math.max(peak, state.x);
  }
  return { state, peak };
}

describe('spring', () => {
  it('overshoots by about 37% (zeta 0.3)', () => {
    const { peak } = run(2);
    expect(peak).toBeGreaterThan(130);
    expect(peak).toBeLessThan(145);
  });

  it('settles on the target', () => {
    // the 0.05 threshold also covers velocity, which takes a little over 3 s to decay
    expect(isSettled(run(0.5).state, target)).toBe(false);
    expect(isSettled(run(4).state, target)).toBe(true);
  });

  it('is unchanged when dt is 0', () => {
    expect(stepSpring(start, target, 0)).toEqual(start);
  });
});
