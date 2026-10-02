import { CircleAlert, Database, Loader2 } from "lucide-react";
import type { DbStatus as Status } from "@/hooks/useDatabase";
import { useMessages } from "@/i18n";

/** Where the in-browser PostgreSQL is: starting, ready, or failed. */
export function DbStatus({ status, error }: { status: Status; error: string | null }) {
  const m = useMessages().practice;
  if (status === "loading") return <p role="status" className="inline-flex items-center gap-1.5 text-xs text-muted"><Loader2 className="size-3.5 animate-spin" aria-hidden /> {m.starting}</p>;
  if (status === "error") return <p role="alert" className="inline-flex items-center gap-1.5 text-xs text-miss"><CircleAlert className="size-3.5" aria-hidden /> {error}</p>;
  return <p role="status" className="inline-flex items-center gap-1.5 text-xs text-ok"><Database className="size-3.5" aria-hidden /> {m.ready}</p>;
}
