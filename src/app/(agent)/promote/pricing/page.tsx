import Link from "next/link";
import { BadgePercent, Check, Plus, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { CopyButton } from "@/components/agent/copy-button";
import { PricingProductCard, type PricingVariantView } from "@/components/agent/pricing-product";
import {
  createPriceCodeAction,
  deletePriceCodeAction,
  saveAgentPricingAction,
  togglePriceCodeAction,
} from "@/lib/actions/agent";
import { getAgentPriceCode, getAgentPriceCodes, getAgentShop, getPromoSettings } from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const CODE_COLORS = ["#7c5cff", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#6366f1"];
const codeColor = (id: number) => CODE_COLORS[Math.abs(id) % CODE_COLORS.length];

export default async function AgentPricingPage({ searchParams }: PageProps<"/promote/pricing">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const pcId = Number(sp.pc);
  const cat = Number(sp.cat);
  const requestedCode = pcId > 0 ? await getAgentPriceCode(agent.id, pcId) : null;
  const selectedCode = requestedCode?.active ? requestedCode : null;
  const [priceCodes, shop, settings] = await Promise.all([
    getAgentPriceCodes(agent.id),
    getAgentShop(agent.code, selectedCode?.code),
    getPromoSettings(),
  ]);
  if ("invalid" in shop) throw new Error("代理店铺状态异常");

  const categories = [...new Map(shop.products.map((p) => [p.categoryId, { id: p.categoryId, name: p.categoryName, sort: p.categorySort }])).values()].sort((a, b) => a.sort - b.sort || a.id - b.id);
  const products = cat > 0 ? shop.products.filter((p) => p.categoryId === cat) : shop.products;
  const priceCodeId = selectedCode?.id ?? 0;
  const saved = sp.saved === "1";
  const created = sp.created === "1";
  const deleted = sp.deleted === "1";
  const error = typeof sp.error === "string" ? sp.error : "";
  const linkBase = absoluteUrl(`/r/${agent.code}`);
  const atLimit = priceCodes.length >= settings.maxPriceCodes;
  const editingName = selectedCode?.name || "代理主价格";
  const selectedAccent = selectedCode ? codeColor(selectedCode.id) : "#7c5cff";

  const productViews = products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryName: product.categoryName,
    image: product.image,
    variants: product.variants.flatMap((v): PricingVariantView[] => {
      const info = shop.prices.get(v.id);
      if (!v.affiliateEnabled || !info) return [];
      return [{
        id: v.id,
        name: v.name,
        systemPriceCents: info.systemPriceCents,
        originalPriceCents: v.originalPriceCents,
        costCents: info.costCents,
        priceCents: info.priceCents,
        minCents: info.minCents,
        maxCents: info.maxCents,
        isDefault: info.isDefault,
      }];
    }),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Pricing</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">客户价</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">用滑杆或输入框设置客户价，保存后立即应用到代理店铺和下单结算。</p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2 text-[11px] text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
          当前正在编辑：<span className="font-medium text-foreground">{editingName}</span>
        </div>
      </div>

      {error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">{error}</p>}
      {created && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">价位码已创建，现在可以设置它自己的客户价。</p>}
      {deleted && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">价位码已删除，已产生订单的价格快照不受影响。</p>}

      <section className="rounded-[24px] border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold"><BadgePercent className="size-4" style={{ color: selectedAccent }} /> 价位码</div>
          <p className="mt-1 text-[12px] text-muted-foreground">点击卡片切换价位码，当前正在编辑：<span className="font-medium text-foreground">{editingName}</span>。上限 {settings.maxPriceCodes} 个。</p>
          <p className="mt-1 text-[10px] text-muted-foreground">「独立价」按商品统计：只有和代理主价格不同的商品才计数，同一个商品的多个规格算 1 个商品。</p>
        </div>

        <div className={cn("mt-4 rounded-2xl border border-dashed border-black/[0.09] bg-gradient-to-br from-brand/[0.035] via-transparent to-brand-2/[0.035] p-3.5 dark:border-white/[0.12]", atLimit && "opacity-55")}>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium"><span className="grid size-6 place-items-center rounded-lg bg-brand/10 text-brand"><Plus className="size-3.5" /></span> 生成新价位码</div>
          <form action={createPriceCodeAction} className="flex flex-col gap-2.5 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-[10px] font-medium text-muted-foreground">价位码名称 <span className="text-rose-500">*</span></span>
              <input name="name" required maxLength={60} disabled={atLimit} placeholder="例如：老客户专享、朋友圈价" className="h-10 w-full rounded-xl border border-black/[0.09] bg-white px-3.5 text-[12px] shadow-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-brand/40 focus:ring-[2px] focus:ring-brand/10 disabled:cursor-not-allowed dark:border-white/[0.12] dark:bg-white/[0.05]" />
            </label>
            <label className={cn("flex h-10 shrink-0 cursor-pointer select-none items-center gap-2.5 rounded-xl border px-3 text-[11px] transition", atLimit ? "cursor-not-allowed border-black/[0.06] bg-white/50 text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.03]" : "border-black/[0.09] bg-white text-foreground hover:border-brand/35 dark:border-white/[0.12] dark:bg-white/[0.05]")}>
              <input type="checkbox" name="copyCurrent" value="1" defaultChecked disabled={atLimit} className="peer sr-only" />
              <span className="grid size-4 place-items-center rounded-[5px] border border-black/20 text-transparent transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white dark:border-white/25">
                <Check className="size-3" strokeWidth={3} />
              </span>
              复制当前代理价
            </label>
            <button type="submit" disabled={atLimit} className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-foreground px-4 text-[11px] font-medium text-background shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"><Plus className="size-3.5" /> 生成价位码</button>
          </form>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">勾选「复制当前代理价」会把当前主价格复制到新价位码，创建后可逐个商品重新定价；不勾选则先沿用主价格，之后再单独设置。</p>
        </div>
        {atLimit && <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">已达到 {settings.maxPriceCodes} 个价位码上限，请先删除不用的价位码。上限可在后台「设置 → 代理推广设置」调整。</p>}

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <Link href={cat ? `/promote/pricing?cat=${cat}` : "/promote/pricing"} className={cn("relative overflow-hidden rounded-2xl border p-3.5 transition", priceCodeId === 0 ? "border-brand/35 bg-brand/[0.07] shadow-sm" : "border-black/[0.06] hover:border-black/20 dark:border-white/[0.08] dark:hover:border-white/20")}>
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand to-brand-2" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-brand" /><span className="text-[12px] font-semibold">代理主价格</span></div>
              {priceCodeId === 0 && <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[9px] font-medium text-brand">正在编辑</span>}
            </div>
            <div className="mt-2 truncate font-mono text-[10px] text-muted-foreground">{linkBase}</div>
            <div className="mt-2 text-[10px] text-muted-foreground">未设置价位码的默认客户价</div>
          </Link>
          {priceCodes.map((code) => {
            const accent = codeColor(code.id);
            const selected = priceCodeId === code.id;
            return (
              <Link
                key={code.id}
                href={`/promote/pricing?pc=${code.id}${cat ? `&cat=${cat}` : ""}`}
                className={cn("relative overflow-hidden rounded-2xl border p-3.5 transition", selected ? "bg-white shadow-sm dark:bg-white/[0.07]" : "border-black/[0.06] hover:border-black/20 dark:border-white/[0.08] dark:hover:border-white/20")}
                style={selected ? { borderColor: accent, boxShadow: `0 8px 24px -18px ${accent}` } : undefined}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: accent }} />
                    <span className="truncate text-[12px] font-semibold">{code.name || "未命名价位码"}</span>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px]", code.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]")}>{code.active ? "启用" : "停用"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground">
                  <span>{code.code}</span>
                  <span title="只统计与代理主价格不同的商品数，同一商品多个规格只算 1 个">{code.customProductCount > 0 ? `${code.customProductCount} 个商品独立价` : "沿用主价格"}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"><span className="block h-full rounded-full" style={{ width: `${code.customProductCount > 0 ? Math.min(100, code.customProductCount * 16 + 12) : 0}%`, background: accent }} /></div>
              </Link>
            );
          })}
        </div>
        {requestedCode && !requestedCode.active && <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">「{requestedCode.name}」已停用，启用后才能编辑它的价格。</p>}

        {priceCodes.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-black/[0.05] dark:border-white/[0.06]">
            <div className="border-b border-black/[0.04] px-3 py-2 text-[10px] font-medium text-muted-foreground dark:border-white/[0.05]">价位码管理</div>
            {priceCodes.map((code) => {
              const accent = codeColor(code.id);
              return (
                <div key={code.id} className="flex flex-wrap items-center gap-2 border-b border-black/[0.04] px-3 py-2 last:border-0 dark:border-white/[0.05]">
                  <span className="size-2 rounded-full" style={{ background: accent }} />
                  <Link href={`/promote/pricing?pc=${code.id}`} className="min-w-0 text-[11px] font-medium hover:underline">{code.name || "未命名价位码"}</Link>
                  <span className="font-mono text-[10px] text-muted-foreground">{code.code}</span>
                  <span className="text-[10px] text-muted-foreground">{code.customProductCount > 0 ? `${code.customProductCount} 个商品独立价` : "沿用主价格"}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <CopyButton value={absoluteUrl(`/r/${code.code}`)} label="" />
                    <form action={togglePriceCodeAction}>
                      <input type="hidden" name="id" value={code.id} />
                      <input type="hidden" name="active" value={code.active ? "0" : "1"} />
                      <button type="submit" className="text-[10px] text-muted-foreground hover:text-foreground">{code.active ? "停用" : "启用"}</button>
                    </form>
                    <form action={deletePriceCodeAction}>
                      <input type="hidden" name="id" value={code.id} />
                      <ConfirmSubmit message={`删除价位码「${code.name || code.code}」？\n\n它的独立价格配置会一起删除，已产生订单的价格快照不会受影响。`} dialogTitle="删除价位码" confirmText="确认删除" className="inline-flex items-center text-[10px] text-muted-foreground hover:text-rose-500">
                        <Trash2 className="size-3" />
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/[0.06] bg-white p-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="thin-scroll flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href={`/promote/pricing?pc=${priceCodeId}`} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px]", !cat ? "bg-foreground text-background" : "text-muted-foreground")}>全部分类</Link>
          {categories.map((c) => <Link key={c.id} href={`/promote/pricing?pc=${priceCodeId}&cat=${c.id}`} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px]", cat === c.id ? "bg-foreground text-background" : "text-muted-foreground")}>{c.name}</Link>)}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground"><span>佣金比例 {settings.commissionRate}%</span>{saved && <span className="text-emerald-600 dark:text-emerald-400">已保存</span>}</div>
      </div>

      <form action={saveAgentPricingAction} className="space-y-3">
        <input type="hidden" name="priceCodeId" value={priceCodeId} />
        {productViews.length === 0 && <div className="rounded-2xl border border-dashed border-black/10 py-12 text-center text-[12px] text-muted-foreground dark:border-white/10">该分类暂无参与代理销售的商品</div>}
        {productViews.map((product, i) => (
          <PricingProductCard key={`${priceCodeId}-${product.id}`} product={product} defaultOpen={i === 0} commissionRate={settings.commissionRate} accent={selectedAccent} />
        ))}
        {productViews.length > 0 && (
          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.07] bg-white/90 p-3 shadow-lg backdrop-blur dark:border-white/[0.1] dark:bg-[#17151f]/90">
            <p className="text-[11px] text-muted-foreground">价格区间：系统售价 ～ 划线原价；没有划线价时按系统售价。保存后立即应用于客户价和下单。</p>
            <button type="submit" className="inline-flex h-10 items-center rounded-xl bg-foreground px-5 text-xs font-medium text-background">保存客户价</button>
          </div>
        )}
      </form>
    </div>
  );
}
