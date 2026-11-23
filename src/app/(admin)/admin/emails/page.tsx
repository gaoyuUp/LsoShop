import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Mail,
  MailCheck,
  MailWarning,
  Send,
  Settings2,
} from "lucide-react";
import { EmailStatusBadge } from "@/components/admin/badges";
import { getEmailSummary, listEmailLogs } from "@/lib/admin-data";
import { getMailStatus } from "@/lib/mail/config";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "邮件记录" };

export default async function AdminEmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  await connection();
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const [summary, list, mail] = await Promise.all([getEmailSummary(), listEmailLogs(page), getMailStatus()]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {[
          { label: "邮件总数", value: summary.total, icon: Mail, tone: "bg-foreground/[0.05] text-muted-foreground" },
          { label: "发送成功", value: summary.sent, icon: MailCheck, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: "邮箱未启用", value: summary.skipped, icon: MailWarning, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
          { label: "发送失败", value: summary.failed, icon: MailWarning, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-xl border border-foreground/[0.07] bg-background/70 p-3.5 backdrop-blur">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", c.tone)}>
              <c.icon className="size-4" />
            </span>
            <div>
              <div className="text-[12px] text-muted-foreground">{c.label}</div>
              <div className="font-mono text-lg font-semibold leading-tight">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-[13px] leading-relaxed",
          mail.enabled
            ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/20 bg-amber-500/[0.05] text-amber-700 dark:text-amber-300",
        )}
      >
        {mail.enabled ? (
          <span className="flex items-center gap-2">
            <MailCheck className="size-3.5" />
            SMTP 已配置（{mail.host} · {mail.user}），发货时邮件会真实发送，并在此留存记录。
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            <MailWarning className="size-3.5" />
            邮箱服务未启用：交付邮件只记录不发送，买家仍可在订单页查看交付内容。请在「设置 → 邮件服务」中配置。
            <Link href="/admin/settings" className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
              查看配置说明
              <ArrowUpRight className="size-2.5" />
            </Link>
          </span>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 backdrop-blur">
        <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-3.5 sm:px-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Send className="size-4 text-brand" />
              发件记录
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">每笔交付邮件都有留底，可展开预览原始内容</p>
          </div>
          <span className="font-mono text-[12px] text-muted-foreground">{list.total} 封</span>
        </div>

        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground">
              <Mail className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium">还没有邮件记录</p>
            <p className="mt-1 text-[12px] text-muted-foreground">买家付款发货后，这里会自动记录交付邮件</p>
          </div>
        ) : (
          <ul className="divide-y divide-foreground/[0.05]">
            {list.rows.map((m) => (
              <li key={m.id} className="px-4 py-3 sm:px-5">
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground/[0.04]">
                      {m.status === "sent" ? (
                        <MailCheck className="size-4 text-emerald-500" />
                      ) : m.status === "failed" ? (
                        <MailWarning className="size-4 text-rose-500" />
                      ) : (
                        <Mail className="size-4 text-amber-500" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-medium">{m.toEmail}</span>
                        <EmailStatusBadge status={m.status} />
                        {m.orderNo && (
                          <Link
                            href={`/admin/orders/${m.orderId}`}
                            className="font-mono text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          >
                            {m.orderNo}
                          </Link>
                        )}
                      </div>
                      <div className="mt-0.5 max-w-[520px] truncate text-[12px] text-muted-foreground">{m.subject}</div>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
                      {formatDateTime(m.createdAt)}
                      <ChevronDown className="size-3.5 transition group-open:rotate-180" />
                    </div>
                  </summary>

                  <div className="mt-3 overflow-hidden rounded-xl border border-foreground/10 bg-white">
                    <div className="flex items-center justify-between border-b border-black/5 bg-[#f7f7f9] px-3 py-2">
                      <span className="font-mono text-[11px] text-black/40">邮件预览 · {m.toEmail}</span>
                      <span className="text-[11px] text-black/30">只读</span>
                    </div>
                    <iframe
                      title={`邮件预览 ${m.id}`}
                      srcDoc={m.html}
                      sandbox=""
                      className="h-[320px] w-full border-0 bg-white"
                    />
                  </div>
                  {m.error && (
                    <p className="mt-2 rounded-lg bg-rose-500/[0.07] px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
                      错误信息：{m.error}
                    </p>
                  )}
                  {m.orderId && (
                    <Link
                      href={`/admin/orders/${m.orderId}`}
                      className="mt-2 inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 text-[12px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                    >
                      查看对应订单
                      <ArrowRight className="size-2.5" />
                    </Link>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}

        {list.pages > 1 && (
          <div className="flex items-center justify-between border-t border-foreground/[0.06] px-4 py-3 text-[12px] text-muted-foreground sm:px-5">
            <span>
              共 {list.total} 条 · 第 {list.page} / {list.pages} 页
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/emails?page=${Math.max(1, list.page - 1)}`}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page <= 1 && "pointer-events-none opacity-40",
                )}
              >
                <ArrowLeft className="size-3" />
                上一页
              </Link>
              <Link
                href={`/admin/emails?page=${Math.min(list.pages, list.page + 1)}`}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page >= list.pages && "pointer-events-none opacity-40",
                )}
              >
                下一页
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
        <Settings2 className="mt-0.5 size-3.5 shrink-0" />
        <p>
          配置真实发件：在后台「设置 → 邮件服务」填写 SMTP 服务器、发件邮箱和授权码，保存后立即生效，并可直接发送测试邮件。QQ / 企业邮箱请使用授权码而非登录密码。
        </p>
      </div>
    </div>
  );
}
