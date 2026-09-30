import { ACID_LAB } from "./acid";
import { COMPOSITE_INDEX_LAB } from "./compositeIndex";
import { MVCC_LAB } from "./mvcc";
import { RECOVERY_LAB } from "./recovery";
import { TUPLE_LAYOUT_LAB } from "./tupleLayout";
import { WAL_LAB } from "./wal";
import type { LabLesson } from "./types";

export type { LabLesson, LabStep, LabView } from "./types";

export const LABS: Record<string, LabLesson> = Object.fromEntries(
  [COMPOSITE_INDEX_LAB, TUPLE_LAYOUT_LAB, ACID_LAB, MVCC_LAB, WAL_LAB, RECOVERY_LAB].map((lab) => [lab.id, lab]),
);
