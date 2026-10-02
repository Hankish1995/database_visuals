import type { Locale } from "@/lib/prefs";
import type { TraceEvent } from "@/lib/hnsw/types";

// The HNSW lesson's step-by-step sentence, per language. Vector ids (v12),
// ef_search and k stay as they are.

const fmt = (d: number) => d.toFixed(1);
type Stop = Extract<TraceEvent, { kind: "stop" }>;

const en = {
  queryName: (label: string) => label,
  reason: (e: Stop) => (e.reason === "farther" ? `${e.node} is farther than every kept candidate, so nothing closer can be reached` : "no unexplored candidates are left"),
  /** One plain-language sentence for the step the animation is on. */
  describe(event: TraceEvent | null, efSearch: number, k: number): string {
    if (!event) return "Press Run search to start at the entry point on the top layer.";
    switch (event.kind) {
      case "enter": return `Start at the entry point ${event.node} on layer ${event.layer} (distance ${fmt(event.distance)}).`;
      case "expand": return event.layer > 0
        ? `Layer ${event.layer}: check the links of ${event.node}, looking for anything closer (greedy, one best candidate).`
        : `Layer 0: explore the links of ${event.node}, the nearest unexplored candidate (distance ${fmt(event.distance)}).`;
      case "visit": return event.kept
        ? `${event.node} is ${fmt(event.distance)} away -- close enough to join the candidate list${event.evicted ? `, which pushes out ${event.evicted}` : ""}.`
        : `${event.node} is ${fmt(event.distance)} away -- not closer than the candidates already kept, so it is dropped.`;
      case "descend": return `Nothing closer on layer ${event.fromLayer}. Drop to layer ${event.toLayer}, starting from ${event.node}.`;
      case "stop": return event.layer > 0 ? `Layer ${event.layer} is done: ${en.reason(event)}.` : `Layer 0 stops: ${en.reason(event)}. The list held up to ${efSearch} candidates.`;
      case "done": return `Return the ${k} nearest of the candidates found.`;
    }
  },
};

export type HnswText = typeof en;

const hi: HnswText = {
  queryName: (label) => label.replace(/^Query /, "क्वेरी "),
  reason: (e) => (e.reason === "farther" ? `${e.node} रखे गए हर उम्मीदवार से दूर है, इसलिए इससे नज़दीक कुछ नहीं मिल सकता` : "जाँचने के लिए कोई उम्मीदवार नहीं बचा"),
  describe(event, efSearch, k) {
    if (!event) return "सबसे ऊपरी लेयर के entry point से शुरू करने के लिए \"सर्च चलाएँ\" दबाएँ।";
    switch (event.kind) {
      case "enter": return `लेयर ${event.layer} पर entry point (शुरुआती बिंदु) ${event.node} से शुरू करें (दूरी ${fmt(event.distance)})।`;
      case "expand": return event.layer > 0
        ? `लेयर ${event.layer}: ${event.node} के लिंक जाँचें, कुछ और नज़दीक ढूँढते हुए (greedy: हर बार सिर्फ़ एक सबसे अच्छा उम्मीदवार)।`
        : `लेयर 0: ${event.node} के लिंक खोजें, जो सबसे नज़दीकी बिना-जाँचा उम्मीदवार है (दूरी ${fmt(event.distance)})।`;
      case "visit": return event.kept
        ? `${event.node} की दूरी ${fmt(event.distance)} है -- इतना नज़दीक कि उम्मीदवारों की सूची में जुड़ जाए${event.evicted ? `, जिससे ${event.evicted} बाहर हो जाता है` : ""}।`
        : `${event.node} की दूरी ${fmt(event.distance)} है -- पहले से रखे उम्मीदवारों से नज़दीक नहीं, इसलिए छोड़ दिया गया।`;
      case "descend": return `लेयर ${event.fromLayer} पर कुछ और नज़दीक नहीं मिला। ${event.node} से शुरू करते हुए लेयर ${event.toLayer} पर उतरें।`;
      case "stop": return event.layer > 0 ? `लेयर ${event.layer} पूरी हुई: ${hi.reason(event)}।` : `लेयर 0 रुकती है: ${hi.reason(event)}। सूची में ज़्यादा से ज़्यादा ${efSearch} उम्मीदवार थे।`;
      case "done": return `मिले हुए उम्मीदवारों में से ${k} सबसे नज़दीकी लौटाएँ।`;
    }
  },
};

export const HNSW_TEXT: Record<Locale, HnswText> = { en, hi };
