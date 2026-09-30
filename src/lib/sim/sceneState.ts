import { BUFFER_SLOTS, TABLE } from "@/lib/sim/data";
import type { CachedPage, CacheResult, ComponentId, EdgeId, Simulation, SimStep } from "@/lib/sim/types";

export type PlayStatus = "idle" | "playing" | "paused" | "done";

/** What every view shows at one moment of a run -- derived, never stored. */
export interface SceneState {
  status: PlayStatus;
  step: SimStep | null;
  active: ComponentId | null;
  visited: Set<ComponentId>;
  edge: EdgeId | null;
  travelled: Set<EdgeId>;
  buffer: (CachedPage | null)[];
  /** users pages the current step is checking or loading. */
  focusPages: number[];
  diskReading: number[];
  btreeLit: string[];
  pointerShown: boolean;
  cacheResult: CacheResult | null;
  resultShown: boolean;
  /** users pages changed in memory but not yet written to their data file. */
  dirtyPages: number[];
  /** WAL records so far, and whether each has been flushed to disk (at COMMIT). */
  wal: { record: string; flushed: boolean }[];
  /** The statement has hit its error. */
  failed: boolean;
}

export function deriveScene(sim: Simulation, index: number, status: PlayStatus): SceneState {
  const reached = status === "idle" ? [] : sim.steps.slice(0, index + 1);
  const step = reached.at(-1) ?? null;
  const loaded = reached.flatMap((s) => s.loadPages ?? []);
  const buffer: (CachedPage | null)[] = [...sim.initialBuffer, ...loaded.map((page) => ({ relation: TABLE, page }))];
  while (buffer.length < BUFFER_SLOTS) buffer.push(null);

  const lastCheck = [...reached].reverse().find((s) => s.cacheResult);
  const flushedUpTo = reached.reduce((n, s) => n + (s.wal?.length ?? 0), 0);
  const lastFlush = reached.map((s) => s.flush).lastIndexOf(true);
  const durable = lastFlush < 0 ? 0 : reached.slice(0, lastFlush + 1).reduce((n, s) => n + (s.wal?.length ?? 0), 0);
  const records = reached.flatMap((s) => s.wal ?? []);
  return {
    status,
    step,
    active: status === "done" ? null : step?.component ?? null,
    visited: new Set(reached.map((s) => s.component)),
    edge: status === "done" ? null : step?.edge ?? null,
    travelled: new Set(reached.flatMap((s) => (s.edge ? [s.edge] : []))),
    buffer: buffer.slice(0, BUFFER_SLOTS),
    focusPages: step?.loadPages ?? step?.checkPages ?? (step?.writePage ? [step.writePage] : step?.component === "row" && sim.rowPage && sim.kind === "select" ? [sim.rowPage] : []),
    diskReading: step?.loadPages ?? [],
    btreeLit: reached.flatMap((s) => s.btreeNodes ?? []),
    pointerShown: sim.pointerLabel !== null && reached.some((s) => s.btreeNodes),
    cacheResult: lastCheck?.cacheResult ?? null,
    resultShown: step?.component === "row",
    dirtyPages: [...new Set(reached.flatMap((s) => (s.writePage ? [s.writePage] : [])))],
    wal: records.map((record, i) => ({ record, flushed: i < durable && flushedUpTo > 0 })),
    failed: reached.some((s) => s.failed),
  };
}
