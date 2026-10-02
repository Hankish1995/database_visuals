import type { Concept } from "@/content/concepts";
import type { VectorConceptId } from "@/content/vectorConcepts";
import type { ConceptId } from "@/lib/sim/types";

// The shape of the Hindi content overlay: text only, keyed by the English
// content's ids. Structure, SQL and checks always come from the English modules.
export interface Titled { title: string; subtitle: string }
export interface LabText { intro: string; steps: Record<string, { title: string; body: string; observe: string }> }
export interface ExampleText { title: string; summary: string; notice: string }
export interface ChallengeText { title: string; topic: string; prompt: string; hints: string[] }

export interface HiContent {
  sections: Record<string, Titled>;
  lessons: Record<string, Titled>;
  concepts: Record<ConceptId, Concept>;
  vectorConcepts: Record<VectorConceptId, Concept & { short: string }>;
  labs: Record<string, LabText>;
  exampleGroups: Record<string, string>;
  examples: Record<string, ExampleText>;
  challenges: Record<string, ChallengeText>;
  planNodes: Record<string, string>;
  planSamples: Record<string, string>;
}
