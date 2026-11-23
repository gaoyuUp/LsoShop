import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Plus, Search, Ticket, Trash2, Users } from "lucide-react";
import { CopyButton } from "@/components/agent/copy-button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Pagination } from "@/components/admin/pagination";
import {
  createInviteAction,
  deleteAffiliateAction,
  deleteInviteAction,
  disableInviteAction,
  toggleAffiliateAction,
} from "@/lib/actions/admin-affiliates";
import {
  countAdminAffiliates,
  countInvites,
  countUnusedInvites,
  getAdminAffiliateSummary,
  getPromoSettings,
  listAdminAffiliates,
  listInvites,
} from "@/lib/affiliate";
import { requireAdmin } from "@/lib/auth/admin";
import { absoluteUrl } from "@/lib/seo";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "代理管理" };

const inviteStatus = (row: { status: string; expiresAt: Date | null }) => {
  if (row.status === "used") return { label: "已使用", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  if (row.status === "disabled") return { label: "已停用", tone: "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]" };
  if (row.status === "expired" || (row.expiresAt && row.expiresAt < new Date())) return { label: "已过期", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  return { label: "未使用", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
};

export default async function AdminAgentsPage({ searchParams }: PageProps<"/admin/agents">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const ipage = Math.max(1, Number(sp.ipage) || 1);
  const pageSize = 20;
  const invitePageSize = 10;
  const [agents, totalAgents, summary, invites, totalInvites, unusedInvites, settings] = await Promise.all([
    listAdminAffiliates({ q, page, pageSize }),
    countAdminAffiliates(q),
    getAdminAffiliateSummary(),
    listInvites({ page: ipage, pageSize: invitePageSize }),
    countInvites(),
    countUnusedInvites(),
    getPromoSettings(),
  ]);
  const showTestInbox = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_CODE_INBOX === "1";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">代理管理</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">管理邀请码、代理账号与推广数据。代理与管理员登录体系完全独立。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {showTestInbox && (
            <Link href="/admin/dev/codes" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 text-[11px] text-amber-700 transition hover:bg-amber-500/10 dark:text-amber-300">
              <Inbox className="size-3.5" />
              测试验证码
            </Link>
          )}
          <span className="rounded-full border border-foreground/10 px-3 py-1 text-[11px] text-muted-foreground">邀请制 · 不开放注册</span>
        </div>
      </div>

      {sp.error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">{String(sp.error)}</p>}
      {sp.created === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">邀请码已创建，可以复制开通链接发给代理。</p>}
      {sp.deletedInvite === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">未使用的邀请码已删除。</p>}
      {sp.deletedAgent === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">代理账号已删除。</p>}
      {sp.status === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">代理状态已更新。</p>}
      {sp.disabled === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">邀请码已停用。</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "有效代理", value: `${summary.active} / ${summary.total}`, hint: "启用 / 全部" },
          { label: "累计推广成交", value: `¥${formatPrice(summary.revenue)}`, hint: "已付款 / 已交付订单" },
          { label: "可提现余额", value: `¥${formatPrice(summary.withdrawable)}`, hint: "扣减待处理/已打款申请后" },
          { label: "邀请码", value: `${unusedInvites} 个可用`, hint: "共 " + totalInvites + " 个" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4">
            <div className="text-[11px] text-muted-foreground">{c.label}</div>
            <div className="mt-2 font-mono text-xl font-semibold">{c.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{c.hint}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Ticket className="size-4 text-brand" /> 邀请码 <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{totalInvites}</span></h2>
            <p className="mt-1 text-[12px] text-muted-foreground">管理员只需生成邀请码，不需要填写代理邮箱；代理在 /join 用自己的邮箱开通。每个邀请码只能开通一个代理，默认有效期 {settings.inviteTtlDays} 天。</p>
          </div>
          <form action={createInviteAction} className="flex items-center gap-2">
            <input name="remark" maxLength={200} placeholder="备注（选填，不需要邮箱）" className="h-9 w-40 rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none" />
            <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background"><Plus className="size-3.5" /> 创建邀请码</button>
          </form>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[12px]">
            <thead className="border-b border-foreground/[0.06] text-[11px] text-muted-foreground"><tr><th className="px-2 py-2 font-medium">邀请码</th><th className="px-2 py-2 font-medium">状态</th><th className="px-2 py-2 font-medium">使用邮箱</th><th className="px-2 py-2 font-medium">有效期</th><th className="px-2 py-2 font-medium">备注</th><th className="px-2 py-2 text-right font-medium">操作</th></tr></thead>
            <tbody>
              {invites.length === 0 && <tr><td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">还没有邀请码，先创建一个。</td></tr>}
              {invites.map((invite) => {
                const status = inviteStatus(invite);
                const link = absoluteUrl(`/join?invite=${invite.code}`);
                const deletable = invite.status !== "used";
                return (
                  <tr key={invite.id} className="border-b border-foreground/[0.04] last:border-0">
                    <td className="px-2 py-2.5 font-mono text-[12px] font-medium">{invite.code}</td>
                    <td className="px-2 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px]", status.tone)}>{status.label}</span></td>
                    <td className="px-2 py-2.5 text-muted-foreground">{invite.usedEmail || "—"}</td>
                    <td className="px-2 py-2.5 text-muted-foreground">{invite.expiresAt ? invite.expiresAt.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }) : "长期"}</td>
                    <td className="max-w-[160px] truncate px-2 py-2.5 text-muted-foreground">{invite.remark || "—"}</td>
                    <td className="px-2 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CopyButton value={link} label="复制链接" />
                        {invite.status === "unused" && <form action={disableInviteAction}><input type="hidden" name="id" value={invite.id} /><button type="submit" className="text-[11px] text-muted-foreground hover:text-amber-600">停用</button></form>}
                        {deletable && (
                          <form action={deleteInviteAction}>
                            <input type="hidden" name="id" value={invite.id} />
                            <ConfirmSubmit message={`删除邀请码「${invite.code}」？\n\n删除后这个开通链接将立即失效。`} dialogTitle="删除邀请码" confirmText="确认删除" className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-rose-500">
                              <Trash2 className="size-3" /> 删除
                            </ConfirmSubmit>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/admin/agents" page={ipage} total={totalInvites} pageSize={invitePageSize} param="ipage" query={{ q }} className="mt-3" />
      </section>

      <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Users className="size-4 text-brand" /><h2 className="text-sm font-semibold">代理账号</h2><span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{totalAgents}</span></div>
          <form className="flex items-center gap-2">
            <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="搜索邮箱 / 推广码" className="h-9 w-48 rounded-lg border border-foreground/10 bg-background pl-8 pr-3 text-xs outline-none" /></div>
            <button type="submit" className="h-9 rounded-lg border border-foreground/10 px-3 text-xs">搜索</button>
          </form>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-[12px]">
            <thead className="border-b border-foreground/[0.06] text-[11px] text-muted-foreground"><tr><th className="px-2 py-2 font-medium">代理</th><th className="px-2 py-2 font-medium">推广码</th><th className="px-2 py-2 font-medium">状态</th><th className="px-2 py-2 font-medium">绑定客户</th><th className="px-2 py-2 font-medium">推广订单</th><th className="px-2 py-2 font-medium">销售额</th><th className="px-2 py-2 font-medium">可提现</th><th className="px-2 py-2 font-medium">待结算</th><th className="px-2 py-2 text-right font-medium">操作</th></tr></thead>
            <tbody>
              {agents.length === 0 && <tr><td colSpan={9} className="px-2 py-8 text-center text-muted-foreground">没有匹配的代理</td></tr>}
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b border-foreground/[0.04] last:border-0">
                  <td className="px-2 py-2.5"><Link href={`/admin/agents/${agent.id}`} className="font-medium hover:underline">{agent.nickname || agent.email.split("@")[0]}</Link><div className="mt-0.5 text-[10px] text-muted-foreground">{agent.email}</div></td>
                  <td className="px-2 py-2.5 font-mono">{agent.code}</td>
                  <td className="px-2 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px]", agent.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]")}>{agent.status === "active" ? "启用" : "停用"}</span></td>
                  <td className="px-2 py-2.5">{agent.customers}</td><td className="px-2 py-2.5">{agent.orderCount}</td>
                  <td className="px-2 py-2.5 font-mono">¥{formatPrice(agent.revenue)}</td><td className="px-2 py-2.5 font-mono">¥{formatPrice(agent.withdrawable)}</td><td className="px-2 py-2.5 font-mono text-muted-foreground">¥{formatPrice(agent.pendingCommission)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form action={toggleAffiliateAction}><input type="hidden" name="id" value={agent.id} /><input type="hidden" name="status" value={agent.status === "active" ? "disabled" : "active"} /><input type="hidden" name="fromList" value="1" /><button type="submit" className="text-[11px] text-muted-foreground hover:text-amber-600">{agent.status === "active" ? "停用" : "启用"}</button></form>
                      <form action={deleteAffiliateAction}>
                        <input type="hidden" name="id" value={agent.id} />
                        <ConfirmSubmit message={`删除代理「${agent.nickname || agent.email}」？\n\n只有没有订单、客户、佣金和提现记录的代理才能删除；已有业务数据请使用停用。`} dialogTitle="删除代理账号" confirmText="确认删除" className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-rose-500">
                          <Trash2 className="size-3" /> 删除
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/admin/agents" page={page} total={totalAgents} pageSize={pageSize} param="page" query={{ q }} className="mt-3" />
      </section>
    </div>
  );
}
