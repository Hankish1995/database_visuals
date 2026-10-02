import type { SceneState } from "@/lib/sim/sceneState";
import type { Simulation } from "@/lib/sim/types";
import { useMessages } from "@/i18n";

/** The timeline: one numbered stop per step. Selecting one jumps there and pauses. */
export function StepDots({ sim, scene, onSeek }: { sim: Simulation; scene: SceneState; onSeek: (i: number) => void }) {
  const current = scene.step ? sim.steps.indexOf(scene.step) : -1;
  const m = useMessages().playback;
  return (
    <ol aria-label={m.stepsList} className="order-last flex w-full min-w-0 items-center overflow-x-auto py-1 lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
      {sim.steps.map((step, i) => {
        const done = scene.status === "done" || (current >= 0 && i < current);
        const now = i === current && scene.status !== "done";
        return (
          <li key={step.id} className="flex items-center">
            {i > 0 && <span aria-hidden className={`h-0.5 w-3 sm:w-8 ${done || now ? "bg-flow-bright" : "bg-line"}`} />}
            <button type="button" onClick={() => onSeek(i)} aria-label={m.stepLabel(i + 1, step.title)} aria-current={now ? "step" : undefined} title={step.title}
              className={`flex size-6 shrink-0 sm:size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                now ? "bg-accent text-white ring-4 ring-accent/20" : done ? "bg-flow-bright text-white" : "border border-line-strong bg-surface text-muted hover:border-accent"}`}>
              {i + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
