import { useMemo } from "react";
import { CHALLENGES, type Challenge } from "@/content/challenges";
import { CONCEPTS, type Concept } from "@/content/concepts";
import { EXAMPLE_GROUPS, type ExampleGroup, type SqlExample } from "@/content/examples";
import { HI } from "@/content/hi";
import { LABS, type LabLesson } from "@/content/labs";
import { LESSON_SECTIONS, type Lesson, type LessonSection } from "@/content/lessons";
import { PLAN_NODE_INFO } from "@/content/planNodes";
import { PLAN_SAMPLES } from "@/content/planSamples";
import { VECTOR_CONCEPTS, type VectorConceptId } from "@/content/vectorConcepts";
import { useLocale, type Locale } from "@/lib/prefs";
import type { ConceptId } from "@/lib/sim/types";

// Lesson content in the reader's language. English lives in the content
// modules; Hindi overlays (src/content/hi) replace only the TEXT, keyed by
// the same ids, so SQL, checks and structure are never duplicated. A test
// asserts every id has its Hindi text.

export interface Content {
  sections: LessonSection[];
  lesson: (id: string) => Lesson;
  concepts: Record<ConceptId, Concept>;
  vectorConcepts: Record<VectorConceptId, Concept & { short: string }>;
  labs: Record<string, LabLesson>;
  exampleGroups: ExampleGroup[];
  example: (id: string) => SqlExample | undefined;
  challenges: Challenge[];
  planNodeInfo: Record<string, string>;
  planSamples: typeof PLAN_SAMPLES;
}

function build(locale: Locale): Content {
  const hi = locale === "hi" ? HI : null;
  const sections = LESSON_SECTIONS.map((s) => ({
    ...s, ...hi?.sections[s.id],
    lessons: s.lessons.map((l) => ({ ...l, ...hi?.lessons[l.id] })),
  }));
  const allLessons = sections.flatMap((s) => s.lessons);
  const labs = Object.fromEntries(Object.entries(LABS).map(([id, lab]) => {
    const t = hi?.labs[id];
    return [id, t ? { ...lab, intro: t.intro, steps: lab.steps.map((st) => ({ ...st, ...t.steps[st.id] })) } : lab];
  }));
  const exampleGroups = EXAMPLE_GROUPS.map((g) => ({
    ...g, title: hi?.exampleGroups[g.id] ?? g.title,
    examples: g.examples.map((e) => ({ ...e, ...hi?.examples[e.id] })),
  }));
  const all = exampleGroups.flatMap((g) => g.examples);
  return {
    sections,
    lesson: (id) => allLessons.find((l) => l.id === id) ?? allLessons[0],
    concepts: hi ? { ...CONCEPTS, ...hi.concepts } : CONCEPTS,
    vectorConcepts: hi ? { ...VECTOR_CONCEPTS, ...hi.vectorConcepts } : VECTOR_CONCEPTS,
    labs,
    exampleGroups,
    example: (id) => all.find((e) => e.id === id),
    challenges: CHALLENGES.map((c) => ({ ...c, ...hi?.challenges[c.id] })),
    planNodeInfo: hi ? { ...PLAN_NODE_INFO, ...hi.planNodes } : PLAN_NODE_INFO,
    planSamples: PLAN_SAMPLES.map((s) => ({ ...s, title: hi?.planSamples[s.id] ?? s.title })),
  };
}

const cache: Partial<Record<Locale, Content>> = {};
export const contentFor = (locale: Locale): Content => (cache[locale] ??= build(locale));

export function useContent(): Content {
  const locale = useLocale();
  return useMemo(() => contentFor(locale), [locale]);
}
