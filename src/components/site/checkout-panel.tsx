"use client";
import { Check, Loader2, Minus, Plus, Truck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { PublicProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { saveLocalOrder } from "@/lib/local-orders";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { AnimatedPrice } from "./animated-number";
import { AlipayIcon } from "./alipay-icon";
import { PurchaseNotice } from "./purchase-notice";

const EMAIL_DOMAINS = ["qq.com", "163.com", "gmail.com", "outlook.com", "icloud.com", "126.com"];

export function CheckoutPanel({ product }: { product: PublicProduct }) {
  const t = useT();
  const router = useRouter();
  const firstAvailable = product.variants.find((v) => v.stock === null || v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  const [qty, setQty] = useState(variant?.minQuantity ?? 1);
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shakeAgree, setShakeAgree] = useState(0);

  const maxQty = variant ? Math.min(variant.maxQuantity, variant.stock ?? variant.maxQuantity) : 1;
  const soldOut = !variant || variant.stock === 0;
  const total = (variant?.priceCents ?? 0) * qty;

  const suggestions = useMemo(() => {
    const at = email.indexOf("@");
    if (at < 1) return [];
    const domain = email.slice(at + 1).toLowerCase();
    return EMAIL_DOMAINS.filter((d) => d.startsWith(domain) && d !== domain).slice(0, 4);
  }, [email]);

  function pickVariant(id: number) {
    const v = product.variants.find((x) => x.id === id);
    if (!v) return;
    setVariantId(id);
    setQty((q) => Math.min(Math.max(q, v.minQuantity), Math.max(v.minQuantity, Math.min(v.maxQuantity, v.stock ?? v.maxQuantity))));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!variant || soldOut) return;
    if (!agree) {
      setShakeAgree((n) => n + 1);
      toast.warning(t.product.needAgree);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, quantity: qty, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.common.networkError);
      saveLocalOrder({
        orderNo: data.orderNo,
        token: data.token,
        productName: product.name,
        variantName: variant.name,
        totalCents: total,
        createdAt: new Date().toISOString(),
      });
      router.push(`/order/${data.orderNo}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.common.networkError);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      {/* 规格 */}
      <section>
        <Label>{t.product.chooseVariant}</Label>
        <div className="mt-3 grid gap-2.5">
          {product.variants.map((v) => {
            const active = v.id === variant?.id;
            const out = v.stock === 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                onClick={() => pickVariant(v.id)}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300",
                  active
                    ? "border-transparent bg-background/80 shadow-[0_0_0_1.5px_var(--t1),0_10px_30px_-12px_var(--t1)] dark:bg-foreground/[0.06]"
                    : "border-foreground/[0.08] bg-foreground/[0.015] hover:border-foreground/20",
                  out && "cursor-not-allowed opacity-45",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border transition-all",
                    active ? "border-transparent text-white" : "border-foreground/20",
                  )}
                  style={active ? { background: "linear-gradient(135deg, var(--t1), var(--t2))" } : undefined}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="size-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{v.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {v.description}
                    {v.description && " · "}
                    {out ? t.product.soldOut : v.stock === null ? t.product.manual : t.product.stock(v.stock)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-mono text-lg font-semibold">¥{formatPrice(v.priceCents)}</span>
                  {v.originalPriceCents > v.priceCents && (
                    <span className="block font-mono text-xs text-muted-foreground line-through">¥{formatPrice(v.originalPriceCents)}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 数量 */}
      <section className="flex items-center justify-between">
        <div>
          <Label>{t.product.quantity}</Label>
          {variant && <p className="mt-1 text-xs text-muted-foreground">{t.product.limit(variant.minQuantity, variant.maxQuantity)}</p>}
        </div>
        <div className="flex items-center rounded-full border border-foreground/10 bg-foreground/[0.02] p-1">
          <StepButton disabled={!variant || qty <= variant.minQuantity} onClick={() => setQty((q) => q - 1)} label="减少">
            <Minus className="size-4" />
          </StepButton>
          <span className="w-10 overflow-hidden text-center font-mono text-base font-semibold tabular-nums">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={qty} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="inline-block">
                {qty}
              </motion.span>
            </AnimatePresence>
          </span>
          <StepButton disabled={!variant || qty >= maxQty} onClick={() => setQty((q) => q + 1)} label="增加">
            <Plus className="size-4" />
          </StepButton>
        </div>
      </section>

      {/* 邮箱 */}
      <section>
        <div className="flex items-center justify-between">
          <Label htmlFor="email">{t.product.email}</Label>
          {!product.requireEmail && <span className="text-xs text-muted-foreground">{t.product.emailOptional}</span>}
        </div>
        <div className="relative mt-3">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required={product.requireEmail}
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder={t.product.emailPlaceholder}
            className="h-12 w-full rounded-2xl border border-foreground/10 bg-background/60 px-4 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-transparent focus:shadow-[0_0_0_1.5px_var(--t1),0_0_0_6px_color-mix(in_oklch,var(--t1)_15%,transparent)] dark:bg-foreground/[0.03]"
          />
        </div>
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-2 flex flex-wrap gap-1.5">
              {suggestions.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setEmail(email.slice(0, email.indexOf("@") + 1) + d)}
                  className="rounded-full border border-foreground/10 px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                >
                  @{d}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-2 text-xs text-muted-foreground">{t.product.emailHint}</p>
        {product.deliveryHint && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="mt-px size-3.5 shrink-0" />
            {t.product.delivery}：{product.deliveryHint}
          </p>
        )}
      </section>

      <section id="notice" className="scroll-mt-24 lg:hidden">
        <PurchaseNotice warnings={product.warnings} notes={product.notes} />
      </section>

      {/* 同意 + 支付 */}
      <section className="rounded-3xl border border-foreground/[0.08] bg-foreground/[0.02] p-4 sm:border-0 sm:bg-transparent sm:p-0">
        <motion.label
          key={shakeAgree}
          animate={shakeAgree ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
          transition={{ duration: 0.45 }}
          className="flex cursor-pointer select-none items-center gap-2.5 text-sm"
        >
          <span
            className={cn(
              "grid size-5 place-items-center rounded-md border transition-all",
              agree ? "border-transparent text-white" : "border-foreground/25",
            )}
            style={agree ? { background: "linear-gradient(135deg, var(--t1), var(--t2))" } : undefined}
          >
            {agree && <Check className="size-3.5" strokeWidth={3} />}
          </span>
          <input type="checkbox" className="sr-only" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span className="text-muted-foreground">{t.product.agree}</span>
        </motion.label>

        <div className="mt-4 flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-xs text-muted-foreground">{t.product.total}</div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm">¥</span>
              <AnimatedPrice cents={total} className="font-mono text-[28px] font-semibold leading-none tabular-nums" />
            </div>
          </div>
          <button
            type="submit"
            disabled={soldOut || submitting}
            className="group relative flex h-14 flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#1677ff] text-[15px] font-medium text-white shadow-[0_12px_32px_-10px_#1677ff] transition hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {t.product.creating}
              </>
            ) : soldOut ? (
              t.product.soldOut
            ) : (
              <>
                <AlipayIcon className="size-5" />
                {t.product.pay}
              </>
            )}
          </button>
        </div>
      </section>
    </form>
  );
}

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className="text-sm font-semibold tracking-tight" />;
}

function StepButton({ children, label, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-9 place-items-center rounded-full transition hover:bg-foreground/[0.07] active:scale-90 disabled:pointer-events-none disabled:opacity-30"
      {...rest}
    >
      {children}
    </button>
  );
}
