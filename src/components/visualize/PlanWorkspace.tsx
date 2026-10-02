"use client";

import { useState } from "react";
import { PlanControls } from "@/components/visualize/PlanControls";
import { PlanSidebar } from "@/components/visualize/PlanSidebar";
import { PlanTree } from "@/components/plan/PlanTree";
import { DbStatus } from "@/components/practice/DbStatus";
import { SqlEditor } from "@/components/sql/SqlEditor";
import { PLAN_SAMPLES } from "@/content/planSamples";
import { useDatabase } from "@/hooks/useDatabase";
import { usePlanRunner } from "@/hooks/usePlanRunner";
import { SHOP_SEED } from "@/lib/db/seeds";
import type { PlanNode } from "@/lib/plan/parsePlan";
import { useMessages } from "@/i18n";

const SHOP = { key: "shop", sql: SHOP_SEED };
const panel = "rounded-xl border border-line bg-surface shadow-card";

// Visualize: the real execution plan PostgreSQL chooses for your query.
export function PlanWorkspace({ initialSql }: { initialSql?: string }) {
  const m = useMessages().plan;
  const db = useDatabase(SHOP);
  const planner = usePlanRunner(db);
  const [sql, setSql] = useState(initialSql ?? PLAN_SAMPLES[0].sql);
  const [analyze, setAnalyze] = useState(true);
  const [selected, setSelected] = useState<PlanNode | null>(null);
  const run = () => { if (db.status === "ready") { setSelected(null); planner.run(sql, analyze); } };
  const plan = planner.result?.plan ?? null;

  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:min-h-0 lg:grid-cols-[minmax(300px,26rem)_minmax(0,1fr)_minmax(260px,21rem)]">
      <section aria-labelledby="viz-title" className={`${panel} flex min-h-0 flex-col gap-3 p-4`}>
        <div>
          <h1 id="viz-title" className="text-lg font-extrabold tracking-wide text-ink uppercase">{m.title}</h1>
          <p className="text-sm text-muted">{m.subtitle}</p>
        </div>
        <DbStatus status={db.status} error={db.error} />
        <SqlEditor id="plan-sql" label={m.query} value={sql} onChange={setSql} onRun={run} className="h-56 shrink-0 lg:h-auto lg:min-h-48 lg:flex-1" />
        <PlanControls analyze={analyze} onAnalyzeChange={setAnalyze} onRun={run} running={planner.running} ready={db.status === "ready"}
          onSample={(s) => setSql(s)} />
      </section>
      <section aria-label={m.region} className={`${panel} min-h-64 overflow-y-auto p-4`}>
        {planner.result?.problem && <p role="alert" className="mb-3 rounded-lg border border-miss-line bg-miss-soft px-3 py-2 text-sm text-miss">{m.problem(planner.result.problem)}</p>}
        {plan ? <PlanTree plan={plan} selectedId={selected?.id ?? plan.root.id} onSelect={setSelected} />
          : !planner.result && <p className="py-10 text-center text-sm text-muted">{m.empty}</p>}
      </section>
      <PlanSidebar className={`${panel} p-5 lg:overflow-y-auto`} plan={plan} node={selected ?? plan?.root ?? null} setup={planner.result?.setup ?? []} />
    </div>
  );
}
