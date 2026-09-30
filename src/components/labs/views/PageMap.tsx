import type { StatementResult } from "@/lib/db/types";

interface Item { lp: number; lp_off: number; lp_len: number; lp_flags: number }
const FLAG = { 0: "unused", 1: "normal", 2: "redirect", 3: "dead" } as Record<number, string>;
const PAGE = 8192;

// The 8 KB page drawn to scale: header, line pointers, free space, tuples.
export function PageMap({ header, items }: { header: StatementResult; items: StatementResult }) {
  const h = header.rows[0] as { lower: number; upper: number; special: number };
  const tuples = (items.rows as unknown as Item[]).filter((t) => t.lp_len > 0 && t.lp_flags === 1);
  const pct = (bytes: number) => `${(bytes / PAGE) * 100}%`;
  return (
    <figure className="space-y-2">
      <figcaption className="text-xs font-semibold text-ink">Page 0, to scale (8,192 bytes)</figcaption>
      <div className="relative h-12 overflow-hidden rounded-lg border border-line-strong bg-surface" role="img"
        aria-label={`Header 24 bytes, line pointers to byte ${h.lower}, free space ${h.upper - h.lower} bytes, tuples from byte ${h.upper} to ${h.special}`}>
        <div className="absolute inset-y-0 left-0 bg-ink/70" style={{ width: pct(24) }} />
        <div className="absolute inset-y-0 bg-accent/60" style={{ left: pct(24), width: pct(h.lower - 24) }} />
        <div className="absolute inset-y-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgb(203_213_227/0.35)_6px,rgb(203_213_227/0.35)_12px)]" style={{ left: pct(h.lower), width: pct(h.upper - h.lower) }} />
        {tuples.map((t) => (
          <div key={t.lp} className="absolute inset-y-1 flex items-center justify-center rounded-sm border border-white bg-flow-bright/80 text-[10px] font-bold text-white"
            style={{ left: pct(t.lp_off), width: pct(t.lp_len) }} title={`Tuple for slot ${t.lp}: bytes ${t.lp_off}–${t.lp_off + t.lp_len}`}>
            {t.lp_len > 120 ? `slot ${t.lp}` : t.lp}
          </div>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
        <li><span className="mr-1 inline-block size-2.5 rounded-sm bg-ink/70 align-middle" />Header 24 B</li>
        <li><span className="mr-1 inline-block size-2.5 rounded-sm bg-accent/60 align-middle" />Line pointers {h.lower - 24} B (lower = {h.lower})</li>
        <li><span className="mr-1 inline-block size-2.5 rounded-sm border border-line-strong align-middle" />Free {h.upper - h.lower} B</li>
        <li><span className="mr-1 inline-block size-2.5 rounded-sm bg-flow-bright/80 align-middle" />Tuples {h.special - h.upper} B (upper = {h.upper})</li>
      </ul>
      <p className="text-[11px] text-muted">
        Line pointer flags: {(items.rows as unknown as Item[]).map((t) => `${t.lp} ${FLAG[t.lp_flags] ?? t.lp_flags}${t.lp_flags === 2 ? ` → ${t.lp_off}` : ""}`).join(" · ")}
      </p>
    </figure>
  );
}
