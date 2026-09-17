/**
 * CIF in and CIF out.
 *
 * A dropped file goes through exactly the path the shipped structures go
 * through, so the examples on the site are a test of the importer rather than a
 * separate code path. What comes out carries both the symbol and the whole
 * coset list, because a file naming only `F d -3 m` leaves the reader to guess
 * an origin, and guessing wrong moves every atom by an eighth of a cell.
 */

import { Button, Callout } from '@blueprintjs/core';
import type { DragEvent, ReactElement } from 'react';
import { useRef, useState } from 'react';
import { downloadText, sanitizeFileName } from 'react-cheminfo/core';

import { writeCif } from '../../crystal/cif/index.ts';
import type { CrystalDraft } from '../../crystal/draft.ts';
import { draftStructure } from '../../crystal/draft.ts';
import type { SpaceGroupSetting } from '../../symmetry/spaceGroups.ts';

import './crystals.css';

/** Props of {@link CifPanel}. */
export interface CifPanelProps {
  readonly draft: CrystalDraft;
  readonly setting: SpaceGroupSetting;
  /** A file was dropped or chosen: its text and its name. */
  readonly onFile: (text: string, fileName: string) => void;
  /** What went wrong reading the last file, or `null`. */
  readonly problem: string | null;
}

/**
 * The drop target and the download.
 * @param props - See {@link CifPanelProps}.
 * @returns The panel.
 */
export function CifPanel(props: CifPanelProps): ReactElement {
  const { draft, setting, onFile, problem } = props;
  const [over, setOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function take(file: File | undefined): Promise<void> {
    if (file === undefined) return;
    onFile(await file.text(), file.name);
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setOver(false);
    void take(event.dataTransfer.files[0]);
  }

  return (
    <div className="xtl-panel">
      <div
        className={over ? 'xtl-drop xtl-drop--over' : 'xtl-drop'}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => {
          setOver(false);
        }}
        onDrop={onDrop}
      >
        <span>Drop a CIF here to build it.</span>
        <input
          ref={fileInput}
          type="file"
          accept=".cif,chemical/x-cif,text/plain"
          style={hiddenFileStyle}
          aria-label="Choose a CIF file"
          onChange={(event) => {
            void take(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <Button
          size="small"
          variant="minimal"
          icon="folder-open"
          text="or choose a file"
          onClick={() => {
            fileInput.current?.click();
          }}
        />
      </div>
      {problem !== null && (
        <Callout intent="danger" title="That file could not be read" compact>
          {problem}
        </Callout>
      )}
      <div>
        <Button
          size="small"
          variant="minimal"
          icon="download"
          text="Download CIF"
          onClick={() => {
            downloadText(
              writeCif(draftStructure(draft, setting)),
              `${sanitizeFileName(draft.name, 'structure')}.cif`,
              'chemical/x-cif',
            );
          }}
        />
      </div>
    </div>
  );
}

const hiddenFileStyle = { display: 'none' } as const;
