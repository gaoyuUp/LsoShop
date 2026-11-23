import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, ShieldAlert } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { CodeAutoRefresh, CodeParser } from "@/components/admin/code-test-tools";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { CopyButton } from "@/components/admin/copy-button";
import { clearTestCodesAction } from "@/lib/actions/admin-affiliates";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "测试验证码",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const PURPOSE: Record<string, string> = { activate: "开通代理", login: "代理登录" };

export default async function TestCodesPage({ searchParams }: PageProps<"/admin/dev/codes">) {
  await requireAdmin();
  // 生产环境默认关闭；本地或显式设置 ALLOW_TEST_CODE_INBOX=1 才打开。
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_CODE_INBOX !== "1") notFound();

  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email.trim().toLowerCase() : "";
  const rows = await db
    .select()
    .from(schema.affiliateEmailCodes)
    .where(email ? eq(schema.affiliateEmailCodes.email, email) : undefined)
    .orderBy(desc(schema.affiliateEmailCodes.id))
    .limit(60);
  const latest = rows.find((r) => !r.usedAt && r.expiresAt > new Date()) ?? rows[0] ?? null;
  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <CodeAutoRefresh />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1 text-[11px] text-amber-700 dark:text-amber-300">
            <ShieldAlert className="size-3.5" /> 仅管理员 · 测试页面
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">验证码收件箱</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">真实 SMTP 关闭时，验证码仍会写入数据库；这里直接读取最新验证码。每 5 秒自动刷新。</p>
        </div>
        <form className="flex items-center gap-2">
          <input name="email" defaultValue={email} placeholder="按邮箱筛选" className="h-9 w-52 rounded-lg border border-foreground/10 bg-background px-3 text-xs outline-none" />
          <button type="submit" className="h-9 rounded-lg border border-foreground/10 px-3 text-xs">查询</button>
        </form>
      </div>

      {sp.cleared === "1" && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-600 dark:text-emerald-400">验证码记录已清空。</p>}

      {latest && (
        <section className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/[0.055] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">最新验证码</div>
              {email && <div className="mt-1 text-[12px] text-muted-foreground">筛选邮箱：{email}</div>}
            </div>
            <span className="rounded-full bg-background/60 px-2.5 py-1 text-[10px] text-muted-foreground">{PURPOSE[latest.purpose] ?? latest.purpose}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <span className="font-mono text-5xl font-bold tracking-[0.22em] text-emerald-700 dark:text-emerald-300">{latest.code}</span>
            <CopyButton text={latest.code} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span>{latest.email}</span>
            <span>生成：{formatDateTime(latest.createdAt)}</span>
            <span>过期：{formatDateTime(latest.expiresAt)}</span>
            <span>{latest.usedAt ? "已使用" : latest.expiresAt < now ? "已过期" : "有效"}</span>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-[24px] border border-foreground/[0.07] bg-background/70">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/[0.06] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold"><Mail className="size-4 text-brand" /> 最近验证码 <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{rows.length}</span></div>
          {rows.length > 0 && (
            <form action={clearTestCodesAction}>
              <ConfirmSubmit message={"清空测试验证码记录？\n\n会删除所有已生成和已使用的验证码，操作不可恢复；正在进行的开通/登录需要重新发送。"} dialogTitle="清空验证码记录" confirmText="确认清空" className="inline-flex h-7 items-center gap-1 rounded-lg border border-rose-500/20 px-2.5 text-[10px] text-rose-600 transition hover:bg-rose-500/[0.06] dark:text-rose-400">
                一键清空
              </ConfirmSubmit>
            </form>
          )}
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center text-[12px] text-muted-foreground">还没有验证码。去 /join 填邮箱点击「发送验证码」后，这里会自动出现。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12px]">
              <thead className="border-b border-foreground/[0.06] text-[11px] text-muted-foreground"><tr><th className="px-4 py-2 font-medium">验证码</th><th className="px-3 py-2 font-medium">邮箱</th><th className="px-3 py-2 font-medium">用途</th><th className="px-3 py-2 font-medium">状态</th><th className="px-3 py-2 font-medium">生成时间</th><th className="px-3 py-2 font-medium">过期时间</th><th className="px-3 py-2 font-medium">尝试</th></tr></thead>
              <tbody>
                {rows.map((row) => {
                  const state = row.usedAt ? "已使用" : row.expiresAt < now ? "已过期" : "有效";
                  return (
                    <tr key={row.id} className="border-b border-foreground/[0.04] last:border-0">
                      <td className="px-4 py-2.5"><div className="flex items-center gap-2"><span className="font-mono text-base font-semibold tracking-[0.14em]">{row.code}</span><CopyButton text={row.code} /></div></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{row.email}</td>
                      <td className="px-3 py-2.5">{PURPOSE[row.purpose] ?? row.purpose}</td>
                      <td className="px-3 py-2.5"><span className={cn("rounded-full px-2 py-0.5 text-[10px]", state === "有效" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : state === "已使用" ? "bg-foreground/[0.05] text-muted-foreground" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")}>{state}</span></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(row.createdAt)}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(row.expiresAt)}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{row.attempts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CodeParser />
      <div className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 text-[12px] leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">说明</p>
        <p className="mt-1">这个页面只用于本地/测试阶段。生产环境默认 404，除非显式设置 <code className="rounded bg-foreground/[0.06] px-1 font-mono">ALLOW_TEST_CODE_INBOX=1</code>。验证码本身仍然遵守过期、重发间隔和尝试次数限制。</p>
      </div>
    </div>
  );
}
