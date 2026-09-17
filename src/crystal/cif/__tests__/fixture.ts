import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIRECTORY = join(import.meta.dirname, 'fixtures');

/**
 * Read one fixture CIF.
 * @param name - the file name, e.g. `halite.cif`.
 * @returns its content. Every fixture is ASCII, so the encoding is not in play.
 */
export function fixture(name: string): string {
  return readFileSync(join(DIRECTORY, name), 'utf8');
}

/**
 * List every fixture CIF.
 * @returns the file names, sorted.
 */
export function fixtureNames(): string[] {
  return readdirSync(DIRECTORY).toSorted();
}

/**
 * Wrap a body in the smallest CIF that carries a unit cell.
 * @param body - the tags under test.
 * @returns a one-block CIF.
 */
export function miniCif(body: string): string {
  return `data_test
_cell_length_a 1
_cell_length_b 2
_cell_length_c 3
_cell_angle_alpha 90
_cell_angle_beta 90
_cell_angle_gamma 90
${body}
`;
}
