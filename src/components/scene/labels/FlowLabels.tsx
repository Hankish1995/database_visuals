"use client";

import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";
import { BTREE, INDEX } from "@/lib/sim/data";
import { BTREE_SIZE } from "@/components/scene/BTree3D";
import { Anchored, type AnchorRegistry } from "@/components/scene/labels/anchors";
import { SceneTag } from "@/components/scene/SceneTag";
import { BTREE_POS, STAGE_LABEL_POS_Z, STAGE_POS } from "@/components/scene/sceneLayout";
import { STAGES, stageState } from "@/components/scene/Stages3D";
import type { SceneViewProps } from "@/components/scene/types";

type Props = SceneViewProps & { registry: AnchorRegistry };

/** Captions for the query stages and the B-tree index. */
export function FlowLabels({ registry, sim, scene, selected, onSelect }: Props) {
  const concepts = useContent().concepts;
  const m = useMessages().scene;
  const enabled = sim.options.useIndex || sim.kind === "insert";
  const lit = new Set(scene.btreeLit);
  const leafId = scene.btreeLit.at(-1);
  const btreeState = scene.active === "btree" ? "active" : scene.visited.has("btree") ? "done" : null;
  return (
    <>
      {STAGES.map((id) => (
        <Anchored key={id} registry={registry} id={`stage-${id}`} position={[STAGE_POS[id][0], 1.1, STAGE_LABEL_POS_Z]}>
          <SceneTag title={concepts[id].name} subtitle={concepts[id].tagline} state={stageState(id, scene)} selected={selected === id} onSelect={() => onSelect(id)} />
        </Anchored>
      ))}
      <Anchored registry={registry} id="btree-tag" position={[-8.95, 0, -1.3]}>
        <SceneTag tone="index" title={m.btree} subtitle={sim.kind === "insert" ? m.btreeInsert : enabled ? `${INDEX} (id)` : m.btreeOff} state={btreeState}
          selected={selected === "btree"} onSelect={() => onSelect("btree")} />
      </Anchored>
      {BTREE.map((node) => (
        <Anchored key={node.id} registry={registry} id={`key-${node.id}`} position={[BTREE_POS[node.id][0], BTREE_SIZE[node.level][1], BTREE_POS[node.id][2]]}>
          <span className={`pointer-events-none text-[11px] font-bold ${lit.has(node.id) ? "text-white" : enabled ? "text-index" : "text-muted"}`}>
            {node.low}–{node.high}
          </span>
        </Anchored>
      ))}
      {leafId && sim.pointerLabel && scene.pointerShown && (
        <Anchored registry={registry} id="pointer" position={[BTREE_POS[leafId][0], 0, BTREE_POS[leafId][2] + 0.95]}>
          <span className={`pointer-events-none rounded-md border bg-surface px-1.5 py-0.5 text-[11px] font-semibold shadow-sm ${scene.failed && sim.kind === "insert" ? "border-miss-line text-miss" : "border-index/30 text-index"}`}>
            {sim.pointerLabel}
          </span>
        </Anchored>
      )}
    </>
  );
}
