import type { Metadata } from "next";
import { ChallengesWorkspace } from "@/components/challenges/ChallengesWorkspace";
import { PageShell } from "@/components/workspace/PageShell";

export const metadata: Metadata = { title: "Challenges · Inside the Database" };

export default function ChallengesPage() {
  return (
    <PageShell>
      <ChallengesWorkspace />
    </PageShell>
  );
}
