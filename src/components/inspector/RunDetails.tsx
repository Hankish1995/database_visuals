import { runFacts } from "@/content/runFacts";
import { PageRows } from "@/components/inspector/PageRows";
import { StatusCard } from "@/components/inspector/StatusCard";
import type { SceneState } from "@/lib/sim/sceneState";
import type { ConceptId, Simulation } from "@/lib/sim/types";

export function RunDetails({ concept, sim, scene }: { concept: ConceptId; sim: Simulation; scene: SceneState }) {
  const facts = runFacts(concept, sim, scene);
  const finished = scene.status === "done" || scene.resultShown;
  return (
    <div className="space-y-4 text-sm">
      <StatusCard status={facts.status} />
      <dl className="divide-y divide-line rounded-lg border border-line">
        {facts.rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-3 py-2">
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 text-right font-medium break-words text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {facts.extra === "parseTree" && (
        <Figure title="Parse tree (simplified)">
          {parseTree(sim)}
        </Figure>
      )}
      {facts.extra === "plan" && <Figure title="Chosen plan (EXPLAIN-style)">{sim.plan.join("\n")}</Figure>}
      {facts.extra === "page" && <PageRows sim={sim} scene={scene} />}
      {facts.extra === "result" && finished && sim.rows[0] && (
        <Figure title="Returned row">{sim.query.columns.map((c) => `${c}: ${sim.rows[0][c]}`).join("\n")}</Figure>
      )}
      {facts.extra === "result" && finished && sim.change?.after && (
        <Figure title={sim.kind === "insert" ? "Inserted row" : "Row after the update"}>{Object.entries(sim.change.after).map(([k, v]) => `${k}: ${v}`).join("\n")}</Figure>
      )}
      {facts.extra === "wal" && scene.wal.length > 0 && (
        <Figure title="Records this run">{scene.wal.map((w) => `${w.flushed ? "✓ flushed " : "· pending "} ${w.record}`).join("\n")}</Figure>
      )}
    </div>
  );
}

function parseTree(sim: Simulation): string {
  const q = sim.query;
  const where = `└─ WHERE\n   └─ =\n      ├─ column: id\n      └─ constant: ${q.id}`;
  const vals = Object.entries(q.values).map(([k, v]) => `${k} = ${typeof v === "string" ? `'${v}'` : v}`);
  switch (q.kind) {
    case "select": return `SELECT\n├─ columns: ${q.selectAll ? "*" : q.columns.join(", ")}\n├─ FROM: users\n${where}`;
    case "insert": return `INSERT\n├─ INTO: users\n└─ VALUES\n${vals.map((v, i) => `   ${i === vals.length - 1 ? "└─" : "├─"} ${v}`).join("\n")}`;
    case "update": return `UPDATE\n├─ TABLE: users\n├─ SET\n${vals.map((v) => `│  ├─ ${v}`).join("\n")}\n${where}`;
    case "delete": return `DELETE\n├─ FROM: users\n${where}`;
  }
}

function Figure({ title, children }: { title: string; children: string }) {
  return (
    <figure>
      <figcaption className="mb-1 font-semibold text-ink">{title}</figcaption>
      <pre className="overflow-x-auto rounded-lg border border-line bg-subtle px-3 py-2 font-mono text-xs leading-relaxed text-ink">{children}</pre>
    </figure>
  );
}
