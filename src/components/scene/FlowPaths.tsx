"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { PALETTE } from "@/components/scene/palette";
import { edgePoints, planEdges } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

/** The routes this plan uses: grey ahead, pale cyan once travelled, bright cyan for the current hop. */
export function FlowPaths({ sim, scene }: Pick<SceneViewProps, "sim" | "scene">) {
  const edges = useMemo(() => planEdges(sim).map((id) => ({ id, points: edgePoints(id, sim, scene) })), [sim, scene]);
  return edges.map(({ id, points }) => {
    const current = scene.edge === id;
    const travelled = scene.travelled.has(id);
    return (
      <Line key={id} points={points} lineWidth={current ? 4 : travelled ? 2.5 : 1.5}
        color={current ? PALETTE.flow : travelled ? PALETTE.lineDone : PALETTE.line}
        dashed={!current && !travelled} dashSize={0.25} gapSize={0.18} />
    );
  });
}
