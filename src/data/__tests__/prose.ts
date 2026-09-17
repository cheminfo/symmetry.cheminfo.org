/**
 * Every authored string, and how many sentences it holds.
 *
 * The marker test walks all of it, so a `[[term]]` written into a hint, a
 * cheatsheet row or a glossary summary is checked exactly as one written into a
 * tutorial step.
 */

import { EXERCISES } from '../exercises/index.ts';
import { GLOSSARY } from '../glossary/index.ts';
import { REFERENCE_SECTIONS } from '../reference/index.ts';
import { TUTORIAL_STEPS } from '../tutorial/index.ts';

/** `No. 14` is a space-group number, not the end of a sentence. */
const ABBREVIATION = /\bNo\./g;
const SENTENCE = /[.!?](?:\s|$)/g;

/** How many sentences a string holds. */
export function sentenceCount(text: string): number {
  return text.replaceAll(ABBREVIATION, 'No').match(SENTENCE)?.length ?? 0;
}

/** Every authored string that may carry a marker, with where it came from. */
export function authoredProse(): ReadonlyArray<readonly [string, string]> {
  const prose: Array<readonly [string, string]> = [];
  for (const step of TUTORIAL_STEPS) {
    prose.push([step.id, step.description], [step.id, step.observe]);
  }
  for (const exercise of EXERCISES) {
    prose.push([exercise.id, exercise.description]);
    for (const hint of exercise.hints) prose.push([exercise.id, hint]);
    prose.push([exercise.id, exercise.solution]);
  }
  for (const [term, entry] of Object.entries(GLOSSARY)) {
    prose.push([term, entry.summary]);
    for (const example of entry.examples) {
      prose.push([term, example.observation]);
      if (example.note !== undefined) prose.push([term, example.note]);
    }
  }
  for (const section of REFERENCE_SECTIONS) {
    for (const row of section.rows) prose.push([section.id, row.description]);
  }
  return prose;
}
