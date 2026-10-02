# Inside the Database

An interactive learning studio that shows how a relational database answers a query: the client sends SQL, the parser builds a tree, the planner picks a plan, the executor walks a B-tree index, the buffer pool is checked, and a cache miss reads the page from disk.

It has two halves:

- **Query flow** (Learn, lesson 1.1) is a deterministic, animated, simplified model of that journey for a SELECT, INSERT, UPDATE or DELETE on a `users` table: index lookups, the buffer pool, disk reads, new row versions (MVCC), dirty pages, WAL records and the commit flush, including a duplicate-key failure.
- Everything else runs **real PostgreSQL 18 inside the browser tab** via [PGlite](https://pglite.dev) (Postgres compiled to WebAssembly). Nothing is sent to a server.

| Page | What it does |
| --- | --- |
| Learn | Query flow animation, plus six hands-on labs: Composite indexes, Tuple layout (`pageinspect`), ACID, MVCC (row versions + snapshot explorer), Write-ahead logging (`pg_walinspect`) and Crash recovery (a real crash and WAL replay) |
| Practice | SQL Lab: an editor over a sample shop database, 50+ runnable examples (joins, CTEs, window functions, MERGE, views, materialized views, functions, procedures with COMMIT, all trigger kinds, event triggers, transactions and savepoints, indexes, partitioning, JSONB, full-text search, LISTEN/NOTIFY, row-level security, cursors, prepared statements) and a live schema browser |
| Visualize | Runs `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` and draws the real plan tree, with per-node timing and explanations |
| Challenges | 12 exercises, checked by running your SQL and a reference solution on two fresh databases |

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run typecheck
npm test         # runs every example, lab step and challenge against real PostgreSQL (Node)
npm run build
```

## Using it

- **Run query** plays the whole sequence automatically. Pause/Resume and Replay are in the progress strip; the numbered steps jump to a step and pause there.
- **users_pkey index** switches between an index lookup and a sequential scan.
- **Cold: miss / Warm: hit** replays with the page missing from, or already in, the buffer pool.
- Select any part of the scene (or its caption) to explain it in the inspector: *Overview*, *This run* and *Steps* (the whole run as text).
- **3D / 2D** switches views. Small screens default to 2D; without WebGL the 2D diagram is used automatically.
- Settings: playback speed and reduced motion (the OS `prefers-reduced-motion` setting is also respected).

### HNSW vector search (lesson 2.4)

An interactive simulation of a pgvector HNSW index -- PostgreSQL has no vector index of its own; the pgvector extension adds the `vector` type and the `hnsw` index, and `SET hnsw.ef_search = N` (default 40) controls the search at run time. No database or network is involved.

- Pick **Query A/B/C**, set **ef_search** (5-32) and press **Run search**: the traversal animates from the top layer's entry point, layer by layer, then across layer 0. Pause/Resume and Replay sit next to it; changing a setting while a search is shown replays it.
- **Compare with exact** overlays the true 5 nearest (purple diamonds; red dashed when the search missed one) and lists both answers.
- The metrics -- vectors compared, recall@5 against the exact answer, work relative to a full scan -- are illustrative counts from a 48-vector demo, not benchmarks.
- What the fixed dataset shows: Query A finds 1 of 5 at ef_search 5 and all 5 at 6; Query C needs 8; Query B misses one until 32.

### Theme and language

The header has two switches: **Light / Dark** and **English / हिन्दी**. On a first visit the theme follows the OS setting; an explicit choice is saved in `localStorage` (`itd.theme`, `itd.locale`) and applied by a small inline script before the first paint, so there's no flash of the wrong theme or language. Switching never resets the lesson, query, playback position, lab progress or HNSW settings: the same run is simply re-worded.

In Hindi, all interface text, lesson content (definitions, lab steps, examples, challenges), the Query flow and HNSW narration, validation errors, visualization labels and aria labels are translated. SQL, code, identifiers, setting names (`ef_search`) and product names stay in English; common technical terms are kept in English and explained in Hindi where they first appear.

### Supported SQL

```
SELECT * | col[, col...] FROM users WHERE id = <integer>
INSERT INTO users (name, email[, id, created_at]) VALUES (...)
UPDATE users SET name | email | created_at = '...'[, ...] WHERE id = <integer>
DELETE FROM users WHERE id = <integer>
```

Columns: `id, name, email, created_at`. The `users` table holds ids 1-56 (14 rows per 8 KB page, pages 15-18); other ids return an empty result. Anything else gets an inline explanation.

## Structure

| Path | Responsibility |
| --- | --- |
| `src/lib/db/` | PGlite engine loading, seeded snapshots, the statement splitter/runner, catalog queries, the crash helper and the challenge checker. |
| `src/content/examples/`, `src/content/labs/`, `src/content/challenges.ts` | The SQL Lab examples, lab lessons and challenges (all covered by `npm test`). |
| `src/lib/plan/` + `src/components/plan/` | EXPLAIN JSON parsing and the plan tree. |
| `src/lib/hnsw/` | The HNSW lesson's model: the fixed 2D dataset and graph (built by HNSW insertion), the traced layer search, exact search, recall and the per-step animation frame. No rendering code. |
| `src/components/vector/`, `src/hooks/useHnswDemo.ts`, `src/content/vectorConcepts.ts` | The HNSW lesson's SVG stage, inspector, state and glossary. |
| `src/lib/sim/` | The Query flow simulation: mock data, the SQL subset parser, the step builder and the derived scene state. No rendering code. |
| `src/content/` | Concept definitions, lessons and the inspector's per-run facts. |
| `src/hooks/usePlayback.ts` | Automatic timing, pause/resume, replay and seek. |
| `src/hooks/useWorkspace.ts` | Workspace state: lesson, query, options, selection, settings. |
| `src/components/scene/` | React Three Fiber scene (client-only, loaded with `ssr: false`). Labels are DOM elements in an overlay, positioned each frame by a projector without React re-renders. |
| `src/components/diagram/` | 2D diagram: fallback and small-screen view. |
| `src/components/{stage,inspector,playback,editor,lessons,topbar}/` | The workspace panels. |
| `src/lib/prefs.ts`, `src/lib/prefsScript.ts`, `src/components/prefs/` | Theme and language: the preference store (`<html data-theme lang>` is the source of truth), the no-flash head script and the header switches. Theme colours are CSS variables in `globals.css`, redefined under `[data-theme="dark"]`; the 3D scene reads its palette from `usePalette()`. |
| `src/i18n/` | Interface text: `messages/en.ts` defines every key (and the type), `messages/hi.ts` must match it; components call `useMessages()`. |
| `src/content/hi/`, `src/content/localized.ts` | Hindi lesson content as text-only overlays keyed by the English ids (SQL and checks are never duplicated); `useContent()` returns the content in the current language. |
| `src/lib/sim/text/`, `src/lib/hnsw/text.ts`, `src/content/runFactsText.ts` | Narration packs (English and Hindi) for the Query flow steps, parser errors, the HNSW search and the inspector's per-run facts. |

## Limitations

- Parsing, Planning, Execution, B-tree lookups, Index vs. table scan and Pages are focused views of the Query flow scene, not separate lessons.
- The in-browser database is a single session, so concurrency (two transactions at once) is explained with the MVCC snapshot explorer rather than shown live. It also can't crash mid-transaction; the Crash recovery lab crashes between transactions.
- PostgreSQL is the only engine; the selector lists others as not available.
- The Query flow animation leaves out locks, the OS page cache, statistics, index pages living in the buffer pool, and eviction.
- The HNSW lesson is a simplified model: 2-dimensional vectors (real embeddings have hundreds of dimensions), 48 of them, small m and ef_construction, and a fixed demo range for ef_search. It follows the HNSW algorithm, but it is not pgvector's code, and its counts say nothing about real latency.
- PostgreSQL's own messages (errors, notices, EXPLAIN node names, catalog definitions) and the SQL in examples stay in English in both languages; Hindi wraps them with an explanation where they appear.
- The server renders English and light first; a returning Hindi visitor's page stays hidden for the moment it takes to render in Hindi (at most 1.5 s).
- The database lives in memory: changes last until you reset or reload the page. The first page load downloads PGlite (a few MB).
