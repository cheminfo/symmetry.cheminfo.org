/**
 * What the crystal workbench is showing, and the five ways it changes.
 *
 * The group lives in the view state, because the address carries it. The
 * structure being edited does not: a cell somebody typed cannot go in a query
 * string, and the CIF download is how it leaves the page. So the draft is local,
 * and the address and the draft meet in one place — here.
 *
 * **Changing anything detaches the draft from the library entry it started as.**
 * A link saying `structure=halite` must open halite, so the moment an atom moves
 * the page stops claiming to be halite and the link carries the group alone.
 */

import { batch } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import { useMemo, useState } from 'react';

import { readCif } from '../../crystal/cif/index.ts';
import type { CrystalDraft } from '../../crystal/draft.ts';
import { draftOf, emptyDraft, reconstrain } from '../../crystal/draft.ts';
import { resolveStructureSetting } from '../../crystal/resolve.ts';
import { structureById, structureOf } from '../../data/structures/index.ts';
import {
  selectSetting,
  selectSpaceGroup,
  selectStructure,
  state,
} from '../../state/index.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';
import { spaceGroup, spaceGroupSettings } from '../../symmetry/spaceGroups.ts';

/** The structure the workbench opens on when the address names none. */
export const DEFAULT_STRUCTURE_ID = 'halite';

/** What the page reads, and what it calls when something is clicked. */
export interface CrystalWorkbench {
  /** The setting in force, from the address. */
  readonly setting: SpaceGroupSetting;
  /** The structure on the bench, its cell already obeying the setting. */
  readonly draft: CrystalDraft;
  /** The library entry it still is, or `null` once it has been edited. */
  readonly structureId: string | null;
  /** Why the last dropped file could not be read, or `null`. */
  readonly problem: string | null;
  /** Put a library structure on the bench, in the group its file names. */
  readonly openStructure: (id: string) => void;
  /** Read a dropped CIF onto the bench. */
  readonly openFile: (text: string, fileName: string) => void;
  /** Build the same atoms in another group. */
  readonly changeGroup: (number: number) => void;
  /** Write the same group in another setting. */
  readonly changeSetting: (index: number) => void;
  /** Any edit to the cell or the atoms. */
  readonly edit: (next: CrystalDraft) => void;
}

/**
 * The workbench.
 * @returns What is on it, and the handlers that change it.
 */
export function useCrystalDraft(): CrystalWorkbench {
  useSignals();
  const structureId = state.view.crystals.structureId.value;
  const setting = settingOf(
    state.view.crystals.spaceGroupNumber.value,
    state.view.crystals.settingIndex.value,
  );

  // The draft the address describes: stable while the address is, so an edit
  // made against it can be told apart from a stale one.
  const fromAddress = useMemo(
    () => (structureId === null ? null : libraryDraft(structureId)),
    [structureId],
  );
  const [edited, setEdited] = useState<Edited>(() => ({
    base: null,
    draft: libraryDraft(DEFAULT_STRUCTURE_ID) ?? emptyDraft(spaceGroup(1)),
  }));
  const [problem, setProblem] = useState<string | null>(null);

  const current =
    edited.base === fromAddress ? edited.draft : (fromAddress ?? edited.draft);
  const draft = useMemo(
    () => reconstrain(current, setting),
    [current, setting],
  );

  function detach(next: CrystalDraft): void {
    setEdited({ base: null, draft: next });
    setProblem(null);
    if (structureId !== null) selectStructure(null);
  }

  return {
    setting,
    draft,
    structureId,
    problem,
    openStructure: (id) => {
      const entry = structureById(id);
      if (entry === undefined) return;
      setProblem(null);
      setEdited({ base: null, draft: libraryDraft(id) ?? draft });
      batch(() => {
        selectSpaceGroup(entry.spaceGroupNumber);
        selectSetting(entry.variant);
        selectStructure(id);
      });
    },
    openFile: (text, fileName) => {
      const read = readFile(text, fileName);
      if (typeof read === 'string') {
        setProblem(read);
        return;
      }
      setProblem(null);
      setEdited({ base: null, draft: read.draft });
      batch(() => {
        selectSpaceGroup(read.setting.number);
        selectSetting(read.setting.variant);
        selectStructure(null);
      });
    },
    changeGroup: (number) => {
      detach(current);
      selectSpaceGroup(number);
    },
    changeSetting: (index) => {
      detach(current);
      selectSetting(index);
    },
    edit: detach,
  };
}

/** A draft and the base it was made from; a `null` base is the student's own. */
interface Edited {
  readonly base: CrystalDraft | null;
  readonly draft: CrystalDraft;
}

/**
 * The setting an address names, falling back to a group's first setting when
 * the index is past the end of its own list.
 * @param number - International Tables number.
 * @param variant - Which setting of it the address asked for.
 */
export function settingOf(number: number, variant: number): SpaceGroupSetting {
  const settings = spaceGroupSettings(number);
  return settings[variant] ?? settings[0] ?? spaceGroup(1);
}

/** One library structure as a draft, or `null` when no structure has that id. */
function libraryDraft(id: string): CrystalDraft | null {
  const entry = structureById(id);
  if (entry === undefined) return null;
  return draftOf(
    structureOf(id),
    settingOf(entry.spaceGroupNumber, entry.variant),
    entry.title,
  );
}

/**
 * A dropped file as a draft, or the one sentence to show instead.
 *
 * `readCif` throws a sentence already written for a reader, so it is shown as
 * it is rather than wrapped in one of our own.
 */
function readFile(
  text: string,
  fileName: string,
): { draft: CrystalDraft; setting: SpaceGroupSetting } | string {
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
  const name = fileName.replace(/\.cif$/i, '');
  return {
    draft: draftOf(structure, resolved.setting, name),
    setting: resolved.setting,
  };
}
