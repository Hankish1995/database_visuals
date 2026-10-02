import type { ExampleText } from "@/content/hi/types";

const ex = (title: string, summary: string, notice: string): ExampleText => ({ title, summary, notice });

export const exampleGroups: Record<string, string> = {
  querying: "क्वेरी करना",
  changing: "डेटा बदलना",
  structure: "टेबल और constraints",
  views: "Views",
  functions: "Functions",
  procedures: "Procedures",
  triggers: "Triggers",
  transactions: "ट्रांज़ैक्शन",
  indexes: "इंडेक्स और प्लान",
  features: "PostgreSQL की और सुविधाएँ",
};

export const examples: Record<string, ExampleText> = {
  "filter-sort": ex("फ़िल्टर और sort", "एक टेबल पर WHERE, ORDER BY और LIMIT।", "सिर्फ़ 100 से कम कीमत वाले products लौटते हैं, सबसे महँगे पहले, और ज़्यादा से ज़्यादा पाँच।"),
  joins: ex("Inner join", "orders, customers और order items को जोड़ें।", "हर order एक बार आता है, अपने customer के नाम और अपने line items के जोड़ के साथ।"),
  "left-join": ex("Left join: छूटी पंक्तियाँ ढूँढें", "वे customers जिन्होंने कभी order नहीं किया।", "LEFT JOIN हर customer को रखता है; जिनका कोई मेल खाता order नहीं उन्हें NULL मिलते हैं, जिन्हें WHERE क्लॉज़ रखता है।"),
  aggregate: ex("Group by और having", "हर category की कमाई, सिर्फ़ बड़ी वाली।", "WHERE समूह बनाने से पहले पंक्तियाँ छाँटता है; HAVING aggregation के बाद समूहों को छाँटता है।"),
  subquery: ex("Subquery और EXISTS", "किसी aggregate से तुलना; मौजूदगी की जाँच।", "दो नतीजे: एक मान की तरह इस्तेमाल हुई scalar subquery, फिर हर customer के लिए correlated EXISTS जाँच।"),
  cte: ex("Common table expressions (CTE)", "WITH से किसी बीच के नतीजे को नाम दें।", "CTE एक अस्थायी view की तरह पढ़ी जाती है जो सिर्फ़ इसी स्टेटमेंट के लिए होती है।"),
  "recursive-cte": ex("Recursive CTE", "किसी भी गहराई की management chain पर चलें।", "recursive हिस्सा पिछले स्तर से नई पंक्तियाँ जोड़ता रहता है, जब तक और न मिलें।"),
  window: ex("Window functions", "पंक्तियाँ मिलाए बिना रैंकिंग और running total।", "GROUP BY के उलट, window functions हर पंक्ति रखते हैं और उसके साथ एक गणना वाला कॉलम जोड़ते हैं।"),
  "set-ops": ex("UNION, INTERSECT, EXCEPT", "दो क्वेरी के नतीजों को मिलाएँ।", "UNION duplicate हटाता है (UNION ALL नहीं हटाता); INTERSECT साझा पंक्तियाँ रखता है; EXCEPT घटाता है।"),
  lateral: ex("LATERAL join", "हर order का सबसे ऊपर का item, हर पंक्ति के लिए गणना।", "LATERAL subquery अपने से पहले की पंक्तियों के कॉलम देख सकती है, जैसे हर पंक्ति के लिए function call।"),
  rollup: ex("ROLLUP और FILTER", "एक ही बार में subtotal और शर्त वाले aggregate।", "ROLLUP एक कुल-योग वाली पंक्ति जोड़ता है (category NULL, ALL के रूप में दिखती है); FILTER सिर्फ़ एक aggregate को सीमित करता है।"),

  "insert-returning": ex("INSERT … RETURNING", "पंक्तियाँ जोड़ें और बने हुए मान वापस पाएँ।", "RETURNING वह identity मान दिखाता है जो डेटाबेस ने बनाया। इसे दो बार चलाएँ: दूसरी बार ON CONFLICT duplicate को छोड़ देता है और कुछ नहीं लौटाता।"),
  upsert: ex("Upsert (ON CONFLICT DO UPDATE)", "जोड़ें, या उसकी जगह मौजूदा पंक्ति अपडेट करें।", "पहली बार Dev जुड़ता है; हर अगली बार primary key का टकराव होता है और balance में 25 जुड़ते हैं।"),
  "update-returning": ex("UPDATE … RETURNING", "पंक्तियाँ बदलें और नए मान देखें।", "हर किताब 5% महँगी होती है; RETURNING नई कीमतें दिखाता है।"),
  "delete-cascade": ex("ON DELETE CASCADE के साथ DELETE", "order हटाने पर उसके items भी हट जाते हैं।", "order_items ON DELETE CASCADE के साथ orders को refer करता है, इसलिए रद्द हुए order का line item भी उसके साथ गायब हो जाता है।"),
  merge: ex("MERGE", "एक बैच लागू करें: मेल वालों को अपडेट, बाकी को जोड़ें।", "merge_action() बताता है कि हर source पंक्ति के साथ क्या हुआ: lamp के लिए UPDATE, नए arm के लिए INSERT (और अगली बार UPDATE)।"),

  "create-table": ex("Constraints के साथ CREATE TABLE", "Keys, checks और defaults डेटा की रक्षा करते हैं।", "आख़िरी INSERT check-constraint उल्लंघन से विफल होता है: डेटाबेस 9 की rating ठुकरा देता है।"),
  "alter-generated": ex("ALTER TABLE और generated columns", "दूसरे कॉलमों से गणना वाला कॉलम जोड़ें।", "price_with_tax को डेटाबेस गणना करके रखता है; price बदलने पर यह अपने-आप अपडेट हो जाता है।"),
  "enum-domain": ex("Enums और domains", "अपने टाइप जो मानों को सीमित करते हैं।", "Enum मान घोषणा के क्रम में sort होते हैं (यहाँ urgent पहले)। Domain का CHECK गलत email को ठुकरा देता है।"),
  sequences: ex("Sequences", "टेबल के बाहर अनोखी संख्याएँ बनाएँ।", "हर nextval() कॉल एक नई संख्या देता है। Sequences कभी रोलबैक नहीं होते, इसलिए बीच में ख़ाली संख्याएँ सामान्य हैं।"),
  partitioning: ex("Declarative partitioning", "टेबल को दायरे से बाँटें; क्वेरी partitions छोड़ देती हैं।", "पंक्तियाँ मेल खाते partition में जाती हैं। प्लान सिर्फ़ readings_2025_q2 स्कैन करता है: partition pruning।"),

  view: ex("CREATE VIEW", "किसी क्वेरी को एक नाम से सहेजें।", "View क्वेरी रखता है, डेटा नहीं: हर SELECT उसे मौजूदा टेबलों पर दोबारा चलाता है।"),
  "updatable-view": ex("WITH CHECK OPTION वाला updatable view", "एक सरल view के ज़रिए सुरक्षित रूप से लिखें।", "सरल views अपडेट हो सकते हैं: पहला UPDATE products को बदलता है। दूसरा ठुकराया जाता है क्योंकि पंक्ति view से बाहर हो जाती।"),
  "materialized-view": ex("Materialized view और REFRESH", "क्वेरी का नतीजा सहेजें; ज़रूरत पर refresh करें।", "Materialized view REFRESH तक अपना सहेजा नतीजा रखता है; दोनों 'books' नतीजों की तुलना करें।"),

  "sql-function": ex("SQL function", "दोबारा इस्तेमाल होने वाली गणना, किसी भी क्वेरी में।", "STABLE प्लानर को बताता है कि एक स्टेटमेंट के अंदर नतीजा नहीं बदलेगा, इसलिए उसे optimize किया जा सकता है।"),
  "plpgsql-function": ex("PL/pgSQL function", "Variables, IF/ELSIF और एक नतीजा।", "PL/pgSQL variables और control flow जोड़ता है; SELECT … INTO क्वेरी का नतीजा एक variable में रखता है।"),
  "table-function": ex("Set-returning function", "ऐसा function जिससे SELECT FROM कर सकें।", "RETURNS TABLE function को पैरामीटर वाले view जैसा बनाता है। नाम वाले arguments => इस्तेमाल करते हैं।"),
  "do-loop": ex("Loop वाला DO block", "procedural कोड एक बार चलाएँ; RAISE NOTICE का आउटपुट।", "DO block एक बेनाम function है। उसके RAISE NOTICE संदेश स्टेटमेंट के नीचे दिखते हैं।"),
  exception: ex("PL/pgSQL में त्रुटि सँभालना", "त्रुटि पकड़ें और सँभलें।", "EXCEPTION block त्रुटि पकड़ लेता है, इसलिए क्वेरी सफल होती है और दूसरा मान NULL है।"),
  "expression-index": ex("इंडेक्स में function", "case की परवाह किए बिना खोज के लिए lower(email) पर इंडेक्स।", "प्लान customers_email_lower इस्तेमाल करता है क्योंकि क्वेरी वही expression इस्तेमाल करती है जो इंडेक्स में है।"),

  "procedure-transfer": ex("CREATE PROCEDURE और CALL", "अपनी जाँचों के साथ पैसे का ट्रांसफ़र।", "Procedures CALL से चलती हैं, SELECT से नहीं। अगर कोई balance ऋणात्मक होता, तो CHECK constraint पूरी कॉल रोक देता है।"),
  "procedure-inout": ex("INOUT पैरामीटर", "ऐसी procedure जो मान वापस देती है।", "CALL INOUT मानों वाली एक पंक्ति लौटाता है: कितने products फिर से भरे गए।"),
  "procedure-commit": ex("Procedure के अंदर ट्रांज़ैक्शन नियंत्रण", "बैच में commit करें, जो functions नहीं कर सकते।", "function के उलट, procedure COMMIT कर सकती है: हर बैच अपना अलग ट्रांज़ैक्शन बनता है।"),

  "before-trigger": ex("BEFORE trigger: डेटा साफ़ करें", "सहेजने से पहले email को एक जैसा करें।", "पंक्ति hana.sato@example.com के रूप में सहेजी जाती है: BEFORE trigger लिखे जाने से पहले NEW को बदल सकता है।"),
  "updated-at": ex("updated_at को अद्यतन रखें", "क्लासिक timestamp trigger।", "कोई UPDATE updated_at का ज़िक्र नहीं करता, फिर भी वह भरा जाता है: trigger हर बदलाव पर उसे सेट करता है।"),
  "audit-trigger": ex("AFTER trigger: audit log", "हर insert, update और delete दर्ज करें।", "TG_OP, OLD और NEW बदलाव बताते हैं; trigger उन्हें अपने-आप audit_log में कॉपी करता है।"),
  "validation-trigger": ex("गलत लिखाई ठुकराएँ", "स्टॉक से बाहर product का order रोकें।", "RAISE EXCEPTION INSERT को रद्द करता है; HINT त्रुटि के साथ दिखता है।"),
  "instead-of": ex("View पर INSTEAD OF trigger", "Join view को लिखने लायक बनाएँ।", "Join view अपने-आप अपडेट नहीं हो सकता; INSTEAD OF trigger बताता है कि उस पर UPDATE का क्या मतलब है।"),
  "statement-trigger": ex("Transition table वाला statement-level trigger", "हर स्टेटमेंट पर एक कॉल, सभी बदली पंक्तियों के साथ।", "पूरे UPDATE के लिए एक notice, transition table से हर बदली पंक्ति गिनते हुए।"),
  "event-trigger": ex("DDL पर event trigger", "डेटा नहीं, schema के बदलावों पर प्रतिक्रिया।", "CREATE TABLE और DROP TABLE के लिए notices दिखते हैं: event triggers DDL कमांड पर चलते हैं।"),

  commit: ex("BEGIN … COMMIT", "दो बदलाव जो साथ सफल या विफल होते हैं।", "दोनों अपडेट COMMIT पर एक साथ दिखते हैं; कोई 'रास्ते में' पैसा नहीं देख सकता था।"),
  rollback: ex("ROLLBACK", "BEGIN के बाद का सब कुछ वापस लें।", "ट्रांज़ैक्शन के अंदर टेबल खाली दिखती है; ROLLBACK के बाद हर पंक्ति वापस आ जाती है।"),
  savepoint: ex("SAVEPOINT", "ट्रांज़ैक्शन का कुछ हिस्सा वापस लें।", "विफल स्टेटमेंट savepoint तक वापस लिया जाता है; उससे पहले का +1 फिर भी commit होता है।"),
  aborted: ex("त्रुटि ट्रांज़ैक्शन को रद्द करती है", "विफलता के बाद ROLLBACK क्यों ज़रूरी है।", "त्रुटि के बाद PostgreSQL ROLLBACK (या किसी savepoint तक ROLLBACK TO) तक हर कमांड अनदेखा करता है।"),
  isolation: ex("Isolation level और snapshot", "वह snapshot देखें जिससे ट्रांज़ैक्शन पढ़ता है।", "REPEATABLE READ पूरे ट्रांज़ैक्शन के लिए एक snapshot लेता है; MVCC पाठ दिखाता है कि पंक्तियाँ उससे कैसे जाँची जाती हैं।"),

  "explain-index": ex("Seq scan बनाम index scan", "इंडेक्स से पहले और बाद में EXPLAIN ANALYZE।", "प्लानों की तुलना करें: सभी 50,000 पंक्तियाँ पढ़ता Seq Scan, फिर लगभग 100 छूता Bitmap या Index Scan।"),
  "partial-index": ex("Partial index", "सिर्फ़ उन पंक्तियों का इंडेक्स जिन्हें आप खोजते हैं।", "इंडेक्स सिर्फ़ refunds को ढकता है (पंक्तियों का चौथाई), इसलिए छोटा है, और प्लान उसे इस्तेमाल कर सकता है।"),
  "covering-index": ex("Covering index (Index Only Scan)", "INCLUDE कॉलम ताकि टेबल न पढ़नी पड़े।", "Heap Fetches: 0 वाला Index Only Scan देखें -- हर ज़रूरी मान इंडेक्स से आया।"),
  "gin-jsonb": ex("JSONB पर GIN इंडेक्स", "documents पर containment क्वेरी का इंडेक्स।", "GIN इंडेक्स JSON के अंदर हर key/value को पंक्तियों से जोड़ता है, इसलिए @> containment उसे इस्तेमाल कर सकता है।"),

  jsonb: ex("JSONB", "JSON documents से क्वेरी करें और उन्हें बनाएँ।", "->> टेक्स्ट निकालता है, ? key की मौजूदगी जाँचता है, और jsonb_agg पंक्तियों से arrays बनाता है।"),
  arrays: ex("Arrays", "Overlap, contains और unnest।", "&& का मतलब 'कोई भी तत्व साझा' है; unnest array को पंक्तियों में बदलता है जिन्हें group कर सकें।"),
  "full-text": ex("Full-text search", "शब्दों का मिलान, टुकड़ों का नहीं।", "शब्दों को मूल रूप (stem) में बदलकर lexemes के रूप में मिलाया जाता है; ts_rank प्रासंगिकता से क्रम देता है।"),
  series: ex("generate_series कैलेंडर", "ख़ाली जगह भरें: हर दिन के orders, शून्य वाले दिन भी।", "बिना orders वाले दिन भी 0 के साथ दिखते हैं, क्योंकि join कैलेंडर से चलता है।"),
  "listen-notify": ex("LISTEN और NOTIFY", "sessions के बीच संदेश भेजें।", "इस session को मिली notifications उन्हें भेजने वाले स्टेटमेंट्स के नीचे दिखती हैं।"),
  rls: ex("Row-level security", "हर उपयोगकर्ता सिर्फ़ अपनी पंक्तियाँ देखता है।", "shop_customer के रूप में policy टेबल को customer 2 तक सीमित करती है। मालिक (यहाँ superuser) इसे लाँघ जाता है।"),
  cursor: ex("Cursors", "बड़ा नतीजा कुछ-कुछ पंक्तियों में लाएँ।", "हर FETCH वहीं से आगे बढ़ता है जहाँ पिछला रुका था; क्वेरी एक बार चलती है।"),
  prepared: ex("Prepared statements", "एक बार parse और plan, कई बार execute।", "$1 एक पैरामीटर है; वही prepared statement अलग-अलग मानों के साथ चलता है।"),
  "system-columns": ex("छुपे system columns", "हर पंक्ति पर ctid, xmin और xmax।", "ctid पंक्ति का भौतिक स्थान है (पेज, स्लॉट); xmin/xmax वे ट्रांज़ैक्शन हैं जिन्होंने उसे बनाया और हटाया।"),
  catalog: ex("Catalog से पूछें", "डेटाबेस ख़ुद अपना वर्णन करता है।", "information_schema SQL-मानक view है; pg_class और उसके साथी PostgreSQL के अपने catalogs हैं।"),
};
