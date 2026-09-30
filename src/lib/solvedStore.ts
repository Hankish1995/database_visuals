// Which challenges this browser has solved. Kept in localStorage as a
// convenience only: if storage is unavailable, progress just isn't remembered.
const KEY = "inside-the-database:solved";
const listeners = new Set<() => void>();
let cache: string | null = null;

function read(): string {
  if (cache === null) {
    try { cache = window.localStorage.getItem(KEY) ?? ""; } catch { cache = ""; }
  }
  return cache;
}

export const solvedStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: read,
  getServerSnapshot: () => "",
  markSolved(id: string) {
    const ids = new Set(read().split(",").filter(Boolean));
    if (ids.has(id)) return;
    ids.add(id);
    cache = [...ids].join(",");
    try { window.localStorage.setItem(KEY, cache); } catch { /* progress stays in memory */ }
    listeners.forEach((l) => l());
  },
};
