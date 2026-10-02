"use client";

import { Crosshair } from "lucide-react";
import type { Lesson } from "@/content/lessons";
import { useContent } from "@/content/localized";
import { useMessages } from "@/i18n";

export function FocusBanner({ lesson }: { lesson: Lesson }) {
  const content = useContent();
  const m = useMessages();
  const local = content.lesson(lesson.id);
  const name = lesson.focus ? content.concepts[lesson.focus].name : "";
  return (
    <p role="note" className="flex items-start gap-2 border-t border-line bg-accent-soft/60 px-4 py-2 text-xs text-ink-soft lg:px-5">
      <Crosshair className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden />
      <span>{m.stage.focusNote(`${local.number} ${local.title}`, name)}</span>
    </p>
  );
}
