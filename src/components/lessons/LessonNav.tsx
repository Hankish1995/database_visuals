"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LessonSectionGroup } from "@/components/lessons/LessonSectionGroup";
import { LESSON_SECTIONS, type Lesson } from "@/content/lessons";

interface Props { current: Lesson; onChoose: (id: string) => void; className?: string }

// Full panel on large screens; a collapsible picker above the scene on smaller ones.
export function LessonNav({ current, onChoose, className = "" }: Props) {
  const [openOnMobile, setOpenOnMobile] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([LESSON_SECTIONS[0].id]));
  const toggle = (id: string) => setExpanded((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <nav aria-label="Lessons" className={`rounded-xl border border-line bg-surface shadow-card lg:flex lg:min-h-0 lg:flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:pt-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Lessons</h2>
        <button type="button" aria-expanded={openOnMobile} aria-controls="lesson-list" onClick={() => setOpenOnMobile((o) => !o)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-ink-soft hover:bg-subtle lg:hidden">
          <span className="font-medium">{current.number} {current.title}</span>
          <ChevronDown aria-hidden className={`size-4 transition-transform ${openOnMobile ? "rotate-180" : ""}`} />
          <span className="sr-only">{openOnMobile ? "Hide lessons" : "Show lessons"}</span>
        </button>
      </div>
      <div id="lesson-list" className={`${openOnMobile ? "block" : "hidden"} border-t border-line px-2 pb-3 lg:block lg:min-h-0 lg:flex-1 lg:overflow-y-auto`}>
        {LESSON_SECTIONS.map((section) => (
          <LessonSectionGroup key={section.id} section={section} current={current} expanded={expanded.has(section.id)}
            onToggle={() => toggle(section.id)} onChoose={(id) => { onChoose(id); setOpenOnMobile(false); }} />
        ))}
      </div>
    </nav>
  );
}
