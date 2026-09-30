import { Crosshair } from "lucide-react";
import { CONCEPTS } from "@/content/concepts";
import type { Lesson } from "@/content/lessons";

export function FocusBanner({ lesson }: { lesson: Lesson }) {
  const name = lesson.focus ? CONCEPTS[lesson.focus].name.toLowerCase() : "component";
  return (
    <p role="note" className="flex items-start gap-2 border-t border-line bg-accent-soft/60 px-4 py-2 text-xs text-ink-soft lg:px-5">
      <Crosshair className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
      <span>
        <strong className="text-ink">{lesson.number} {lesson.title}</strong> is a focused view: the Query flow scene with the {name} pinned in the
        inspector. A dedicated lesson isn&apos;t built yet.
      </span>
    </p>
  );
}
