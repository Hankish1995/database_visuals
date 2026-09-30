import { CircleAlert, CircleCheck } from "lucide-react";
import { ResultCard } from "@/components/stage/ResultCard";
import type { SceneState } from "@/lib/sim/sceneState";
import type { Simulation } from "@/lib/sim/types";

function Summary({ sim, scene }: { sim: Simulation; scene: SceneState }) {
  if (sim.error) {
    return <p className="flex items-center gap-1.5 text-sm font-semibold text-miss"><CircleAlert className="size-4" aria-hidden /> Failed after {sim.steps.length} steps: the transaction rolled back.</p>;
  }
  const fromMemory = sim.tablePagesVisited.length - sim.pagesFromDisk.length;
  return (
    <div className="space-y-0.5 text-sm">
      <p className="flex items-center gap-1.5 font-semibold text-ok"><CircleCheck className="size-4" aria-hidden /> Complete: {sim.commandTag} in {sim.steps.length} steps</p>
      <p className="text-ink-soft">
        {sim.kind === "select" || sim.kind === "update" || sim.kind === "delete" ? `${sim.rowsExamined} row${sim.rowsExamined === 1 ? "" : "s"} examined · ` : ""}
        {fromMemory} table page{fromMemory === 1 ? "" : "s"} from memory · {sim.pagesFromDisk.length} from disk
        {sim.indexPagesVisited > 0 && ` · ${sim.indexPagesVisited} index pages`}
        {scene.wal.length > 0 && ` · ${scene.wal.length} WAL records flushed · ${scene.dirtyPages.length} page left dirty`}
      </p>
    </div>
  );
}

// Every step explained in text: the scene is never the only place the information lives.
// Fixed height on large screens, so the 3D view above doesn't resize between steps.
export function Narration({ sim, scene, onSelectRow }: { sim: Simulation; scene: SceneState; onSelectRow: () => void }) {
  const box = "px-4 py-3 lg:h-40 lg:overflow-y-auto lg:px-5";
  if (scene.status === "idle") {
    const plan = sim.kind === "insert" ? "insert" : sim.options.useIndex ? "index lookup" : "table scan";
    return (
      <div className={`${box} text-sm`}>
        <p className="font-semibold text-ink">Ready to run</p>
        <p className="text-ink-soft">Press <strong>Run query</strong> and the {sim.kind.toUpperCase()} plays through all {sim.steps.length} steps on its own ({plan}, {sim.options.cache === "hit" ? "warm" : "cold"} cache). Pick SELECT, INSERT, UPDATE or DELETE below the scene to compare.</p>
      </div>
    );
  }
  if (scene.status === "done") {
    return (
      <div className={`${box} grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]`}>
        <Summary sim={sim} scene={scene} />
        <ResultCard sim={sim} onSelect={onSelectRow} />
      </div>
    );
  }
  const step = scene.step!;
  return (
    <div className={box}>
      <h2 className={`text-sm font-semibold ${step.failed ? "text-miss" : "text-ink"}`}>{step.failed && "✕ "}{step.title}</h2>
      <dl className="mt-1.5 grid gap-x-5 gap-y-2 text-[13px] leading-snug md:grid-cols-[1.3fr_1fr_1fr]">
        {([["What's happening", step.what], ["Why", step.why], ["What to notice", step.notice]] as const).map(([term, text]) => (
          <div key={term}>
            <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{term}</dt>
            <dd className="text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>
      {scene.resultShown && <div className="mt-2"><ResultCard sim={sim} onSelect={onSelectRow} /></div>}
    </div>
  );
}
