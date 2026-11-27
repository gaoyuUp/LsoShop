import type { Metadata } from "next";
import { connection } from "next/server";
import { PackageCheck, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { Hero } from "@/components/site/hero";
import { HomeFeaturesEmbed } from "@/components/site/home-features-embed";
import { ProductGrid } from "@/components/site/product-grid";
import { getDictionary } from "@/i18n";
import { getListedProducts, getSetting } from "@/lib/catalog";
import { getAgentPricingContext } from "@/lib/agent-context";
import { absoluteUrl, serializeJsonLd } from "@/lib/seo";
import { getSiteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const t = getDictionary();
const DEFAULT_HOME_KEYWORDS = ["Muse AI", "GPT Plus", "ChatGPT Plus", "AI 成品账号", "AI 订阅服务", "自动发货"];
const STEP_ICONS = [ShoppingBag, Wallet, PackageCheck];

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const homeTitle = `${site.name} · ${site.slogan}`;
  const homeDescription = site.customDescription || `${t.home.title1}${t.home.title2}${t.home.desc}`;
  const ogImage = { url: site.ogImageUrl, width: 1200, height: 630, alt: site.ogImageAlt };

  return {
    title: { absolute: homeTitle },
    description: homeDescription,
    alternates: { canonical: "/" },
    keywords: site.customKeywords.length ? site.customKeywords : DEFAULT_HOME_KEYWORDS,
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: "/",
      siteName: site.name,
      title: homeTitle,
      description: homeDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: homeTitle,
      description: homeDescription,
      images: [ogImage.url],
    },
  };
}

export default async function HomePage() {
  await connection();
  const ctx = await getAgentPricingContext();
  const agent = ctx.affiliateId ? { affiliateId: ctx.affiliateId, priceCodeId: null } : undefined;
  const [products, announcement, site] = await Promise.all([getListedProducts(agent), getSetting("announcement"), getSiteConfig()]);
  const itemListJsonLd =
    products.length > 0
      ? serializeJsonLd({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t.home.sectionTitle,
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.name,
            url: absoluteUrl(`/products/${product.slug}`),
          })),
        })
      : null;

  return (
    <>
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: itemListJsonLd }}
        />
      )}
      <Hero announcement={announcement} compact logoUrl={site.logoUrl}>
        <HomeFeaturesEmbed />
      </Hero>

      <section id="products" className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4 px-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.home.sectionTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.home.sectionDesc}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-foreground/[0.08] bg-background/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              {products.length > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
              <span className={products.length > 0 ? "relative inline-flex size-1.5 rounded-full bg-emerald-500" : "relative inline-flex size-1.5 rounded-full bg-foreground/25"} />
            </span>
            {products.length > 0 ? `${products.length} 件在售` : "暂无在售"}
          </span>
        </div>
        {products.length === 0 ? (
          <div className="glass rounded-3xl py-20 text-center text-sm text-muted-foreground">暂无在售商品</div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 px-2 sm:mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">how it works</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{t.home.stepsTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.home.stepsDesc}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-background/50 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-brand" />
            自动交付 · 全天可用
          </span>
        </div>
        <ol className="glass grid overflow-hidden rounded-[30px] p-2 sm:grid-cols-3">
          {t.home.steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <li
                key={s.title}
                className={cn(
                  "group relative flex gap-4 p-4 transition-colors hover:bg-foreground/[0.02] sm:p-6",
                  i > 0 && "border-t border-foreground/[0.06] sm:border-l sm:border-t-0",
                )}
              >
                <span className="brand-gradient grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg shadow-brand/20">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
                    Step 0{i + 1}
                  </span>
                  <h3 className="mt-1.5 text-base font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
