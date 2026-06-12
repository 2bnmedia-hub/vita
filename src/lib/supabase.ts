import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Mock data (replace with real Supabase queries once DB is set up) ──
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "קריאטין מונוהידראט — ללא טעם",
    slug: "creatine-unflavored",
    description: "קריאטין נקי ופשוט, מתאים לשילוב בכל משקה ללא שינוי הטעם.",
    long_description:
      "קריאטין מונוהידראט טהור מבית VITA — הבחירה הקלאסית למי שמעדיף גמישות מקסימלית. מתערבב בקלות עם מים, מיץ, שייק חלבון או כל משקה אחר, בלי לשנות את הטעם. מיוצר בתקני GMP, HACCP ו-ISO.",
    price: 89,
    compare_price: 109,
    images: ["/images/creatine-unflavored.jpg"],
    category: "קריאטין",
    flavor: "ללא טעם",
    weight: "500g",
    servings: 166,
    serving_size: "3g",
    in_stock: true,
    featured: true,
    badge: "הנמכר ביותר",
    tags: ["קריאטין", "אבקה", "ללא טעם"],
    nutrition_facts: { "קריאטין מונוהידראט": "3g", "קלוריות": "0", "פחמימות": "0g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "קריאטין מונוהידראט — טעם ענבים",
    slug: "creatine-grape",
    description: "קריאטין בטעם ענבים מרענן, לשימוש יומיומי נוח ומהנה.",
    long_description:
      "קריאטין מונוהידראט בטעם ענבים מרענן ומתוק. מתאים למי שרוצה ליהנות מהשגרה היומית שלו בלי להסתבך עם ערבובים. 3 גרם למנה, 166 מנות לאריזה.",
    price: 94,
    compare_price: 114,
    images: ["/images/creatine-grape.jpg"],
    category: "קריאטין",
    flavor: "ענבים",
    weight: "500g",
    servings: 166,
    serving_size: "3g",
    in_stock: true,
    featured: true,
    badge: "פופולרי",
    tags: ["קריאטין", "אבקה", "ענבים"],
    nutrition_facts: { "קריאטין מונוהידראט": "3g", "קלוריות": "5", "פחמימות": "1g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "קריאטין מונוהידראט — קוקטייל פירות",
    slug: "creatine-fruit-cocktail",
    description: "טעם פירותי קליל ומרענן, לחוויית שתייה טעימה.",
    long_description:
      "קריאטין מונוהידראט בטעם קוקטייל פירות — עם טעם פירותי קליל ומרענן. מתאים למתאמנים שמחפשים מוצר יעיל עם חוויית שתייה טעימה.",
    price: 94,
    compare_price: 114,
    images: ["/images/creatine-fruit.jpg"],
    category: "קריאטין",
    flavor: "קוקטייל פירות",
    weight: "500g",
    servings: 166,
    serving_size: "3g",
    in_stock: true,
    featured: false,
    tags: ["קריאטין", "אבקה", "פירות"],
    nutrition_facts: { "קריאטין מונוהידראט": "3g", "קלוריות": "5", "פחמימות": "1g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "קריאטין טבליות לעיסה",
    slug: "creatine-chewable",
    description: "ללא מים, ללא ערבוב — 150 טבליות בטעם קוקטייל פירות.",
    long_description:
      "טבליות קריאטין ללעיסה של VFORM Nutrition — הדרך הנוחה ביותר לקחת קריאטין בכל יום. ללא מים, ללא ערבוב, פחות מ-2 קק\"ל לטבלייה. 3 גרם קריאטין ל-3 טבליות יומיות.",
    price: 99,
    compare_price: 129,
    images: ["/images/creatine-chewable.jpg"],
    category: "קריאטין",
    flavor: "קוקטייל פירות",
    weight: "150 טבליות",
    servings: 50,
    serving_size: "3 טבליות",
    in_stock: true,
    featured: true,
    badge: "חדש",
    tags: ["קריאטין", "טבליות", "ללא מים"],
    nutrition_facts: { "קריאטין מונוהידראט": "3g", "קלוריות": "<2 לטבלייה", "שומן": "0g" },
    created_at: new Date().toISOString(),
  },
];

// ── Supabase queries (active when DB is connected) ──
export async function getProducts(): Promise<Product[]> {
  if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
    return MOCK_PRODUCTS;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("in_stock", true)
    .order("created_at", { ascending: false });
  if (error) { console.error(error); return MOCK_PRODUCTS; }
  return data ?? MOCK_PRODUCTS;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
    return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  return data;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
    return MOCK_PRODUCTS.filter((p) => p.featured);
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("in_stock", true)
    .limit(4);
  if (error) return MOCK_PRODUCTS.filter((p) => p.featured);
  return data ?? [];
}
