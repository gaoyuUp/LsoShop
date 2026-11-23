import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  PackagePlus,
  Plus,
  Settings2,
  ShoppingBag,
  Truck,
  TriangleAlert,
} from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/badges";
import { getDashboardData, shanghaiDayKey } from "@/lib/admin-data";
import { listAdminAffiliates, listAdminWithdrawals } from "@/lib/affiliate";
import { formatDateTime, formatPrice } from "@/lib/format";

const money = (cents: number) =>
  `¥${(cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function delta(current: number, prev: number) {
  if (prev === 0) return current > 0 ? { text: "新订单", up: true, neutral: true } : { text: "—", up: true, neutral: true };
  const pct = ((current - prev) / prev) * 100;
  return { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, up: pct >= 0, neutral: false };
}

export default async function AdminDashboardPage() {
  const [data, agents, withdrawals] = await Promise.all([getDashboardData(), listAdminAffiliates(), listAdminWithdrawals()]);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", hour: "2-digit", hour12: false }).format(new Date()));
  const greeting = hour < 6 ? "夜深了" : hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const revenueDelta = delta(data.todayRevenue, data.yesterday.revenue);
  const orderDelta = delta(data.today.orders, data.yesterday.orders);
  const maxRevenue = Math.max(...data.series.map((s) => s.revenue), 1);
  const todayKey = shanghaiDayKey(new Date());
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((s, w) => s + w.amountCents, 0);
  const promoRevenue = agents.reduce((s, a) => s + a.revenue, 0);
  const promoCommission = agents.reduce((s, a) => s + a.commission, 0);

  const stats = [
    {
      label: "今日成交额",
      value: money(data.todayRevenue),
      hint: `昨日 ${money(data.yesterday.revenue)}`,
      delta: revenueDelta,
      icon: CircleDollarSign,
      accent: "from-violet-500/15 to-fuchsia-500/[0.03]",
      iconClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "今日订单",
      value: String(data.today.orders).padStart(2, "0"),
      hint: `昨日 ${data.yesterday.orders} 单`,
      delta: orderDelta,
      icon: ShoppingBag,
      accent: "from-sky-500/15 to-cyan-500/[0.03]",
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "待发货",
      value: String(data.today.pendingShip).padStart(2, "0"),
      hint: data.today.pendingShip > 0 ? "有订单等待处理" : "全部处理完毕",
      delta: null,
      icon: Truck,
      accent: "from-amber-500/15 to-orange-500/[0.03]",
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "可售库存",
      value: data.stock.available.toLocaleString("zh-CN"),
      hint: `累计售出 ${data.stock.sold} 份`,
      delta: null,
      icon: Boxes,
      accent: "from-emerald-500/15 to-teal-500/[0.03]",
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎栏 */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {todayLabel}
            <span className="mx-1 h-3 w-px bg-foreground/10" />
            北京时间
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting}，今天也把交付做漂亮。
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            累计成交 <span className="font-medium text-foreground">{money(data.allTime.revenue)}</span> · 已发货{" "}
            <span className="font-medium text-foreground">{data.allTime.delivered}</span> 单
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background transition hover:opacity-90"
          >
            <Plus className="size-3.5" />
            新建商品
          </Link>
          <Link
            href="/admin/orders?status=paid"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 bg-background/60 px-4 text-xs font-medium transition hover:border-foreground/25"
          >
            <Truck className="size-3.5" />
            去发货
          </Link>
          <Link
            href="/admin/inventory"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 bg-background/60 px-4 text-xs font-medium transition hover:border-foreground/25"
          >
            <PackagePlus className="size-3.5" />
            导入库存
          </Link>
        </div>
      </section>

      {/* 指标卡 */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-18px_rgba(0,0,0,0.28)]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${s.accent} opacity-70`} />
            <div className="relative flex items-start justify-between">
              <span className={`grid size-9 place-items-center rounded-xl ${s.iconClass}`}>
                <s.icon className="size-[18px]" />
              </span>
              {s.delta ? (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-medium ${
                    s.delta.neutral
                      ? "bg-foreground/[0.05] text-muted-foreground"
                      : s.delta.up
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {!s.delta.neutral &&
                    (s.delta.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />)}
                  {s.delta.text}
                </span>
              ) : null}
            </div>
            <div className="relative mt-4">
              <div className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-mono text-[26px] font-semibold leading-none tracking-tight">{s.value}</div>
              <div className="mt-2 text-[13px] text-muted-foreground">{s.hint}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "有效代理", value: `${activeAgents} / ${agents.length}`, hint: "启用 / 全部", href: "/admin/agents" },
          { label: "待处理提现", value: `${pendingWithdrawals.length} 笔`, hint: `¥${formatPrice(pendingWithdrawalAmount)}`, href: "/admin/withdrawals?status=pending" },
          { label: "推广成交额", value: `¥${formatPrice(promoRevenue)}`, hint: "代理推广订单", href: "/admin/agents" },
          { label: "推广佣金", value: `¥${formatPrice(promoCommission)}`, hint: "累计佣金流水", href: "/admin/agents" },
        ].map((x) => (
          <Link key={x.label} href={x.href} className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 transition hover:border-foreground/20">
            <div className="text-[11px] text-muted-foreground">{x.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold">{x.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{x.hint}</div>
          </Link>
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.6fr_1fr]">
        {/* 近 7 天收入 */}
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-5 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">近 7 天成交</h3>
              <p className="mt-1 text-xs text-muted-foreground">按支付时间统计，单位：元</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-semibold">
                {money(data.series.reduce((s, x) => s + x.revenue, 0))}
              </div>
              <div className="text-[12px] text-muted-foreground">7 日合计</div>
            </div>
          </div>

          <div className="relative mt-7">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-dashed border-foreground/[0.05]" />
              ))}
            </div>
            <div className="relative flex h-44 items-end gap-2 pb-5 sm:gap-3">
            {data.series.map((day) => {
              const h = Math.max(4, Math.round((day.revenue / maxRevenue) * 100));
              const isToday = day.day === todayKey;
              return (
                <div key={day.day} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      title={`${day.day} · ${money(day.revenue)} · ${day.count} 单`}
                      className={`w-full rounded-t-lg transition-all duration-500 group-hover:brightness-110 ${
                        isToday
                          ? "bg-gradient-to-t from-brand to-brand-2 shadow-[0_0_24px_-6px_var(--brand)]"
                          : "bg-foreground/[0.09] group-hover:bg-foreground/20"
                      }`}
                      style={{ height: `${h}%`, minHeight: day.revenue > 0 ? 8 : 3 }}
                    />
                    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-1.5 py-0.5 font-mono text-[12px] text-background opacity-0 transition group-hover:opacity-100">
                      {money(day.revenue)}
                    </span>
                  </div>
                  <span className={`text-[12px] ${isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {isToday ? "今天" : day.day.slice(5).replace("-", "/")}
                  </span>
                </div>
              );
            })}
            </div>
          </div>
        </section>

        {/* 库存预警 */}
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-5 backdrop-blur sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                库存水位
                <TriangleAlert className="size-3.5 text-amber-500" />
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">自动发货规格的可售库存，优先展示库存较低项</p>
            </div>
            <Link href="/admin/inventory" className="text-[13px] text-muted-foreground transition hover:text-foreground">
              全部库存
            </Link>
          </div>

          {data.lowStock.length === 0 ? (
            <div className="mt-8 flex flex-col items-center pb-6 text-center">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Boxes className="size-5" />
              </span>
              <p className="mt-3 text-xs text-muted-foreground">库存充足，暂无需补货</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.lowStock.map((v) => (
                <li key={v.variantId}>
                  <Link
                    href={`/admin/inventory?variantId=${v.variantId}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition hover:border-foreground/[0.07] hover:bg-foreground/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{v.variantName}</div>
                      <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{v.productName}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[13px] font-semibold ${
                          v.stock === 0
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : v.stock < 5
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-foreground/[0.05] text-muted-foreground"
                        }`}
                      >
                        {v.stock}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-60" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-foreground/10 p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">商品 / 规格</span>
              <span className="font-mono">
                {data.counts.products} / {data.counts.variants}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                style={{ width: `${Math.min(100, (data.stock.available / Math.max(1, data.stock.available + data.stock.sold)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[12px] text-muted-foreground">可售库存占比</div>
          </div>
        </section>
      </div>

      {/* 最近订单 */}
      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-sm font-semibold">最近订单</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">最新 7 笔订单动态</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition hover:text-foreground"
          >
            查看全部
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <div className="border-t border-foreground/[0.06] px-6 py-14 text-center text-xs text-muted-foreground">
            还没有订单，分享商店链接开始第一笔生意吧
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-foreground/[0.06]">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium sm:px-6">订单</th>
                  <th className="px-3 py-2.5 font-medium">商品</th>
                  <th className="px-3 py-2.5 font-medium">金额</th>
                  <th className="px-3 py-2.5 font-medium">状态</th>
                  <th className="px-3 py-2.5 font-medium">时间</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.recent.map((o) => (
                  <tr key={o.id} className="border-t border-foreground/[0.04] transition hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3 sm:px-6">
                      <div className="font-mono text-xs">{o.orderNo}</div>
                      <div className="mt-0.5 max-w-[180px] truncate text-[12px] text-muted-foreground">{o.email || "未留邮箱"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[200px] truncate text-xs font-medium">{o.productName}</div>
                      <div className="mt-0.5 max-w-[200px] truncate text-[12px] text-muted-foreground">{o.variantName}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">¥{formatPrice(o.totalCents)}</td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3 text-[13px] text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/products", label: "商品与规格", desc: "编辑价格、库存与购买须知", icon: ShoppingBag },
          { href: "/admin/emails", label: "邮件记录", desc: "查看历史交付邮件与发送状态", icon: Settings2 },
          { href: "/admin/settings", label: "站点设置", desc: "公告、客服联系方式与密码", icon: Settings2 },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-3 rounded-2xl border border-foreground/[0.07] bg-background/60 p-4 transition hover:border-foreground/15 hover:bg-background/80"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.04] text-muted-foreground transition group-hover:text-brand">
              <q.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">{q.label}</div>
              <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{q.desc}</div>
            </div>
            <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-60" />
          </Link>
        ))}
      </section>
    </div>
  );
}
