import type { ReactNode } from "react";
import { TopBar } from "@/components/topbar/TopBar";

/** The frame for the Practice, Visualize and Challenges pages: top bar, then a full-height workspace. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <TopBar />
      <main id="workspace" className="flex flex-1 flex-col gap-3 p-3 lg:min-h-0">{children}</main>
    </div>
  );
}
