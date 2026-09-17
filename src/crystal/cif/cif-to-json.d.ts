declare module 'cif-to-json' {
  /** One row of a `loop_`, keyed on the full tag of each column. */
  export type CifRow = Record<string, string>;

  /** A parsed CIF: scalar tags, and each `loop_` under its common tag prefix. */
  export type CifJson = Record<string, string | CifRow[]>;

  /**
   * Parse a CIF string. Every value comes back as a string, and `.` and `?`
   * both come back as `''`.
   * @param input - CIF file content.
   * @returns the parsed block.
   */
  export function cifParser(input: string): CifJson;
}
