import { ChevronRight, CirclePlay, Crosshair, FlaskConical, Waypoints } from "lucide-react";
import type { Lesson, LessonSection } from "@/content/lessons";
import { useMessages } from "@/i18n";

interface Props {
  section: LessonSection;
  current: Lesson;
  expanded: boolean;
  onToggle: () => void;
  onChoose: (id: string) => void;
}

const KIND_ICON = { ready: CirclePlay, focus: Crosshair, lab: FlaskConical, vector: Waypoints };

export function LessonSectionGroup({ section, current, expanded, onToggle, onChoose }: Props) {
  const listId = `lessons-${section.id}`;
  const m = useMessages().lessons;
  const KIND_NOTE = { ready: "", focus: m.kindFocus, lab: m.kindLab, vector: m.kindVector };
  return (
    <div className="border-b border-line py-1 last:border-b-0">
      <button type="button" aria-expanded={expanded} aria-controls={listId} onClick={onToggle}
        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-subtle">
        <span className="mt-0.5 text-sm font-bold text-accent">{section.number}.</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold uppercase tracking-wide text-ink">{section.title}</span>
          <span className="block text-xs text-muted">{section.subtitle}</span>
        </span>
        <ChevronRight aria-hidden className={`mt-0.5 size-4 text-muted transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>
      {expanded && (
        <ul id={listId} className="space-y-1 pb-1">
          {section.lessons.map((lesson) => {
            const Icon = KIND_ICON[lesson.kind];
            const active = lesson.id === current.id;
            return (
              <li key={lesson.id}>
                <button type="button" aria-current={active ? "true" : undefined} onClick={() => onChoose(lesson.id)}
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    active ? "border-accent/50 bg-accent-soft" : "border-transparent hover:bg-subtle"}`}>
                  <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${active ? "text-accent" : lesson.kind === "lab" ? "text-index" : "text-muted"}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">
                      <span className="mr-1.5 text-accent">{lesson.number}</span>{lesson.title}
                    </span>
                    <span className="block text-xs text-muted">
                      {lesson.subtitle}
                      {KIND_NOTE[lesson.kind] && <span className="ml-1 whitespace-nowrap">· {KIND_NOTE[lesson.kind]}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
