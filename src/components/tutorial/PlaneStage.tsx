/**
 * The live view of a plane group: the pattern it makes, and the elements that
 * make it.
 *
 * Two drawings side by side on purpose. The tiling is what a student
 * recognises; the diagram is what the International Tables print, and putting
 * them next to each other is how the second one stops being a code.
 */

import { Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import {
  friezeById,
  friezeOperations,
  latticeCell,
  wallpaperById,
  wallpaperOperations,
} from '../../symmetry/planeGroups.ts';
import { ElementDiagram, PatternSvg, motifById } from '../plane/index.ts';

/** What {@link PlaneStage} needs. */
export interface PlaneStageProps {
  /** Wallpaper or frieze id, e.g. `p4m` or `p2mg`. */
  readonly groupId: string;
  /** Which of the two namespaces it belongs to: `p2` names one in each. */
  readonly namespace: string;
  /**
   * The motif repeated.
   * @default the first motif the site ships
   */
  readonly motifId?: string;
  /** Cells drawn along each direction. @default 3 */
  readonly tiles?: number;
  /** Whether the element diagram is drawn beside the tiling. @default true */
  readonly diagram?: boolean;
}

/**
 * A plane group as a tiling and as its element diagram.
 * @param props - See {@link PlaneStageProps}.
 * @returns The two drawings, or a line saying no such group exists.
 */
export function PlaneStage(props: PlaneStageProps): ReactElement {
  const { groupId, namespace, motifId, tiles = 3, diagram = true } = props;
  const built = useMemo(
    () => resolve(groupId, namespace),
    [groupId, namespace],
  );
  if (built === null) {
    return (
      <Callout intent="warning">
        {`No ${namespace === 'frieze' ? 'frieze' : 'wallpaper'} group ${groupId}.`}
      </Callout>
    );
  }

  return (
    <div className="plane-stage">
      <PatternSvg
        operations={built.operations}
        cell={built.cell}
        motif={motifById(motifId)}
        tiles={tiles}
        motifScale={built.motifScale}
        title={`${groupId}, tiled over ${tiles} × ${tiles} cells`}
        className="plane-stage__drawing"
      />
      {diagram && (
        <ElementDiagram
          operations={built.operations}
          cell={built.cell}
          title={`${groupId}, its symmetry elements`}
          className="plane-stage__drawing"
        />
      )}
    </div>
  );
}

/** The operations, the cell, and how small the motif has to be drawn in it. */
function resolve(groupId: string, namespace: string) {
  if (namespace === 'frieze') {
    const group = friezeById(groupId);
    if (group === undefined) return null;
    return {
      operations: friezeOperations(group),
      cell: latticeCell('rectangular', 100),
      motifScale: motifScale(group.operationsPerPeriod),
    };
  }
  const group = wallpaperById(groupId);
  if (group === undefined) return null;
  return {
    operations: wallpaperOperations(group),
    cell: latticeCell(group.lattice, 100),
    motifScale: motifScale(group.operationsPerCell),
  };
}

/**
 * A motif sized for p1 overlaps its own copies in a group of order twelve, so
 * it shrinks with the number of copies the cell holds.
 */
function motifScale(copies: number): number {
  return Math.min(1, 1.4 / Math.sqrt(copies));
}
