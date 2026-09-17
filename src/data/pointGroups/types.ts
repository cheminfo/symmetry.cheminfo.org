/** The seven families a chemist sorts the point groups into, plus the two linear ones. */
export type PointGroupFamily =
  | 'nonaxial'
  | 'Cn'
  | 'Cnv'
  | 'Cnh'
  | 'Dn'
  | 'Dnh'
  | 'Dnd'
  | 'Sn'
  | 'cubic'
  | 'icosahedral'
  | 'linear';

/** The seven crystal systems of the International Tables. */
export type CrystalSystem =
  | 'triclinic'
  | 'monoclinic'
  | 'orthorhombic'
  | 'tetragonal'
  | 'trigonal'
  | 'hexagonal'
  | 'cubic';

/** One conjugacy class, as a character table prints its header. */
export interface PointGroupClass {
  /** `E`, `2C3`, `3σv`, `2S8^3` — the multiplicity is part of the header. */
  readonly label: string;
  /** How many operations are in the class. `Infinity` for the linear groups. */
  readonly size: number;
}

/** A molecular point group. Everything derivable is derived, not typed. */
export interface PointGroup {
  /** ASCII Schoenflies symbol, the key everywhere: `C2v`, `D3h`, `Cinfv`. */
  readonly id: string;
  /** Lowercase ASCII, what goes in a URL: `c2v`, `d3h`, `cinfv`. */
  readonly slug: string;
  /** The symbol as a chemist writes it, subscripts left to the renderer: `C∞v`. */
  readonly schoenflies: string;
  readonly family: PointGroupFamily;
  /** The order of the principal axis. 1 for the non-axial groups, `Infinity` for linear. */
  readonly principalOrder: number;
  /** |G|, the number of operations. `Infinity` for the linear groups. */
  readonly order: number;
  readonly classes: readonly PointGroupClass[];
  /** The short Hermann-Mauguin symbol, or `null` when the group is not crystallographic. */
  readonly hermannMauguin: string | null;
  /** The full Hermann-Mauguin symbol, spelling out every direction. */
  readonly hermannMauguinFull: string | null;
  readonly crystalSystem: CrystalSystem | null;
  /** One of the 11 Laue classes, for a crystallographic group. */
  readonly laueClass: string | null;
  /** Only proper rotations, so a molecule in it is chiral and optically active. */
  readonly chiral: boolean;
  /** Leaves a direction invariant, so the molecule may carry a permanent dipole. */
  readonly polar: boolean;
  /** Contains the inversion. */
  readonly centrosymmetric: boolean;
  /** One of the 32 classes compatible with a lattice. */
  readonly crystallographic: boolean;
}

/** What a point-group entry is typed as. Every other field is computed. */
export interface RawPointGroup {
  readonly id: string;
  readonly schoenflies?: string;
  readonly family: PointGroupFamily;
  readonly principalOrder: number;
  /** The class headers, in character-table order, separated by single spaces. */
  readonly classes: string;
  readonly hermannMauguin?: string;
  readonly hermannMauguinFull?: string;
  readonly crystalSystem?: CrystalSystem;
  readonly laueClass?: string;
}
