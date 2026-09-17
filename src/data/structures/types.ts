/** What the structure library records about each CIF beside it. */

/** Where the coordinates in the file came from. */
export type StructureSource =
  | {
      readonly kind: 'literature';
      /** The determination the cell and the coordinates are quoted from. */
      readonly citation: string;
    }
  | {
      readonly kind: 'cod';
      /** The Crystallography Open Database entry, e.g. `9011665`. */
      readonly cod: string;
      /** The paper that entry carries. */
      readonly citation: string;
    };

/**
 * One structure the site ships, as the picker lists it.
 *
 * Only what the CIF cannot say is written here. The cell, the coordinates, the
 * occupancies and the group all come from the file, and the number and variant
 * below are checked against it — a record that disagreed with its own file
 * would put a wrong group on screen under a right name.
 */
export interface StructureEntry {
  /** Its value in `?structure=`, and the stem of its `.cif` file. */
  readonly id: string;
  /** What the picker shows, e.g. `Halite`. */
  readonly title: string;
  /** The formula, rendered by `react-mf`. */
  readonly formula: string;
  /** International Tables number of the group the file names. */
  readonly spaceGroupNumber: number;
  /** Which setting of it the file is written in. */
  readonly variant: number;
  /** One clause saying what this structure is here to show. */
  readonly teaches: string;
  readonly source: StructureSource;
}
