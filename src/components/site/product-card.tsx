"use client";
import { ArrowUpRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useT } from "@/i18n/provider";
import { ProductArt } from "./product-art";
import { TiltCard } from "./tilt-card";

export function ProductCard({
  product,
  index,
  href,
}: {
  product: PublicProduct;
  index: number;
  /** 卡片跳转链接（代理店铺传自己的详情链接，默认走系统价详情） */
  href?: string;
}) {
  const t = useT();
  const soldOut = product.totalStock === 0;
  const target = href ?? `/products/${product.slug}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link href={target} className="block h-full rounded-[28px] outline-offset-4" aria-label={product.name}>
        <TiltCard theme={product.theme} className="flex h-full flex-col p-2.5">
          <div className="relative overflow-hidden rounded-[20px] bg-foreground/[0.025]" style={{ transform: "translateZ(30px)" }}>
            <ProductArt image={product.image} name={product.name} theme={product.theme} className="aspect-[5/4]" />
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md">
              {soldOut ? (
                <>
                  <span className="size-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-500">{t.product.soldOut}</span>
                </>
              ) : product.totalStock === null ? (
                <>
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  {t.product.manual}
                </>
              ) : (
                <>
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {t.product.stock(product.totalStock)}
                </>
              )}
            </span>
          </div>

          <div className="flex flex-1 flex-col px-3.5 pb-3 pt-5" style={{ transform: "translateZ(20px)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold tracking-tight">{product.name}</h3>
                <p className="mt-1 truncate text-sm text-muted-foreground">{product.subtitle}</p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-500 group-hover/tilt:rotate-45">
                <ArrowUpRight className="size-[18px]" />
              </span>
            </div>
            <div className="mt-auto flex items-end justify-between pt-6">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">¥</span>
                <span className="font-mono text-[28px] font-semibold leading-none tracking-tight">
                  {formatPrice(product.minPriceCents)}
                </span>
                {product.variants.length > 1 && <span className="text-sm text-muted-foreground">{t.product.from}</span>}
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="size-3.5" style={{ color: "var(--t1)" }} />
                {product.variants.length} 个规格
              </span>
            </div>
          </div>
        </TiltCard>
      </Link>
    </motion.div>
  );
}
