import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, ArrowUpRight, ShoppingBag } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/badges";
import { OrderSourceInfo } from "@/components/admin/order-source";
import { Pagination } from "@/components/admin/pagination";
import { getAffiliateById, getAgentPriceCodes, listAffiliateOrders } from "@/lib/affiliate";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "代理订单" };

const SCOPES = [
  { value: "all", label: "全部订单" },
  { value: "affiliate", label: "推广订单" },
  { value: "self", label: "代理自购" },
] as const;

export default async function AdminAgentOrdersPage({
  params,
  searchParams,
}: PageProps<"/admin/agents/[id]/orders">) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const affiliateId = Number(id);
  if (!Number.isInteger(affiliateId) || affiliateId <= 0) notFound();

  const [affiliate, priceCodes] = await Promise.all([getAffiliateById(affiliateId), getAgentPriceCodes(affiliateId)]);
  if (!affiliate) notFound();

  const sp = await searchParams;
  const scope = SCOPES.some((item) => item.value === sp.scope) ? (sp.scope as (typeof SCOPES)[number]["value"]) : "all";
  const channel =
    sp.channel === "main" || priceCodes.some((code) => code.code === sp.channel)
      ? (sp.channel as string)
      : "all";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const list = await listAffiliateOrders({ affiliateId, scope, channel, page });

  const href = (next: { scope?: string; channel?: string; page?: number }) => {
    const params = new URLSearchParams();
    const nextScope = next.scope ?? scope;
    const nextChannel = next.channel ?? channel;
    if (nextScope !== "all") params.set("scope", nextScope);
    if (nextChannel !== "all") params.set("channel", nextChannel);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return `/admin/agents/${affiliateId}/orders${qs ? `?${qs}` : ""}`;
  };

  const agentName = affiliate.nickname || affiliate.email;

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/agents/${affiliateId}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        返回代理详情
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-foreground/[0.07] bg-background/70 p-5">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Agent orders</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">{agentName} · 代理订单</h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {affiliate.email} · 推广码 <span className="font-mono">{affiliate.code}</span> · 共 {list.total} 笔
          </p>
        </div>
        <div className="rounded-xl border border-brand/15 bg-brand/[0.05] px-3 py-2 text-[11px] text-muted-foreground">
          包含主链接订单与各价位码订单
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 backdrop-blur">
        <div className="space-y-3 border-b border-foreground/[0.06] px-4 py-3 sm:px-5">
          <div className="thin-scroll flex items-center gap-1 overflow-x-auto">
            {SCOPES.map((item) => (
              <Link
                key={item.value}
                href={href({ scope: item.value, page: 1 })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-lg px-2.5 text-[12px] font-medium transition",
                  scope === item.value
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="thin-scroll flex items-center gap-1 overflow-x-auto text-[11px]">
            <span className="mr-1 shrink-0 text-muted-foreground">来源</span>
            <Link
              href={href({ channel: "all", page: 1 })}
              className={cn(
                "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 transition",
                channel === "all"
                  ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
                  : "border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
            >
              全部
            </Link>
            <Link
              href={href({ channel: "main", page: 1 })}
              className={cn(
                "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 transition",
                channel === "main"
                  ? "border-foreground/20 bg-foreground/[0.06] text-foreground"
                  : "border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
              )}
            >
              主链接
            </Link>
            {priceCodes.map((code) => (
              <Link
                key={code.id}
                href={href({ channel: code.code, page: 1 })}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 transition",
                  channel === code.code
                    ? "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    : "border-foreground/10 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {code.name || "价位码"} <span className="font-mono">{code.code}</span>
              </Link>
            ))}
          </div>
        </div>

        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground">
              <ShoppingBag className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium">暂无符合条件的订单</p>
            <p className="mt-1 text-[12px] text-muted-foreground">换一个来源或订单类型试试。</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium sm:px-5">订单号</th>
                  <th className="px-3 py-2.5 font-medium">商品</th>
                  <th className="px-3 py-2.5 font-medium">来源</th>
                  <th className="px-3 py-2.5 font-medium">买家</th>
                  <th className="px-3 py-2.5 font-medium">金额</th>
                  <th className="px-3 py-2.5 font-medium">佣金</th>
                  <th className="px-3 py-2.5 font-medium">状态</th>
                  <th className="px-3 py-2.5 font-medium">时间</th>
                  <th className="px-3 py-2.5 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((order) => (
                  <tr key={order.id} className="border-t border-foreground/[0.04] transition hover:bg-foreground/[0.015]">
                    <td className="px-4 py-3 sm:px-5">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] hover:underline">
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[180px] truncate text-[13px] font-medium">{order.productName}</div>
                      <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">
                        {order.variantName} × {order.quantity}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <OrderSourceInfo
                        orderType={order.orderType}
                        affiliateCode={affiliate.code}
                        priceCodeValue={order.priceCodeValue}
                        src={order.src}
                        showAgent={false}
                        className="max-w-[180px]"
                      />
                    </td>
                    <td className="px-3 py-3 text-[11px] text-muted-foreground">{order.email || "—"}</td>
                    <td className="px-3 py-3 font-mono text-[13px]">¥{formatPrice(order.totalCents)}</td>
                    <td className="px-3 py-3 font-mono text-[13px] text-emerald-600 dark:text-emerald-400">
                      ¥{formatPrice(order.commissionCents)}
                    </td>
                    <td className="px-3 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-3 text-[11px] text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                        title="订单详情"
                      >
                        <ArrowUpRight className="size-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 pb-3 sm:px-5">
          <Pagination
            basePath={`/admin/agents/${affiliateId}/orders`}
            page={list.page}
            total={list.total}
            pageSize={list.pageSize}
            query={{ scope: scope === "all" ? undefined : scope, channel: channel === "all" ? undefined : channel }}
            className="pt-3"
          />
        </div>
      </section>
    </div>
  );
}
