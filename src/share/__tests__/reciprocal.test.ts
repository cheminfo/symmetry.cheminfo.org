import { expect, test } from 'vitest';

import {
  openReciprocalPhoto,
  pickSpot,
  rebuiltImage,
  state,
} from '../../state/index.ts';
import { formatRoute, parseAddress } from '../../utils/router.ts';
import { reciprocalOnScreen } from '../reciprocalShare.ts';
import { applyRoute, currentRoute } from '../route.ts';
import { shareVocabularyOf } from '../vocabulary.ts';

/** Apply an address as the shell does, and read back the one it writes. */
function open(value: string): string {
  applyRoute(parseAddress(value));
  return formatRoute(currentRoute());
}

test('a bare visit opens the square lattice and keeps a bare address', () => {
  expect(open('/reciprocal')).toBe('/reciprocal');
  expect(state.view.reciprocal.source.value).toStrictEqual({
    kind: 'example',
    id: 'square-lattice',
  });
});

test('an example, its mask and its phases travel in the link', () => {
  expect(
    open(
      '/reciprocal?example=glide&mask=spots&spots=0,0,0,8&phase=swap&phaseFrom=letter-f',
    ),
  ).toBe(
    '/reciprocal?example=glide&mask=spots&spots=0,0,0,8&phase=swap&phaseFrom=letter-f',
  );
  expect(
    open('/reciprocal?example=slit&mask=low&radius=12&show=phase&contrast=5'),
  ).toBe('/reciprocal?example=slit&mask=low&radius=12&show=phase&contrast=5');
});

test('a setting at its default, or that nothing uses, is not written', () => {
  expect(
    open(
      '/reciprocal?example=square-lattice&mask=all&radius=40&spots=0,0&phase=measured&phaseFrom=slit&contrast=3',
    ),
  ).toBe('/reciprocal');
});

test('any lattice setting means the generator, written whole', () => {
  expect(open('/reciprocal?a=20')).toBe(
    '/reciprocal?a=20&b=16&gamma=90&basis=dot&crystal=90&noise=0',
  );
  expect(state.view.reciprocal.source.value).toStrictEqual({
    kind: 'lattice',
    lattice: { a: 20, b: 16, gamma: 90, basis: 'dot', crystal: 90, noise: 0 },
    from: null,
  });
  // Beside an example, what the link does not name stays as the example has it.
  expect(open('/reciprocal?example=glide&a=20')).toBe(
    '/reciprocal?example=glide&a=20&b=32&gamma=90&basis=glide&crystal=90&noise=0',
  );
  // Out of range is brought back inside it, not refused.
  expect(open('/reciprocal?a=2&gamma=170&basis=hexagon&noise=900')).toBe(
    '/reciprocal?a=6&b=16&gamma=150&basis=dot&crystal=90&noise=200',
  );
});

test('a link a hand mangled still opens on something sensible', () => {
  expect(open('/reciprocal?example=duck&mask=blur&region=1,2&spots=,,')).toBe(
    '/reciprocal',
  );
  expect(open('/reciprocal?region=250,250,99,99&mask=spots')).toBe(
    '/reciprocal?region=250,250,6,6&mask=spots&spots=0,0',
  );
});

test('picking a spot from the full transform keeps the centre with it', () => {
  open('/reciprocal');
  pickSpot({ u: 16, v: 0 });

  expect(formatRoute(currentRoute())).toBe(
    '/reciprocal?mask=spots&spots=0,0,16,0',
  );
  // The centre and one pair: the mean grey, plus fringes 16 px apart along x
  // that run straight down the image. They fade with the crystal, so they are
  // compared with their neighbours rather than across the whole picture.
  const image = rebuiltImage.value;
  const row = 128 * 256;
  const crest = image[row + 128] ?? 0;
  const trough = image[row + 136] ?? 0;
  const swing = crest - trough;
  expect(swing).toBeGreaterThan(0);
  expect(Math.abs((image[row + 144] ?? 0) - crest)).toBeLessThan(0.1 * swing);
  expect(Math.abs((image[row + 8 * 256 + 128] ?? 0) - crest)).toBeLessThan(
    0.1 * swing,
  );
  expect(image[row + 8 * 256 + 136]).toBeLessThan(crest - 0.5 * swing);
});

test('a picture somebody opened stays on screen through a back to its page', () => {
  open('/reciprocal');
  openReciprocalPhoto({ name: 'mine.png', image: new Float64Array(256 * 256) });

  expect(formatRoute(currentRoute())).toBe('/reciprocal');
  expect(open('/reciprocal')).toBe('/reciprocal');
  expect(state.view.reciprocal.source.value).toStrictEqual({
    kind: 'photo',
    name: 'mine.png',
  });
  expect(open('/reciprocal?example=arrow')).toBe('/reciprocal?example=arrow');
});

test('the dialog leaves the picture to "Opens on", and is told what is on screen', () => {
  const params = Object.keys(shareVocabularyOf('reciprocal').params ?? {});
  for (const key of [
    'example',
    'a',
    'b',
    'gamma',
    'basis',
    'crystal',
    'noise',
  ]) {
    expect(params).not.toContain(key);
  }
  expect(params).toContain('mask');

  open('/reciprocal?example=slit');
  expect(reciprocalOnScreen()).toStrictEqual({
    example: 'slit',
    changed: false,
  });
  open('/reciprocal?example=glide&a=20');
  expect(reciprocalOnScreen()).toStrictEqual({
    example: 'glide',
    changed: true,
    screen: {
      entries: [
        ['a', '20'],
        ['b', '32'],
        ['gamma', '90'],
        ['basis', 'glide'],
        ['crystal', '90'],
        ['noise', '0'],
      ],
    },
  });
});
