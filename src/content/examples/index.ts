import { CHANGING_DATA } from "./changingData";
import { FEATURES } from "./features";
import { FUNCTIONS } from "./functions";
import { INDEXES } from "./indexes";
import { PROCEDURES } from "./procedures";
import { QUERYING } from "./querying";
import { STRUCTURE } from "./structure";
import { TRANSACTIONS } from "./transactions";
import { TRIGGERS } from "./triggers";
import { VIEWS } from "./views";
import type { ExampleGroup, SqlExample } from "./types";

export type { ExampleGroup, SqlExample };

export const EXAMPLE_GROUPS: ExampleGroup[] = [QUERYING, CHANGING_DATA, STRUCTURE, VIEWS, FUNCTIONS, PROCEDURES, TRIGGERS, TRANSACTIONS, INDEXES, FEATURES];
export const ALL_EXAMPLES: SqlExample[] = EXAMPLE_GROUPS.flatMap((g) => g.examples);
export const findExample = (id: string) => ALL_EXAMPLES.find((e) => e.id === id);
