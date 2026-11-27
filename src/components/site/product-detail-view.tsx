import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog";
import { getDictionary } from "@/i18n";
import { CheckoutPanel } from "./checkout-panel";
import { ProductArt } from "./product-art";
import { PurchaseNotice } from "./purchase-notice";
import { RichText } from "./rich-text";

/** 商品详情主体：根路径与代理链接共用，仅面包屑入口/价格由上层传入。 */
export function ProductDetailView({
  product,
  homeHref = "/",
  priceBadge,
  couponCode,
  couponLabel,
}: {
  product: PublicProduct;
  homeHref?: string;
  priceBadge?: string;
  couponCode?: string;
  couponLabel?: string;
}) {
  const t = getDictionary();

  return (
    <div data-theme={product.theme} className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
      <nav aria-label="面包屑" className="flex flex-wrap items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground">
        <Link href={homeHref} className="transition hover:text-foreground">
          首页
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        {product.categoryName !== product.name && (
          <>
            <span>{product.categoryName}</span>
            <ChevronRight className="size-3.5" aria-hidden />
          </>
        )}
        <span className="min-w-0 truncate text-foreground" aria-current="page">
          {product.name}
        </span>
      </nav>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8">
        <div className="space-y-4">
          <div className="glass-card rounded-[30px] p-2.5">
            <div className="relative overflow-hidden rounded-[22px] bg-foreground/[0.025]">
              <ProductArt
                image={product.image}
                name={product.name}
                theme={product.theme}
                size="lg"
                className="aspect-[4/3] w-full"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-full border border-foreground/[0.06] bg-background/55 px-3 py-1 text-xs font-medium backdrop-blur-md">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          <div className="hidden lg:block">
            <PurchaseNotice warnings={product.warnings} notes={product.notes} />
          </div>
        </div>

        <div className="glass rounded-[30px] p-5 sm:p-7 lg:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-brand/15 bg-brand/[0.07] px-2.5 py-1 text-[11px] font-medium text-brand">
              {product.categoryName}
            </span>
            {priceBadge && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {priceBadge}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>
          {product.subtitle && <p className="mt-2 text-muted-foreground">{product.subtitle}</p>}
          {product.description && (
            <RichText text={product.description} className="mt-4 text-sm leading-relaxed text-muted-foreground" />
          )}
          <div className="my-7 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
          {product.variants.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t.product.soldOut}</p>
          ) : (
            <CheckoutPanel product={product} initialCouponCode={couponCode} initialCouponLabel={couponLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
