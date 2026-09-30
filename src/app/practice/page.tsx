import type { Metadata } from "next";
import { SqlLab } from "@/components/practice/SqlLab";
import { PageShell } from "@/components/workspace/PageShell";

export const metadata: Metadata = { title: "SQL Lab · Inside the Database" };

export default async function PracticePage({ searchParams }: PageProps<"/practice">) {
  const { sql } = await searchParams;
  return (
    <PageShell>
      <SqlLab initialSql={typeof sql === "string" ? sql : undefined} />
    </PageShell>
  );
}
