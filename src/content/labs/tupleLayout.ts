import type { LabLesson } from "./types";

const INSPECT = `SELECT lower, upper, special, pagesize FROM page_header(get_raw_page('pets', 0));
SELECT lp, lp_off, lp_len, lp_flags, t_xmin, t_xmax, t_ctid, t_hoff
FROM heap_page_items(get_raw_page('pets', 0));`;

export const TUPLE_LAYOUT_LAB: LabLesson = {
  id: "tuples",
  intro: "A table is a file of 8 KB pages. Each page has a small header, an array of line pointers growing from the front, and tuples (row versions) packed in from the back. The free space is the gap in the middle. These steps read real page bytes with the pageinspect extension.",
  extensions: ["pageinspect"],
  setup: `CREATE EXTENSION pageinspect;
CREATE TABLE pets (id integer, name text, species text);`,
  steps: [
    {
      id: "insert", title: "Insert three rows", view: "tables",
      body: "Every row gets a physical address, its ctid: (page number, line pointer number).",
      observe: "The rows are at (0,1), (0,2) and (0,3): page 0, slots 1 to 3.",
      sql: `INSERT INTO pets VALUES (1, 'Rex', 'dog'), (2, 'Tom', 'cat'), (3, 'Nemo', 'fish');
SELECT ctid, * FROM pets;`,
    },
    {
      id: "page", title: "Look inside page 0", view: "page",
      body: "page_header shows where free space starts (lower, the end of the line pointer array) and ends (upper, the start of the tuples). heap_page_items lists each line pointer: the offset and length of its tuple.",
      observe: "Line pointers sit right after the 24-byte header; tuples are packed at the end of the page, the first one closest to byte 8192.",
      sql: INSPECT,
    },
    {
      id: "long", title: "Add a longer row", view: "page",
      body: "A bigger tuple takes more bytes from the back of the page, and one more 4-byte line pointer from the front.",
      observe: "upper drops by the new tuple's length (rounded up for alignment) and lower grows by 4: the free gap shrinks from both ends.",
      sql: `INSERT INTO pets VALUES (4, 'Bartholomew the Magnificent', repeat('long-haired ', 20));
${INSPECT}`,
    },
    {
      id: "update", title: "UPDATE writes a new tuple", view: "page",
      body: "PostgreSQL never overwrites a row in place. The update writes a new tuple and stamps the old one with the updating transaction in t_xmax, pointing its t_ctid at the new version.",
      observe: "Five tuples for four rows: slot 1's t_xmax is now set and its t_ctid points to the new slot 5.",
      sql: `UPDATE pets SET name = 'Rex II' WHERE id = 1;
${INSPECT}`,
    },
    {
      id: "vacuum", title: "VACUUM reclaims the old version", view: "page",
      body: "Once no transaction can still see the old version, VACUUM removes it. Because this was a HOT update (no indexed column changed), slot 1 becomes a redirect to slot 5, so the row's address stays valid.",
      observe: "Slot 1 now has no tuple (flag 2, redirect), and its bytes are free again.",
      sql: `VACUUM pets;
${INSPECT}`,
    },
  ],
};
