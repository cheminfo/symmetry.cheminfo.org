import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseOperation } from '../parseOperation.ts';
import type { CrystalOperation } from '../types.ts';

/** One entry of the extracted International Tables table, as it is on disk. */
export interface RawSetting {
  readonly spaceGroup: number;
  readonly HM: string;
  readonly hall: string;
  readonly latticeCentering: string;
  readonly abbreviatedSymbol: string;
  readonly variant: number;
  readonly crystalSystem: string;
  readonly dimension: number;
  readonly equivalentPositions: string;
  readonly equivalentArray: readonly string[];
}

/**
 * The 521 settings of the 230 space groups, holding 7244 operations between
 * them. It is the fixture the core is checked against, not a shipped data file:
 * the site's own typed table is generated from it separately.
 */
export const RAW_SETTINGS: readonly RawSetting[] = JSON.parse(
  readFileSync(join(import.meta.dirname, 'data/spaceGroups.json'), 'utf8'),
) as RawSetting[];

/** One setting, by International Tables number and setting index. */
export function rawSetting(number: number, variant = 0): RawSetting {
  const setting = RAW_SETTINGS.find(
    (entry) => entry.spaceGroup === number && entry.variant === variant,
  );
  if (setting === undefined) throw new Error(`no setting ${number}/${variant}`);
  return setting;
}

/** The parsed coset list of one setting, centring translations included. */
export function settingOperations(
  number: number,
  variant = 0,
): Array<CrystalOperation<3>> {
  return rawSetting(number, variant).equivalentArray.map((xyz) =>
    parseOperation(xyz, 3),
  );
}

/** The eight general positions of the plane group p4g, in the ITA order. */
export const P4G_POSITIONS = [
  'x,y',
  '-x,-y',
  '-y,x',
  'y,-x',
  '-x+1/2,y+1/2',
  'x+1/2,-y+1/2',
  'y+1/2,x+1/2',
  '-y+1/2,-x+1/2',
] as const;

/** p4g, parsed. */
export function p4gOperations(): Array<CrystalOperation<2>> {
  return P4G_POSITIONS.map((xyz) => parseOperation(xyz, 2));
}
