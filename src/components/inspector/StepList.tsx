import { Check } from "lucide-react";
import type { SceneState } from "@/lib/sim/sceneState";
import type { Simulation } from "@/lib/sim/types";
import { useMessages } from "@/i18n";

// The whole run as text, the text equivalent of the scene. Selecting a step jumps there and pauses.
export function StepList({ sim, scene, onSeek }: { sim: Simulation; scene: SceneState; onSeek: (i: number) => void }) {
  const current = scene.step ? sim.steps.indexOf(scene.step) : -1;
  const done = useMessages().inspector.done;
  return (
    <ol className="space-y-1.5 text-sm">
      {sim.steps.map((step, i) => {
        const state = scene.status === "idle" ? "ahead" : i < current || scene.status === "done" ? "done" : i === current ? "now" : "ahead";
        return (
          <li key={step.id}>
            <button type="button" onClick={() => onSeek(i)} aria-current={state === "now" ? "step" : undefined}
              className={`flex w-full gap-2.5 rounded-lg border px-3 py-2 text-left ${state === "now" ? "border-flow-bright/50 bg-flow-soft" : "border-line hover:border-line-strong"}`}>
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                state === "done" ? "bg-ok text-white" : state === "now" ? "bg-flow text-white" : "bg-subtle text-muted ring-1 ring-line"}`}>
                {state === "done" ? <Check className="size-3" aria-label={done} /> : i + 1}
              </span>
              <span>
                <span className="block font-medium text-ink">{step.title}</span>
                {state === "now" && <span className="block text-xs text-ink-soft">{step.what}</span>}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
