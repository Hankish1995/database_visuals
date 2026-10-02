"use client";

import { CircleHelp } from "lucide-react";
import { useMessages } from "@/i18n";
import { KNOWN_ID_RANGE, SUPPORTED_SQL } from "@/lib/sim/sql";

export function HelpPopover() {
  const m = useMessages();
  const h = m.help;
  return (
    <>
      <button type="button" popoverTarget="help-panel" className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-soft hover:bg-subtle hover:text-ink sm:px-3">
        <CircleHelp className="size-5" aria-hidden />
        <span className="hidden md:inline">{m.topbar.help}</span>
        <span className="sr-only md:hidden">{m.topbar.help}</span>
      </button>
      <div id="help-panel" popover="auto" role="dialog" aria-labelledby="help-title" className="w-[min(380px,calc(100vw-32px))] p-5 text-sm">
        <h2 id="help-title" className="text-base font-semibold">{h.title}</h2>
        <p className="mt-2 text-ink-soft">{h.intro}</p>
        <h3 className="mt-4 font-semibold">{h.kindsTitle}</h3>
        <p className="mt-1 text-ink-soft">{h.kinds}</p>
        <h3 className="mt-4 font-semibold">{h.sqlTitle}</h3>
        <p className="mt-1 text-ink-soft">{h.sqlIntro}</p>
        <code className="mt-2 block rounded-lg bg-subtle px-3 py-2 font-mono text-xs">{SUPPORTED_SQL}</code>
        <p className="mt-2 text-ink-soft">{h.ids(KNOWN_ID_RANGE)}</p>
        <h3 className="mt-4 font-semibold">{h.modelTitle}</h3>
        <p className="mt-1 text-ink-soft">{h.model}</p>
      </div>
    </>
  );
}
