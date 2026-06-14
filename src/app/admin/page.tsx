import { createClient } from "@supabase/supabase-js";
import AdminDashboardClient from "./AdminDashboardClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [customers, allOrders, todayOrders, monthOrders, categories, products, pendingOrders, unreadContacts, newCustomers] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact" }),
    supabase.from("orders").select("id,total,status,created_at,items"),
    supabase.from("orders").select("id,total,status,created_at,customer_name,items").gte("created_at", todayStart),
    supabase.from("orders").select("id,total,status,created_at").gte("created_at", monthStart),
    supabase.from("categories").select("id,name,slug,created_at").order("created_at", { ascending: false }),
    supabase.from("products").select("id,name,price,in_stock").order("created_at", { ascending: false }),
    supabase.from("orders").select("id,total,status,created_at,customer_name,items").eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("contact_submissions").select("id,name,email,message,created_at,read").eq("read", false).order("created_at", { ascending: false }),
    supabase.from("customers").select("id", { count: "exact" }).gte("created_at", monthStart),
  ]);

  // Top products מתוך items של הזמנות
  const productCount: Record<string, number> = {};
  allOrders.data?.forEach(order => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      const name = item.name || item.product_name || "לא ידוע";
      const qty = item.quantity || item.qty || 1;
      productCount[name] = (productCount[name] || 0) + qty;
    });
  });
  const topProducts = Object.entries(productCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // גרף חודשי
  const monthlyRevenue: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    monthlyRevenue[key] = 0;
  }
  allOrders.data?.forEach(o => {
    const d = new Date(o.created_at);
    const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
    if (monthlyRevenue[key] !== undefined) monthlyRevenue[key] += Number(o.total);
  });
  const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));

  return {
    totalCustomers: customers.count ?? 0,
    newCustomersMonth: newCustomers.count ?? 0,
    todayOrders: todayOrders.data ?? [],
    todayRevenue: todayOrders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    monthOrders: monthOrders.count ?? 0,
    monthRevenue: monthOrders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0,
    topProducts,
    categories: categories.data ?? [],
    products: products.data ?? [],
    pendingOrders: pendingOrders.data ?? [],
    unreadContacts: unreadContacts.data ?? [],
    chartData,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <AdminDashboardClient stats={stats} />;
}
