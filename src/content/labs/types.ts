import type { ExtensionName } from "@/lib/db/types";

/** How a step's results are drawn: plain tables, or a purpose-built view of the internals. */
export type LabView = "tables" | "plan" | "page" | "versions" | "wal" | "recovery";

export interface LabStep {
  id: string;
  title: string;
  /** What happens and why. */
  body: string;
  /** What to look for in the result. */
  observe: string;
  sql: string;
  view: LabView;
  /** "crash" copies the data directory without a checkpoint and restarts from it: a real crash + recovery. */
  action?: "crash";
  /** Errors this step causes on purpose (a failed check, an aborted transaction...). */
  expectedErrors?: number;
}

export interface LabLesson {
  id: string;
  intro: string;
  extensions: ExtensionName[];
  /** Runs once when the lesson's database is created; not shown as a step. */
  setup: string;
  steps: LabStep[];
}
