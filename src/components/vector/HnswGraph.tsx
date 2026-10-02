import { LayerPanel } from "@/components/vector/LayerPanel";
import type { HnswDemo } from "@/hooks/useHnswDemo";
import { useMessages, type Messages } from "@/i18n";

// The layers top-down: the sparse upper layers beside (or, on a phone,
// above) the full bottom layer where the real search happens.
export function HnswGraph({ demo }: { demo: HnswDemo }) {
  const { graph, frame, query, result, exact, compare } = demo;
  const upper = frame.layers.slice(1).reverse();
  const panel = (layer: number) => (
    <LayerPanel key={layer} graph={graph} layer={layer} frame={frame.layers[layer]} query={query}
      results={result.results} exact={exact} showExact={compare === "exact" && frame.done}
      active={demo.playback.status !== "idle" && !frame.done && frame.activeLayer === layer} done={frame.done} />
  );
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">{upper.map((l) => panel(l.layer))}</div>
      {panel(0)}
    </div>
  );
}

type KeyId = keyof Messages["vector"]["key"];
const KEY: [KeyId, React.ReactNode][] = [
  ["unvisited", <circle key="u" cx={6} cy={6} r={3} fill="var(--color-surface)" stroke="var(--color-line-strong)" />],
  ["dropped", <circle key="v" cx={6} cy={6} r={3} fill="var(--color-muted)" fillOpacity={0.55} />],
  ["candidate", <circle key="c" cx={6} cy={6} r={3.4} fill="var(--color-accent)" />],
  ["exploring", <circle key="x" cx={6} cy={6} r={3.4} fill="var(--color-accent)" stroke="var(--color-flow-bright)" strokeWidth={1.6} />],
  ["returned", <rect key="r" x={2.5} y={2.5} width={7} height={7} rx={1} fill="var(--color-ok)" />],
  ["trueNearest", <path key="e" d="M6 0.8l5.2 5.2-5.2 5.2-5.2-5.2z" fill="none" stroke="var(--color-index)" strokeWidth={1.1} />],
  ["missedNearest", <path key="m" d="M6 0.8l5.2 5.2-5.2 5.2-5.2-5.2z" fill="none" stroke="var(--color-miss)" strokeWidth={1.1} strokeDasharray="2 1.4" />],
  ["query", <path key="q" d="M1 6h10M6 1v10" stroke="var(--color-miss)" strokeWidth={1.3} />],
];

export function HnswLegend({ compare }: { compare: boolean }) {
  const m = useMessages().vector;
  return (
    <ul aria-label={m.legend} className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
      {KEY.filter(([id]) => compare || !id.endsWith("Nearest")).map(([id, icon]) => (
        <li key={id} className="flex items-center gap-1.5">
          <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>{icon}</svg>{m.key[id]}
        </li>
      ))}
    </ul>
  );
}
