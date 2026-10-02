import { CircleCheck, CircleDot, CircleX, Info, Play } from "lucide-react";
import type { RunStatus, Tone } from "@/content/runFacts";
import { useMessages } from "@/i18n";

const STYLE: Record<Tone, { box: string; title: string; icon: typeof Info }> = {
  neutral: { box: "border-line bg-subtle", title: "text-ink", icon: CircleDot },
  active: { box: "border-flow-bright/40 bg-flow-soft", title: "text-flow", icon: Play },
  ok: { box: "border-ok/30 bg-ok-soft", title: "text-ok", icon: CircleCheck },
  miss: { box: "border-miss-line bg-miss-soft", title: "text-miss", icon: CircleX },
  info: { box: "border-accent/30 bg-accent-soft", title: "text-accent", icon: Info },
};

export function StatusCard({ status }: { status: RunStatus }) {
  const s = STYLE[status.tone];
  const Icon = s.icon;
  const label = useMessages().inspector.currentStatus;
  return (
    <section aria-label={label}>
      <h3 className="mb-1.5 font-semibold text-ink">{label}</h3>
      <div className={`flex gap-2.5 rounded-lg border px-3 py-2.5 ${s.box}`}>
        <Icon className={`mt-0.5 size-4 shrink-0 ${s.title}`} aria-hidden />
        <div>
          <p className={`font-semibold ${s.title}`}>{status.title}</p>
          <p className="text-xs leading-relaxed text-ink-soft">{status.body}</p>
        </div>
      </div>
    </section>
  );
}
