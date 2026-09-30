import type { Metadata } from "next";
import { PlanWorkspace } from "@/components/visualize/PlanWorkspace";
import { PageShell } from "@/components/workspace/PageShell";

export const metadata: Metadata = { title: "Plan visualizer · Inside the Database" };

export default async function VisualizePage({ searchParams }: PageProps<"/visualize">) {
  const { sql } = await searchParams;
  return (
    <PageShell>
      <PlanWorkspace initialSql={typeof sql === "string" ? sql : undefined} />
    </PageShell>
  );
}
