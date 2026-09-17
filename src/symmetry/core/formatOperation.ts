import { greatestCommonDivisor } from './integerMatrix.ts';
import type { CrystalOperation, Dimension } from './types.ts';
import { AXIS_NAMES, TWELFTHS_PER_CELL } from './types.ts';

/**
 * The canonical triplet of an operation: `x,y,z`, `-x+1/2,-y,z+1/2`,
 * `-x+y+2/3,-x+1/3,z+1/3`.
 *
 * Variables come in x, y, z order, a `+` is written only between terms, and the
 * translation is written last and positive. Every one of the 7244 operations of
 * the 230 space groups prints back byte for byte, so
 * `parseOperation(formatOperation(op))` is `op` and the string is safe to use as
 * a display value and as a CIF `_space_group_symop_operation_xyz`.
 */
export function formatOperation(
  operation: CrystalOperation<Dimension>,
): string {
  const components: string[] = [];
  for (let index = 0; index < operation.rotation.length; index++) {
    components.push(
      formatComponent(
        operation.rotation[index] ?? [],
        operation.translation[index] ?? 0,
      ),
    );
  }
  return components.join(',');
}

/**
 * A translation vector in twelfths, written the way a glide vector or a centring
 * vector reads: `1/2,1/2,0`.
 */
export function formatTranslation(translation: readonly number[]): string {
  const parts: string[] = [];
  for (const twelfths of translation) {
    parts.push(formatFraction(twelfths) || '0');
  }
  return parts.join(',');
}

/**
 * A count of twelfths as a reduced fraction: `6` is `1/2`, `0` is the empty
 * string, `16` is `1/3` because a translation is read modulo the cell.
 */
export function formatFraction(twelfths: number): string {
  const reduced =
    ((twelfths % TWELFTHS_PER_CELL) + TWELFTHS_PER_CELL) % TWELFTHS_PER_CELL;
  if (reduced === 0) return '';
  const divisor = greatestCommonDivisor(reduced, TWELFTHS_PER_CELL);
  return `${reduced / divisor}/${TWELFTHS_PER_CELL / divisor}`;
}

function formatComponent(row: readonly number[], translation: number): string {
  let text = '';
  for (let index = 0; index < row.length; index++) {
    const coefficient = row[index] ?? 0;
    if (coefficient === 0) continue;
    if (coefficient < 0) text += '-';
    else if (text.length > 0) text += '+';
    const magnitude = Math.abs(coefficient);
    const name = AXIS_NAMES[index] ?? '';
    text += magnitude === 1 ? name : `${magnitude}${name}`;
  }
  const fraction = formatFraction(translation);
  if (fraction.length === 0) return text.length === 0 ? '0' : text;
  return text.length === 0 ? fraction : `${text}+${fraction}`;
}
