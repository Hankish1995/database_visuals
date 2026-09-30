import { ArrowLeftRight, Cog, FileCode2, GitBranch, GitFork, HardDrive, Layers, LayoutPanelTop, LifeBuoy, MemoryStick, Monitor, Rows3, ScrollText, Workflow, Zap, type LucideIcon } from "lucide-react";
import type { ConceptId } from "@/lib/sim/types";

export const CONCEPT_ICONS: Record<ConceptId, LucideIcon> = {
  client: Monitor, parser: FileCode2, planner: Workflow, executor: Cog, btree: GitFork,
  bufferPool: MemoryStick, disk: HardDrive, row: Rows3, cache: Zap,
  compositeIndex: Layers, tuple: LayoutPanelTop, transaction: ArrowLeftRight, mvcc: GitBranch, wal: ScrollText, recovery: LifeBuoy,
};
