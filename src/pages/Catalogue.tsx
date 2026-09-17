/**
 * The four catalogues: `/point-groups`, `/space-groups`, `/wallpaper` and
 * `/frieze`, each with an index and one page per entry.
 *
 * These are the site's indexable pages. Somebody searching `Pnma` or
 * `C2v character table` lands on one, so an entry **says** what the group is
 * rather than sending the reader to a workbench to find out — and then offers
 * the workbench.
 *
 * One component serves all four; `descriptorFor` is the whole of what tells
 * them apart.
 */

import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { CatalogueEntry } from '../components/catalogue/CatalogueEntry.tsx';
import { CatalogueIndex } from '../components/catalogue/CatalogueIndex.tsx';
import { descriptorFor } from '../components/catalogue/descriptors.ts';
import type { CatalogueTabId } from '../state/index.ts';
import { state } from '../state/index.ts';

import '../components/catalogue/catalogue.css';
import '../components/catalogue/entry.css';
import '../components/catalogue/body.css';

/**
 * A catalogue index, or one entry of it.
 * @param props - Which of the four catalogues is open.
 * @returns The index when the address names no entry, and the entry when it
 *   names one the catalogue holds.
 */
export function Catalogue(props: { tab: CatalogueTabId }): ReactElement {
  useSignals();
  const itemId = state.view.catalogue.itemId.value;
  // The setting is the crystal workbench's own leaf, because it means the same
  // thing on both pages: which of a number's settings is in force.
  const settingIndex = state.view.crystals.settingIndex.value;
  const descriptor = descriptorFor(props.tab);
  // Closing a point group, decomposing 192 operations into elements and
  // deriving the absences are all real work. Doing them per render would also
  // hand the diagrams a new operation array each time and redraw them.
  const view = useMemo(
    () => (itemId === null ? null : descriptor.entry(itemId, settingIndex)),
    [descriptor, itemId, settingIndex],
  );
  if (view === null) {
    return (
      <CatalogueIndex
        descriptor={descriptor}
        {...(itemId === null ? {} : { missing: itemId })}
      />
    );
  }
  return <CatalogueEntry descriptor={descriptor} view={view} />;
}
