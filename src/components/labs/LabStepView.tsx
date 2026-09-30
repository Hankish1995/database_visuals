import type { ReactNode } from "react";
import { PlanTree } from "@/components/plan/PlanTree";
import { PageMap } from "@/components/labs/views/PageMap";
import { RecoveryView } from "@/components/labs/views/RecoveryView";
import { VersionsView } from "@/components/labs/views/VersionsView";
import { WalRecords } from "@/components/labs/views/WalRecords";
import { StatementResultCard } from "@/components/sql/StatementResultCard";
import type { LabView } from "@/content/labs";
import type { StepOutcome } from "@/hooks/useLab";
import { planFromRows } from "@/lib/plan/parsePlan";
import type { StatementResult } from "@/lib/db/types";

const has = (r: StatementResult, col: string) => r.columns.some((c) => c.name === col);

// Picks out the results a special view draws (a plan, a page, versions, WAL
// records) and shows every other statement as an ordinary result.
export function LabStepView({ view, outcome }: { view: LabView; outcome: StepOutcome }) {
  if (outcome.failure) return <p role="alert" className="text-sm text-miss">This step couldn&apos;t run: {outcome.failure}</p>;
  if (view === "recovery" && outcome.recovery) return <RecoveryView report={outcome.recovery} />;

  const { results } = outcome;
  const used = new Set<StatementResult>();
  const take = (match: (r: StatementResult) => boolean) => {
    const found = [...results].reverse().find((r) => !r.error && match(r));
    if (found) used.add(found);
    return found;
  };

  let special: ReactNode = null;
  if (view === "plan") {
    const r = take((x) => has(x, "QUERY PLAN"));
    const plan = r && planFromRows(r.rows);
    if (plan) special = <PlanTree plan={plan} compact />;
  } else if (view === "page") {
    const header = take((x) => has(x, "upper"));
    const items = take((x) => has(x, "lp_off"));
    if (header && items) special = <><PageMap header={header} items={items} /><StatementResultCard result={items} showSql={false} /></>;
  } else if (view === "versions") {
    const versions = take((x) => has(x, "xmin_status"));
    if (versions) special = <VersionsView versions={versions} />;
  } else if (view === "wal") {
    const records = take((x) => has(x, "record_type"));
    if (records) special = <WalRecords records={records} />;
  }

  const rest = results.filter((r) => !used.has(r) && (r.error || r.columns.length > 0 || r.notices.length > 0));
  return (
    <div className="space-y-2">
      {rest.map((r, i) => <StatementResultCard key={i} result={r} />)}
      {special}
    </div>
  );
}
