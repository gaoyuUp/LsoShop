"use client";
import { ArrowUpRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/provider";
import { ProductArt } from "./product-art";
import { TiltCard } from "./tilt-card";

export function ProductCard({
  product,
  index,
  href,
  surface = "glass",
  compact = false,
}: {
  product: PublicProduct;
  index: number;
  /** 卡片跳转链接（代理店铺传自己的详情链接，默认走系统价详情） */
  href?: string;
  surface?: "glass" | "plain";
  compact?: boolean;
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
        <TiltCard
          theme={product.theme}
          surface={surface}
          className={cn("flex h-full flex-col", compact ? "p-1.5 max-[359px]:p-2.5 sm:p-2.5" : "p-2.5")}
        >
          <div
            className={cn(
              "relative overflow-hidden bg-foreground/[0.025]",
              compact ? "rounded-[14px] max-[359px]:rounded-[20px] sm:rounded-[20px]" : "rounded-[20px]",
              surface === "plain" &&
                "border border-black/[0.06] shadow-[0_24px_60px_-38px_rgba(40,20,100,0.45)] dark:border-white/[0.08]",
            )}
            style={{ transform: "translateZ(30px)" }}
          >
            <ProductArt image={product.image} name={product.name} theme={product.theme} className="aspect-[5/4]" />
            <span
              className={cn(
                "absolute inline-flex items-center rounded-full bg-background/75 font-medium text-muted-foreground shadow-sm backdrop-blur-md",
                compact
                  ? "right-2 top-2 gap-1 px-2 py-0.5 text-[10px] max-[359px]:right-3 max-[359px]:top-3 max-[359px]:gap-1.5 max-[359px]:px-2.5 max-[359px]:py-1 max-[359px]:text-[11px] sm:right-3 sm:top-3 sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[11px]"
                  : "right-3 top-3 gap-1.5 px-2.5 py-1 text-[11px]",
              )}
            >
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

          <div
            className={cn(
              "flex flex-1 flex-col",
              compact
                ? "px-2 pb-2 pt-3 max-[359px]:px-3.5 max-[359px]:pb-3 max-[359px]:pt-5 sm:px-3.5 sm:pb-3 sm:pt-5"
                : "px-3.5 pb-3 pt-5",
            )}
            style={{ transform: "translateZ(20px)" }}
          >
            <div
              className={cn(
                "flex items-start justify-between",
                compact ? "gap-2 max-[359px]:gap-3 sm:gap-3" : "gap-3",
              )}
            >
              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-semibold tracking-tight",
                    compact
                      ? "line-clamp-2 text-sm max-[359px]:line-clamp-none max-[359px]:block max-[359px]:truncate max-[359px]:text-lg sm:line-clamp-none sm:block sm:truncate sm:text-lg"
                      : "truncate text-lg",
                  )}
                >
                  {product.name}
                </h3>
                <p
                  className={cn(
                    "mt-1 truncate text-sm text-muted-foreground",
                    compact && "hidden max-[359px]:block sm:block",
                  )}
                >
                  {product.subtitle}
                </p>
              </div>
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-500 group-hover/tilt:rotate-45",
                  compact ? "size-7 max-[359px]:size-10 sm:size-10" : "size-10",
                )}
              >
                <ArrowUpRight
                  className={cn(compact ? "size-3.5 max-[359px]:size-[18px] sm:size-[18px]" : "size-[18px]")}
                />
              </span>
            </div>
            <div
              className={cn(
                "mt-auto flex items-end justify-between",
                compact ? "gap-2 pt-4 max-[359px]:gap-0 max-[359px]:pt-6 sm:gap-0 sm:pt-6" : "pt-6",
              )}
            >
              <div className="flex items-baseline gap-1">
                <span
                  className={cn(
                    "text-muted-foreground",
                    compact ? "text-xs max-[359px]:text-sm sm:text-sm" : "text-sm",
                  )}
                >
                  ¥
                </span>
                <span
                  className={cn(
                    "font-mono font-semibold leading-none tracking-tight",
                    compact ? "text-xl max-[359px]:text-[28px] sm:text-[28px]" : "text-[28px]",
                  )}
                >
                  {formatPrice(product.minPriceCents)}
                </span>
                {product.variants.length > 1 && (
                  <span
                    className={cn(
                      "text-muted-foreground",
                      compact ? "text-xs max-[359px]:text-sm sm:text-sm" : "text-sm",
                    )}
                  >
                    {t.product.from}
                  </span>
                )}
                {product.compareAtPriceCents > product.minPriceCents && (
                  <span
                    className={cn(
                      "ml-1 font-mono text-muted-foreground line-through",
                      compact ? "text-[11px] max-[359px]:text-xs sm:text-xs" : "text-xs",
                    )}
                  >
                    ¥{formatPrice(product.compareAtPriceCents)}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs text-muted-foreground",
                  compact && "hidden max-[359px]:inline-flex sm:inline-flex",
                )}
              >
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
