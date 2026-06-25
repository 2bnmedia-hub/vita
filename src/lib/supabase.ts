import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Mock data ──
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "קריאטין מונוהידראט — ללא טעם",
    slug: "creatine-unflavored",
    description: "קריאטין נקי ופשוט, מתאים לשילוב בכל משקה ללא שינוי הטעם.",
    long_description:
      "קריאטין מונוהידראט טהור מבית VITA — הבחירה הקלאסית למי שמעדיף גמישות מקסימלית.",
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
    nutrition_facts: { "קריאטין מונוהידראט": "3g", קלוריות: "0", פחמימות: "0g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "קריאטין מונוהידראט — טעם ענבים",
    slug: "creatine-grape",
    description: "קריאטין בטעם ענבים מרענן, לשימוש יומיומי נוח ומהנה.",
    long_description: "קריאטין מונוהידראט בטעם ענבים מרענן ומתוק.",
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
    nutrition_facts: { "קריאטין מונוהידראט": "3g", קלוריות: "5", פחמימות: "1g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "קריאטין מונוהידראט — קוקטייל פירות",
    slug: "creatine-fruit-cocktail",
    description: "טעם פירותי קליל ומרענן, לחוויית שתייה טעימה.",
    long_description: "קריאטין מונוהידראט בטעם קוקטייל פירות.",
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
    nutrition_facts: { "קריאטין מונוהידראט": "3g", קלוריות: "5", פחמימות: "1g" },
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "קריאטין טבליות לעיסה",
    slug: "creatine-chewable",
    description: "ללא מים, ללא ערבוב — 150 טבליות בטעם קוקטייל פירות.",
    long_description: "טבליות קריאטין ללעיסה — הדרך הנוחה ביותר לקחת קריאטין.",
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
    nutrition_facts: { "קריאטין מונוהידראט": "3g", קלוריות: "<2 לטבלייה", שומן: "0g" },
    created_at: new Date().toISOString(),
  },
];

const isMock =
  !supabaseUrl || supabaseUrl === "https://placeholder.supabase.co";

// ── Categories ──
export async function getCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  if (isMock) {
    return [{ id: "1", name: "קריאטין", slug: "creatine" }];
  }
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) { console.error(error); return []; }
  return data ?? [];
}

// ── Products with optional filters ──
export interface GetProductsParams {
  category?: string;   // category name (Hebrew)
  search?: string;     // free-text search on name
  sort?: "price-asc" | "price-desc" | "featured" | "newest";
}

export async function getProducts(params: GetProductsParams = {}): Promise<Product[]> {
  if (isMock) {
    let results = [...MOCK_PRODUCTS];
    if (params.category) {
      results = results.filter((p) => p.category === params.category);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(q));
    }
    return applySortMock(results, params.sort);
  }

  let query = supabase.from("products").select("*").eq("in_stock", true);

  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  // Sort
  switch (params.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "featured":
      query = query.order("featured", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) { console.error(error); return MOCK_PRODUCTS; }
  return data ?? [];
}

function applySortMock(products: Product[], sort?: string): Product[] {
  const arr = [...products];
  switch (sort) {
    case "price-asc":  return arr.sort((a, b) => a.price - b.price);
    case "price-desc": return arr.sort((a, b) => b.price - a.price);
    case "featured":   return arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    default:           return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}

// ── Single product ──
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isMock) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
  return data;
}

// ── Featured products ──
export async function getFeaturedProducts(): Promise<Product[]> {
  if (isMock) return MOCK_PRODUCTS.filter((p) => p.featured);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("in_stock", true)
    .limit(4);
  if (error) return MOCK_PRODUCTS.filter((p) => p.featured);
  return data ?? [];
}
