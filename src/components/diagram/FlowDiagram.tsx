"use client";

import { ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";
import { DiagramCard } from "@/components/diagram/DiagramCard";
import { StorageDiagram } from "@/components/diagram/StorageDiagram";
import type { SceneViewProps } from "@/components/scene/types";
import type { ComponentId } from "@/lib/sim/types";

const STAGES: ComponentId[] = ["client", "parser", "planner", "executor"];

// The same scene as the 3D view, as plain HTML: used when WebGL is
// unavailable, on small screens, or when the learner picks 2D.
export function FlowDiagram(props: SceneViewProps) {
  const { scene, selected, onSelect } = props;
  const concepts = useContent().concepts;
  const m = useMessages().scene;
  const stateOf = (id: ComponentId) =>
    scene.active === id || (id === "client" && scene.active === "row") ? "active" : scene.visited.has(id) ? "done" : null;

  return (
    <div className="h-full space-y-3 overflow-y-auto p-3 sm:p-4">
      <ol aria-label={m.stages} className="grid grid-cols-2 gap-2 md:flex md:items-stretch">
        {STAGES.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && <ArrowRight aria-hidden className="hidden size-4 shrink-0 self-center text-line-strong md:block" />}
            <li className="md:flex-1">
              <DiagramCard title={concepts[id].name} subtitle={concepts[id].tagline} state={stateOf(id)}
                selected={selected === id} onSelect={() => onSelect(id)} className="h-full" />
            </li>
          </Fragment>
        ))}
      </ol>
      <StorageDiagram {...props} />
    </div>
  );
}
