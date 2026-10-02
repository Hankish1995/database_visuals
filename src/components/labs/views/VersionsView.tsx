"use client";

import { useState } from "react";
import { ResultTable } from "@/components/sql/ResultTable";
import { useMessages } from "@/i18n";
import type { StatementResult } from "@/lib/db/types";

interface Version { lp: number; lp_flags: number; t_xmin: string | null; t_xmax: string | null; xmin_status: string | null; xmax_status: string | null }

// The simplified visibility rule: a snapshot taken when every transaction
// below `snap` had finished sees a version if its creator committed before
// the snapshot, and its deleter (if any) had not.
function visible(v: Version, snap: number): boolean {
  if (v.lp_flags !== 1 || v.t_xmin === null) return false;
  const created = v.xmin_status === "committed" && Number(v.t_xmin) < snap;
  const ended = v.t_xmax !== "0" && v.xmax_status === "committed" && Number(v.t_xmax) < snap;
  return created && !ended;
}

export function VersionsView({ versions }: { versions: StatementResult }) {
  const m = useMessages().labs;
  const rows = versions.rows as unknown as Version[];
  const xids = rows.flatMap((v) => [v.t_xmin, v.t_xmax]).filter((x): x is string => x !== null && x !== "0").map(Number);
  const min = Math.min(...xids);
  const max = Math.max(...xids) + 1;
  const [snap, setSnap] = useState<number | null>(null);
  const at = snap === null ? max : Math.min(Math.max(snap, min), max);
  const seen = rows.filter((v) => visible(v, at));

  return (
    <div className="space-y-2">
      <ResultTable result={versions} caption={m.versionsCaption} highlight={(r) => visible(r as unknown as Version, at)} />
      {xids.length > 0 && (
        <div className="rounded-lg border border-line bg-subtle px-3 py-2 text-xs">
          <label htmlFor="snapshot" className="font-semibold text-ink">{m.snapshot(at)}</label>
          <input id="snapshot" type="range" min={min} max={max} value={at} onChange={(e) => setSnap(Number(e.target.value))} className="mt-1 block w-full accent-[var(--color-accent)]" />
          <p className="text-ink-soft">
            {seen.length ? m.sees(seen.map((v) => v.lp).join(", ")) : m.seesNone}{" "}
            {at === max ? m.snapshotNow : m.snapshotOlder}
          </p>
        </div>
      )}
    </div>
  );
}
