import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductDetailView } from "@/components/site/product-detail-view";
import { getAgentShop } from "@/lib/affiliate";
import { getProductBySlug } from "@/lib/catalog";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AgentProductPage({ params, searchParams }: PageProps<"/r/[code]/products/[slug]">) {
  await connection();
  const { code, slug } = await params;
  const sp = await searchParams;
  const pc = typeof sp.pc === "string" ? sp.pc : "";
  const shop = await getAgentShop(code, pc || undefined);
  if ("invalid" in shop) notFound();

  const product = await getProductBySlug(slug, {
    affiliateId: shop.affiliate.id,
    priceCodeId: shop.priceCode?.id ?? null,
  });
  if (!product) notFound();

  return (
    <ProductDetailView
      product={product}
      homeHref={`/r/${shop.entryCode}`}
      priceBadge={shop.priceCode?.name ? `价位码 · ${shop.priceCode.name}` : "专属价"}
      couponCode={shop.priceCode?.code ?? shop.affiliate.code}
      couponLabel={shop.priceCode?.name ? `价位码 · ${shop.priceCode.name}` : "代理专属价"}
      orderRef={shop.entryCode}
    />
  );
}
