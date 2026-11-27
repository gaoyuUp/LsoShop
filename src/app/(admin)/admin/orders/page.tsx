import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Mail,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { EmailStatusBadge, OrderStatusBadge } from "@/components/admin/badges";
import { CopyButton } from "@/components/admin/copy-button";
import { OrderSourceInfo } from "@/components/admin/order-source";
import { getOrderSummary, listOrders } from "@/lib/admin-data";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "订单管理" };

const TABS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待支付" },
  { value: "paid", label: "待发货" },
  { value: "delivered", label: "已发货" },
  { value: "closed", label: "已关闭" },
  { value: "refunded", label: "已退款" },
] as const;

const SOURCES = [
  { value: "all", label: "全部来源" },
  { value: "normal", label: "主站订单" },
  { value: "affiliate", label: "代理推广" },
  { value: "self", label: "代理自购" },
] as const;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await connection();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const q = typeof sp.q === "string" ? sp.q : "";
  const source = typeof sp.source === "string" && SOURCES.some((item) => item.value === sp.source) ? sp.source : "all";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const [summary, list] = await Promise.all([
    getOrderSummary(),
    listOrders({ status, q, source, page }),
  ]);

  const counts: Record<string, number> = {
    all: summary.all,
    pending: summary.pending,
    paid: summary.paid,
    delivered: summary.delivered,
    closed: summary.closed,
    refunded: summary.refunded,
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (source !== "all") params.set("source", source);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "累计成交", value: `¥${formatPrice(summary.revenue)}`, icon: ShoppingBag, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: "待发货", value: String(summary.paid), icon: Truck, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
          { label: "已发货", value: String(summary.delivered), icon: PackageCheck, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "全部订单", value: String(summary.all), icon: Clock3, tone: "bg-foreground/[0.05] text-muted-foreground" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-xl border border-foreground/[0.07] bg-background/70 p-3.5 backdrop-blur">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", c.tone)}>
              <c.icon className="size-4" />
            </span>
            <div>
              <div className="text-[12px] text-muted-foreground">{c.label}</div>
              <div className="font-mono text-lg font-semibold leading-tight">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/[0.06] px-4 py-3 sm:px-5">
          <div className="thin-scroll flex max-w-full items-center gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = status === t.value;
              const params = new URLSearchParams();
              if (t.value !== "all") params.set("status", t.value);
              if (source !== "all") params.set("source", source);
              if (q) params.set("q", q);
              const href = `/admin/orders${params.toString() ? `?${params}` : ""}`;
              return (
                <Link
                  key={t.value}
                  href={href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                  )}
                >
                  {t.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 font-mono text-[11px]", active ? "bg-background/20" : "bg-foreground/[0.05]")}>
                    {counts[t.value] ?? 0}
                  </span>
                </Link>
              );
            })}
          </div>

          <form method="get" className="flex items-center gap-1.5">
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={q}
                placeholder="订单号 / 邮箱 / 商品 / 推广码"
                className="h-8 w-44 rounded-lg border border-foreground/10 bg-background pl-7 pr-2 text-[12px] outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand sm:w-56"
              />
            </div>
            <select
              name="source"
              defaultValue={source}
              className="h-8 rounded-lg border border-foreground/10 bg-background px-2 text-[12px] outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
            >
              {SOURCES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-lg border border-foreground/10 px-2.5 text-[12px] transition hover:border-foreground/25"
            >
              搜索
            </button>
            {(q || status !== "all" || source !== "all") && (
              <Link
                href="/admin/orders"
                className="inline-flex h-8 items-center rounded-lg px-2 text-[12px] text-muted-foreground transition hover:text-foreground"
              >
                清除
              </Link>
            )}
          </form>
        </div>

        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground">
              <ShoppingBag className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium">没有找到订单</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {q ? `没有与「${q}」匹配的订单` : "调整筛选条件试试"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-xs">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium sm:px-5">订单号</th>
                  <th className="px-3 py-2.5 font-medium">商品</th>
                  <th className="px-3 py-2.5 font-medium">来源</th>
                  <th className="px-3 py-2.5 font-medium">金额</th>
                  <th className="px-3 py-2.5 font-medium">买家邮箱</th>
                  <th className="px-3 py-2.5 font-medium">状态</th>
                  <th className="px-3 py-2.5 font-medium">邮件</th>
                  <th className="px-3 py-2.5 font-medium">下单时间</th>
                  <th className="px-3 py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((o) => (
                  <tr key={o.id} className="border-t border-foreground/[0.04] transition hover:bg-foreground/[0.015]">
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/orders/${o.id}`} className="font-mono text-[13px] hover:underline">
                          {o.orderNo}
                        </Link>
                        <CopyButton text={o.orderNo} />
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">#{o.id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[190px] truncate text-[13px] font-medium">{o.productName}</div>
                      <div className="mt-0.5 max-w-[190px] truncate text-[12px] text-muted-foreground">
                        {o.variantName} × {o.quantity}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <OrderSourceInfo
                        orderType={o.orderType}
                        affiliateId={o.affiliateId}
                        affiliateName={o.agentName}
                        affiliateCode={o.affiliateCode}
                        priceCodeValue={o.priceCodeValue}
                        src={o.src}
                        className="max-w-[230px]"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-[13px] font-medium">¥{formatPrice(o.totalCents)}</td>
                    <td className="px-3 py-3">
                      <div className="max-w-[170px] truncate text-[12px] text-muted-foreground">{o.email || "—"}</div>
                      {o.email && <Mail className="mt-0.5 size-2.5 text-muted-foreground/50" />}
                    </td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-3">
                      <EmailStatusBadge status={o.emailStatus} />
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {o.status === "paid" && (
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="inline-flex h-6 items-center gap-1 rounded-md bg-amber-500/10 px-1.5 text-[12px] font-medium text-amber-600 transition hover:bg-amber-500/15 dark:text-amber-400"
                          >
                            <Truck className="size-2.5" />
                            去发货
                          </Link>
                        )}
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                          title="订单详情"
                        >
                          <ArrowUpRight className="size-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {list.pages > 1 && (
          <div className="flex items-center justify-between border-t border-foreground/[0.06] px-4 py-3 text-[12px] text-muted-foreground sm:px-5">
            <span>
              共 {list.total} 条 · 第 {list.page} / {list.pages} 页
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href={pageHref(Math.max(1, list.page - 1))}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page <= 1 && "pointer-events-none opacity-40",
                )}
              >
                <ArrowLeft className="size-3" />
                上一页
              </Link>
              <Link
                href={pageHref(Math.min(list.pages, list.page + 1))}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page >= list.pages && "pointer-events-none opacity-40",
                )}
              >
                下一页
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
