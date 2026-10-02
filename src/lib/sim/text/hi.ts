import { INDEX, TABLE } from "@/lib/sim/data";
import { SUPPORTED_SQL } from "@/lib/sim/supported";
import type { SimText, StepText } from "@/lib/sim/text/en";
import { USER_COLUMNS, type ParsedQuery, type StatementKind } from "@/lib/sim/types";

// Query flow की हिन्दी व्याख्या। SQL, कमांड टैग, WAL रिकॉर्ड के नाम और
// PostgreSQL के शब्द (xmin, xmax, VACUUM, HOT) जैसे हैं वैसे ही रहते हैं।

const pageList = (pages: number[]) => pages.length === 1 ? `पेज ${pages[0]}` : `पेज ${pages.slice(0, -1).join(", ")} और ${pages.at(-1)}`;
const cols = (q: ParsedQuery) => (q.selectAll ? "सभी कॉलम" : q.columns.join(", "));
const lookup = (useIndex: boolean, id: number | null) => useIndex
  ? `primary key पर एक id खोजने के लिए ${INDEX} से index scan करना पूरी टेबल पढ़ने से कहीं सस्ता है।`
  : `इस रन में ${INDEX} खोज के लिए बंद है, इसलिए id = ${id} ढूँढने के लिए ${TABLE} का हर पेज पढ़ना पड़ेगा।`;

function tree(q: ParsedQuery): string {
  const set = Object.entries(q.values).map(([k, v]) => `${k} = ${typeof v === "string" ? `'${v}'` : v}`).join(", ");
  switch (q.kind) {
    case "select": return `SELECT ${cols(q)} FROM ${TABLE} WHERE id = ${q.id}`;
    case "insert": return `INSERT INTO ${TABLE} (${Object.keys(q.values).join(", ")}), मानों (values) की एक पंक्ति के साथ`;
    case "update": return `UPDATE ${TABLE} SET ${set} WHERE id = ${q.id}`;
    case "delete": return `DELETE FROM ${TABLE} WHERE id = ${q.id}`;
  }
}

export const simHi: SimText = {
  pageList,
  errors: {
    empty: "चलाने के लिए कोई स्टेटमेंट लिखें, जैसे: SELECT * FROM users WHERE id = 42;",
    oneAtATime: "एक बार में एक ही स्टेटमेंट चलाएँ।",
    returning: "RETURNING इस एनिमेशन का हिस्सा नहीं है।",
    notAnimated: (verb) => `${verb} का एनिमेशन यहाँ नहीं है। समर्थित: ${SUPPORTED_SQL}.`,
    noTable: (table) => `इस मॉडल में "${table}" नाम की कोई टेबल नहीं है। सिर्फ़ "users" मौजूद है।`,
    whereOnlyId: "सिर्फ़ WHERE id = <number> वाला फ़िल्टर एनिमेट होता है।",
    whereMissing: (verb) => `एक फ़िल्टर जोड़ें: WHERE id = <number>। इसके बिना ${verb} हर पंक्ति को छुएगा।`,
    idWhole: "id एक पूर्ण संख्या होनी चाहिए।",
    selectUnreadable: `यह क्वेरी समझ नहीं आई। समर्थित: ${SUPPORTED_SQL}.`,
    unknownColumn: (name) => `users में "${name || "(खाली)"}" नाम का कोई कॉलम नहीं है। कॉलम: ${USER_COLUMNS.join(", ")}.`,
    insertUnreadable: "यह INSERT समझ नहीं आया। आज़माएँ: INSERT INTO users (name, email) VALUES ('Dana', 'dana@example.com');",
    listColumns: "कॉलम के नाम लिखें: INSERT INTO users (name, email) VALUES (…).",
    countMismatch: (c, v) => `${c} कॉलम हैं लेकिन ${v} मान (values)।`,
    notNull: "name और email NOT NULL हैं (खाली नहीं रह सकते): दोनों दें।",
    updateUnreadable: "यह UPDATE समझ नहीं आया। आज़माएँ: UPDATE users SET email = 'bob@new.example' WHERE id = 42;",
    setUnreadable: (part) => `"${part}" समझ नहीं आया। column = 'value' लिखें।`,
    pkUpdate: "primary key बदलने का एनिमेशन नहीं है; name, email या created_at अपडेट करें।",
    pkChange: "primary key बदलने का एनिमेशन नहीं है।",
    deleteUnreadable: "यह DELETE समझ नहीं आया। आज़माएँ: DELETE FROM users WHERE id = 42;",
    noDefault: (col) => `${col} का कोई डिफ़ॉल्ट मान नहीं है।`,
    idPositive: "id एक धनात्मक पूर्ण संख्या होनी चाहिए।",
    quoted: (col) => `${col} को उद्धरण चिह्नों में टेक्स्ट चाहिए, जैसे '…'.`,
    dateFormat: "created_at '2025-06-30' जैसा दिखना चाहिए।",
    blank: (col) => `${col} खाली नहीं हो सकता।`,
  },
  source: (page, slot) => (slot === null ? `पेज ${page}` : `पेज ${page} के स्लॉट ${slot}`),
  pointer: (page, slot) => `→ पेज ${page}, स्लॉट ${slot}`,
  keyExists: (id, page, slot) => `${id} पहले से है → पेज ${page}, स्लॉट ${slot}`,
  keyNew: (id, page, slot) => `${id} → पेज ${page}, स्लॉट ${slot} (नया)`,

  client: (verb, write): StepText => ({
    title: `क्लाइंट ${verb} भेजता है`,
    what: "ऐप्लिकेशन अपने कनेक्शन से SQL टेक्स्ट डेटाबेस सर्वर को भेजता है।",
    why: write ? "हर बदलाव सर्वर से होकर जाता है, जो सभी क्लाइंट के लिए constraints (नियम), लॉगिंग और concurrency (एक साथ काम) सँभालता है।" : "प्लानिंग और डेटा तक पहुँच का सारा काम सर्वर करता है; क्लाइंट सिर्फ़ टेक्स्ट भेजकर पंक्तियों का इंतज़ार करता है।",
    notice: "क्वेरी का निशान क्लाइंट से निकलकर पार्सर की ओर जाता है।",
  }),
  parse: (q): StepText => ({
    title: "पार्सर सिंटैक्स ट्री बनाता है",
    what: `टेक्स्ट को टोकन में बाँटकर SQL व्याकरण से जाँचा जाता है, जिससे एक ट्री बनता है: ${tree(q)}। फिर "${TABLE}" जैसे नामों को catalog (डेटाबेस की सूची) में खोजा जाता है।`,
    why: "आगे के चरण कच्चे टेक्स्ट पर नहीं, एक व्यवस्थित ट्री पर काम करते हैं। सिंटैक्स की गलतियाँ यहीं रुक जाती हैं, डेटा छूने से पहले।",
    notice: "पार्सर चमकता है। ट्री देखने के लिए इसे इंस्पेक्टर में खोलें।",
  }),
  plan: (q, verb, useIndex, plan): StepText => ({
    title: q.kind === "insert" ? "प्लानर insert का प्लान बनाता है" : useIndex ? "प्लानर index scan चुनता है" : "प्लानर table scan पर लौटता है",
    what: q.kind === "insert"
      ? `VALUES वाले INSERT में खोजने को कुछ नहीं होता, इसलिए प्लान सीधा है: एक पंक्ति बनाकर "${plan[0]}" को सौंपना।`
      : q.kind !== "select" ? `${verb} को पहले SELECT की तरह पंक्ति ढूँढनी होती है। ${lookup(useIndex, q.id)}` : `प्लानर संभावित प्लानों की लागत (cost) का अनुमान लगाता है। ${lookup(useIndex, q.id)}`,
    why: "डेटा तक पहुँचने का तरीका पहले से तय करने से बेवजह पेज पढ़ने से बचा जाता है, और पेज पढ़ना ही महँगा हिस्सा है।",
    notice: `चुना गया प्लान है "${plan.map((l) => l.trim()).join(" ")}"।`,
  }),
  execute: (q, useIndex): StepText => ({
    title: "एग्ज़िक्यूटर प्लान चलाता है",
    what: q.kind === "insert"
      ? `एग्ज़िक्यूटर नया tuple (पंक्ति का भौतिक रूप) बनाता है: ${q.id === null ? "id users_id_seq sequence से आता है" : `id ${q.id} है, जैसा दिया गया`}${q.values.created_at ? "" : ", और created_at को उसका डिफ़ॉल्ट (आज की तारीख़) मिलता है"}।`
      : "एग्ज़िक्यूटर प्लान को नोड-दर-नोड चलाता है और स्टोरेज लेयर से ज़रूरी पेज माँगता है।",
    why: q.kind !== "select" ? "लिखना पहले मेमोरी के पेजों में होता है; एग्ज़िक्यूटर को टेबल के हर इंडेक्स को भी अपडेट रखना होता है।" : "प्लान बताता है कैसे; काम एग्ज़िक्यूटर करता है, ज़रूरत के हिसाब से एक-एक पंक्ति खींचते हुए।",
    notice: q.kind === "insert" ? "अब यह पंक्ति के लिए जगह वाला पेज ढूँढता है।" : useIndex ? "अब निशान B-tree इंडेक्स की ओर जाता है।" : "अब निशान सीधे टेबल के पेजों की ओर जाता है।",
  }),
  returnRows: (q, found, source): StepText => ({
    title: found ? "पंक्ति क्लाइंट को लौटाएँ" : "शून्य पंक्तियाँ लौटाएँ",
    what: found
      ? `एग्ज़िक्यूटर ${source} से tuple पढ़ता है, जाँचता है कि पंक्ति का यह वर्ज़न इस क्वेरी को दिखना चाहिए (MVCC), ${cols(q)} रखता है, और उसे क्लाइंट को भेजता है।`
      : `किसी पंक्ति का id = ${q.id} नहीं है। क्लाइंट को खाली नतीजा मिलता है, जो कोई त्रुटि नहीं है।`,
    why: found ? "सर्वर से सिर्फ़ माँगी गई पंक्ति जाती है; बाकी पेज आगे की क्वेरी के लिए कैश में रहता है।" : "किसी से मेल न खाने वाले फ़िल्टर का सामान्य जवाब खाली नतीजा ही है।",
    notice: found ? "नतीजा सीन के नीचे दिखता है। रन पूरा हुआ।" : "नतीजे की टेबल खाली है। रन पूरा हुआ।",
  }),

  indexLookup: (id, route, at, leaf): StepText => ({
    title: at ? `इंडेक्स को key ${id} मिलती है` : `इंडेक्स में key ${id} नहीं है`,
    what: at
      ? `एग्ज़िक्यूटर ${INDEX} में root से leaf तक उतरता है (${route})। ${id} की leaf एंट्री टेबल के पेज ${at.page}, स्लॉट ${at.slot} की ओर इशारा करती है।`
      : `एग्ज़िक्यूटर ${INDEX} में उतरता है (${route})। leaf ${leaf.low}–${leaf.high} में ${id} की कोई एंट्री नहीं है, इसलिए टेबल का कोई पेज नहीं चाहिए।`,
    why: "B-tree कुंजियों को क्रम में रखता है, इसलिए खोज में हर टेबल पेज की जगह कुछ ही इंडेक्स पेज पढ़ने पड़ते हैं।",
    notice: at
      ? `रास्ते के बैंगनी नोड चमकते हैं और pointer (पेज ${at.page}, स्लॉट ${at.slot}) leaf के नीचे दिखता है।`
      : "रास्ता एक leaf पर रुक जाता है और कोई pointer नहीं बनता।",
  }),
  bufferCheck: (page, hit): StepText => ({
    title: `बफ़र पूल में पेज ${page} देखें`,
    what: `डेटाबेस बफ़र पूल (मेमोरी में पेजों का साझा कैश) में ${TABLE} का पेज ${page} ढूँढता है। ${hit ? "वह पहले से वहाँ है: कैश hit।" : "वह वहाँ नहीं है: कैश miss।"}`,
    why: "मेमोरी डिस्क से कहीं तेज़ है, इसलिए हर पेज की माँग, पढ़ना हो या लिखना, पहले साझा कैश में देखती है।",
    notice: hit ? `पेज ${page} मेमोरी में हाइलाइट है और स्थिति कैश hit दिखाती है। डिस्क से पढ़ना नहीं होगा।` : "स्टेटस कार्ड कैश miss दिखाता है। पेज अब डिस्क से आएगा।",
  }),
  diskWhyIndex: (page, range) => `डेटाबेस अकेली पंक्तियाँ नहीं, पूरे पेज लाता है। पेज ${page} में id ${range} हैं, इसलिए पड़ोसी पंक्तियाँ भी साथ आती हैं।`,
  scanCheck: (pages, warm, cold, hit, id): StepText => ({
    title: `बफ़र पूल में ${pageList(pages)} देखें`,
    what: hit
      ? `sequential scan (क्रम से पूरी टेबल पढ़ना) ${TABLE} का हर पेज क्रम से माँगता है। सभी ${pages.length} पहले से बफ़र पूल में हैं।`
      : `sequential scan ${TABLE} का हर पेज क्रम से माँगता है। सिर्फ़ ${pageList(warm)} कैश में है; ${pageList(cold)} नहीं हैं।`,
    why: `इंडेक्स के बिना यह जानने का कोई तरीका नहीं कि id ${id} किस पेज में है, इसलिए हर पेज पढ़ना पड़ता है।`,
    notice: hit ? "users के चारों पेज मेमोरी में हाइलाइट हैं।" : "कैश वाले पेज हाइलाइट हैं; स्टेटस कार्ड miss बताता है।",
  }),
  diskWhyScan: "एग्ज़िक्यूटर सिर्फ़ मेमोरी में मौजूद पंक्तियाँ जाँच सकता है, और I/O की इकाई पेज है।",
  filter: (count, id, pages, matched, select): StepText => ({
    title: `सभी ${count} पंक्तियों को id = ${id} से जाँचें`,
    what: `${pageList(pages)} की हर पंक्ति फ़िल्टर से मिलाई जाती है। ${matched ? "एक पंक्ति मेल खाती है।" : "कोई पंक्ति मेल नहीं खाती।"}`,
    why: "इंडेक्स के बिना एग्ज़िक्यूटर नहीं जान सकता कि मेल अकेला है या कहाँ है, इसलिए स्कैन बीच में नहीं रुक सकता।",
    notice: `${matched ? 1 : 0} पंक्ति ${select ? "लौटाने" : "बदलने"} के लिए ${count} पंक्तियाँ जाँची गईं। असली टेबल में ये लाखों हो सकती हैं।`,
  }),
  disk: (pages, why): StepText => ({
    title: `डिस्क से ${pageList(pages)} पढ़ें`,
    what: `${pages.length === 1 ? `पूरा 8 KB का पेज ${pages[0]}` : "छूटे हुए पेज"} टेबल की डेटा फ़ाइल से ${pages.length === 1 ? "एक खाली बफ़र स्लॉट" : "खाली बफ़र स्लॉटों"} में पढ़ा जाता है।`,
    why,
    notice: `${pageList(pages)} डिस्क की शेल्फ़ से बफ़र पूल में ${pages.length === 1 ? "जाता है" : "जाते हैं"}, जहाँ आगे की क्वेरी ${pages.length === 1 ? "उसे" : "उन्हें"} दोबारा इस्तेमाल कर सकती हैं।`,
  }),

  space: (page, used, capacity, hit): StepText => ({
    title: `जगह ढूँढें: पेज ${page}`,
    what: `free space map (खाली जगह का नक्शा) बताता है कि पेज ${page} में जगह है (${capacity} में से ${used} स्लॉट भरे), इसलिए नई पंक्ति वहीं जाती है। पेज ${page} ${hit ? "पहले से बफ़र पूल में है: कैश hit" : "बफ़र पूल में नहीं है: कैश miss"}।`,
    why: "heap टेबल पंक्तियों को किसी ख़ास क्रम में नहीं रखती: नई पंक्ति जहाँ जगह हो वहाँ जाती है, पड़ोसी id के पास नहीं।",
    notice: hit ? `पेज ${page} मेमोरी में हाइलाइट है।` : `स्टेटस कार्ड कैश miss दिखाता है: पंक्ति जोड़ने के लिए भी पेज ${page} पहले पढ़ना होगा।`,
  }),
  diskWhyInsert: "किसी पेज को बदलने के लिए, सिर्फ़ एक पंक्ति जोड़ने के लिए भी, उसका मेमोरी में होना ज़रूरी है।",
  insertWrite: (id, name, page, slot, txid): StepText => ({
    title: `नया tuple पेज ${page} में लिखें`,
    what: `पंक्ति (id ${id}, '${name}') स्लॉट ${slot} में xmin = ${txid} के साथ रखी जाती है, जो इस ट्रांज़ैक्शन का id है। commit होने तक कोई और ट्रांज़ैक्शन इसे नहीं देख सकता। WAL में एक Heap INSERT रिकॉर्ड जुड़ता है।`,
    why: "बदलाव मेमोरी में होता है; अगर पेज लिखे जाने से पहले सर्वर क्रैश हो जाए, तो WAL रिकॉर्ड से ही बदलाव वापस पाया जा सकता है।",
    notice: `पेज ${page} dirty (बदला हुआ, अभी डिस्क पर नहीं लिखा) हो जाता है, और WAL शेल्फ़ पर एक Heap INSERT रिकॉर्ड दिखता है, जो अभी डिस्क पर नहीं गया।`,
  }),
  duplicate: (id, page, slot): StepText => ({
    title: `Duplicate key: id ${id} पहले से मौजूद है`,
    what: `${INDEX} में ${id} जोड़ते समय leaf में पहले से ${id} है (पेज ${page}, स्लॉट ${slot} की ओर), और वह पंक्ति जीवित है। primary key अनोखी होनी चाहिए, इसलिए insert विफल होता है।`,
    why: "अनोखेपन (uniqueness) की जाँच key जोड़ते ही इंडेक्स में होती है; heap tuple पहले ही लिखा जा चुका था, इसीलिए विफलता को रोलबैक करना पड़ता है।",
    notice: "मौजूदा एंट्री leaf के नीचे हाइलाइट है और इस चरण को त्रुटि के रूप में दिखाया गया है।",
  }),
  indexAdd: (id, page, slot): StepText => ({
    title: `${INDEX} में key ${id} जोड़ें`,
    what: `एग्ज़िक्यूटर ${INDEX} में सही leaf तक उतरकर ${id} → (पेज ${page}, स्लॉट ${slot}) जोड़ता है। key नई है, इसलिए uniqueness जाँच पास होती है। WAL में एक Btree रिकॉर्ड जुड़ता है।`,
    why: "टेबल के हर इंडेक्स को हर नई पंक्ति के बारे में जानना होता है, इसीलिए हर अतिरिक्त इंडेक्स लिखना धीमा करता है।",
    notice: "नई एंट्री leaf के नीचे दिखती है, और WAL शेल्फ़ पर दूसरा रिकॉर्ड जुड़ता है।",
  }),
  abort: (txid, page): StepText => ({
    title: "ट्रांज़ैक्शन रद्द (abort) होता है",
    what: `त्रुटि ट्रांज़ैक्शन ${txid} को रद्द कर देती है। एक abort रिकॉर्ड लॉग होता है। पेज ${page} में लिखा tuple वहीं रहता है, लेकिन उसका xmin एक रद्द ट्रांज़ैक्शन है, इसलिए वह कभी किसी को नहीं दिखेगा; VACUUM बाद में उसकी जगह वापस लेता है।`,
    why: "Atomicity (सब या कुछ नहीं): विफल स्टेटमेंट कोई दिखने वाला निशान नहीं छोड़ता, भले उसका कुछ काम पेज तक पहुँच गया हो।",
    notice: "WAL शेल्फ़ पर एक ABORT रिकॉर्ड जुड़ता है। abort के लिए कुछ भी डिस्क पर लिखना ज़रूरी नहीं।",
  }),
  insertFailed: (error): StepText => ({
    title: "क्लाइंट को त्रुटि मिलती है",
    what: `सर्वर कमांड टैग ERROR के साथ जवाब देता है। त्रुटि (PostgreSQL का संदेश): ${error}`,
    why: "अकेले चलाने पर (autocommit), विफल स्टेटमेंट का ट्रांज़ैक्शन पहले ही रोलबैक हो चुका होता है। BEGIN … COMMIT के अंदर, क्लाइंट को कुछ और करने से पहले ROLLBACK करना होगा।",
    notice: "नतीजे में त्रुटि दिखती है। टेबल नहीं बदली। रन पूरा हुआ।",
  }),
  insertDetail: `"0" एक पुराना ऐतिहासिक फ़ील्ड है (object id, जो अब हमेशा 0 होता है) और "1" जोड़ी गई पंक्तियों की संख्या है।`,

  updateWrite: (id, slot, newSlot, changed, txid, page, used, capacity): StepText => ({
    title: `पंक्ति ${id} का नया वर्ज़न लिखें`,
    what: `स्लॉट ${slot} के पुराने वर्ज़न को xmax = ${txid} (यह ट्रांज़ैक्शन) मिलता है। ${changed} बदले हुए नए वर्ज़न को उसी पेज के खाली स्लॉट ${newSlot} में xmin = ${txid} के साथ रखा जाता है। बदलाव बताने वाला एक WAL रिकॉर्ड जुड़ता है।`,
    why: `PostgreSQL पंक्तियों को कभी ओवरराइट नहीं करता (MVCC): दूसरों को अभी पुराना वर्ज़न चाहिए हो सकता है। कोई इंडेक्स वाला कॉलम नहीं बदला और पेज ${page} में जगह थी (${capacity} में से ${used} स्लॉट भरे), इसलिए यह HOT update है: ${INDEX} को नई एंट्री नहीं चाहिए।`,
    notice: `पेज ${page} dirty हो जाता है (मेमोरी में बदला, डेटा फ़ाइल में अभी नहीं) और WAL शेल्फ़ पर एक Heap रिकॉर्ड दिखता है, जो अभी डिस्क पर नहीं गया।`,
  }),
  deleteWrite: (id, slot, txid, page): StepText => ({
    title: `पंक्ति ${id} को हटाई गई चिह्नित करें`,
    what: `स्लॉट ${slot} के tuple को xmax = ${txid} मिलता है। उसके बाइट पेज पर ही रहते हैं; ट्रांज़ैक्शन commit होने के बाद नए snapshot उसे देखना बंद कर देते हैं। एक WAL रिकॉर्ड जुड़ता है।`,
    why: "पहले शुरू हुए ट्रांज़ैक्शन को अभी यह पंक्ति पढ़नी पड़ सकती है, इसलिए इसे अभी मिटाया नहीं जा सकता। जब कोई इसे न देख सके, तब VACUUM इसे हटाता है। इंडेक्स एंट्री भी तब तक रहती है।",
    notice: `पेज ${page} dirty हो जाता है और WAL शेल्फ़ पर एक Heap DELETE रिकॉर्ड दिखता है, जो अभी डिस्क पर नहीं गया।`,
  }),
  changedDetail: (tag: string, kind: StatementKind) => `${tag} का मतलब है कि एक पंक्ति ${kind === "update" ? "अपडेट हुई" : "हटाई गई"}।`,
  noMatchDetail: (id) => `किसी पंक्ति का id = ${id} नहीं है, इसलिए कुछ नहीं बदला। न ट्रांज़ैक्शन id की ज़रूरत पड़ी, न WAL में कुछ लिखा गया।`,

  commit: (page): StepText => ({
    title: "Commit: WAL को डिस्क पर लिखें",
    what: `COMMIT एक commit रिकॉर्ड जोड़ता है और तब तक रुकता है जब तक वहाँ तक का WAL डिस्क पर न लिख जाए। पेज ${page} ख़ुद मेमोरी में dirty रहता है; checkpointer या background writer उसे बाद में डेटा फ़ाइल में लिखता है।`,
    why: "एक क्रमिक लॉग रिकॉर्ड लिखना हर बदले पेज को लिखने से कहीं तेज़ है। अगर अभी सर्वर क्रैश हो, तो WAL दोबारा चलाकर बदलाव फिर से किया जा सकता है।",
    notice: `WAL रिकॉर्ड ठोस हो जाते हैं: वे अब टिकाऊ (durable) हैं। पेज ${page} बफ़र पूल में अभी भी dirty है।`,
  }),
  writeReturn: (tag, detail): StepText => ({
    title: `क्लाइंट को "${tag}" मिलता है`,
    what: `सर्वर कमांड टैग ${tag} के साथ जवाब देता है। ${detail}`,
    why: "RETURNING के बिना, लिखने वाला स्टेटमेंट सिर्फ़ यह बताता है कि कितनी पंक्तियाँ प्रभावित हुईं, पंक्तियाँ ख़ुद नहीं।",
    notice: "नतीजे में पंक्ति पहले और बाद में दिखती है। रन पूरा हुआ।",
  }),
};
