/**
 * Every point group the site teaches, in the order a chemist meets them.
 *
 * One row per group, `id|family|principalOrder|classes|HM|HM full|system|Laue`,
 * with the last four empty when the group is not one of the 32 crystallographic
 * classes. A row is one string so that the table stays readable as a table;
 * {@link parsePointGroup} is what reads it, and is unit-tested.
 *
 * Class headers follow Cotton, *Chemical Applications of Group Theory*, 3rd ed.,
 * Appendix II, and **that order is data, not decoration**: the character tables
 * of `src/data/characterTables` are written column by column against it.
 *
 * Hermann-Mauguin symbols are ASCII, with `-3` for `3̄`, so a space group's
 * crystal class from `src/symmetry/core` compares to one of these with `===`.
 */
export const POINT_GROUP_ROWS: readonly string[] = [
  'C1|nonaxial|1|E|1|1|triclinic|-1',
  'Cs|nonaxial|1|E σh|m|m|monoclinic|2/m',
  'Ci|nonaxial|1|E i|-1|-1|triclinic|-1',
  'C2|Cn|2|E C2|2|2|monoclinic|2/m',
  'C3|Cn|3|E C3 C3^2|3|3|trigonal|-3',
  'C4|Cn|4|E C4 C2 C4^3|4|4|tetragonal|4/m',
  'C5|Cn|5|E C5 C5^2 C5^3 C5^4||||',
  'C6|Cn|6|E C6 C3 C2 C3^2 C6^5|6|6|hexagonal|6/m',
  'C7|Cn|7|E C7 C7^2 C7^3 C7^4 C7^5 C7^6||||',
  'C8|Cn|8|E C8 C4 C8^3 C2 C8^5 C4^3 C8^7||||',
  'C2v|Cnv|2|E C2 σv(xz) σv′(yz)|mm2|mm2|orthorhombic|mmm',
  'C3v|Cnv|3|E 2C3 3σv|3m|3m|trigonal|-3m',
  'C4v|Cnv|4|E 2C4 C2 2σv 2σd|4mm|4mm|tetragonal|4/mmm',
  'C5v|Cnv|5|E 2C5 2C5^2 5σv||||',
  'C6v|Cnv|6|E 2C6 2C3 C2 3σv 3σd|6mm|6mm|hexagonal|6/mmm',
  'C7v|Cnv|7|E 2C7 2C7^2 2C7^3 7σv||||',
  'C8v|Cnv|8|E 2C8 2C4 2C8^3 C2 4σv 4σd||||',
  'C2h|Cnh|2|E C2 i σh|2/m|2/m|monoclinic|2/m',
  'C3h|Cnh|3|E C3 C3^2 σh S3 S3^5|-6|-6|hexagonal|6/m',
  'C4h|Cnh|4|E C4 C2 C4^3 i S4^3 σh S4|4/m|4/m|tetragonal|4/m',
  'C5h|Cnh|5|E C5 C5^2 C5^3 C5^4 σh S5 S5^7 S5^3 S5^9||||',
  'C6h|Cnh|6|E C6 C3 C2 C3^2 C6^5 i S3^5 S6^5 σh S6 S3|6/m|6/m|hexagonal|6/m',
  'D2|Dn|2|E C2(z) C2(y) C2(x)|222|222|orthorhombic|mmm',
  'D3|Dn|3|E 2C3 3C2|32|32|trigonal|-3m',
  'D4|Dn|4|E 2C4 C2 2C2′ 2C2″|422|422|tetragonal|4/mmm',
  'D5|Dn|5|E 2C5 2C5^2 5C2||||',
  'D6|Dn|6|E 2C6 2C3 C2 3C2′ 3C2″|622|622|hexagonal|6/mmm',
  'D7|Dn|7|E 2C7 2C7^2 2C7^3 7C2||||',
  'D8|Dn|8|E 2C8 2C4 2C8^3 C2 4C2′ 4C2″||||',
  'D2h|Dnh|2|E C2(z) C2(y) C2(x) i σ(xy) σ(xz) σ(yz)|mmm|2/m 2/m 2/m|orthorhombic|mmm',
  'D3h|Dnh|3|E 2C3 3C2 σh 2S3 3σv|-6m2|-6m2|hexagonal|6/mmm',
  'D4h|Dnh|4|E 2C4 C2 2C2′ 2C2″ i 2S4 σh 2σv 2σd|4/mmm|4/m 2/m 2/m|tetragonal|4/mmm',
  'D5h|Dnh|5|E 2C5 2C5^2 5C2 σh 2S5 2S5^3 5σv||||',
  'D6h|Dnh|6|E 2C6 2C3 C2 3C2′ 3C2″ i 2S3 2S6 σh 3σd 3σv|6/mmm|6/m 2/m 2/m|hexagonal|6/mmm',
  'D7h|Dnh|7|E 2C7 2C7^2 2C7^3 7C2 σh 2S7 2S7^3 2S7^5 7σv||||',
  'D8h|Dnh|8|E 2C8 2C4 2C8^3 C2 4C2′ 4C2″ i 2S8 2S4 2S8^3 σh 4σv 4σd||||',
  'D2d|Dnd|2|E 2S4 C2 2C2′ 2σd|-42m|-42m|tetragonal|4/mmm',
  'D3d|Dnd|3|E 2C3 3C2 i 2S6 3σd|-3m|-3 2/m|trigonal|-3m',
  'D4d|Dnd|4|E 2S8 2C4 2S8^3 C2 4C2′ 4σd||||',
  'D5d|Dnd|5|E 2C5 2C5^2 5C2 i 2S10^3 2S10 5σd||||',
  'D6d|Dnd|6|E 2S12 2C6 2S4 2C3 2S12^5 C2 6C2′ 6σd||||',
  'S4|Sn|4|E S4 C2 S4^3|-4|-4|tetragonal|4/m',
  'S6|Sn|6|E C3 C3^2 i S6^5 S6|-3|-3|trigonal|-3',
  'S8|Sn|8|E S8 C4 S8^3 C2 S8^5 C4^3 S8^7||||',
  'T|cubic|3|E 4C3 4C3^2 3C2|23|23|cubic|m-3',
  'Th|cubic|3|E 4C3 4C3^2 3C2 i 4S6 4S6^5 3σh|m-3|2/m -3|cubic|m-3',
  'Td|cubic|3|E 8C3 3C2 6S4 6σd|-43m|-43m|cubic|m-3m',
  'O|cubic|4|E 6C4 3C2(=C4²) 8C3 6C2|432|432|cubic|m-3m',
  'Oh|cubic|4|E 8C3 6C2 6C4 3C2(=C4²) i 6S4 8S6 3σh 6σd|m-3m|4/m -3 2/m|cubic|m-3m',
  'I|icosahedral|5|E 12C5 12C5^2 20C3 15C2||||',
  'Ih|icosahedral|5|E 12C5 12C5^2 20C3 15C2 i 12S10 12S10^3 20S6 15σ||||',
  'Cinfv|linear|inf|E 2C∞ ∞σv||||',
  'Dinfh|linear|inf|E 2C∞ ∞σv i 2S∞ ∞C2||||',
];
