import { TABLE, TABLE_PAGES } from "@/lib/sim/data";
import type { SceneState } from "@/lib/sim/sceneState";
import type { EdgeId, Simulation } from "@/lib/sim/types";

// World layout, in scene units: x to the right, z toward the viewer, y up.
// Query stages along the back; the index (left) and buffer pool (right)
// in the middle; the disk shelf at the front, under the buffer pool.
export type Vec3 = [number, number, number];
export type StageId = "client" | "parser" | "planner" | "executor";

export const STAGE_POS: Record<StageId, Vec3> = {
  client: [-9, 0, -5], parser: [-3, 0, -5], planner: [3, 0, -5], executor: [9, 0, -5],
};
export const STAGE_SIZE: Vec3 = [2.4, 1.1, 1.6];
/** Stage captions sit above the blocks, like section titles, keeping the routes below them clear. */
export const STAGE_LABEL_POS_Z = -6.45;

export const BTREE_POS: Record<string, Vec3> = {
  root: [-6, 0, -1.3],
  "inner-0": [-7.8, 0, 0.5], "inner-1": [-4.2, 0, 0.5],
  "leaf-0": [-8.7, 0, 2.3], "leaf-1": [-6.9, 0, 2.3], "leaf-2": [-5.1, 0, 2.3], "leaf-3": [-3.3, 0, 2.3],
};

export const BUFFER_CENTER: Vec3 = [4.5, 0, 0.4];
export const BUFFER_SIZE: [number, number] = [11.2, 3.3];
const BUFFER_COLS = 6;
export function bufferSlotPos(slot: number): Vec3 {
  const col = slot % BUFFER_COLS;
  const row = Math.floor(slot / BUFFER_COLS);
  return [BUFFER_CENTER[0] + (col - 2.5) * 1.8, 0, BUFFER_CENTER[2] + (row - 0.5) * 1.5];
}

export const DISK_CENTER: Vec3 = [4.5, 0, 5.1];
export const DISK_SIZE: [number, number] = [8.4, 1.7];
/** Disk shelf: the four pages of the users data file. */
export function diskPagePos(index: number): Vec3 {
  return [DISK_CENTER[0] + (index - 1.5) * 1.9, 0, DISK_CENTER[2]];
}

/** The WAL shelf: records appended left to right, bottom-left of the scene. */
export const WAL_CENTER: Vec3 = [-6.5, 0, 5.1];
export const WAL_SIZE: [number, number] = [8.2, 1.7];
export function walRecordPos(index: number): Vec3 {
  return [WAL_CENTER[0] - WAL_SIZE[0] / 2 + 0.95 + index * 1.4, 0, WAL_CENTER[2]];
}

const Y = 0.28;
const at = (x: number, z: number): Vec3 => [x, Y, z];
const ROUTE_TO_INDEX_Z = -2.55;
const ROUTE_HOME_Z = -2.05;

function slotOf(scene: SceneState, page: number): number {
  const found = scene.buffer.findIndex((p) => p?.relation === TABLE && p.page === page);
  return found >= 0 ? found : Math.max(0, scene.buffer.findIndex((p) => p === null));
}

/** The polyline for an edge, given where this run's pages and leaf are. */
export function edgePoints(edge: EdgeId, sim: Simulation, scene: SceneState): Vec3[] {
  const [cx, , cz] = STAGE_POS.client;
  const [ex, , ez] = STAGE_POS.executor;
  const [rx, , rz] = BTREE_POS.root;
  const half = STAGE_SIZE[0] / 2;
  const page = scene.focusPages[0] ?? sim.rowPage ?? TABLE_PAGES[0];
  const [sx, , sz] = bufferSlotPos(slotOf(scene, page));
  const leaf = BTREE_POS[sim.steps.find((s) => s.btreeNodes)?.btreeNodes?.at(-1) ?? "root"];
  const walTop = WAL_CENTER[2] - WAL_SIZE[1] / 2;
  const walRight = WAL_CENTER[0] + WAL_SIZE[0] / 2;
  const walLeft = WAL_CENTER[0] - WAL_SIZE[0] / 2;
  const bufferTop = BUFFER_CENTER[2] - BUFFER_SIZE[1] / 2;
  switch (edge) {
    case "client-parser": return [at(cx + half, cz), at(STAGE_POS.parser[0] - half, cz)];
    case "parser-planner": return [at(STAGE_POS.parser[0] + half, cz), at(STAGE_POS.planner[0] - half, cz)];
    case "planner-executor": return [at(STAGE_POS.planner[0] + half, cz), at(ex - half, ez)];
    case "executor-btree": return [at(ex, ez + 0.8), at(ex, ROUTE_TO_INDEX_Z), at(rx, ROUTE_TO_INDEX_Z), at(rx, rz - 0.45)];
    case "btree-buffer": return [at(leaf[0], leaf[2] + 0.45), at(leaf[0], 3.4), at(-1.9, 3.4), at(-1.9, sz), at(sx - 0.8, sz)];
    case "executor-buffer": return [at(ex, ez + 0.8), at(ex, bufferTop)];
    case "disk-buffer": {
      const [dx, , dz] = diskPagePos(Math.max(0, TABLE_PAGES.indexOf(page)));
      return [at(dx, dz - 0.5), at(dx, 3.3), at(sx, 3.3), at(sx, sz + 0.5)];
    }
    case "buffer-btree": return edgePoints("btree-buffer", sim, scene).reverse();
    case "buffer-wal": return [at(sx, sz + 0.5), at(sx, 3.9), at(walRight - 0.6, 3.9), at(walRight - 0.6, walTop + 0.1)];
    case "btree-wal": return [at(leaf[0], leaf[2] + 0.45), at(leaf[0], walTop + 0.1)];
    case "wal-client": return [at(walLeft + 0.1, WAL_CENTER[2]), at(walLeft - 0.35, WAL_CENTER[2]), at(walLeft - 0.35, ROUTE_HOME_Z), at(cx, ROUTE_HOME_Z), at(cx, cz + 0.8)];
    case "buffer-client": {
      // A key the index couldn't find never reaches the buffer pool: the empty result leaves from the index.
      const [fx, fz] = sim.rowPage === null && sim.options.useIndex ? [rx - 0.6, rz - 0.45] : [sx, sz - 0.5];
      return [at(fx, fz), at(fx, ROUTE_HOME_Z), at(cx, ROUTE_HOME_Z), at(cx, cz + 0.8)];
    }
  }
}

/** Edges drawn for this run: exactly the routes its steps travel. */
export function planEdges(sim: Simulation): EdgeId[] {
  return [...new Set(sim.steps.flatMap((s) => (s.edge ? [s.edge] : [])))];
}

/** Where the query marker travels for the current step. A step without a route (a write in a page) keeps it on that page. */
export function markerPath(sim: Simulation, scene: SceneState): Vec3[] {
  const [cx, , cz] = STAGE_POS.client;
  const step = scene.step;
  if (step?.edge) return edgePoints(step.edge, sim, scene);
  if (step?.writePage) {
    const [sx, , sz] = bufferSlotPos(slotOf(scene, step.writePage));
    return [at(sx, sz)];
  }
  return [at(cx, cz + 0.8)];
}
