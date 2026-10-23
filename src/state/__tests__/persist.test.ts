import { expect, test, vi } from 'vitest';

import {
  getExerciseProgress,
  preferences,
  setExerciseStatus,
  setNotation,
} from '../preferences.ts';

// Installed before the buckets are read, with what an earlier visit stored:
// Node ships no `localStorage`, and the buckets read it when they are declared.
const storage = vi.hoisted(() => {
  const entries = new Map<string, string>([
    ['symmetry:preferences:v1', JSON.stringify({ flags: { axes: false } })],
    [
      'symmetry:exercises:v1',
      JSON.stringify({
        progress: {
          'c2v-water': {
            status: 'attempted',
            hintsRevealed: 1,
            showSolution: false,
          },
        },
      }),
    ],
  ]);
  const memory: Storage = {
    get length() {
      return entries.size;
    },
    clear: () => {
      entries.clear();
    },
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
  vi.stubGlobal('localStorage', memory);
  return memory;
});

function storedKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key !== null) keys.push(key);
  }
  return keys.toSorted();
}

test('what an earlier visit stored under the two keys is read back', () => {
  expect(preferences.flags.axes.value).toBe(false);
  expect(preferences.flags.mirrors.value).toBe(true);
  expect(preferences.notation.value).toBe('schoenflies');
  expect(getExerciseProgress('c2v-water')).toStrictEqual({
    status: 'attempted',
    hintsRevealed: 1,
    showSolution: false,
  });
});

test('the two buckets are written under the keys they always were', () => {
  setNotation('hermann-mauguin');
  setExerciseStatus('c2v-water', 'solved');

  expect(storedKeys()).toStrictEqual([
    'symmetry:exercises:v1',
    'symmetry:preferences:v1',
  ]);
  const display = JSON.parse(storage.getItem('symmetry:preferences:v1') ?? '');

  expect(display.notation).toBe('hermann-mauguin');
  expect(display.flags.axes).toBe(false);
  expect(
    JSON.parse(storage.getItem('symmetry:exercises:v1') ?? '').progress[
      'c2v-water'
    ].status,
  ).toBe('solved');
});
