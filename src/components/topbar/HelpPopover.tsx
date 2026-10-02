import { CircleHelp } from "lucide-react";
import { KNOWN_ID_RANGE, SUPPORTED_SQL } from "@/lib/sim/sql";

export function HelpPopover() {
  return (
    <>
      <button type="button" popoverTarget="help-panel" className="inline-flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-soft hover:bg-subtle hover:text-ink sm:px-3">
        <CircleHelp className="size-5" aria-hidden />
        <span className="hidden md:inline">Help</span>
        <span className="sr-only md:hidden">Help</span>
      </button>
      <div id="help-panel" popover="auto" role="dialog" aria-labelledby="help-title" className="w-[min(380px,calc(100vw-32px))] p-5 text-sm">
        <h2 id="help-title" className="text-base font-semibold">How this studio works</h2>
        <p className="mt-2 text-ink-soft">
          Press <strong>Run query</strong> and the query plays through the database on its own. Pause, resume or replay it from the
          progress strip, and select any part of the scene to explain it in the inspector.
        </p>
        <h3 className="mt-4 font-semibold">Kinds of lesson</h3>
        <p className="mt-1 text-ink-soft">
          <strong>Query flow</strong> is an animated, simplified model. The <strong>hands-on labs</strong>, <strong>Practice</strong>,{" "}
          <strong>Visualize</strong> and <strong>Challenges</strong> run real PostgreSQL 18 inside this tab (PGlite): nothing is sent anywhere.
          The <strong>HNSW vector search</strong> lesson is an interactive simulation of pgvector&apos;s index on a fixed demo dataset.
        </p>
        <h3 className="mt-4 font-semibold">Query flow&apos;s SQL</h3>
        <p className="mt-1 text-ink-soft">The animation follows a SELECT, INSERT, UPDATE or DELETE on the users table (use the buttons above the editor); anything else can run in the SQL Lab:</p>
        <code className="mt-2 block rounded-lg bg-subtle px-3 py-2 font-mono text-xs">{SUPPORTED_SQL}</code>
        <p className="mt-2 text-ink-soft">The users table holds ids {KNOWN_ID_RANGE}. Try an id outside that range to see an empty result, or INSERT an id that exists to see a duplicate-key error.</p>
        <h3 className="mt-4 font-semibold">About the model</h3>
        <p className="mt-1 text-ink-soft">
          It is a simplified model of PostgreSQL. Real databases add steps (locks, visibility checks, statistics, the OS cache) and
          the details differ by engine and configuration.
        </p>
      </div>
    </>
  );
}
