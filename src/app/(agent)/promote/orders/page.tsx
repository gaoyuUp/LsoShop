import Link from "next/link";
import { ArrowUpRight, Download, Package, ReceiptText } from "lucide-react";
import { agentCommissionSummary, agentOrderStats, agentOrders } from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { startOfShanghaiDay } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: 0, label: "全部" },
  { value: 7, label: "近 7 天" },
  { value: 30, label: "近 30 天" },
  { value: 90, label: "近 90 天" },
] as const;
const STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "待支付", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  paid: { label: "待发货", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  delivered: { label: "已交付", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  closed: { label: "已关闭", tone: "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.07]" },
  refunded: { label: "已退款", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return domain ? `${name.slice(0, 2)}***@${domain}` : email || "—";
}
const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(d);
const clock = (d: Date) => new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

export default async function AgentOrdersPage({ searchParams }: PageProps<"/promote/orders">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const scope = sp.scope === "self" ? "self" : "customers";
  const period = PERIODS.some((p) => p.value === Number(sp.period)) ? (Number(sp.period) as 0 | 7 | 30 | 90) : 0;
  const from = period > 0 ? startOfShanghaiDay(-(period - 1)) : undefined;
  const [orders, stats, summary] = await Promise.all([
    agentOrders(agent.id, scope, from),
    agentOrderStats(agent.id, scope),
    agentCommissionSummary(agent.id),
  ]);
  const gptOrders = stats.products.filter((p) => /gpt|plus|pro/i.test(p.name)).reduce((s, p) => s + p.n, 0);
  const groups = new Map<string, typeof orders>();
  for (const order of orders) {
    const list = groups.get(day(order.createdAt)) ?? [];
    list.push(order);
    groups.set(day(order.createdAt), list);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Orders</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">推广订单</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">客户通过你的链接产生的订单，以及你自己购买的订单。</p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "成交", value: String(stats.total), note: scope === "self" ? "我的订单" : "客户推广订单" },
          { label: "GPT 成交", value: String(gptOrders), note: "GPT / Plus / Pro" },
          { label: "销售额", value: `¥${formatPrice(stats.revenue)}`, note: "已付款 / 已交付" },
          { label: "累计佣金", value: `¥${formatPrice(summary.balance.totalCents)}`, note: `本月 ¥${formatPrice(summary.month.amount)}` },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
            <div className="text-[11px] text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">{c.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.note}</div>
          </div>
        ))}
      </div>

      <section className="rounded-[24px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.07] sm:px-5">
          <div className="flex items-center gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
            {[{ value: "customers" as const, label: "客户的单" }, { value: "self" as const, label: "我下的单" }].map((tab) => (
              <Link key={tab.value} href={`/promote/orders?scope=${tab.value}&period=${period}`} className={cn("rounded-full px-3 py-1.5 text-[11px] transition", scope === tab.value ? "bg-white text-foreground shadow-sm dark:bg-white/[0.12]" : "text-muted-foreground hover:text-foreground")}>{tab.label}</Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-black/[0.035] p-1 dark:bg-white/[0.05]">
              {PERIODS.map((p) => (
                <Link key={p.value} href={`/promote/orders?scope=${scope}&period=${p.value}`} className={cn("rounded-full px-2.5 py-1.5 text-[11px] transition", period === p.value ? "bg-white text-foreground shadow-sm dark:bg-white/[0.12]" : "text-muted-foreground hover:text-foreground")}>{p.label}</Link>
              ))}
            </div>
            <Link href={`/api/agent/orders/export?scope=${scope}&period=${period}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-black/[0.08] px-2.5 text-[11px] dark:border-white/[0.1]"><Download className="size-3.5" /> 导出</Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]"><Package className="size-5 text-muted-foreground" /></span>
            <p className="mt-3 text-sm font-medium">{scope === "customers" ? "还没有客户推广订单" : "还没有你自己的订单"}</p>
            <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{scope === "customers" ? "客户使用你的推广链接下单并完成付款后，订单会出现在这里。" : "你通过自己的推广链接购买时，会记为自购订单，不计佣金。"}</p>
            <Link href={`/r/${agent.code}`} target="_blank" className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-medium text-background">去我的店铺 <ArrowUpRight className="size-3.5" /></Link>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {[...groups.entries()].map(([date, list]) => (
              <div key={date}>
                <div className="flex items-center gap-2 bg-black/[0.018] px-4 py-2 text-[11px] text-muted-foreground dark:bg-white/[0.02] sm:px-5"><ReceiptText className="size-3.5" /> {date}<span className="ml-auto font-mono">{list.length} 单</span></div>
                {list.map((order) => {
                  const s = STATUS[order.status] ?? STATUS.closed;
                  return (
                    <Link key={order.id} href={`/promote/orders/${order.orderNo}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3.5 transition hover:bg-black/[0.02] dark:hover:bg-white/[0.025] sm:px-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium">{order.productName}</span>
                          <span className="text-[11px] text-muted-foreground">{order.variantName}</span>
                          {order.orderType === "self" && <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground dark:bg-white/[0.08]">自购 · 不计佣金</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span>{maskEmail(order.email)}</span><span>·</span><span>{order.quantity} 份</span><span>·</span><span>{clock(order.createdAt)}</span>
                          {order.src && <><span>·</span><span>src: {order.src}</span></>}
                          {order.priceCodeValue && <><span>·</span><span>价位码 {order.priceCodeValue}</span></>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[13px] font-semibold">¥{formatPrice(order.totalCents)}</div>
                        <div className="mt-1 flex items-center justify-end gap-1.5"><span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", s.tone)}>{s.label}</span>{order.orderType === "affiliate" && order.commissionCents > 0 && <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400">+¥{formatPrice(order.commissionCents)}</span>}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </section>

      {stats.products.length > 0 && (
        <section className="rounded-[24px] border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="text-sm font-semibold">商品成交分布</h2>
          <div className="mt-3 space-y-2">
            {stats.products.map((p) => {
              const max = Math.max(...stats.products.map((x) => x.n), 1);
              return <div key={p.name} className="flex items-center gap-3 text-[11px]"><span className="w-28 truncate text-muted-foreground">{p.name}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.07]"><div className="h-full rounded-full bg-brand" style={{ width: `${(p.n / max) * 100}%` }} /></div><span className="w-10 text-right font-mono">{p.n} 单</span></div>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
