/**
 * What the marking says, case by case.
 *
 * Before the answer is handed in, the cases are drawn as not evaluated: an
 * untouched question is not a wrong one, and a list of red crosses on a
 * question nobody has read yet is what makes a student close the page. After
 * it, each case carries the validator's own sentence, which names the value and
 * what was wanted.
 */

import { Callout } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import type { ValidationResult } from 'react-cheminfo/core';
import { TestCaseList } from 'react-cheminfo/ui';

/** What {@link ExerciseVerdict} needs. */
export interface ExerciseVerdictProps {
  /** What the validator returned for what is written now. */
  readonly result: ValidationResult;
  /** Whether the answer has been handed in at least once. */
  readonly attempted: boolean;
  /** Whether there is anything written to mark. */
  readonly blank: boolean;
  /** The sentence to show when every case passes. */
  readonly solution: string;
}

/**
 * The cases, and the one line over them.
 * @param props - See {@link ExerciseVerdictProps}.
 * @returns The verdict.
 */
export function ExerciseVerdict(props: ExerciseVerdictProps): ReactElement {
  const { result, attempted, blank, solution } = props;
  const pending = blank || !attempted;

  return (
    <div className="exercise-verdict">
      {result.error !== null && attempted && (
        <Callout intent="warning" icon="issue">
          {result.error}
        </Callout>
      )}

      {result.missingOptions.length > 0 && attempted && (
        <Callout intent="warning" icon="layers">
          {`Switch on: ${result.missingOptions.join(', ')}.`}
        </Callout>
      )}

      {result.passed && !blank && (
        <Callout intent="success" icon="tick-circle">
          {solution}
        </Callout>
      )}

      {attempted && !result.passed && result.error === null && (
        <Callout intent="danger" icon="cross-circle" title="Not yet">
          {failureLine(result)}
        </Callout>
      )}

      <TestCaseList results={result.cases} pending={pending} />
    </div>
  );
}

/** How many cases are still out, said as a count rather than as a judgement. */
function failureLine(result: ValidationResult): string {
  let failed = 0;
  for (const testCase of result.cases) {
    if (!testCase.passed) failed++;
  }
  if (failed === 0) return 'Nothing to mark yet.';
  return `${failed} of ${result.cases.length} checks below did not come out. Each one says what it got and what it wanted.`;
}
