import type { SceneState } from "@/lib/sim/sceneState";
import type { ConceptId, Simulation } from "@/lib/sim/types";

export interface SceneViewProps {
  sim: Simulation;
  scene: SceneState;
  selected: ConceptId;
  onSelect: (id: ConceptId) => void;
  reduceMotion: boolean;
}
