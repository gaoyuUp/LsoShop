import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Package, XCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { agentOrderDetail } from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "待支付",
  paid: "已付款，待发货",
  delivered: "已交付",
  closed: "已关闭",
  refunded: "已退款",
};

export default async function AgentOrderDetailPage({ params }: PageProps<"/promote/orders/[orderNo]">) {
  const agent = await requireAffiliate();
  const { orderNo } = await params;
  const result = await agentOrderDetail(agent.id, orderNo);
  if (!result) notFound();
  const { order, commission } = result;
  const StatusIcon = order.status === "delivered" ? CheckCircle2 : order.status === "closed" || order.status === "refunded" ? XCircle : Clock3;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/promote/orders" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-3.5" /> 返回推广订单
      </Link>
      <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package className="size-3.5" /> {order.orderNo}</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{order.productName}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{order.variantName} · {order.quantity} 份</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold">¥{formatPrice(order.totalCents)}</div>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2 py-1 text-[11px] text-muted-foreground dark:bg-white/[0.07]">
              <StatusIcon className="size-3.5" /> {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 text-[12px] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="mb-3 text-sm font-semibold">订单信息</h2>
          {[
            ["订单类型", order.orderType === "self" ? "代理自购（不计佣金）" : "客户推广订单"],
            ["客户邮箱", order.email || "—"],
            ["下单时间", new Date(order.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })],
            ["付款时间", order.paidAt ? new Date(order.paidAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "—"],
            ["交付时间", order.deliveredAt ? new Date(order.deliveredAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "—"],
            ["渠道来源", order.src || "—"],
            ["价位码", order.priceCodeValue || "主价格"],
          ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t border-black/[0.04] py-2 first:border-0 first:pt-0 dark:border-white/[0.05]"><span className="shrink-0 text-muted-foreground">{k}</span><span className="text-right">{v}</span></div>)}
        </section>
        <section className="rounded-[22px] border border-black/[0.06] bg-white p-5 text-[12px] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="mb-3 text-sm font-semibold">价格与佣金</h2>
          {[
            ["系统价", `¥${formatPrice(order.systemPriceCents)}`],
            ["客户实付单价", `¥${formatPrice(order.unitPriceCents)}`],
            ["成本价", `¥${formatPrice(order.costPriceCents)}`],
            ["本单佣金", `¥${formatPrice(order.commissionCents)}`],
            ["佣金状态", commission ? ({ pending: "待结算", settled: "可提现/已结算", revoked: "已撤销", withdrawn: "已提现" }[commission.status] ?? commission.status) : "无佣金"],
          ].map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-t border-black/[0.04] py-2 first:border-0 first:pt-0 dark:border-white/[0.05]"><span className="shrink-0 text-muted-foreground">{k}</span><span className={cn("text-right font-mono", k === "本单佣金" && order.commissionCents > 0 && "text-emerald-600 dark:text-emerald-400")}>{v}</span></div>)}
          <p className="mt-3 border-t border-black/[0.04] pt-3 leading-relaxed text-muted-foreground dark:border-white/[0.05]">佣金按「客户实付 − 成本价」计算。退款或关闭会撤销未提现佣金。</p>
        </section>
      </div>
    </div>
  );
}
