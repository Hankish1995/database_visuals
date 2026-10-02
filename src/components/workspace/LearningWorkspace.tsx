"use client";

import { QueryEditor } from "@/components/editor/QueryEditor";
import { Inspector } from "@/components/inspector/Inspector";
import { LessonNav } from "@/components/lessons/LessonNav";
import { PlaybackStrip } from "@/components/playback/PlaybackStrip";
import { StagePanel } from "@/components/stage/StagePanel";
import { TopBar } from "@/components/topbar/TopBar";
import { VectorInspector } from "@/components/vector/VectorInspector";
import { useWorkspace } from "@/hooks/useWorkspace";

// Desktop: lessons | stage | inspector, with playback and the editor below.
// Below lg the panels stack in reading order: lesson picker, stage,
// playback, editor, then the inspector.
export function LearningWorkspace() {
  const ws = useWorkspace();
  return (
    <div className={`flex min-h-dvh flex-col lg:h-dvh ${ws.reduceMotion ? "reduce-motion" : ""}`}>
      <TopBar settings={ws.settings} onSettingsChange={ws.setSettings} />
      <main id="workspace" className="flex flex-1 flex-col gap-3 p-3 lg:grid lg:min-h-0 lg:grid-cols-[minmax(240px,19rem)_minmax(0,1fr)_minmax(300px,23rem)] lg:grid-rows-[minmax(0,1fr)_auto_auto]">
        <LessonNav current={ws.lesson} onChoose={ws.chooseLesson} className="lg:col-start-1 lg:row-start-1" />
        <StagePanel ws={ws} className="lg:col-start-2 lg:row-start-1" />
        {ws.lesson.kind === "vector"
          ? <VectorInspector demo={ws.hnsw} className="order-last lg:order-none lg:col-start-3 lg:row-start-1" />
          : <Inspector ws={ws} className="order-last lg:order-none lg:col-start-3 lg:row-start-1" />}
        {(ws.lesson.kind === "ready" || ws.lesson.kind === "focus") && (
          <>
            <PlaybackStrip ws={ws} className="lg:col-span-3 lg:row-start-2" />
            <QueryEditor ws={ws} className="lg:col-span-3 lg:row-start-3" />
          </>
        )}
      </main>
    </div>
  );
}
