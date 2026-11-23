import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  CreditCard,
  Image as ImageIcon,
  KeyRound,
  Mail,
  MailCheck,
  MailWarning,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { CopyButton } from "@/components/admin/copy-button";
import { EmailStatusBadge, OrderStatusBadge } from "@/components/admin/badges";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  closeOrderAction,
  confirmPaymentAction,
  deliverOrderAction,
  resendDeliveryMailAction,
  saveOrderRemarkAction,
} from "@/lib/actions/orders";
import { getOrderDetail } from "@/lib/admin-data";
import { getMailStatus } from "@/lib/mail/config";
import { ORDER_STATUS, formatDateTime, formatPrice } from "@/lib/format";
import { isMockPayment } from "@/lib/payment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "订单详情" };

const NOTICE: Record<string, string> = {
  paid: "已确认收款，系统已按规则自动发货",
  delivered: "交付内容已保存，发货通知已处理",
  closed: "订单已关闭，锁定库存已释放",
  refunded: "订单已退款，锁定库存已释放",
  remark: "管理备注已保存",
};

const MAIL_NOTICE: Record<string, { text: string; ok: boolean }> = {
  sent: { text: "邮件已重新发送成功", ok: true },
  skipped: { text: "邮箱服务未启用，本次邮件已记录但未真正发送", ok: false },
  failed: { text: "邮件发送失败，请检查 SMTP 配置后重试", ok: false },
};

const STATUS_ICON: Record<string, typeof Clock3> = {
  pending: Clock3,
  paid: Truck,
  delivered: PackageCheck,
  closed: XCircle,
  refunded: RotateCcw,
};

export default async function AdminOrderDetailPage({ params, searchParams }: PageProps<"/admin/orders/[id]">) {
  await connection();
  const { id } = await params;
  const [data, mailStatus] = await Promise.all([getOrderDetail(Number(id)), getMailStatus()]);
  if (!data) notFound();
  const { order, mails } = data;
  const sp = await searchParams;

  const notice = typeof sp.notice === "string" ? sp.notice : "";
  const mail = typeof sp.mail === "string" ? sp.mail : "";
  const error = typeof sp.error === "string" ? sp.error : "";
  const canDeliver = order.status === "paid" || order.status === "delivered";
  const StatusIcon = STATUS_ICON[order.status] ?? Clock3;
  const statusLabel = ORDER_STATUS[order.status]?.label ?? order.status;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          返回订单列表
        </Link>
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="font-mono">{order.orderNo}</span>
          <CopyButton text={order.orderNo} />
          <span className="h-3 w-px bg-foreground/10" />
          <span>ID #{order.id}</span>
        </div>
      </div>

      {notice && NOTICE[notice] && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          {NOTICE[notice]}
        </div>
      )}
      {mail && MAIL_NOTICE[mail] && (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-xs",
            MAIL_NOTICE[mail].ok
              ? "border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-600 dark:text-emerald-400"
              : "border border-amber-500/20 bg-amber-500/[0.07] text-amber-600 dark:text-amber-400",
          )}
        >
          {MAIL_NOTICE[mail].text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* 状态横幅 */}
      <section className="relative overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 p-5 backdrop-blur sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl",
                order.status === "delivered" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                order.status === "paid" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                order.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                order.status === "refunded" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                order.status === "closed" && "bg-foreground/[0.05] text-muted-foreground",
              )}
            >
              <StatusIcon className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{statusLabel}</h2>
                <OrderStatusBadge status={order.status} />
                {order.deliveryMode === "auto" ? (
                  <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[12px] text-muted-foreground">自动发货</span>
                ) : (
                  <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[12px] text-muted-foreground">人工发货</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.status === "pending" && "等待买家支付。若已通过其他方式收款，可手动确认支付。"}
                {order.status === "paid" && "买家已付款，请填写交付内容并标记发货。"}
                {order.status === "delivered" && `已于 ${formatDateTime(order.deliveredAt)} 完成发货。`}
                {order.status === "closed" && "订单已关闭，库存已释放。"}
                {order.status === "refunded" && "订单已退款。"}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-[12px] text-muted-foreground">订单金额</div>
            <div className="font-mono text-2xl font-semibold tracking-tight">¥{formatPrice(order.totalCents)}</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              {order.quantity} × ¥{formatPrice(order.unitPriceCents)}
            </div>
          </div>
        </div>
      </section>

      {order.orderType !== "normal" && (
        <section className="rounded-2xl border border-brand/15 bg-brand/[0.04] p-4 text-[12px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-brand">{order.orderType === "self" ? "代理自购 · 不计佣金" : "代理推广订单"}</span>
              {order.affiliateCode && <span className="rounded-full bg-background/60 px-2 py-0.5 font-mono text-[11px]">推广码 {order.affiliateCode}</span>}
              {order.priceCodeValue && <span className="rounded-full bg-background/60 px-2 py-0.5 font-mono text-[11px]">价位码 {order.priceCodeValue}</span>}
              {order.src && <span className="rounded-full bg-background/60 px-2 py-0.5 text-[11px]">src {order.src}</span>}
            </div>
            <div className="flex gap-4 font-mono text-[11px]"><span>系统价 ¥{formatPrice(order.systemPriceCents)}</span><span>成本 ¥{formatPrice(order.costPriceCents)}</span><span className="text-emerald-600 dark:text-emerald-400">佣金 ¥{formatPrice(order.commissionCents)}</span></div>
          </div>
        </section>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {/* 商品 */}
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <div className="flex gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-foreground/[0.06] bg-foreground/[0.03]">
                {order.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.productImage} alt={order.productName} className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{order.productName}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.variantName} × {order.quantity}
                    </p>
                  </div>
                  <Link
                    href={`/admin/products/${order.productId}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-foreground/10 px-2 py-1 text-[12px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                  >
                    商品
                    <ArrowUpRight className="size-2.5" />
                  </Link>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                  <div className="rounded-lg bg-foreground/[0.025] px-2.5 py-1.5">
                    <span className="text-muted-foreground">买家邮箱</span>
                    <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[13px]">
                      {order.email || "未填写"}
                      {order.email && <CopyButton text={order.email} />}
                    </div>
                  </div>
                  <div className="rounded-lg bg-foreground/[0.025] px-2.5 py-1.5">
                    <span className="text-muted-foreground">邮件状态</span>
                    <div className="mt-1">
                      <EmailStatusBadge status={order.emailStatus} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 交付内容 */}
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <KeyRound className="size-4 text-brand" />
                  交付内容
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  多份内容之间用单独一行 <code className="rounded bg-foreground/[0.06] px-1 font-mono">---</code> 分隔；保存后会同步更新买家订单页。
                </p>
              </div>
              {order.deliveryContent && <CopyButton text={order.deliveryContent} label="复制内容" className="h-7 border border-foreground/10 px-2" />}
            </div>

            {canDeliver ? (
              <form action={deliverOrderAction} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <textarea
                  name="content"
                  defaultValue={order.deliveryContent ?? ""}
                  rows={9}
                  placeholder={`账号：xxx@outlook.com\n密码：xxxxxx\n接码链接：https://...`}
                  className="thin-scroll w-full resize-y rounded-xl border border-foreground/10 bg-background p-3.5 font-mono text-[13px] leading-relaxed outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
                    <input type="checkbox" name="notify" value="1" defaultChecked className="size-3.5 accent-emerald-500" />
                    保存后发送发货邮件
                    {!mailStatus.enabled && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] text-amber-600 dark:text-amber-400">邮箱未启用，仅记录</span>}
                  </label>
                  <SubmitButton pendingText="处理中…">
                    <Send className="mr-1 size-3.5" />
                    {order.status === "delivered" ? "保存并通知" : "标记已发货"}
                  </SubmitButton>
                </div>
              </form>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-6 text-center text-[13px] text-muted-foreground">
                {order.deliveryContent ? (
                  <pre className="whitespace-pre-wrap break-all text-left font-mono text-[13px] leading-relaxed">{order.deliveryContent}</pre>
                ) : (
                  "订单尚未付款，付款后才能填写交付内容。"
                )}
              </div>
            )}

            {order.status === "delivered" && order.email && (
              <form action={resendDeliveryMailAction} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-foreground/[0.06] bg-foreground/[0.02] px-3.5 py-2.5">
                <input type="hidden" name="id" value={order.id} />
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Mail className="size-3.5" />
                  重新发送交付邮件到 {order.email}
                </div>
                <SubmitButton variant="outline" pendingText="发送中…" className="h-7 px-2.5 text-[12px]">
                  <RefreshCw className="mr-1 size-3" />
                  重发邮件
                </SubmitButton>
              </form>
            )}
          </section>

          {/* 支付确认 */}
          {order.status === "pending" && (
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
                <WalletCards className="size-4" />
                确认收款
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                如果买家已通过支付宝或其他方式付款，可以在这里手动确认。确认后自动发货规格会立即从库存发货，并发送交付邮件。
                {isMockPayment() && <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-700 dark:text-amber-300">当前为模拟支付模式</span>}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={confirmPaymentAction}>
                  <input type="hidden" name="id" value={order.id} />
                  <ConfirmSubmit
                    message="确定已收到该订单的款项吗？确认后将标记为已支付并尝试自动发货。"
                    dialogTitle="确认已收款？"
                    confirmText="确认已收款"
                    tone="success"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-[13px] font-medium text-white transition hover:bg-emerald-600"
                  >
                    <ShieldCheck className="size-3.5" />
                    确认已收款
                  </ConfirmSubmit>
                </form>
                <span className="text-[12px] text-muted-foreground">请先核实款项，避免误发货</span>
              </div>
            </section>
          )}

          {/* 管理备注 */}
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <h3 className="text-sm font-semibold">管理备注</h3>
            <form action={saveOrderRemarkAction} className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <input type="hidden" name="id" value={order.id} />
              <input
                name="remark"
                defaultValue={order.adminRemark}
                maxLength={500}
                placeholder="例如：买家已联系客服补发、特殊情况说明…"
                className="h-9 flex-1 rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
              />
              <SubmitButton variant="outline" pendingText="保存中…" className="h-9">
                保存备注
              </SubmitButton>
            </form>
          </section>

          {(order.status === "paid" || order.status === "delivered") && (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/[0.025] px-4 py-3.5">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  <RotateCcw className="size-3.5" />
                  {order.status === "paid" ? "取消订单" : "标记退款"}
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {order.status === "paid"
                    ? "关闭未发货订单并释放锁定库存"
                    : "标记退款后订单将结束，已售库存不会自动恢复"}
                </p>
              </div>
              <form action={closeOrderAction}>
                <input type="hidden" name="id" value={order.id} />
                <ConfirmSubmit
                  message={
                    order.status === "paid"
                      ? "确定取消该订单吗？订单将关闭并释放锁定库存。"
                      : "确定将该订单标记为已退款吗？此操作不会自动恢复已售库存。"
                  }
                  dialogTitle={order.status === "paid" ? "确认取消订单？" : "确认退款？"}
                  confirmText={order.status === "paid" ? "确认取消" : "确认退款"}
                  className="inline-flex h-8 items-center rounded-lg border border-rose-500/20 px-3 text-[13px] text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                >
                  {order.status === "paid" ? "取消订单" : "标记退款"}
                </ConfirmSubmit>
              </form>
            </section>
          )}
        </div>

        {/* 右侧信息 */}
        <aside className="space-y-4">
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="size-4 text-brand" />
              订单进度
            </h3>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <MetaRow label="创建订单" value={formatDateTime(order.createdAt)} />
              <MetaRow label="支付时间" value={formatDateTime(order.paidAt)} muted={!order.paidAt} />
              <MetaRow label="发货时间" value={formatDateTime(order.deliveredAt)} muted={!order.deliveredAt} />
              <MetaRow label="支付超时" value={formatDateTime(order.expiresAt)} muted={Boolean(order.paidAt)} />
            </dl>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="size-4 text-brand" />
              支付信息
            </h3>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <MetaRow label="支付方式" value={order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod} />
              <MetaRow label="渠道交易号" value={order.tradeNo || "—"} mono />
              <MetaRow label="买家 IP" value={order.clientIp || "—"} mono />
              <MetaRow label="交付方式" value={order.deliveryMode === "auto" ? "自动发货" : "人工发货"} />
            </dl>
          </section>

          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Mail className="size-4 text-brand" />
                邮件记录
              </h3>
              <span className="font-mono text-[12px] text-muted-foreground">{mails.length}</span>
            </div>
            {mails.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-foreground/15 px-3 py-5 text-center text-[12px] text-muted-foreground">
                还没有发送记录
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {mails.slice(0, 5).map((m) => (
                  <li key={m.id} className="rounded-lg border border-foreground/[0.06] bg-foreground/[0.015] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <EmailStatusBadge status={m.status} />
                      <span className="text-[11px] text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                      {m.status === "sent" ? (
                        <MailCheck className="size-3 shrink-0 text-emerald-500" />
                      ) : (
                        <MailWarning className="size-3 shrink-0 text-amber-500" />
                      )}
                      <span className="truncate">{m.toEmail}</span>
                    </div>
                    {m.error && <p className="mt-1 line-clamp-2 text-[11px] text-rose-500">{m.error}</p>}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/emails"
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-foreground/10 py-1.5 text-[12px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
            >
              查看全部邮件
              <ArrowUpRight className="size-2.5" />
            </Link>
          </section>

          <div className="flex items-start gap-2 rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] p-3 text-[12px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            <p>订单编号与查询口令共同保护买家隐私。请勿在公开渠道泄露交付内容。</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("text-right", mono && "font-mono text-[12px]", muted && "text-muted-foreground/60")}>{value}</dd>
    </div>
  );
}
