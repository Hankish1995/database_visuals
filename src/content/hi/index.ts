import { challenges } from "@/content/hi/challenges";
import { concepts } from "@/content/hi/concepts";
import { exampleGroups, examples } from "@/content/hi/examples";
import { labs } from "@/content/hi/labs";
import { lessons, sections } from "@/content/hi/lessons";
import { planNodes, planSamples } from "@/content/hi/plans";
import type { HiContent } from "@/content/hi/types";
import { vectorConcepts } from "@/content/hi/vectorConcepts";

// हिन्दी पाठ्य सामग्री: अंग्रेज़ी content के ids से जुड़ी, सिर्फ़ टेक्स्ट।
export const HI: HiContent = { sections, lessons, concepts, vectorConcepts, labs, exampleGroups, examples, challenges, planNodes, planSamples };
