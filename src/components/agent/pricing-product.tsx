"use client";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PricingVariantView = {
  id: number;
  name: string;
  systemPriceCents: number;
  originalPriceCents: number;
  costCents: number;
  priceCents: number;
  minCents: number;
  maxCents: number;
  isDefault: boolean;
};

type PricingProductView = {
  id: number;
  name: string;
  categoryName: string;
  image: string;
  variants: PricingVariantView[];
};

function PriceRow({ variant, commissionRate, accent }: { variant: PricingVariantView; commissionRate: number; accent: string }) {
  const [raw, setRaw] = useState((variant.priceCents / 100).toFixed(2));
  const [sliderValue, setSliderValue] = useState(variant.priceCents);

  const parsed = Math.round(Number(raw) * 100);
  const current = Number.isFinite(parsed) ? Math.max(variant.minCents, Math.min(variant.maxCents, parsed)) : variant.priceCents;
  const commission = Math.max(0, Math.round(((current - variant.costCents) * commissionRate) / 100));
  const hasRange = variant.maxCents > variant.minCents;
  const pct = hasRange ? Math.max(0, Math.min(100, ((sliderValue - variant.minCents) / (variant.maxCents - variant.minCents)) * 100)) : 100;
  const discount = variant.originalPriceCents > current ? Math.round(((variant.originalPriceCents - current) / variant.originalPriceCents) * 100) : 0;
  const sliderStyle = {
    accentColor: accent,
    background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(120,120,135,0.18) ${pct}%, rgba(120,120,135,0.18) 100%)`,
    "--slider-accent": accent,
  } as CSSProperties;

  function onNumber(value: string) {
    setRaw(value);
    const cents = Math.round(Number(value) * 100);
    if (Number.isFinite(cents)) setSliderValue(Math.max(variant.minCents, Math.min(variant.maxCents, cents)));
  }
  function onRange(value: number) {
    setSliderValue(value);
    setRaw((value / 100).toFixed(2));
  }
  function normalize() {
    setRaw((current / 100).toFixed(2));
    setSliderValue(current);
  }

  return (
    <div className="rounded-xl border border-black/[0.05] px-3 py-3 dark:border-white/[0.06]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
            {variant.name}
            {variant.isDefault && <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[9px] font-normal text-muted-foreground dark:bg-white/[0.08]">默认价</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span>系统价 ¥{formatPrice(variant.systemPriceCents)}</span>
            <span>划线价 {variant.originalPriceCents > 0 ? `¥${formatPrice(variant.originalPriceCents)}` : "未设置"}</span>
            <span>成本 ¥{formatPrice(variant.costCents)}</span>
          </div>
        </div>
        <div className="rounded-lg bg-emerald-500/[0.07] px-2.5 py-1 text-right">
          <div className="text-[9px] text-emerald-700/70 dark:text-emerald-300/70">预计佣金</div>
          <div className="font-mono text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">+¥{formatPrice(commission)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-muted-foreground">客户支付</span>
          <span className="font-mono text-xl font-semibold tracking-tight" style={{ color: accent }}>¥{formatPrice(current)}</span>
          {discount > 0 && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">省 {discount}%</span>}
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">{hasRange ? `区间 ${Math.round(pct)}%` : "固定价"}</span>
      </div>

      <div className="mt-2 grid items-center gap-3 sm:grid-cols-[1fr_130px]">
        <div>
          <input
            type="range"
            min={variant.minCents}
            max={variant.maxCents}
            step={1}
            value={sliderValue}
            onChange={(e) => onRange(Number(e.target.value))}
            disabled={!hasRange}
            aria-label={`${variant.name} 客户价`}
            style={sliderStyle}
            className="pricing-range h-2 w-full cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed disabled:opacity-40"
          />
          <div className="mt-1.5 flex justify-between font-mono text-[9px] text-muted-foreground">
            <span>系统 ¥{formatPrice(variant.minCents)}</span>
            <span>{hasRange ? `最高 ¥${formatPrice(variant.maxCents)}` : "没有划线价，固定系统价"}</span>
          </div>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">¥</span>
          <input
            name={`price_${variant.id}`}
            type="number"
            min={(variant.minCents / 100).toFixed(2)}
            max={(variant.maxCents / 100).toFixed(2)}
            step="0.01"
            value={raw}
            onChange={(e) => onNumber(e.target.value)}
            onBlur={normalize}
            required
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-background pl-6 pr-2 font-mono text-[12px] outline-none focus:ring-[1.5px] focus:ring-brand dark:border-white/[0.1]"
          />
        </div>
      </div>
    </div>
  );
}

export function PricingProductCard({
  product,
  defaultOpen,
  commissionRate,
  accent = "var(--brand)",
}: {
  product: PricingProductView;
  defaultOpen?: boolean;
  commissionRate: number;
  accent?: string;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className={cn("relative overflow-hidden rounded-[22px] border bg-white transition-colors dark:bg-white/[0.04]", open ? "border-black/[0.09] dark:border-white/[0.11]" : "border-black/[0.06] dark:border-white/[0.08]")}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.05]">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-xs font-semibold text-white" style={{ background: accent }}>{product.name.slice(0, 1)}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold">{product.name}</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">{product.categoryName} · {product.variants.length} 个可设置规格</span>
        </span>
        <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:flex"><Sparkles className="size-3" /> {open ? "收起" : "展开设置"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-black/[0.05] px-3 pb-3 pt-3 dark:border-white/[0.06] sm:px-4">
              {product.variants.map((v) => <PriceRow key={`${v.id}-${v.priceCents}-${v.minCents}-${v.maxCents}`} variant={v} commissionRate={commissionRate} accent={accent} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
