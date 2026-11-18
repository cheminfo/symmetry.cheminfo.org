/**
 * The two ways in while the viewer is empty — a file, or one of the
 * structures the site ships — and the row that opens another one once a
 * crystal is on screen.
 */

import { Button, HTMLSelect } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useRef } from 'react';
import { downloadText, sanitizeFileName } from 'react-cheminfo/core';
import { DataDropZone, PagePart } from 'react-cheminfo/ui';

import { STRUCTURES } from '../../data/structures/index.ts';
import { state } from '../../state/index.ts';

import type { ViewerSource } from './viewerSource.ts';
import { openViewerExample } from './viewerSource.ts';

/** What the file types Open offers. */
const CIF_ACCEPT = '.cif,chemical/x-cif,text/plain';

/** Props of {@link CifDrop}. */
export interface CifDropProps {
  /** Files dropped, pasted or chosen. */
  readonly onFiles: (files: File[]) => void;
  /** Text pasted, or dragged in from another page. */
  readonly onText: (text: string) => void;
}

/**
 * What the viewer shows while it holds nothing.
 * @param props - See {@link CifDropProps}.
 * @returns The drop zone, with the examples under it.
 */
export function CifDrop(props: CifDropProps): ReactElement {
  return (
    <DataDropZone
      title="Open a crystal structure"
      description="Drop a CIF file here, paste its text, or open it. Or start from a structure the site ships:"
      onFiles={props.onFiles}
      onText={props.onText}
      accept={CIF_ACCEPT}
      multiple={false}
      icon="cube"
      className="cif-drop"
      actions={
        <div className="cif-drop__examples">
          {STRUCTURES.map((entry) => (
            <Button
              key={entry.id}
              size="small"
              variant="outlined"
              text={entry.title}
              onClick={() => {
                openViewerExample(entry.id);
              }}
            />
          ))}
        </div>
      }
    />
  );
}

/** Props of {@link CifActions}. */
export interface CifActionsProps {
  readonly source: ViewerSource;
  /** Files chosen with Open. */
  readonly onFiles: (files: File[]) => void;
}

/**
 * Open another file, pick another example, or take the file away.
 * @param props - See {@link CifActionsProps}.
 * @returns The row.
 */
export function CifActions(props: CifActionsProps): ReactElement {
  useSignals();
  const { source, onFiles } = props;
  const fileInput = useRef<HTMLInputElement>(null);
  const structureId = state.view.viewer.structureId.value;

  return (
    <div className="cif-actions no-print">
      <input
        ref={fileInput}
        type="file"
        accept={CIF_ACCEPT}
        hidden
        aria-label="Choose a CIF file"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <Button
        size="small"
        icon="folder-open"
        text="Open a CIF…"
        onClick={() => {
          fileInput.current?.click();
        }}
      />
      <HTMLSelect
        aria-label="Open an example"
        value={structureId ?? ''}
        onChange={(event) => {
          if (event.target.value !== '') openViewerExample(event.target.value);
        }}
      >
        <option value="">Examples…</option>
        {STRUCTURES.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.title}
          </option>
        ))}
      </HTMLSelect>
      <PagePart part="export">
        <Button
          size="small"
          variant="minimal"
          icon="download"
          text="Download CIF"
          onClick={() => {
            downloadText(
              source.text,
              `${sanitizeFileName(source.name, 'structure')}.cif`,
              'chemical/x-cif',
            );
          }}
        />
      </PagePart>
    </div>
  );
}
