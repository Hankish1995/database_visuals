import type { Locale } from "@/lib/prefs";

// The inspector's "This run" phrases, per language. runFacts.ts decides WHAT
// to say; this decides how it reads.
type Status = { title: string; body: string };
const listPages = (pages: number[]) => pages.join(", ");

const en = {
  none: "none",
  notRun: { title: "Not run yet", body: "Press Run query to watch this part of the query flow." },
  walRead: { title: "Not used by a read", body: "A SELECT changes nothing, so it writes nothing to the WAL." },
  walAborted: { title: "Aborted", body: "The transaction failed; its abort record needs no flush and its changes stay invisible." },
  walFlushed: { title: "Flushed: the change is durable", body: "COMMIT waited for these records to reach disk." },
  walPending: (n: number): Status => ({ title: `${n} record(s) waiting in memory`, body: "They reach disk at COMMIT." }),
  indexOff: (index: string): Status => ({ title: "Not used in this plan", body: `${index} is disabled, so the planner chose a sequential scan.` }),
  noPageYet: { title: "No page checked yet", body: "The buffer pool hasn't been asked for a users page yet." },
  noDiskRead: { title: "No disk read needed", body: "Every page this query needed was already in memory." },
  activeNow: "Active now",
  finished: (steps: number): Status => ({ title: "Done", body: `Finished its part of this ${steps}-step run.` }),
  notReached: { title: "Not reached yet", body: "This component comes later in the run." },
  cacheHit: (checked: number[]): Status => ({
    title: "Cache hit: page found in memory",
    body: `${checked.length === 1 ? `Page ${checked[0]} was` : "All pages were"} already in the buffer pool, so no disk read was needed.`,
  }),
  cacheMiss: (missing: number[], checked: number, partial: boolean): Status => ({
    title: partial ? `Cache miss on ${missing.length} of ${checked} pages` : "Cache miss: page read from disk",
    body: `${missing.length === 1 ? `Page ${missing[0]} was` : `Pages ${listPages(missing)} were`} not in the buffer pool, so the database read ${missing.length === 1 ? "it" : "them"} from disk into memory.`,
  }),
  rows: {
    statement: "Statement", serverReplied: "Server replied", waiting: "waiting", table: "Table", columns: "Columns",
    allColumns: "* (all)", valuesFor: "Values for", filter: "Filter", plan: "Plan", indexPagesToRead: "Index pages to read",
    tablePagesToRead: "Table pages to read", topNode: "Top plan node", rowsExamined: "Rows examined", rowsReturned: "Rows returned",
    rowsChanged: "Rows changed", zeroFailed: "0 (failed)", index: "Index", levels: "Levels", levelsValue: "3 (root, inner, leaf)",
    key: "Key", entry: "Entry", keyNotFound: "key not found", notUsed: "not used", indexPagesVisited: "Index pages visited",
    slots: "Slots", slotsValue: (used: number, total: number) => `${used} of ${total} in use`, usersPagesInMemory: "users pages in memory",
    pagesNeeded: "Pages this statement needs", dirty: "Dirty (changed, not yet written)", transaction: "Transaction",
    noneNeeded: "none needed", recordsSoFar: "Records so far", flushedToDisk: "Flushed to disk", yes: "yes", notYet: "not yet",
    nothingToFlush: "nothing to flush", pageSize: "Page size", usersTablePages: "users table pages", readFromDisk: "Read from disk this run",
    commandTag: "Command tag", newVersionAt: "New version at", pageSlot: (page: number, slot: number) => `page ${page}, slot ${slot}`,
    pageOnly: (page: number) => `page ${page}`, location: "Location", columnsReturned: "Columns returned", matchingRows: "Matching rows",
    mode: "Mode for this run", warmCache: "Warm cache (hit)", coldCache: "Cold cache (miss)", pagesFromMemory: "Pages from memory",
    pagesFromDisk: "Pages from disk",
  },
};

export type RunText = typeof en;

const hi: RunText = {
  none: "कोई नहीं",
  notRun: { title: "अभी चलाया नहीं गया", body: "Query flow का यह हिस्सा देखने के लिए \"क्वेरी चलाएँ\" दबाएँ।" },
  walRead: { title: "पढ़ने में इस्तेमाल नहीं होता", body: "SELECT कुछ नहीं बदलता, इसलिए वह WAL में कुछ नहीं लिखता।" },
  walAborted: { title: "रद्द (Aborted)", body: "ट्रांज़ैक्शन विफल हुआ; उसके abort रिकॉर्ड को डिस्क पर लिखने की ज़रूरत नहीं, और उसके बदलाव किसी को नहीं दिखते।" },
  walFlushed: { title: "डिस्क पर लिखा गया: बदलाव अब टिकाऊ है", body: "COMMIT ने इन रिकॉर्ड के डिस्क तक पहुँचने का इंतज़ार किया।" },
  walPending: (n: number) => ({ title: `${n} रिकॉर्ड मेमोरी में इंतज़ार कर रहे हैं`, body: "ये COMMIT के समय डिस्क पर पहुँचते हैं।" }),
  indexOff: (index: string) => ({ title: "इस प्लान में इस्तेमाल नहीं हुआ", body: `${index} बंद है, इसलिए प्लानर ने sequential scan (पूरी टेबल पढ़ना) चुना।` }),
  noPageYet: { title: "अभी कोई पेज नहीं जाँचा गया", body: "बफ़र पूल से अभी तक users का कोई पेज नहीं माँगा गया।" },
  noDiskRead: { title: "डिस्क से पढ़ने की ज़रूरत नहीं", body: "इस क्वेरी को जो भी पेज चाहिए थे, वे पहले से मेमोरी में थे।" },
  activeNow: "अभी सक्रिय",
  finished: (steps: number) => ({ title: "पूरा", body: `${steps} चरणों वाले इस रन में अपना काम पूरा कर चुका है।` }),
  notReached: { title: "अभी पहुँचे नहीं", body: "यह हिस्सा रन में आगे आता है।" },
  cacheHit: (checked: number[]) => ({
    title: "कैश hit: पेज मेमोरी में मिल गया",
    body: `${checked.length === 1 ? `पेज ${checked[0]}` : "सभी पेज"} पहले से बफ़र पूल में ${checked.length === 1 ? "था" : "थे"}, इसलिए डिस्क से पढ़ने की ज़रूरत नहीं पड़ी।`,
  }),
  cacheMiss: (missing: number[], checked: number, partial: boolean) => ({
    title: partial ? `${checked} में से ${missing.length} पेज पर कैश miss` : "कैश miss: पेज डिस्क से पढ़ा गया",
    body: `${missing.length === 1 ? `पेज ${missing[0]}` : `पेज ${listPages(missing)}`} बफ़र पूल में नहीं ${missing.length === 1 ? "था" : "थे"}, इसलिए डेटाबेस ने ${missing.length === 1 ? "उसे" : "उन्हें"} डिस्क से मेमोरी में पढ़ा।`,
  }),
  rows: {
    statement: "स्टेटमेंट", serverReplied: "सर्वर का जवाब", waiting: "इंतज़ार", table: "टेबल", columns: "कॉलम",
    allColumns: "* (सभी)", valuesFor: "मान (values)", filter: "फ़िल्टर", plan: "प्लान", indexPagesToRead: "पढ़ने वाले इंडेक्स पेज",
    tablePagesToRead: "पढ़ने वाले टेबल पेज", topNode: "सबसे ऊपर का प्लान नोड", rowsExamined: "जाँची गई पंक्तियाँ", rowsReturned: "लौटाई गई पंक्तियाँ",
    rowsChanged: "बदली गई पंक्तियाँ", zeroFailed: "0 (विफल)", index: "इंडेक्स", levels: "स्तर", levelsValue: "3 (root, inner, leaf)",
    key: "कुंजी (key)", entry: "एंट्री", keyNotFound: "कुंजी नहीं मिली", notUsed: "इस्तेमाल नहीं हुआ", indexPagesVisited: "देखे गए इंडेक्स पेज",
    slots: "स्लॉट", slotsValue: (used: number, total: number) => `${total} में से ${used} इस्तेमाल में`, usersPagesInMemory: "मेमोरी में users के पेज",
    pagesNeeded: "इस स्टेटमेंट को चाहिए पेज", dirty: "Dirty (बदले गए, अभी लिखे नहीं गए)", transaction: "ट्रांज़ैक्शन",
    noneNeeded: "ज़रूरत नहीं", recordsSoFar: "अब तक के रिकॉर्ड", flushedToDisk: "डिस्क पर लिखा गया", yes: "हाँ", notYet: "अभी नहीं",
    nothingToFlush: "लिखने को कुछ नहीं", pageSize: "पेज का आकार", usersTablePages: "users टेबल के पेज", readFromDisk: "इस रन में डिस्क से पढ़े गए",
    commandTag: "कमांड टैग", newVersionAt: "नया वर्ज़न यहाँ", pageSlot: (page: number, slot: number) => `पेज ${page}, स्लॉट ${slot}`,
    pageOnly: (page: number) => `पेज ${page}`, location: "स्थान", columnsReturned: "लौटाए गए कॉलम", matchingRows: "मेल खाती पंक्तियाँ",
    mode: "इस रन का मोड", warmCache: "गर्म कैश (hit)", coldCache: "ठंडा कैश (miss)", pagesFromMemory: "मेमोरी से पेज",
    pagesFromDisk: "डिस्क से पेज",
  },
};

export const RUN_TEXT: Record<Locale, RunText> = { en, hi };
