import type { Titled } from "@/content/hi/types";

export const sections: Record<string, Titled> = {
  query: { title: "क्वेरी प्रोसेसिंग", subtitle: "SQL टेक्स्ट से नतीजे की पंक्तियों तक" },
  indexes: { title: "इंडेक्स", subtitle: "इंडेक्स कैसे काम करते हैं और कब इस्तेमाल करें" },
  storage: { title: "स्टोरेज", subtitle: "पेज, tuple और उनकी बनावट" },
  transactions: { title: "ट्रांज़ैक्शन", subtitle: "ACID, आइसोलेशन और concurrency" },
  recovery: { title: "रिकवरी", subtitle: "Write-ahead logging और क्रैश के बाद रिकवरी" },
};

export const lessons: Record<string, Titled> = {
  "query-flow": { title: "क्वेरी का सफ़र", subtitle: "पढ़ना और लिखना, चरण-दर-चरण" },
  parsing: { title: "पार्सिंग", subtitle: "SQL सिंटैक्स ट्री कैसे बनता है" },
  planning: { title: "प्लानिंग", subtitle: "लागत का अनुमान और प्लान का चुनाव" },
  execution: { title: "एग्ज़िक्यूशन", subtitle: "प्लान को चलाना" },
  btree: { title: "B-tree से खोज", subtitle: "कुछ ही रीड में root से leaf तक" },
  "index-vs-scan": { title: "इंडेक्स बनाम टेबल स्कैन", subtitle: "प्लान अलग क्यों होते हैं" },
  composite: { title: "कंपोज़िट इंडेक्स", subtitle: "कॉलम का क्रम मायने रखता है" },
  hnsw: { title: "HNSW वेक्टर सर्च", subtitle: "ef_search, recall और काम" },
  pages: { title: "पेज और बफ़र पूल", subtitle: "पंक्तियाँ नहीं, पेज क्यों" },
  tuples: { title: "Tuple की बनावट", subtitle: "हेडर, स्लॉट और खाली जगह" },
  acid: { title: "ACID की बुनियाद", subtitle: "चार गारंटियाँ" },
  mvcc: { title: "MVCC", subtitle: "पढ़ने वाले लिखने वालों को नहीं रोकते" },
  wal: { title: "Write-ahead logging", subtitle: "पहले लॉग, फिर डेटा" },
  crash: { title: "क्रैश रिकवरी", subtitle: "लॉग को दोबारा चलाना" },
};
