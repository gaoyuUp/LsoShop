import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductDetailView } from "@/components/site/product-detail-view";
import { getDictionary } from "@/i18n";
import { getProductBySlug } from "@/lib/catalog";
import { getAgentContext } from "@/lib/agent-context";
import { absoluteUrl, defaultOgImage, plainText, serializeJsonLd, siteUrl } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const t = getDictionary();
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "商品不存在或已下架",
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const url = absoluteUrl(`/products/${product.slug}`);
  const description = plainText(
    product.description || product.subtitle,
    `${product.name}，${t.brand.slogan}，支付宝付款后自动发货。`,
  );
  const image = { ...defaultOgImage, alt: `${product.name} · ${t.brand.name}` };

  return {
    title: product.name,
    description,
    keywords: [product.name, product.categoryName, t.brand.name, "AI 账号", "自动发货"],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url,
      siteName: t.brand.name,
      title: `${product.name} · ${t.brand.name}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${t.brand.name}`,
      description,
      images: [image.url],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  await connection();
  const { slug } = await params;
  const ctx = await getAgentContext();
  const agent = ctx.affiliateId ? { affiliateId: ctx.affiliateId, priceCodeId: ctx.priceCodeId } : undefined;
  const product = await getProductBySlug(slug, agent);
  if (!product) notFound();
  const t = getDictionary();

  const url = absoluteUrl(`/products/${product.slug}`);
  const description = plainText(
    product.description || product.subtitle,
    `${product.name}，${t.brand.slogan}。`,
    300,
  );
  const prices = product.variants.map((variant) => variant.priceCents);
  const imageUrl = product.image ? absoluteUrl(product.image) : absoluteUrl("/og-image.png");
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
        brand: { "@type": "Brand", name: t.brand.name },
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
                seller: { "@type": "Organization", name: t.brand.name, url: siteUrl },
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
