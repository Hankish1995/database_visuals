import { CircleAlert, Database, Loader2 } from "lucide-react";
import type { DbStatus as Status } from "@/hooks/useDatabase";

/** Where the in-browser PostgreSQL is: starting, ready, or failed. */
export function DbStatus({ status, error }: { status: Status; error: string | null }) {
  if (status === "loading") return <p role="status" className="inline-flex items-center gap-1.5 text-xs text-muted"><Loader2 className="size-3.5 animate-spin" aria-hidden /> Starting PostgreSQL in your browser…</p>;
  if (status === "error") return <p role="alert" className="inline-flex items-center gap-1.5 text-xs text-miss"><CircleAlert className="size-3.5" aria-hidden /> {error}</p>;
  return <p role="status" className="inline-flex items-center gap-1.5 text-xs text-ok"><Database className="size-3.5" aria-hidden /> PostgreSQL 18 ready · in-browser, nothing leaves this tab</p>;
}
