/**
 * A CIF somebody handed the site — dropped, pasted, chosen, or carried by a
 * figure — read into a draft and the setting it is written in.
 *
 * The crystal workbench and the viewer open files through this one function,
 * so a file one of them reads is a file the other reads too.
 */

import type { SpaceGroupSetting } from '../data/spaceGroups.ts';

import type { CrystalStructure } from './cif/index.ts';
import { readCif } from './cif/index.ts';
import type { CrystalDraft } from './draft.ts';
import { draftOf } from './draft.ts';
import { resolveStructureSetting } from './resolve.ts';

/** A file read, and what it is built in. */
export interface OpenedCif {
  readonly structure: CrystalStructure;
  readonly draft: CrystalDraft;
  readonly setting: SpaceGroupSetting;
}

/**
 * Read a CIF, or say in one sentence why it could not be read.
 *
 * `readCif` throws a sentence already written for a reader, so it is returned
 * as it is rather than wrapped in one of ours.
 * @param text - The file's text.
 * @param fileName - What the file is called; the draft is named after it.
 * @returns The structure, its draft and its setting, or the sentence.
 */
export function openCif(text: string, fileName: string): OpenedCif | string {
  let structure;
  try {
    structure = readCif(text);
  } catch (error) {
    return error instanceof Error ? error.message : 'It is not a CIF.';
  }
  const resolved = resolveStructureSetting(structure);
  if (resolved.setting === null) {
    return `${fileName} names no space group this site recognises. Add a _space_group_IT_number, a Hermann-Mauguin symbol or the operation list.`;
  }
  const name = cifStem(fileName);
  return {
    structure,
    draft: draftOf(structure, resolved.setting, name),
    setting: resolved.setting,
  };
}

/**
 * A file name without its `.cif`.
 * @param fileName - What the file is called.
 * @returns The name.
 */
export function cifStem(fileName: string): string {
  return fileName.replace(/\.cif$/i, '');
}
