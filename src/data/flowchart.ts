/** Where an answer leads: another question, a group, or a family that needs n. */
export type FlowTarget =
  | { readonly kind: 'question'; readonly id: string }
  | { readonly kind: 'group'; readonly id: string }
  | {
      readonly kind: 'groupFamily';
      readonly family: 'Cn' | 'Cnv' | 'Cnh' | 'Dn' | 'Dnh' | 'Dnd' | 'S2n';
    };

/** One node of the assignment tree. */
export interface FlowQuestion {
  readonly id: string;
  /** One sentence, answerable by looking at the molecule. */
  readonly question: string;
  /** What to look for, shown as the hint. */
  readonly hint: string;
  readonly yes: FlowTarget;
  readonly no: FlowTarget;
}

/** Where a walk starts. */
export const FLOW_START = 'linear';

/**
 * The standard assignment tree, as data.
 *
 * The order of the questions is the whole of the teaching. The linear test comes
 * first because no count of an n-fold axis ever reaches a continuous group; the
 * "two axes above two-fold" test comes second because otherwise methane is
 * assigned `C₃v`; and it says **above** two-fold, because ethene has three `C₂`
 * axes and is not cubic.
 */
export const ASSIGNMENT_FLOW: readonly FlowQuestion[] = [
  {
    id: 'linear',
    question: 'Are all the atoms on one straight line?',
    hint: 'Two atoms are always linear. Three or more: check that every bond angle is 180°.',
    yes: { kind: 'question', id: 'linear-i' },
    no: { kind: 'question', id: 'multi-high-axis' },
  },
  {
    id: 'linear-i',
    question: 'Is there a [[centre of inversion]] at the middle of the line?',
    hint: 'Ask whether the molecule reads the same from both ends: CO₂ does, OCS does not.',
    yes: { kind: 'group', id: 'Dinfh' },
    no: { kind: 'group', id: 'Cinfv' },
  },
  {
    id: 'multi-high-axis',
    question: 'Are there two or more proper rotation axes above two-fold?',
    hint: 'Count C₃, C₄ and C₅ axes only. A C₂ does not count, and an S₄ is not a C₄: methane has four C₃, ethene has three C₂ and nothing more.',
    yes: { kind: 'question', id: 'has-c5' },
    no: { kind: 'question', id: 'any-axis' },
  },
  {
    id: 'has-c5',
    question: 'Are there six C₅ axes?',
    hint: 'An icosahedron or a truncated one: C₆₀, B₁₂H₁₂²⁻, dodecahedrane.',
    yes: { kind: 'question', id: 'icosa-i' },
    no: { kind: 'question', id: 'has-c4' },
  },
  {
    id: 'icosa-i',
    question: 'Is there a centre of inversion?',
    hint: 'Almost always yes for a real icosahedral molecule; I without i needs a chiral decoration of the cage.',
    yes: { kind: 'group', id: 'Ih' },
    no: { kind: 'group', id: 'I' },
  },
  {
    id: 'has-c4',
    question: 'Are there three C₄ axes?',
    hint: 'A proper four-fold rotation, not an S₄. SF₆ has three; methane has none.',
    yes: { kind: 'question', id: 'octa-i' },
    no: { kind: 'question', id: 'tetra-mirror' },
  },
  {
    id: 'octa-i',
    question: 'Is there a centre of inversion?',
    hint: 'O without i is the twisted, chiral octahedron, and is very rare.',
    yes: { kind: 'group', id: 'Oh' },
    no: { kind: 'group', id: 'O' },
  },
  {
    id: 'tetra-mirror',
    question: 'Is there any mirror plane?',
    hint: 'T keeps four C₃ and three C₂ and nothing else: neopentane with every methyl turned the same way.',
    yes: { kind: 'question', id: 'tetra-i' },
    no: { kind: 'group', id: 'T' },
  },
  {
    id: 'tetra-i',
    question: 'Is there a centre of inversion?',
    hint: 'Tₕ keeps three σₕ and the inversion; T_d has six σ_d and no inversion.',
    yes: { kind: 'group', id: 'Th' },
    no: { kind: 'group', id: 'Td' },
  },
  {
    id: 'any-axis',
    question: 'Is there any proper rotation axis at all?',
    hint: 'Turn the molecule by 360°/n about a candidate axis and check that it looks identical.',
    yes: { kind: 'question', id: 'perp-c2' },
    no: { kind: 'question', id: 'lone-mirror' },
  },
  {
    id: 'lone-mirror',
    question: 'Is there a mirror plane?',
    hint: 'No axis, one plane: SOCl₂, CH₂ClBr, NHF₂.',
    yes: { kind: 'group', id: 'Cs' },
    no: { kind: 'question', id: 'lone-i' },
  },
  {
    id: 'lone-i',
    question: 'Is there a centre of inversion?',
    hint: 'The anti conformer of meso-CHFCl–CHFCl, which has no axis and no plane.',
    yes: { kind: 'group', id: 'Ci' },
    no: { kind: 'group', id: 'C1' },
  },
  {
    id: 'perp-c2',
    question: 'Are there n C₂ axes perpendicular to the [[principal axis]]?',
    hint: 'Exactly n of them, all at right angles to the highest-order axis. Benzene has six against its C₆.',
    yes: { kind: 'question', id: 'd-sigma-h' },
    no: { kind: 'question', id: 'c-sigma-h' },
  },
  {
    id: 'd-sigma-h',
    question: 'Is there a σₕ plane, perpendicular to the principal axis?',
    hint: 'The plane that holds all the C₂ axes and cuts the principal axis in two.',
    yes: { kind: 'groupFamily', family: 'Dnh' },
    no: { kind: 'question', id: 'd-sigma-d' },
  },
  {
    id: 'd-sigma-d',
    question: 'Are there n σ_d planes, each bisecting two C₂ axes?',
    hint: 'Staggered ethane has three; the tub of allene has two.',
    yes: { kind: 'groupFamily', family: 'Dnd' },
    no: { kind: 'groupFamily', family: 'Dn' },
  },
  {
    id: 'c-sigma-h',
    question: 'Is there a σₕ plane, perpendicular to the principal axis?',
    hint: 'In trans-1,2-dichloroethene the C₂ is perpendicular to the molecular plane, which is therefore σₕ.',
    yes: { kind: 'groupFamily', family: 'Cnh' },
    no: { kind: 'question', id: 'c-sigma-v' },
  },
  {
    id: 'c-sigma-v',
    question: 'Are there n σ_v planes holding the principal axis?',
    hint: 'Water has two, ammonia three.',
    yes: { kind: 'groupFamily', family: 'Cnv' },
    no: { kind: 'question', id: 'improper' },
  },
  {
    id: 'improper',
    question: 'Is there an S₂ₙ axis lying along the principal Cₙ?',
    hint: 'Turn by 360°/2n, then reflect through the plane perpendicular to the axis. Tetraphenylmethane passes this on its C₂ and is S₄.',
    yes: { kind: 'groupFamily', family: 'S2n' },
    no: { kind: 'groupFamily', family: 'Cn' },
  },
];

const BY_ID = new Map(ASSIGNMENT_FLOW.map((one) => [one.id, one]));

/** One node. @throws When the id names no question, which a walk never does. */
export function flowQuestion(id: string): FlowQuestion {
  const question = BY_ID.get(id);
  if (question === undefined) {
    throw new RangeError(`no flowchart question ${id}`);
  }
  return question;
}
