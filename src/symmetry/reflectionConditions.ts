import type { CrystalOperation } from './core/index.ts';
import {
  greatestCommonDivisor,
  symmetryElement,
  wrapTwelfths,
} from './core/index.ts';
import type { ReflectionClass } from './reflectionClasses.ts';
import { reflectionClassOf } from './reflectionClasses.ts';

/**
 * One systematic-absence rule: a class of reflections, and the condition they
 * must satisfy to be present at all.
 */
export interface ReflectionCondition {
  /** The class the condition applies to: `hkl`, `h0l`, `00l`. */
  readonly reflections: string;
  /** What a present reflection satisfies: `l = 2n`, `h + k = 2n`, `2h - l = 4n`. */
  readonly condition: string;
  /** The element that causes it: `c ⊥ (010)`, `2_1 ∥ [010]`, `t(1/2,1/2,0) centring`. */
  readonly cause: string;
  readonly reflectionClass: ReflectionClass;
  /** The condition as `Σ cᵢ mᵢ ≡ 0 (mod modulus)` over the class's basis. */
  readonly coefficients: readonly number[];
  readonly modulus: number;
}

/**
 * The condition one operation imposes, or `null` when it imposes none — an
 * inversion, a rotoinversion, and any operation whose translation is whole
 * along the class it fixes.
 *
 * The coefficients are reduced to the smallest whole numbers with the smallest
 * period, and signed so the first one is positive, so two operations stating
 * the same restriction come out as one condition.
 *
 * @param operation - The operation, as the coset list carries it.
 * @param centring - The group's lattice translations, so a centred group's
 *   glides and screws are named against its own lattice.
 */
export function conditionOf(
  operation: CrystalOperation<3>,
  centring: ReadonlyArray<readonly number[]>,
): ReflectionCondition | null {
  const reflectionClass = reflectionClassOf(operation.rotation);
  if (reflectionClass === null) return null;
  const twelfths = reflectionClass.basis.map((vector) => {
    let sum = 0;
    for (let index = 0; index < 3; index++) {
      sum += (vector[index] ?? 0) * (operation.translation[index] ?? 0);
    }
    return wrapTwelfths(sum);
  });
  let divisor = 12;
  for (const value of twelfths) {
    divisor = greatestCommonDivisor(divisor, value);
  }
  if (divisor === 12) return null;
  const modulus = 12 / divisor;
  const coefficients = signed(
    twelfths.map((value) => symmetric(value / divisor, modulus)),
    modulus,
  );
  return {
    reflections: reflectionClass.label,
    condition: `${terms(coefficients, reflectionClass.letters)} = ${modulus}n`,
    cause: causeOf(operation, centring),
    reflectionClass,
    coefficients,
    modulus,
  };
}

function causeOf(
  operation: CrystalOperation<3>,
  centring: ReadonlyArray<readonly number[]>,
): string {
  const element = symmetryElement(operation, centring);
  if (element.kind === 'translation') return `${element.symbol} centring`;
  if (element.normal !== null) {
    return `${element.symbol} ⊥ (${element.normal.join('')})`;
  }
  if (element.axis !== null) {
    return `${element.symbol} ∥ [${element.axis.join('')}]`;
  }
  return element.symbol;
}

/** The representative of `value` nearest zero, so `3 mod 4` prints as `-1`. */
function symmetric(value: number, modulus: number): number {
  const reduced = ((value % modulus) + modulus) % modulus;
  return reduced > modulus / 2 ? reduced - modulus : reduced;
}

/** The same condition with its first non-zero coefficient positive. */
function signed(coefficients: number[], modulus: number): number[] {
  for (const value of coefficients) {
    if (value === 0) continue;
    if (value > 0) return coefficients;
    return coefficients.map((each) => symmetric(-each, modulus));
  }
  return coefficients;
}

function terms(
  coefficients: readonly number[],
  letters: readonly string[],
): string {
  let text = '';
  for (let index = 0; index < coefficients.length; index++) {
    const value = coefficients[index] ?? 0;
    if (value === 0) continue;
    const letter = letters[index] ?? '';
    const term = Math.abs(value) === 1 ? letter : `${Math.abs(value)}${letter}`;
    if (text.length === 0) text += value < 0 ? `-${term}` : term;
    else text += value < 0 ? ` - ${term}` : ` + ${term}`;
  }
  return text;
}
