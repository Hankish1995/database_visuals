"use client";

import { usePalette } from "@/components/scene/palette";
import { SceneBlock } from "@/components/scene/SceneBlock";
import { STAGE_POS, STAGE_SIZE, type StageId } from "@/components/scene/sceneLayout";
import type { SceneViewProps } from "@/components/scene/types";

export const STAGES: StageId[] = ["client", "parser", "planner", "executor"];

/** Client, parser, planner, executor. The returned row ends its journey back at the client. */
export const stageState = (id: StageId, scene: SceneViewProps["scene"]) => {
  const active = scene.active === id || (id === "client" && scene.active === "row");
  return active ? "active" : scene.visited.has(id) ? "done" : null;
};

export function Stages3D({ scene, selected, onSelect, reduceMotion }: SceneViewProps) {
  const PALETTE = usePalette();
  return STAGES.map((id) => {
    const state = stageState(id, scene);
    return (
      <SceneBlock key={id} position={STAGE_POS[id]} size={STAGE_SIZE} color={PALETTE.stage[id]} active={state === "active"} lit={state === "done"}
        selected={selected === id} reduceMotion={reduceMotion} onSelect={() => onSelect(id)} />
    );
  });
}
