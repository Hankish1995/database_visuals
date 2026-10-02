import type { Locale } from "@/lib/prefs";
import { simEn, type SimText } from "@/lib/sim/text/en";
import { simHi } from "@/lib/sim/text/hi";

export const SIM_TEXT: Record<Locale, SimText> = { en: simEn, hi: simHi };
export type { SimText };
