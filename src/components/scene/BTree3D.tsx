"use client";

import { Line } from "@react-three/drei";
import { BTREE, BTREE_CHILDREN } from "@/lib/sim/data";
import { usePalette } from "@/components/scene/palette";
import { SceneBlock } from "@/components/scene/SceneBlock";
import { BTREE_POS, type Vec3 } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

export const BTREE_SIZE: Record<0 | 1 | 2, Vec3> = { 0: [2.1, 0.6, 1.1], 1: [1.9, 0.55, 1.0], 2: [1.55, 0.5, 0.9] };

export function BTree3D({ sim, scene, selected, onSelect, reduceMotion }: SceneViewProps) {
  const PALETTE = usePalette();
  // Every write keeps the index up to date; the toggle only decides whether lookups use it.
  const enabled = sim.options.useIndex || sim.kind === "insert";
  const lit = new Set(scene.btreeLit);
  const leafId = scene.btreeLit.at(-1);
  return (
    <group>
      {Object.entries(BTREE_CHILDREN).flatMap(([parent, children]) =>
        children.map((child) => {
          const [px, , pz] = BTREE_POS[parent];
          const [cx, , cz] = BTREE_POS[child];
          const onPath = lit.has(parent) && lit.has(child);
          return <Line key={child} points={[[px, 0.3, pz + 0.5], [cx, 0.3, cz - 0.45]]} color={onPath ? PALETTE.indexLit : PALETTE.line} lineWidth={onPath ? 3 : 1.5} />;
        }),
      )}
      {BTREE.map((node) => (
        <SceneBlock key={node.id} position={BTREE_POS[node.id]} size={BTREE_SIZE[node.level]}
          color={!enabled ? PALETTE.indexOff : lit.has(node.id) ? PALETTE.indexLit : PALETTE.indexIdle}
          glow={PALETTE.indexLit} active={scene.active === "btree" && node.id === leafId} lit={lit.has(node.id)} dimmed={!enabled}
          selected={selected === "btree"} reduceMotion={reduceMotion} onSelect={() => onSelect("btree")} />
      ))}
    </group>
  );
}
