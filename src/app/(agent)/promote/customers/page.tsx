import Link from "next/link";
import { CalendarClock, PencilLine, Search, Users } from "lucide-react";
import { updateCustomerRemarkAction } from "@/lib/actions/agent";
import { agentFieldClass } from "@/components/agent/form-ui";
import { listAgentCustomers } from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const FILTERS = ["全部", "回头客", "会员已到期", "绑定中", "已过期", "已结束"];
const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return domain ? `${name.slice(0, 2)}***@${domain}` : email;
};

export default async function AgentCustomersPage({ searchParams }: PageProps<"/promote/customers">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const status = typeof sp.status === "string" && FILTERS.includes(sp.status) ? sp.status : "全部";
  const soon = sp.tab === "soon";
  const all = await listAgentCustomers(agent.id);
  const statusOf = (c: (typeof all)[number]) =>
    c.entitlements.some((e) => e.status === "expired") ? "会员已到期" : c.status;
  const activeEntitlements = (c: (typeof all)[number]) => c.entitlements.filter((e) => e.status !== "ended");
  const filtered = all
    .filter((c) => (!q || c.customerEmail.includes(q) || c.remark.toLowerCase().includes(q)))
    .filter((c) => status === "全部" || statusOf(c) === status)
    .filter((c) => !soon || activeEntitlements(c).some((e) => e.status === "expired" || e.isExpiringSoon))
    .sort((a, b) => {
      if (soon) {
        const ae = activeEntitlements(a).reduce((min, e) => Math.min(min, e.expiresAt.getTime()), Number.MAX_SAFE_INTEGER);
        const be = activeEntitlements(b).reduce((min, e) => Math.min(min, e.expiresAt.getTime()), Number.MAX_SAFE_INTEGER);
        return ae - be;
      }
      return b.boundAt.getTime() - a.boundAt.getTime();
    });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Customers</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">客户</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">首次使用你的推广链接完成开通的客户，会永久绑定到你。</p>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
        {[{ value: "all", label: "全部客户" }, { value: "soon", label: "快到期" }].map((tab) => (
          <Link key={tab.value} href={`/promote/customers?tab=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={cn("rounded-full px-3 py-1.5 text-[11px] transition", (tab.value === "soon") === soon ? "bg-white text-foreground shadow-sm dark:bg-white/[0.12]" : "text-muted-foreground")}>{tab.label}</Link>
        ))}
      </div>

      <form className="flex flex-wrap items-center gap-2 rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-[0_16px_38px_-34px_rgba(0,0,0,0.35)] dark:border-white/[0.08] dark:bg-white/[0.04]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
          <input name="q" defaultValue={q} placeholder="搜索开通账号或备注" className={cn(agentFieldClass, "pl-10 pr-3")} />
        </div>
        <select name="status" defaultValue={status} className="h-11 shrink-0 rounded-xl border border-black/[0.07] bg-black/[0.025] px-3 text-[11px] text-foreground outline-none transition focus:border-brand/45 focus:bg-white focus:ring-4 focus:ring-brand/[0.08] dark:border-white/[0.09] dark:bg-white/[0.035] dark:focus:bg-white/[0.06]">
          {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        {soon && <input type="hidden" name="tab" value="soon" />}
        <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-foreground px-5 text-[11px] font-medium text-background transition hover:opacity-90 active:scale-[0.99]">搜索</button>
      </form>

      <section className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.04]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]"><Users className="size-5 text-muted-foreground" /></span>
            <p className="mt-3 text-sm font-medium">{soon ? "暂无快到期客户" : "还没有绑定的客户"}</p>
            <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-muted-foreground">{soon ? "有会员商品将在 7 天内到期或已经到期时，会在这里提醒你。" : "客户首次使用你的推广码下单并完成开通后，会绑定到这里；绑定关系不随会员到期解除。"}</p>
          </div>
        ) : (
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
            {filtered.map((c) => (
              <div key={c.id} className="flex flex-wrap items-start gap-3 px-4 py-3.5 sm:px-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black/[0.05] text-[11px] font-semibold dark:bg-white/[0.08]">{c.customerEmail.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px]">{maskEmail(c.customerEmail)}</span>
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", statusOf(c) === "会员已到期" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : statusOf(c) === "回头客" ? "bg-brand/10 text-brand" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>{statusOf(c)}</span>
                    {c.repeatBuy && <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-muted-foreground dark:bg-white/[0.08]">回头客</span>}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    绑定于 {new Date(c.boundAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })} · {c.orderCount} 笔成交 · ¥{formatPrice(c.totalCents)}
                  </div>
                  {c.entitlements.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {c.entitlements.map((e) => (
                        <div key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-black/[0.05] bg-black/[0.015] px-2.5 py-1.5 text-[10px] dark:border-white/[0.06] dark:bg-white/[0.02]">
                          <CalendarClock className={cn("size-3", e.status === "expired" ? "text-rose-500" : e.isExpiringSoon ? "text-amber-500" : "text-emerald-500")} />
                          <span className="font-medium">{e.productName}</span>
                          <span className="text-muted-foreground">{e.variantName}</span>
                          <span className={cn("ml-auto", e.status === "expired" ? "text-rose-500" : e.isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                            {e.status === "expired" ? "已到期" : e.status === "ended" ? "已结束" : e.isExpiringSoon ? `${e.daysLeft} 天后到期` : `到期 ${new Date(e.expiresAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={updateCustomerRemarkAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="relative min-w-0 flex-1">
                      <PencilLine className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                      <input name="remark" defaultValue={c.remark} maxLength={200} placeholder="添加客户备注" className="h-9 w-full rounded-xl border border-transparent bg-black/[0.035] pl-9 pr-3 text-[11px] text-foreground outline-none transition placeholder:text-muted-foreground/55 hover:bg-black/[0.05] focus:border-brand/35 focus:bg-white focus:ring-4 focus:ring-brand/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.07] dark:focus:bg-white/[0.08]" />
                    </div>
                    <button type="submit" className="h-9 shrink-0 rounded-xl border border-black/[0.06] bg-white px-3 text-[10px] text-muted-foreground transition hover:border-brand/25 hover:text-brand dark:border-white/[0.08] dark:bg-white/[0.04]">保存备注</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
