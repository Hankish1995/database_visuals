import type { ChallengeText } from "@/content/hi/types";

export const challenges: Record<string, ChallengeText> = {
  "hardware-prices": {
    title: "Hardware की कीमत सूची", topic: "SELECT",
    prompt: "'hardware' category के हर product का नाम और कीमत दिखाएँ, सबसे सस्ता पहले।",
    hints: ["WHERE category = 'hardware' से फ़िल्टर करें।", "ORDER BY price डिफ़ॉल्ट रूप से बढ़ते क्रम में sort करता है।"],
  },
  "orders-by-status": {
    title: "हर status के orders", topic: "GROUP BY",
    prompt: "हर order status और उस status वाले orders की संख्या दिखाएँ, status के नाम से क्रमबद्ध।",
    hints: ["count(*) हर समूह की पंक्तियाँ गिनता है।", "GROUP BY status हर status का एक समूह बनाता है।"],
  },
  "customer-spend": {
    title: "हर customer ने कितना ख़र्च किया", topic: "JOIN",
    prompt: "हर customer का नाम और रद्द (cancelled) न हुए orders पर उसका कुल ख़र्च (quantity × unit_price) दिखाएँ। जिन्होंने कुछ ख़र्च नहीं किया वे 0 के साथ दिखने चाहिए। सबसे बड़ा कुल पहले; बराबरी पर नाम से क्रम दें।",
    hints: ["LEFT JOIN इस्तेमाल करें ताकि बिना orders वाले customers नतीजे में रहें।", "status की शर्त ON क्लॉज़ में रखें, WHERE में नहीं, वरना LEFT JOIN inner join बन जाता है।", "coalesce(sum(...), 0) गायब कुल को 0 में बदलता है।"],
  },
  "priciest-per-category": {
    title: "हर category में सबसे महँगा", topic: "Window functions",
    prompt: "हर category के लिए उसके सबसे महँगे product का नाम, category और कीमत लौटाएँ।",
    hints: ["rank() OVER (PARTITION BY category ORDER BY price DESC) हर category के अंदर products को क्रमांक देता है।", "इसे subquery या CTE में लपेटें और rank = 1 रखें।"],
  },
  "above-average": {
    title: "औसत से ऊपर वाले customers", topic: "Subqueries और CTEs",
    prompt: "उन customers के नाम ढूँढें जिनके order का औसत मूल्य सभी orders के औसत मूल्य से ज़्यादा है। किसी order का मूल्य उसके items का जोड़ (quantity × unit_price) है।",
    hints: ["पहले एक CTE में हर order का मूल्य निकालें।", "फिर customer से group करें और avg(value) की तुलना (SELECT avg(value) FROM order_values) से करें।"],
  },
  calendar: {
    title: "हर दिन के orders, ख़ाली दिन भी", topic: "generate_series",
    prompt: "2025-06-15 से 2025-06-21 तक की हर तारीख़ उस दिन हुए orders की संख्या के साथ दिखाएँ (ordered_at::date से), 0 वाले दिन भी। तारीख़ से क्रम दें।",
    hints: ["generate_series(date '2025-06-15', date '2025-06-21', interval '1 day') कैलेंडर बनाता है।", "उस पर orders को LEFT JOIN करें और count(o.id) लें, जो NULL को नहीं गिनता।"],
  },
  "paid-view": {
    title: "Paid orders का view", topic: "Views",
    prompt: "paid_orders नाम का एक view बनाएँ जिसमें तीन कॉलम हों: order id, customer का नाम, और order का कुल (quantity × unit_price का जोड़), उन orders के लिए जिनका status 'paid' है।",
    hints: ["View बस CREATE VIEW name AS <select> है।", "orders, customers और order_items को join करें, फिर order से GROUP BY करें।"],
  },
  "revenue-function": {
    title: "कमाई का function", topic: "Functions",
    prompt: "एक function product_revenue(p_id integer) लिखें जो एक product की कुल कमाई (quantity × unit_price का जोड़) लौटाए, या 0 अगर उसका कभी order नहीं हुआ।",
    hints: ["LANGUAGE sql function का body एक अकेला SELECT होता है।", "coalesce(sum(...), 0) बिना order items वाले products को सँभालता है।"],
  },
  "restock-procedure": {
    title: "स्टॉक भरने की procedure", topic: "Procedures",
    prompt: "एक procedure restock(p_product_id integer, p_amount integer) बनाएँ जो product के stock में p_amount जोड़े। जब p_amount शून्य या ऋणात्मक हो, तो उसे बिना कुछ बदले exception उठाना चाहिए।",
    hints: ["पहले राशि जाँचें: IF p_amount <= 0 THEN RAISE EXCEPTION '...'; END IF;", "फिर UPDATE products SET stock = stock + p_amount WHERE id = p_product_id."],
  },
  "price-history": {
    title: "कीमत के इतिहास का trigger", topic: "Triggers",
    prompt: "एक टेबल price_history(product_id integer, old_price numeric, new_price numeric) बनाएँ और एक trigger जो, जब भी कोई UPDATE product की कीमत बदले, उसमें एक पंक्ति जोड़े। कीमत न बदलने वाले updates को पंक्ति नहीं जोड़नी चाहिए।",
    hints: ["trigger function के अंदर OLD.price और NEW.price की तुलना करें (IS DISTINCT FROM NULL सँभालता है)।", "AFTER UPDATE … FOR EACH ROW trigger NULL लौटाता है।", "या trigger पर WHEN (OLD.price IS DISTINCT FROM NEW.price) क्लॉज़ यह छँटाई कर देता है।"],
  },
  "safe-transfer": {
    title: "खातों के बीच ट्रांसफ़र", topic: "ट्रांज़ैक्शन",
    prompt: "एक ट्रांज़ैक्शन में Asha के खाते (id 1) से Chen के खाते (id 3) में 25.00 भेजें, फिर commit करें।",
    hints: ["BEGIN और COMMIT के बीच दो UPDATE: एक घटाता है, एक जोड़ता है।"],
  },
  "index-it": {
    title: "इसे इंडेक्स इस्तेमाल करवाएँ", topic: "इंडेक्स",
    prompt: "यह क्वेरी सभी 50,000 events पढ़ती है: SELECT * FROM events WHERE account_id = 7 AND kind = 'refund'। एक इंडेक्स बनाएँ ताकि PostgreSQL events के sequential scan के बिना इसका जवाब दे।",
    hints: ["सिर्फ़ account_id पर इंडेक्स भी मदद करता है; (account_id, kind) और भी सटीक है।", "विज़ुअलाइज़ पेज पर EXPLAIN से अपना प्लान जाँचें।"],
  },
};
