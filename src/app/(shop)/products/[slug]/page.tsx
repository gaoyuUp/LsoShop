import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductDetailView } from "@/components/site/product-detail-view";
import { getProductBySlug } from "@/lib/catalog";
import { getAgentContext } from "@/lib/agent-context";
import { absoluteUrl, plainText, serializeJsonLd, siteUrl } from "@/lib/seo";
import { getSiteConfig } from "@/lib/site-config";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [product, site] = await Promise.all([getProductBySlug(slug), getSiteConfig()]);

  if (!product) {
    return {
      title: "商品不存在或已下架",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const url = absoluteUrl(`/products/${product.slug}`);
  const description = plainText(
    product.description || product.subtitle,
    `${product.name}，${site.slogan}，支付宝付款后自动发货。`,
  );
  const image = { url: site.ogImageUrl, width: 1200, height: 630, alt: `${product.name} · ${site.name}` };
  const keywords = Array.from(
    new Set([product.name, product.categoryName, site.name, "AI 账号", "自动发货", ...site.customKeywords]),
  );

  return {
    title: product.name,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url,
      siteName: site.name,
      title: `${product.name} · ${site.name}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${site.name}`,
      description,
      images: [image.url],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  await connection();
  const { slug } = await params;
  const [ctx, site] = await Promise.all([getAgentContext(), getSiteConfig()]);
  const agent = ctx.affiliateId ? { affiliateId: ctx.affiliateId, priceCodeId: ctx.priceCodeId } : undefined;
  const product = await getProductBySlug(slug, agent);
  if (!product) notFound();

  const url = absoluteUrl(`/products/${product.slug}`);
  const description = plainText(
    product.description || product.subtitle,
    `${product.name}，${site.slogan}。`,
    300,
  );
  const prices = product.variants.map((variant) => variant.priceCents);
  const imageUrl = product.image ? absoluteUrl(product.image) : absoluteUrl(site.ogImageUrl);
  const availability =
    product.totalStock === 0
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";

  const productJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: product.name,
        description,
        image: [imageUrl],
        sku: product.slug,
        category: product.categoryName,
        brand: { "@type": "Brand", name: site.name },
        offers:
          prices.length > 0
            ? {
                "@type": "AggregateOffer",
                priceCurrency: "CNY",
                lowPrice: (Math.min(...prices) / 100).toFixed(2),
                highPrice: (Math.max(...prices) / 100).toFixed(2),
                offerCount: prices.length,
                availability,
                url,
                seller: { "@type": "Organization", name: site.name, url: siteUrl },
              }
            : undefined,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "首页", item: siteUrl },
          { "@type": "ListItem", position: 2, name: product.name, item: url },
        ],
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd }} />
      <ProductDetailView product={product} priceBadge={ctx.affiliateId ? "专属价" : undefined} />
    </>
  );
}
