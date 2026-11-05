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
    // Some products have no description in the DB: fall back to the site default (meta-description audit).
    description: product.description || undefined,
    alternates: { canonical: `/shop/${encodeURIComponent(product.slug)}` },
    // Full object: a page-level openGraph replaces the layout's instead of merging.
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName: "V-FORM NUTRITION",
      title: product.name,
      description: product.description || undefined,
      images: [product.images?.[0] || "/creatine-hero.png"],
    },
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
