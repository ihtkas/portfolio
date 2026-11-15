export type PaletteKey = 'lamp' | 'lamp-hot' | 'mute';
type Rgb = readonly [number, number, number];

const KEYS: readonly PaletteKey[] = ['lamp', 'lamp-hot', 'mute'];
const FALLBACK: Rgb = [128, 128, 128];

function parse(value: string): Rgb {
  let s = value.trim();
  if (s.startsWith('#')) {
    if (s.length === 4) s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
    const at = (i: number): number => parseInt(s.slice(i, i + 2), 16);
    return [at(1), at(3), at(5)];
  }
  const m = s.match(/[\d.]+/g);
  if (!m || m.length < 3) return FALLBACK;
  return [Number(m[0]), Number(m[1]), Number(m[2])];
}

export interface Palette {
  read(): void;
  rgba(key: PaletteKey, alpha: number): string;
}

/** Colours come from the live CSS custom properties, so a theme change only needs read() again. */
export function createPalette(root: HTMLElement): Palette {
  const colors = new Map<PaletteKey, Rgb>();
  let boost = 1;
  return {
    read() {
      const cs = getComputedStyle(root);
      for (const k of KEYS) colors.set(k, parse(cs.getPropertyValue(`--${k}`)));
      boost = cs.colorScheme === 'light' ? 1.15 : 1;
    },
    rgba(key, alpha) {
      const [r, g, b] = colors.get(key) ?? FALLBACK;
      return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha * boost)).toFixed(3)})`;
    },
  };
}
