"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FlowDiagram } from "@/components/diagram/FlowDiagram";
import { FocusBanner } from "@/components/stage/FocusBanner";
import { LabStage } from "@/components/labs/LabStage";
import { HnswStage } from "@/components/vector/HnswStage";
import { Narration } from "@/components/stage/Narration";
import { SceneErrorBoundary } from "@/components/stage/SceneErrorBoundary";
import { StageHeader } from "@/components/stage/StageHeader";
import type { Workspace } from "@/hooks/useWorkspace";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";

const DatabaseScene = dynamic(() => import("@/components/scene/DatabaseScene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return <p className="flex h-full items-center justify-center text-sm text-muted">{useMessages().stage.loading3d}</p>;
}

export function StagePanel({ ws, className = "" }: { ws: Workspace; className?: string }) {
  const [sceneFailed, setSceneFailed] = useState(false);
  const m = useMessages().stage;
  const content = useContent();
  const view = { sim: ws.sim, scene: ws.scene, selected: ws.inspected, onSelect: ws.select, reduceMotion: ws.reduceMotion };
  const use3d = ws.view === "3d" && !sceneFailed;
  const fallbackNote = ws.webgl === false || sceneFailed ? m.no3d : null;

  return (
    <section aria-labelledby="stage-title" className={`flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card ${className}`}>
      <StageHeader ws={ws} can3d={ws.webgl !== false && !sceneFailed} />
      {ws.lesson.kind === "vector" ? (
        <HnswStage demo={ws.hnsw} />
      ) : ws.lesson.kind === "lab" && ws.lesson.lab ? (
        <LabStage key={ws.lesson.id} lab={content.labs[ws.lesson.lab]} reduceMotion={ws.reduceMotion} />
      ) : (
        <>
          {ws.lesson.kind === "focus" && <FocusBanner lesson={ws.lesson} />}
          {fallbackNote && <p role="note" className="border-b border-line bg-subtle px-4 py-2 text-xs text-muted">{fallbackNote}</p>}
          <div className={`relative border-y border-line bg-subtle ${use3d ? "h-[380px] lg:h-auto lg:min-h-[300px] lg:flex-1" : "lg:min-h-0 lg:flex-1"}`}
            role="group" aria-label={use3d ? m.scene3dLabel : m.diagramLabel}>
            {use3d ? (
              <SceneErrorBoundary onError={() => setSceneFailed(true)}>
                <DatabaseScene {...view} cameraReset={ws.cameraReset} onContextLost={() => setSceneFailed(true)} />
              </SceneErrorBoundary>
            ) : (
              <FlowDiagram {...view} />
            )}
          </div>
          <Narration sim={ws.sim} scene={ws.scene} onSelectRow={() => ws.select("row")} />
        </>
      )}
    </section>
  );
}
