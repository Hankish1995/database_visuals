import type { Queryable } from "@/lib/db/runScript";

// What's in the database right now, read from the system catalogs.
/** `info` is a raw value the browser phrases per group (row estimate, return type, parent table…). */
export interface CatalogEntry { name: string; info: string | null; definition?: string }
export interface Catalog {
  tables: CatalogEntry[];
  views: CatalogEntry[];
  materializedViews: CatalogEntry[];
  functions: CatalogEntry[];
  procedures: CatalogEntry[];
  triggers: CatalogEntry[];
  indexes: CatalogEntry[];
  sequences: CatalogEntry[];
}

const USER_SCHEMAS = "n.nspname NOT IN ('pg_catalog', 'information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'";

const QUERIES: Record<keyof Catalog, string> = {
  tables: `SELECT c.relname AS name, CASE c.relkind WHEN 'p' THEN NULL ELSE c.reltuples::bigint::text END AS info
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition AND ${USER_SCHEMAS} ORDER BY 1`,
  views: `SELECT c.relname AS name, NULL AS info, pg_get_viewdef(c.oid, true) AS definition
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'v' AND ${USER_SCHEMAS} ORDER BY 1`,
  materializedViews: `SELECT c.relname AS name, c.relispopulated::text AS info, pg_get_viewdef(c.oid, true) AS definition
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'm' AND ${USER_SCHEMAS} ORDER BY 1`,
  functions: `SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS name, pg_get_function_result(p.oid) || ' · ' || l.lanname AS info, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang
    WHERE p.prokind = 'f' AND ${USER_SCHEMAS} AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e') ORDER BY 1`,
  procedures: `SELECT p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS name, l.lanname AS info, pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang WHERE p.prokind = 'p' AND ${USER_SCHEMAS} ORDER BY 1`,
  triggers: `SELECT t.tgname AS name, c.relname AS info, pg_get_triggerdef(t.oid, true) AS definition
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE NOT t.tgisinternal AND ${USER_SCHEMAS} ORDER BY 1`,
  indexes: `SELECT i.relname AS name, c.relname AS info, pg_get_indexdef(i.oid) AS definition
    FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid JOIN pg_class c ON c.oid = x.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE ${USER_SCHEMAS} ORDER BY 1`,
  sequences: `SELECT c.relname AS name, NULL AS info FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'S' AND ${USER_SCHEMAS} ORDER BY 1`,
};

export async function loadCatalog(db: Queryable): Promise<Catalog> {
  const entries = await Promise.all(Object.entries(QUERIES).map(async ([key, sql]) => [key, (await db.query<CatalogEntry>(sql)).rows] as const));
  return Object.fromEntries(entries) as unknown as Catalog;
}
