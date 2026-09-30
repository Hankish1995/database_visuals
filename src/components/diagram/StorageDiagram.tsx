"use client";

import { BTREE, INDEX, TABLE, TABLE_PAGES } from "@/lib/sim/data";
import { CacheBadge } from "@/components/scene/CacheBadge";
import { DiagramCard } from "@/components/diagram/DiagramCard";
import type { SceneViewProps } from "@/components/scene/types";
import type { ComponentId } from "@/lib/sim/types";

const chip = "rounded-md border px-1.5 py-1 text-center text-[11px]";

export function StorageDiagram({ sim, scene, selected, onSelect }: SceneViewProps) {
  const state = (id: ComponentId) => (scene.active === id ? "active" : scene.visited.has(id) ? "done" : null);
  const lit = new Set(scene.btreeLit);
  const indexOn = sim.options.useIndex || sim.kind === "insert";
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <DiagramCard tone="index" title="B-tree index" subtitle={sim.kind === "insert" ? "Updated on every insert" : indexOn ? `${INDEX} (id)` : "Not used for lookups"}
        state={indexOn ? state("btree") : "off"} selected={selected === "btree"} onSelect={() => onSelect("btree")}>
        {[0, 1, 2].map((level) => (
          <div key={level} className="mb-1 flex justify-center gap-1">
            {BTREE.filter((n) => n.level === level).map((n) => (
              <span key={n.id} className={`${chip} ${lit.has(n.id) ? "border-index bg-index font-bold text-white" : "border-index/20 bg-index-soft text-index"}`}>
                {n.low}–{n.high}
              </span>
            ))}
          </div>
        ))}
        {scene.pointerShown && sim.pointerLabel && <p className={`text-center text-xs font-semibold ${scene.failed && sim.kind === "insert" ? "text-miss" : "text-index"}`}>{sim.pointerLabel}</p>}
      </DiagramCard>

      <DiagramCard title="Buffer pool" subtitle="Shared memory" state={state("bufferPool")} selected={selected === "bufferPool"} onSelect={() => onSelect("bufferPool")}>
        <ul aria-label="Buffer pool slots" className="grid grid-cols-4 gap-1">
          {scene.buffer.map((p, slot) => {
            const focus = p?.relation === TABLE && scene.focusPages.includes(p.page);
            const dirty = p?.relation === TABLE && scene.dirtyPages.includes(p.page);
            return (
              <li key={slot} className={`${chip} ${!p ? "border-dashed border-line-strong text-muted" : focus ? "border-flow-bright bg-flow-soft font-bold text-flow" : p.relation === TABLE ? "border-flow-bright/30 bg-flow-soft/50" : "border-line"}`}>
                {p ? `${p.relation === TABLE ? "users" : p.relation} ${p.page}${dirty ? " · dirty" : ""}` : "free"}
              </li>
            );
          })}
        </ul>
        {scene.cacheResult && <div className="mt-2"><CacheBadge result={scene.cacheResult} selected={selected === "cache"} onSelect={() => onSelect("cache")} /></div>}
      </DiagramCard>

      <DiagramCard title="Disk pages" subtitle="users data file" state={state("disk")} selected={selected === "disk"} onSelect={() => onSelect("disk")}>
        <ul aria-label="Pages on disk" className="grid grid-cols-4 gap-1">
          {TABLE_PAGES.map((page) => {
            const reading = scene.diskReading.includes(page);
            return <li key={page} className={`${chip} ${reading ? "border-flow-bright bg-flow-soft font-bold text-flow" : "border-line"}`}>Page {page}{reading && " · reading"}</li>;
          })}
        </ul>
      </DiagramCard>

      <DiagramCard title="WAL" subtitle={sim.kind === "select" ? "A read writes nothing here" : "Write-ahead log"} state={sim.kind === "select" ? "off" : state("wal")}
        selected={selected === "wal"} onSelect={() => onSelect("wal")}>
        {scene.wal.length === 0 ? <p className="text-xs text-muted">No records yet.</p> : (
          <ol aria-label="WAL records" className="flex flex-wrap gap-1">
            {scene.wal.map((w, i) => (
              <li key={i} className={`${chip} ${w.flushed ? "border-flow-bright bg-flow-soft text-flow" : /ABORT/.test(w.record) ? "border-miss-line bg-miss-soft text-miss" : "border-dashed border-line-strong text-ink-soft"}`}>
                {w.record}{w.flushed ? " ✓" : ""}
              </li>
            ))}
          </ol>
        )}
        {scene.wal.length > 0 && <p className="mt-1 text-[11px] text-muted">{scene.wal.every((w) => w.flushed) ? "✓ flushed to disk at COMMIT" : "Dashed: in memory, not yet flushed"}</p>}
      </DiagramCard>
    </div>
  );
}
