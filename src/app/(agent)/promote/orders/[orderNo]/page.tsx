import Link from "next/link";
import {
  ArrowLeft,
  BadgePercent,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ReceiptText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/agent/copy-button";
import { agentOrderDetail } from "@/lib/affiliate";
import { createOrderShareToken } from "@/lib/orders";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { formatPrice } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "待支付",
  paid: "已付款，待发货",
  delivered: "已交付",
  closed: "已关闭",
  refunded: "已退款",
};

const STATUS_TONE: Record<string, string> = {
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  paid: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  delivered: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  closed: "border-white/10 bg-white/[0.07] text-white/60",
  refunded: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const EMAIL_STATUS: Record<string, string> = {
  sent: "已发送",
  failed: "发送失败",
  skipped: "未启用邮件",
  queued: "待发送",
  none: "未发送",
};

const fmtDate = (value: Date | null) =>
  value ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "—";

export default async function AgentOrderDetailPage({ params }: PageProps<"/promote/orders/[orderNo]">) {
  const agent = await requireAffiliate();
  const { orderNo } = await params;
  const result = await agentOrderDetail(agent.id, orderNo);
  if (!result) notFound();
  const { order, commission } = result;
  const StatusIcon =
    order.status === "delivered"
      ? CheckCircle2
      : order.status === "closed" || order.status === "refunded"
        ? XCircle
        : Clock3;
  const customerLink = absoluteUrl(`/order/${order.orderNo}?share=${encodeURIComponent(createOrderShareToken(order.orderNo))}`);
  const commissionStatus = commission
    ? ({ pending: "待结算", settled: "可提现 / 已结算", revoked: "已撤销", withdrawn: "已提现" }[
        commission.status
      ] ?? commission.status)
    : "无佣金";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/promote/orders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> 返回推广订单
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-2.5 py-1 text-[10px] text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
          <ShieldCheck className="size-3 text-brand" />
          客户链接不显示推广中心、成本与佣金
        </span>
      </div>

      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#151020] p-5 text-white shadow-[0_30px_70px_-32px_rgba(88,52,200,0.8)] sm:p-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 82% 8%, color-mix(in oklch, var(--brand) 46%, transparent), transparent 58%), radial-gradient(ellipse at 4% 100%, color-mix(in oklch, var(--brand-2) 28%, transparent), transparent 56%), linear-gradient(155deg, rgba(255,255,255,0.06), transparent 42%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-brand/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid size-24 shrink-0 place-items-center rounded-[22px] border border-white/10 bg-white/[0.06] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {order.productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.productImage} alt={order.productName} className="size-full object-contain" />
            ) : (
              <span className="grid size-full place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-2xl font-semibold">
                {order.productName.slice(0, 1)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.24em] text-white/40">Order product</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
                  STATUS_TONE[order.status] ?? STATUS_TONE.closed,
                )}
              >
                <StatusIcon className="size-3" />
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight">{order.productName}</h1>
            <p className="mt-1 text-[13px] text-white/55">
              {order.variantName} · {order.quantity} 份
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/45">
              <span className="font-mono">{order.orderNo}</span>
              <span>·</span>
              <span>{fmtDate(order.createdAt)}</span>
              {order.priceCodeValue && (
                <>
                  <span>·</span>
                  <span className="font-mono">价位码 {order.priceCodeValue}</span>
                </>
              )}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">客户实付</div>
            <div className="mt-1 font-mono text-3xl font-semibold tracking-tight">¥{formatPrice(order.totalCents)}</div>
            <div className="mt-1 text-[11px] text-white/45">
              {order.quantity} × ¥{formatPrice(order.unitPriceCents)}
            </div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">Customer order link</div>
            <div className="mt-1 max-w-[540px] truncate font-mono text-[11px] text-white/60">{customerLink}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton
              value={customerLink}
              label="复制客户链接"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.08] px-3 text-[11px] font-medium text-white/85 transition hover:bg-white/[0.14]"
            />
            <Link
              href={customerLink}
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[11px] text-white/60 transition hover:border-white/25 hover:text-white"
            >
              打开客户页 <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        客户打开链接即可直接查看订单和交付内容；页面不会出现推广中心导航，也不会显示订单金额、成本、佣金等推广数据。
      </p>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[24px] border border-black/[0.06] bg-white p-5 text-[12px] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ReceiptText className="size-4 text-brand" /> 订单与客户
          </h2>
          <div className="mt-3">
            {[
              ["订单类型", order.orderType === "self" ? "代理自购（不计佣金）" : "客户推广订单"],
              ["客户邮箱", order.email || "—"],
              ["下单时间", fmtDate(order.createdAt)],
              ["付款时间", fmtDate(order.paidAt)],
              ["交付时间", fmtDate(order.deliveredAt)],
              ["交付方式", order.deliveryMode === "auto" ? "自动发货" : "人工发货"],
              ["邮件通知", EMAIL_STATUS[order.emailStatus] ?? order.emailStatus],
              ["推广码", order.affiliateCode || "—"],
              ["价位码 / 主链接", order.priceCodeValue || "主链接"],
              ["渠道来源", order.src || "—"],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-4 border-t border-black/[0.04] py-2 first:border-0 first:pt-0 dark:border-white/[0.05]"
              >
                <span className="shrink-0 text-muted-foreground">{key}</span>
                <span className="text-right">{value}</span>
              </div>
            ))}
            {order.buyerInput && (
              <div className="flex justify-between gap-4 border-t border-black/[0.04] py-2 dark:border-white/[0.05]">
                <span className="shrink-0 text-muted-foreground">{order.buyerInputLabel || "下单信息"}</span>
                <span className="break-all text-right font-mono">{order.buyerInput}</span>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-black/[0.06] bg-white p-5 text-[12px] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BadgePercent className="size-4 text-brand" /> 推广数据
            <span className="rounded-full bg-brand/[0.08] px-1.5 py-0.5 text-[9px] font-normal text-brand">仅代理可见</span>
          </h2>
          <div className="mt-3">
            {[
              ["系统价", `¥${formatPrice(order.systemPriceCents)}`],
              ["客户实付单价", `¥${formatPrice(order.unitPriceCents)}`],
              ["成本价", `¥${formatPrice(order.costPriceCents)}`],
              ["客户实付总额", `¥${formatPrice(order.totalCents)}`],
              ["本单佣金", `¥${formatPrice(order.commissionCents)}`],
              ["佣金状态", commissionStatus],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-4 border-t border-black/[0.04] py-2 first:border-0 first:pt-0 dark:border-white/[0.05]"
              >
                <span className="shrink-0 text-muted-foreground">{key}</span>
                <span
                  className={cn(
                    "text-right font-mono",
                    key === "本单佣金" && order.commissionCents > 0 && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-black/[0.04] pt-3 leading-relaxed text-muted-foreground dark:border-white/[0.05]">
            佣金按「客户实付 − 成本价」计算。退款或关闭会撤销未提现佣金。客户通过查看链接不会看到本栏数据。
          </p>
        </section>
      </div>
    </div>
  );
}
