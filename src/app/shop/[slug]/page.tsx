import { supabase } from "@/lib/auth";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/supabase";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";


export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(decodeURIComponent(params.slug).trim());
  if (!product) return { title: "מוצר לא נמצא" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(decodeURIComponent(params.slug).trim());
  if (!product) notFound();

  const related = (await getProducts()).filter(
    (p) => p.id !== product.id && p.category === product.category
  );

  return <ProductDetailClient product={product} related={related} />;
}
