export interface SqlExample {
  id: string;
  title: string;
  summary: string;
  sql: string;
  /** What to look for in the output. */
  notice: string;
  /** Run every statement even after an error (to show aborted transactions, failed checks...). */
  continueOnError?: boolean;
  /** The example deliberately ends in an error (a constraint or check doing its job). */
  expectError?: boolean;
}

export interface ExampleGroup {
  id: string;
  title: string;
  examples: SqlExample[];
}
