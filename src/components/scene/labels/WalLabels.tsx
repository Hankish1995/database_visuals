"use client";

import { Anchored, type AnchorRegistry } from "@/components/scene/labels/anchors";
import { SceneTag } from "@/components/scene/SceneTag";
import { WAL_CENTER, WAL_SIZE, walRecordPos } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

type Props = SceneViewProps & { registry: AnchorRegistry };

// "Heap INSERT" -> "Heap" / "INSERT"; long names shortened to fit a block.
const SHORT: Record<string, string> = { Transaction: "Xact", INSERT_LEAF: "INSERT", HOT_UPDATE: "HOT UPD" };

export function WalLabels({ registry, sim, scene, selected, onSelect }: Props) {
  const flushed = scene.wal.length > 0 && scene.wal.every((w) => w.flushed);
  const subtitle = sim.kind === "select" ? "A read writes nothing here" : scene.wal.length === 0 ? "Write-ahead log" : flushed ? "Flushed to disk: durable" : "In memory, not yet flushed";
  const state = scene.active === "wal" ? "active" : scene.visited.has("wal") ? "done" : null;
  return (
    <>
      {scene.wal.map((w, i) => {
        const [rm, type] = w.record.split(" ");
        return (
          <Anchored key={i} registry={registry} id={`wal-${i}`} position={[walRecordPos(i)[0], 0.35, walRecordPos(i)[2]]}>
            <span className="pointer-events-none block text-center text-[9px] leading-tight font-semibold text-ink" title={w.record}>
              {SHORT[rm] ?? rm}<br />{SHORT[type] ?? type}
            </span>
          </Anchored>
        );
      })}
      <Anchored registry={registry} id="wal-tag" position={[WAL_CENTER[0], 0, WAL_CENTER[2] + WAL_SIZE[1] / 2 + 0.75]}>
        <SceneTag title="WAL" subtitle={subtitle} state={state} selected={selected === "wal"} onSelect={() => onSelect("wal")} />
      </Anchored>
    </>
  );
}
