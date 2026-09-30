import { INSERT_PAGE, LOADED_BY_XID, PAGE_SIZE_KB, rowsOnPage } from "@/lib/sim/data";
import type { SceneState } from "@/lib/sim/sceneState";
import type { Simulation, UserRow } from "@/lib/sim/types";

interface Version { slot: number; row: UserRow; xmin: string; xmax: string; tone?: "target" | "new" | "dead" }

/** Tuples on the page this statement touches, with their MVCC stamps before and after the write. */
function versions(sim: Simulation, scene: SceneState, page: number): Version[] {
  const all = rowsOnPage(page);
  const written = scene.dirtyPages.includes(page);
  const target = sim.kind === "insert" ? -1 : all.findIndex((r) => r.id === sim.query.id);
  const from = target >= 0 ? Math.max(0, target - 2) : all.length - 3;
  const out: Version[] = all.slice(from, from + 3 + (target >= 0 ? 0 : 0)).map((row) => {
    const i = all.indexOf(row);
    const hit = i === target;
    const ended = hit && written && sim.kind !== "select";
    return { slot: i + 1, row, xmin: String(LOADED_BY_XID), xmax: ended ? String(sim.txid) : "0", tone: hit ? (ended ? "dead" : "target") : undefined };
  });
  if (written && sim.newTuple && sim.newTuple.page === page) {
    const row = sim.change?.after ?? (sim.kind === "insert" ? { id: sim.query.id ?? 0, name: sim.query.values.name ?? "", email: sim.query.values.email ?? "", created_at: "" } : null);
    if (row) out.push({ slot: sim.newTuple.slot, row, xmin: `${sim.txid}${sim.error ? " (aborted)" : ""}`, xmax: "0", tone: sim.error ? "dead" : "new" });
  }
  return out;
}

const TONE = { target: "bg-flow-soft font-semibold text-flow", new: "bg-ok-soft font-semibold text-ok", dead: "text-muted line-through" };

export function PageRows({ sim, scene }: { sim: Simulation; scene: SceneState }) {
  const page = sim.kind === "insert" ? INSERT_PAGE : sim.rowPage;
  if (page === null) return null;
  const rows = versions(sim, scene, page);
  return (
    <figure>
      <figcaption className="mb-1 font-semibold text-ink">Page {page} ({PAGE_SIZE_KB} KB){scene.dirtyPages.includes(page) ? " · dirty in memory" : ""}</figcaption>
      <table className="w-full overflow-hidden rounded-lg border border-line text-left text-xs">
        <thead className="bg-subtle text-muted">
          <tr>{["slot", "id", "name", "xmin", "xmax"].map((h) => <th key={h} scope="col" className="px-2 py-1.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.slot} className={`border-t border-line ${v.tone ? TONE[v.tone] : "text-ink"}`}>
              <td className="px-2 py-1.5">{v.slot}</td>
              <td className="px-2 py-1.5">{v.row.id}</td>
              <td className="max-w-[7rem] truncate px-2 py-1.5">{v.row.name}</td>
              <td className="px-2 py-1.5 font-mono">{v.xmin}</td>
              <td className="px-2 py-1.5 font-mono">{v.xmax}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-[11px] text-muted">xmin: transaction that created the version · xmax: transaction that ended it (0 = still live).</p>
    </figure>
  );
}
