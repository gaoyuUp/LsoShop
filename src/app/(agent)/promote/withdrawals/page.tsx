import { AtSign, CheckCircle2, Clock3, UserRound, Wallet, XCircle } from "lucide-react";
import { AgentField, AgentIconInput } from "@/components/agent/form-ui";
import { cancelWithdrawalAction, requestWithdrawalAction } from "@/lib/actions/agent";
import { agentBalance, agentPendingWithdrawal, agentWithdrawals, getPromoSettings } from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; tone: string; icon: typeof Clock3 }> = {
  pending: { label: "待审核", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: Clock3 },
  paid: { label: "已打款", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  rejected: { label: "已拒绝", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400", icon: XCircle },
  canceled: { label: "已撤回", tone: "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]", icon: XCircle },
};

export default async function AgentWithdrawalsPage({ searchParams }: PageProps<"/promote/withdrawals">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const [balance, pending, rows, settings] = await Promise.all([
    agentBalance(agent.id),
    agentPendingWithdrawal(agent.id),
    agentWithdrawals(agent.id),
    getPromoSettings(),
  ]);
  const disabledReason = pending ? "有一笔提现申请正在处理中" : balance.availableCents < settings.minWithdrawCents ? `可提现金额不足 ¥${formatPrice(settings.minWithdrawCents)}` : "";
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Withdrawals</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">提现</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">满 ¥{formatPrice(settings.minWithdrawCents)} 可申请，后台审核后通过支付宝人工转账。</p>
      </div>

      {sp.error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">{String(sp.error)}</p>}
      {sp.requested === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">提现申请已提交，等待后台审核。</p>}

      <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground"><span>可提现金额</span><Wallet className="size-4 text-brand" /></div>
          <div className="mt-2 font-mono text-3xl font-semibold tracking-tight">¥{formatPrice(balance.availableCents)}</div>
          <div className="mt-2 text-[11px] text-muted-foreground">已结算 ¥{formatPrice(balance.settledCents)} · 已锁定 ¥{formatPrice(balance.reservedCents)}</div>
          {pending && <div className="mt-3 rounded-xl bg-amber-500/[0.07] px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">已有一笔 ¥{formatPrice(pending.amountCents)} 的申请正在处理中，处理完成后才能继续申请。</div>}
        </div>

        <form action={requestWithdrawalAction} className="rounded-[26px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.4)] dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">申请提现</div>
            <span className="rounded-full bg-emerald-500/[0.08] px-2 py-0.5 font-mono text-[10px] text-emerald-700 dark:text-emerald-400">支付宝</span>
          </div>
          <div className="mt-4 space-y-3.5">
            <AgentField label="提现金额（元）" required hint={`本次最多可提 ¥${formatPrice(balance.availableCents)}`}>
              <AgentIconInput icon={Wallet} name="amount" type="number" min={(settings.minWithdrawCents / 100).toFixed(2)} max={(balance.availableCents / 100).toFixed(2)} step="0.01" required defaultValue={balance.availableCents >= settings.minWithdrawCents ? (balance.availableCents / 100).toFixed(2) : ""} disabled={Boolean(pending)} placeholder="0.00" inputClassName="font-mono text-[15px] font-semibold" />
            </AgentField>
            <AgentField label="支付宝账号" required>
              <AgentIconInput icon={AtSign} name="alipayAccount" required maxLength={191} disabled={Boolean(pending)} placeholder="手机号或邮箱" />
            </AgentField>
            <AgentField label="收款人姓名" required>
              <AgentIconInput icon={UserRound} name="payeeName" required maxLength={60} disabled={Boolean(pending)} placeholder="支付宝实名姓名" />
            </AgentField>
          </div>
          <button type="submit" disabled={Boolean(pending) || balance.availableCents < settings.minWithdrawCents} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-foreground text-[12px] font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45">提交提现申请</button>
          <p className="mt-2.5 text-[10px] leading-relaxed text-muted-foreground">{disabledReason || "提交后金额会锁定，审核前可撤回。"}</p>
        </form>

      </section>

      <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="border-b border-black/[0.06] px-4 py-3 text-sm font-semibold dark:border-white/[0.07] sm:px-5">提现与打款</div>
        {rows.length === 0 ? <div className="px-5 py-12 text-center text-[12px] text-muted-foreground">还没有提现记录</div> : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {rows.map((row) => {
              const status = STATUS[row.status] ?? STATUS.pending;
              const StatusIcon = status.icon;
              return (
                <div key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", status.tone)}><StatusIcon className="size-4" /></span>
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-mono text-[13px] font-semibold">¥{formatPrice(row.amountCents)}</span><span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", status.tone)}>{status.label}</span></div><div className="mt-1 text-[11px] text-muted-foreground">支付宝 {row.alipayAccount.slice(-4).padStart(row.alipayAccount.length, "*")} · {row.payeeName} · {new Date(row.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</div>{row.processNote && <div className="mt-1 text-[10px] text-muted-foreground">备注：{row.processNote}</div>}{row.rejectReason && <div className="mt-1 text-[10px] text-rose-500">拒绝原因：{row.rejectReason}</div>}</div>
                  {row.status === "pending" && <form action={cancelWithdrawalAction}><input type="hidden" name="id" value={row.id} /><button type="submit" className="rounded-lg border border-black/[0.08] px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-rose-500 dark:border-white/[0.1]">撤回申请</button></form>}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
