import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { processWithdrawalAction } from "@/lib/actions/admin-affiliates";
import { getAdminWithdrawalSummary, listAdminWithdrawals } from "@/lib/affiliate";
import { Pagination } from "@/components/admin/pagination";
import { requireAdmin } from "@/lib/auth/admin";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "提现管理" };
const TABS = [{ value: "", label: "全部" }, { value: "pending", label: "待处理" }, { value: "paid", label: "已打款" }, { value: "rejected", label: "已拒绝" }];

export default async function AdminWithdrawalsPage({ searchParams }: PageProps<"/admin/withdrawals">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && ["pending", "paid", "rejected"].includes(sp.status) ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 20;
  const [rows, summary] = await Promise.all([
    listAdminWithdrawals(status || undefined, { page, pageSize }),
    getAdminWithdrawalSummary(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">提现管理</h1><p className="mt-1 text-[13px] text-muted-foreground">人工支付宝转账后在这里标记打款；处理前可拒绝并记录原因。</p></div><Link href="/admin/settings#promo" className="inline-flex h-8 items-center rounded-full border border-foreground/10 px-3 text-[11px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground">设置最低提现额度</Link></div>
      {sp.error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">{String(sp.error)}</p>}
      {sp.processed && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">提现申请已处理</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {[{ label: "待处理申请", value: `${summary.pendingCount} 笔` }, { label: "待处理金额", value: `¥${formatPrice(summary.pendingAmount)}` }, { label: "提现记录", value: `${summary.total} 笔` }].map((c) => <div key={c.label} className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4"><div className="text-[11px] text-muted-foreground">{c.label}</div><div className="mt-2 font-mono text-xl font-semibold">{c.value}</div></div>)}
      </div>
      <div className="flex items-center gap-1 rounded-full bg-foreground/[0.04] p-1 w-fit">{TABS.map((t) => <Link key={t.value} href={`/admin/withdrawals${t.value ? `?status=${t.value}` : ""}`} className={cn("rounded-full px-3 py-1.5 text-[11px]", status === t.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{t.label}</Link>)}</div>
      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70">
        {rows.length === 0 ? <div className="flex flex-col items-center px-5 py-16 text-center"><Wallet className="size-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">暂无提现申请</p></div> : rows.map((row) => (
          <div key={row.id} className="border-b border-foreground/[0.06] px-4 py-4 last:border-0 sm:px-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={`/admin/agents/${row.affiliateId}`} className="text-[13px] font-medium hover:underline">{row.nickname || row.email.split("@")[0]}</Link><span className={cn("rounded-full px-2 py-0.5 text-[10px]", row.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : row.status === "paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>{row.status === "pending" ? "待处理" : row.status === "paid" ? "已打款" : "已拒绝"}</span></div><div className="mt-1 text-[11px] text-muted-foreground">{row.email} · {new Date(row.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</div><div className="mt-1 text-[11px] text-muted-foreground">支付宝：{row.alipayAccount} · 收款人：{row.payeeName}</div>{row.processNote && <div className="mt-1 text-[10px] text-muted-foreground">备注：{row.processNote}</div>}{row.rejectReason && <div className="mt-1 text-[10px] text-rose-500">拒绝原因：{row.rejectReason}</div>}</div>
              <div className="font-mono text-xl font-semibold">¥{formatPrice(row.amountCents)}</div>
            </div>
            {row.status === "pending" && <form action={processWithdrawalAction} className="mt-3 flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={row.id} /><input name="note" maxLength={300} placeholder="处理备注 / 拒绝原因（选填）" className="h-8 min-w-[220px] flex-1 rounded-lg border border-foreground/10 bg-background px-2.5 text-[11px] outline-none" /><button name="action" value="paid" className="h-8 rounded-lg bg-emerald-600 px-3 text-[11px] font-medium text-white">标记已打款</button><button name="action" value="rejected" className="h-8 rounded-lg border border-rose-500/20 px-3 text-[11px] text-rose-600 dark:text-rose-400">拒绝</button></form>}
          </div>
        ))}
      </section>
      <Pagination basePath="/admin/withdrawals" page={page} total={summary.total} pageSize={pageSize} query={{ status: status || undefined }} />
    </div>
  );
}
