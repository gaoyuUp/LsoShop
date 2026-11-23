import Link from "next/link";
import { Award } from "lucide-react";
import { agentLeaderboard } from "@/lib/affiliate";
import { getListedProducts } from "@/lib/catalog";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: 1, label: "今日" },
  { value: 7, label: "本周" },
  { value: 30, label: "本月" },
  { value: 0, label: "全部" },
] as const;

export default async function AgentLeaderboardPage({ searchParams }: PageProps<"/promote/leaderboard">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const productId = Number(sp.product);
  const metric = sp.metric === "orders" ? "orders" : "revenue";
  const period = PERIODS.some((p) => p.value === Number(sp.days)) ? (Number(sp.days) as 0 | 1 | 7 | 30) : 30;
  const [products, rows] = await Promise.all([
    getListedProducts(),
    agentLeaderboard({ productId: productId > 0 ? productId : undefined, metric, days: period }),
  ]);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const ownIndex = rows.findIndex((r) => r.affiliateId === agent.id);
  const own = ownIndex >= 0 ? rows[ownIndex] : null;
  const value = (row: (typeof rows)[number]) => metric === "orders" ? `${row.orders} 单` : `¥${formatPrice(row.revenue)}`;
  const productName = products.find((p) => p.id === productId)?.name ?? "全部商品";
  const q = (patch: Record<string, string | number>) => {
    const params = new URLSearchParams({ metric, days: String(period) });
    if (productId > 0) params.set("product", String(productId));
    for (const [k, v] of Object.entries(patch)) params.set(k, String(v));
    return `/promote/leaderboard?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Leaderboard</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">排行榜</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">按完成且符合返佣条件的客户推广订单统计，自购订单不计入。</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-black/[0.06] bg-white p-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="thin-scroll flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href={q({ product: "" })} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px]", !productId ? "bg-foreground text-background" : "text-muted-foreground")}>全部商品</Link>
          {products.map((p) => <Link key={p.id} href={q({ product: p.id })} className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px]", productId === p.id ? "bg-foreground text-background" : "text-muted-foreground")}>{p.name}</Link>)}
        </div>
        <div className="flex shrink-0 gap-2">
          <div className="flex gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
            <Link href={q({ metric: "revenue" })} className={cn("rounded-full px-2.5 py-1 text-[11px]", metric === "revenue" ? "bg-white dark:bg-white/[0.12]" : "text-muted-foreground")}>销售额</Link>
            <Link href={q({ metric: "orders" })} className={cn("rounded-full px-2.5 py-1 text-[11px]", metric === "orders" ? "bg-white dark:bg-white/[0.12]" : "text-muted-foreground")}>单数</Link>
          </div>
          <div className="flex gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
            {PERIODS.map((p) => <Link key={p.value} href={q({ days: p.value })} className={cn("rounded-full px-2 py-1 text-[11px]", period === p.value ? "bg-white dark:bg-white/[0.12]" : "text-muted-foreground")}>{p.label}</Link>)}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-center gap-3 rounded-[28px] border border-black/[0.06] bg-gradient-to-b from-brand/[0.07] to-transparent px-3 pb-5 pt-10 dark:border-white/[0.08] dark:from-brand/[0.1]">
        {[1, 0, 2].map((slot) => {
          const row = top3[slot];
          if (!row) return <div key={slot} className="w-24" />;
          const first = slot === 0;
          return (
            <div key={row.affiliateId} className={cn("flex min-w-0 flex-col items-center", first ? "w-36 -translate-y-4" : "w-28")}>
              <div className={cn("relative grid place-items-center rounded-2xl border-2 bg-white shadow-lg dark:bg-[#1a1821]", first ? "size-16 border-amber-400" : slot === 1 ? "size-12 border-slate-300" : "size-12 border-amber-700/40")}>
                <span className={cn("font-mono font-bold", first ? "text-xl text-amber-500" : "text-sm text-muted-foreground")}>{(row.name || "A").slice(0, 1).toUpperCase()}</span>
                <span className={cn("absolute -right-2 -top-2 grid size-6 place-items-center rounded-full text-[10px] font-bold text-white", first ? "bg-amber-500" : slot === 1 ? "bg-slate-400" : "bg-amber-700")}>{slot + 1}</span>
              </div>
              <div className="mt-2 max-w-full truncate text-[12px] font-medium">{row.name}{row.affiliateId === agent.id && <span className="ml-1 text-[10px] text-brand">你</span>}</div>
              <div className={cn("mt-0.5 font-mono text-[12px] font-semibold", first ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{value(row)}</div>
            </div>
          );
        })}
      </div>

      <section className="rounded-[24px] border border-brand/15 bg-white p-4 dark:border-brand/20 dark:bg-white/[0.04]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[12px] font-medium"><Award className="size-4 text-brand" /> 你的位置</span>
          {own ? <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] text-brand">第 {ownIndex + 1} 名</span> : <span className="text-[11px] text-muted-foreground">暂无排名</span>}
        </div>
        {own ? <div className="mt-2 flex items-center justify-between text-[12px]"><span className="text-muted-foreground">{productName} · 客户推广订单</span><span className="font-mono font-semibold">{value(own)}</span></div> : <p className="mt-2 text-[12px] text-muted-foreground">客户使用你的推广链接完成成交后，就会进入排行榜。</p>}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.04]">
        {rows.length === 0 ? <div className="px-5 py-12 text-center text-[12px] text-muted-foreground">这个商品还没有推广成交，先去分享你的链接吧。</div> : (
          rest.map((row, i) => (
            <div key={row.affiliateId} className={cn("flex items-center gap-3 border-b border-black/[0.05] px-4 py-3 last:border-0 dark:border-white/[0.06]", row.affiliateId === agent.id && "bg-brand/[0.04]")}>
              <span className="w-7 font-mono text-[12px] text-muted-foreground">{i + 4}</span>
              <span className="grid size-8 place-items-center rounded-full bg-black/[0.05] text-[11px] font-semibold dark:bg-white/[0.08]">{(row.name || "A").slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-medium">{row.name}{row.affiliateId === agent.id && <span className="ml-1 text-[10px] text-brand">你</span>}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{productName} · {row.orders} 单</div></div>
              <span className="font-mono text-[12px] font-semibold">{value(row)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
