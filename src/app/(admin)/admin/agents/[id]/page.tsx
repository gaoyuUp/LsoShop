import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { AgentLoginLogsDialog } from "@/components/admin/agent-login-logs-dialog";
import { CopyButton } from "@/components/agent/copy-button";
import { deleteAffiliateAction, toggleAffiliateAction } from "@/lib/actions/admin-affiliates";
import { getAdminAffiliateDetail } from "@/lib/affiliate";
import { requireAdmin } from "@/lib/auth/admin";
import { absoluteUrl } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function AdminAgentDetailPage({ params }: PageProps<"/admin/agents/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminAffiliateDetail(Number(id));
  if (!detail) notFound();
  const { affiliate, invites, codes, bindings, orders, commissions, withdrawals, balance } = detail;
  return (
    <div className="space-y-5">
      <Link href="/admin/agents" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> 返回代理管理</Link>
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-foreground/[0.07] bg-background/70 p-5">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-foreground text-background"><UserRound className="size-6" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{affiliate.nickname || affiliate.email.split("@")[0]}</h1><span className={cn("rounded-full px-2 py-0.5 text-[10px]", affiliate.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-foreground/[0.05] text-muted-foreground")}>{affiliate.status === "active" ? "启用" : "停用"}</span></div>
            <p className="mt-1 text-[12px] text-muted-foreground">{affiliate.email} · {new Date(affiliate.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]"><span className="font-mono">{affiliate.code}</span><CopyButton value={absoluteUrl(`/r/${affiliate.code}`)} label="复制推广链接" /><CopyButton value={absoluteUrl(`/join?invite=${invites[0]?.code ?? ""}`)} label="开通链接" /></div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AgentLoginLogsDialog
            affiliateId={affiliate.id}
            affiliateName={affiliate.nickname || affiliate.email}
            label="登录记录"
            className="h-9 rounded-lg border border-foreground/10 px-3 text-xs text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
          />
          <Link
            href={`/admin/agents/${affiliate.id}/orders`}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-foreground/10 px-3 text-xs text-muted-foreground transition hover:bg-foreground/[0.03] hover:text-foreground"
          >
            <ShoppingBag className="size-3.5" />
            代理订单
          </Link>
          <form action={toggleAffiliateAction}>
            <input type="hidden" name="id" value={affiliate.id} />
            <input type="hidden" name="status" value={affiliate.status === "active" ? "disabled" : "active"} />
            <ConfirmSubmit
              message={
                affiliate.status === "active"
                  ? `停用后「${affiliate.nickname || affiliate.email}」将无法登录推广后台，其推广链接也不再按代理价归因；历史订单、佣金和客户绑定不受影响。`
                  : `启用后「${affiliate.nickname || affiliate.email}」可以重新登录推广后台，推广链接和代理价恢复生效。`
              }
              dialogTitle={affiliate.status === "active" ? "停用代理？" : "启用代理？"}
              confirmText={affiliate.status === "active" ? "确认停用" : "确认启用"}
              tone={affiliate.status === "active" ? "danger" : "success"}
              className="h-9 rounded-lg border border-foreground/10 px-3 text-xs text-muted-foreground transition hover:text-amber-600"
            >
              {affiliate.status === "active" ? "停用代理" : "启用代理"}
            </ConfirmSubmit>
          </form>
          <form action={deleteAffiliateAction}>
            <input type="hidden" name="id" value={affiliate.id} />
            <ConfirmSubmit message={`删除代理「${affiliate.nickname || affiliate.email}」？

只有没有订单、客户、佣金和提现记录的代理才能删除；已有业务数据请使用停用。`} dialogTitle="删除代理账号" confirmText="确认删除" className="inline-flex h-9 items-center gap-1 rounded-lg border border-rose-500/20 px-3 text-xs text-rose-600 hover:bg-rose-500/[0.06] dark:text-rose-400">
              <Trash2 className="size-3.5" /> 删除代理
            </ConfirmSubmit>
          </form>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "绑定客户", value: String(bindings.length) },
          { label: "推广订单", value: String(orders.length) },
          { label: "累计佣金", value: `¥${formatPrice(balance.settledCents + balance.pendingCents)}` },
          { label: "可提现", value: `¥${formatPrice(balance.availableCents)}` },
        ].map((x) => <div key={x.label} className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><div className="text-[11px] text-muted-foreground">{x.label}</div><div className="mt-2 font-mono text-xl font-semibold">{x.value}</div></div>)}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">联系方式</h2><div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground"><span>展示名：{affiliate.nickname || "—"}</span><span>微信：{affiliate.wechat || "—"}</span><span>QQ：{affiliate.qq || "—"}</span><span>Telegram：{affiliate.telegram || "—"}</span><span className="col-span-2 truncate">二维码：{affiliate.wechatQr || "—"}</span></div></section>
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">价位码</h2><div className="mt-3 space-y-1.5 text-[11px]">{codes.length === 0 ? <p className="text-muted-foreground">暂无价位码</p> : codes.map((c) => <div key={c.id} className="flex justify-between gap-2 rounded-lg border border-foreground/[0.05] px-2 py-1.5"><span>{c.name || "未命名"} <span className="font-mono text-muted-foreground">{c.code}</span></span><span className="text-muted-foreground">{c.active ? "启用" : "停用"}</span></div>)}</div></section>
      </div>

      <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">最近推广订单</h2>
          <Link href={`/admin/agents/${affiliate.id}/orders`} className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline">
            查看全部代理订单 <ShoppingBag className="size-3" />
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[11px]"><thead className="text-muted-foreground"><tr><th className="px-2 py-1.5">订单号</th><th className="px-2 py-1.5">商品</th><th className="px-2 py-1.5">金额</th><th className="px-2 py-1.5">佣金</th><th className="px-2 py-1.5">状态</th><th className="px-2 py-1.5">时间</th></tr></thead><tbody>{orders.length === 0 ? <tr><td colSpan={6} className="py-5 text-center text-muted-foreground">暂无推广订单</td></tr> : orders.map((o) => <tr key={o.id} className="border-t border-foreground/[0.04]"><td className="px-2 py-2 font-mono">{o.orderNo}</td><td className="px-2 py-2">{o.productName}<div className="text-[10px] text-muted-foreground">{o.variantName} × {o.quantity}</div></td><td className="px-2 py-2">¥{formatPrice(o.totalCents)}</td><td className="px-2 py-2 text-emerald-600 dark:text-emerald-400">¥{formatPrice(o.commissionCents)}</td><td className="px-2 py-2">{o.status}</td><td className="px-2 py-2 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</td></tr>)}</tbody></table></div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">客户绑定</h2><div className="mt-2 max-h-56 space-y-1.5 overflow-auto">{bindings.length === 0 ? <p className="text-[11px] text-muted-foreground">暂无绑定客户</p> : bindings.map((b) => <div key={b.id} className="flex justify-between gap-2 rounded-lg border border-foreground/[0.05] px-2 py-1.5 text-[11px]"><span className="font-mono">{b.customerEmail}</span><span className="text-muted-foreground">{b.repeatBuy ? "回头客" : "绑定中"}</span></div>)}</div></section>
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">佣金流水</h2><div className="mt-2 max-h-56 space-y-1.5 overflow-auto">{commissions.length === 0 ? <p className="text-[11px] text-muted-foreground">暂无佣金</p> : commissions.map((c) => <div key={c.id} className="flex justify-between gap-2 rounded-lg border border-foreground/[0.05] px-2 py-1.5 text-[11px]"><span className="font-mono">{c.orderNo}</span><span className="text-emerald-600 dark:text-emerald-400">¥{formatPrice(c.amountCents)}</span><span className="text-muted-foreground">{c.status}</span></div>)}</div></section>
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">提现记录</h2><div className="mt-2 space-y-1.5">{withdrawals.length === 0 ? <p className="text-[11px] text-muted-foreground">暂无提现</p> : withdrawals.map((w) => <div key={w.id} className="flex justify-between gap-2 rounded-lg border border-foreground/[0.05] px-2 py-1.5 text-[11px]"><span>¥{formatPrice(w.amountCents)}</span><span className="text-muted-foreground">{w.status}</span><span>{new Date(w.createdAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</span></div>)}</div></section>
        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><h2 className="text-sm font-semibold">邀请码</h2><div className="mt-2 space-y-1.5">{invites.length === 0 ? <p className="text-[11px] text-muted-foreground">暂无关联邀请码</p> : invites.map((i) => <div key={i.id} className="flex justify-between gap-2 rounded-lg border border-foreground/[0.05] px-2 py-1.5 text-[11px]"><span className="font-mono">{i.code}</span><span className="text-muted-foreground">{i.status}</span><CopyButton value={absoluteUrl(`/join?invite=${i.code}`)} label="" /></div>)}</div></section>
      </div>
    </div>
  );
}
