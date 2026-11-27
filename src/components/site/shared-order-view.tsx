import { CheckCircle2, Clock3, PackageCheck, ShieldCheck, Truck, XCircle } from "lucide-react";
import { CopyButton } from "@/components/agent/copy-button";
import { SharedOrderBankCard } from "./shared-order-bank-card";
import { formatDateTime } from "@/lib/format";
import type { SharedOrderData } from "@/lib/orders";
import { cn } from "@/lib/utils";

const STATUS: Record<
  string,
  { title: string; desc: string; tone: string; icon: typeof CheckCircle2; hint: string }
> = {
  pending: {
    title: "订单待支付",
    desc: "这笔订单还没有完成支付，完成后这里会显示交付内容。",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    icon: Clock3,
    hint: "订单尚未支付，暂时没有交付内容。",
  },
  paid: {
    title: "已付款，等待发货",
    desc: "代理已经完成付款，交付内容会在处理完成后显示在这里。",
    tone: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    icon: Truck,
    hint: "代理已付款，正在等待发货。",
  },
  delivered: {
    title: "订单已完成",
    desc: "以下内容由代理为你购买，请及时保存好交付信息。",
    tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    icon: CheckCircle2,
    hint: "订单已完成。",
  },
  closed: {
    title: "订单已关闭",
    desc: "这笔订单已超时关闭，如有疑问请联系代理。",
    tone: "border-white/10 bg-white/[0.07] text-white/60",
    icon: XCircle,
    hint: "订单已关闭。",
  },
  refunded: {
    title: "订单已退款",
    desc: "这笔订单已退款，如有疑问请联系代理。",
    tone: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    icon: XCircle,
    hint: "订单已退款。",
  },
};

export function SharedOrderView({
  order,
  brandName,
  logoUrl,
}: {
  order: SharedOrderData;
  brandName: string;
  logoUrl?: string;
}) {
  const status = STATUS[order.status] ?? STATUS.closed;
  const StatusIcon = status.icon;
  const allContent = order.deliveryItems.join("\n\n---\n\n");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pt-14">
      <div className="text-center">
        <span
          className={cn(
            "inline-grid size-14 place-items-center rounded-2xl border",
            order.status === "delivered"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-foreground/10 bg-foreground/[0.04] text-muted-foreground",
          )}
        >
          <StatusIcon className="size-6" />
        </span>
        <div className="mt-4 text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground/70">Order result</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{status.title}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{status.desc}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="lg:sticky lg:top-24">
          <SharedOrderBankCard
            order={order}
            brandName={brandName}
            logoUrl={logoUrl}
            statusLabel={status.title}
            statusTone={status.tone}
          />
        </div>

        <div className="space-y-3">
          {order.buyerInput && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-foreground/[0.08] bg-background/60 px-4 py-2.5 text-[11px] backdrop-blur">
              <span className="text-muted-foreground">{order.buyerInputLabel || "下单信息"}</span>
              <span className="font-mono text-foreground/80">{order.buyerInput}</span>
            </div>
          )}

          {order.deliveryItems.length > 0 ? (
            <section className="glass overflow-hidden rounded-[26px]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/[0.07] px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PackageCheck className="size-4 text-brand" />
                  交付内容
                  <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {order.deliveryItems.length}
                  </span>
                </div>
                <CopyButton
                  value={allContent}
                  label="复制全部"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[11px] font-medium text-background transition hover:opacity-90"
                />
              </div>
              <div className="space-y-2.5 p-4 sm:p-5">
                {order.deliveryItems.map((item, index) => (
                  <article key={index} className="overflow-hidden rounded-2xl border border-foreground/[0.08] bg-background/40">
                    <div className="flex items-center justify-between border-b border-foreground/[0.06] px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-2 text-[11px] font-medium">
                        <span className="grid size-5 place-items-center rounded-md bg-foreground font-mono text-[10px] text-background">
                          {index + 1}
                        </span>
                        第 {index + 1} 份
                      </span>
                      <CopyButton
                        value={item}
                        label="复制"
                        className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                      />
                    </div>
                    <pre className="whitespace-pre-wrap break-all px-3.5 py-3 font-mono text-[12px] leading-relaxed text-foreground/85">
                      {item}
                    </pre>
                  </article>
                ))}
              </div>
              <p className="border-t border-foreground/[0.06] px-4 py-3 text-[11px] leading-relaxed text-muted-foreground sm:px-5">
                <ShieldCheck className="mr-1 inline size-3 text-brand" />
                请及时保存以上内容，避免链接或交付信息泄露。
              </p>
            </section>
          ) : (
            <section className="glass flex items-start gap-3 rounded-[26px] p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.05]">
                <Clock3 className="size-4 text-muted-foreground" />
              </span>
              <div>
                <div className="text-sm font-medium">{status.hint}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  交付内容会显示在本页面，刷新后即可看到最新状态。
                </p>
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-muted-foreground">
            <span>下单时间：{formatDateTime(order.createdAt)}</span>
            {order.deliveredAt && <span>完成时间：{formatDateTime(order.deliveredAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
