import { useTheme } from "@/lib/prefs";

// Scene colours, matched to the CSS theme tokens: one set per theme.
const LIGHT = {
  flow: "#06b6d4",
  flowDeep: "#0e7490",
  accent: "#2563eb",
  stage: { client: "#f8fafc", parser: "#7aa2f7", planner: "#4f86f7", executor: "#2f6fed" },
  indexIdle: "#d8ccff",
  indexLit: "#7c3aed",
  indexOff: "#e2e8f0",
  pageIdle: "#ffffff",
  pageEmpty: "#cbd5e1",
  pageUsers: "#e6f6fb",
  pageDirty: "#fde9c9",
  walPending: "#f8fafc",
  walFlushed: "#9fdcea",
  walFailed: "#fbd5dd",
  platformMemory: "#e8f4fb",
  platformDisk: "#e7ecf3",
  line: "#c3cedd",
  lineDone: "#7dd3e3",
  selected: "#2563eb",
  background: "#f7f9fc",
  hemiSky: "#ffffff",
  hemiGround: "#dbe4f0",
  ambient: 1.4,
  directional: 1.6,
};

// Dark: dim, desaturated blocks on a navy floor so the lit path (cyan) and
// the index (violet) still stand out; lights turned down to avoid glare.
const DARK: typeof LIGHT = {
  flow: "#22d3ee",
  flowDeep: "#5fd0e6",
  accent: "#4a84f3",
  stage: { client: "#2a3650", parser: "#4565c8", planner: "#3a5fd0", executor: "#2f56c4" },
  indexIdle: "#3d3170",
  indexLit: "#a78bfa",
  indexOff: "#1f2937",
  pageIdle: "#1f2a42",
  pageEmpty: "#2b364b",
  pageUsers: "#14394a",
  pageDirty: "#4d3714",
  walPending: "#1f2a42",
  walFlushed: "#1d6273",
  walFailed: "#5e1f2e",
  platformMemory: "#142a3d",
  platformDisk: "#18233a",
  line: "#3a4c68",
  lineDone: "#2c97ad",
  selected: "#4a84f3",
  background: "#0e1626",
  hemiSky: "#cbd5e1",
  hemiGround: "#0b1220",
  ambient: 0.9,
  directional: 1.1,
};

export type Palette = typeof LIGHT;

export function usePalette(): Palette {
  return useTheme() === "dark" ? DARK : LIGHT;
}
