# Prints the metric-matched fallback @font-face rules used in src/styles/fonts.css.
#
# Each web font gets a local system font (Arial, Georgia) scaled with size-adjust so that the
# average glyph width matches, plus ascent, descent and line-gap overrides so the line box matches.
# Text set in the fallback then wraps almost exactly like the web font, so the swap does not reflow
# the page. Widths are measured at the weights the site actually uses, with the latin character
# weighting from capsize (the same method as Astro's and Next.js's font fallbacks).
#
# Run it again only if you change a font or its weights, then paste the output into fonts.css:
#   uvx --from 'fonttools[woff]==4.60.1' python scripts/font-fallbacks.py
# It reads the woff2 files from node_modules and the system fonts from macOS.
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONTSOURCE = ROOT / 'node_modules/@fontsource-variable'
SYSTEM = Path('/System/Library/Fonts/Supplemental')

# capsize latin character weighting (@capsizecss/unpack)
WEIGHTS = {
    '0': .0053, '1': .0023, '2': .0026, '3': .001, '4': .0008, '5': .0015, '6': .0007, '7': .0005,
    '8': .0007, '9': .0006, ',': .0083, ' ': .154, 't': .0672, 'h': .0351, 'e': .0922, 'o': .0571,
    'f': .017, 'P': .0023, 'p': .0163, 'l': .0304, "'": .0014, 's': .0469, 'R': .0015, 'u': .0207,
    'b': .0114, 'i': .0588, 'c': .0232, 'C': .0031, 'n': .0578, 'a': .0668, 'd': .0298, 'y': .0123,
    'w': .011, 'B': .002, 'r': .0526, 'z': .0011, 'G': .0011, 'j': .0009, 'T': .0041, '.': .0079,
    'L': .0012, 'k': .0046, 'm': .0181, ']': .0007, 'J': .0009, 'F': .0015, 'v': .0076, 'g': .0155,
    'A': .004, 'N': .0014, '-': .0018, 'H': .0013, 'D': .0013, 'M': .0025, 'I': .0022, 'E': .0011,
    '"': .0012, 'S': .0041, '(': .001, ')': .001, 'x': .0025, 'W': .0012, 'Q': .0001, 'Y': .0003,
    'q': .0008, 'V': .0005, 'K': .0007, 'U': .0016, '=': .0007, '[': .0021, 'O': .0009, '$': .0002,
    ':': .0008, '|': .0038, '/': .0001, '%': .0001, 'Z': .0002, ';': .0001, 'X': .0001,
}


def load(path, wght=None):
    font = TTFont(path)
    if wght is not None and 'fvar' in font:
        font = instancer.instantiateVariableFont(font, {'wght': wght})
    return font


def avg_width(font):
    """Weighted average advance width, in em."""
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    total = weight = 0.0
    for ch, w in WEIGHTS.items():
        glyph = cmap.get(ord(ch))
        if glyph:
            total += hmtx[glyph][0] * w
            weight += w
    return total / weight / font['head'].unitsPerEm


def face(family, web, local, local_names, weight, style='normal'):
    upm = web['head'].unitsPerEm
    hhea = web['hhea']
    size = avg_width(web) / avg_width(local)
    pct = lambda v: f'{v * 100:.2f}%'
    src = ', '.join(f"local('{n}')" for n in local_names)
    return '\n'.join([
        '@font-face {',
        f"  font-family: '{family}';",
        f'  font-style: {style};',
        f'  font-weight: {weight};',
        f'  src: {src};',
        f'  size-adjust: {pct(size)};',
        f'  ascent-override: {pct(hhea.ascent / upm / size)};',
        f'  descent-override: {pct(abs(hhea.descent) / upm / size)};',
        f'  line-gap-override: {pct(hhea.lineGap / upm / size)};',
        '}',
    ])


display = FONTSOURCE / 'big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2'
serif = FONTSOURCE / 'newsreader/files/newsreader-latin-wght-normal.woff2'
serif_italic = FONTSOURCE / 'newsreader/files/newsreader-latin-wght-italic.woff2'

rules = [
    face('Big Shoulders fallback', load(display, 500), load(SYSTEM / 'Arial.ttf'),
         ['Arial', 'ArialMT'], '100 599'),
    face('Big Shoulders fallback', load(display, 800), load(SYSTEM / 'Arial Bold.ttf'),
         ['Arial Bold', 'Arial-BoldMT'], '600 900'),
    face('Newsreader fallback', load(serif, 400), load(SYSTEM / 'Georgia.ttf'),
         ['Georgia'], '200 599'),
    face('Newsreader fallback', load(serif, 700), load(SYSTEM / 'Georgia Bold.ttf'),
         ['Georgia Bold', 'Georgia-Bold'], '600 800'),
    face('Newsreader fallback', load(serif_italic, 300), load(SYSTEM / 'Georgia Italic.ttf'),
         ['Georgia Italic', 'Georgia-Italic'], '200 800', 'italic'),
]
print('\n'.join(rules))
