import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  Check,
  BarChart3,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Crown,
  Link2,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { AgentPromoCard } from "@/components/agent/promo-card";
import {
  agentBalance,
  agentChannelStats,
  agentCommissionSummary,
  agentHasClicks,
  agentPendingWithdrawal,
  agentPromoEffect,
  getPromoSettings,
} from "@/lib/affiliate";
import { absoluteUrl } from "@/lib/seo";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { startOfShanghaiDay } from "@/lib/admin-data";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getSiteConfig } from "@/lib/site-config";

const DAYS = [1, 7, 30, 90] as const;
const COLORS = { visitors: "#7c5cff", opens: "#2bb8a3", orders: "#f2a93b", paid: "#f25c9d" };

function money(cents: number) {
  return `¥${formatPrice(cents)}`;
}

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof TrendingUp }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-3.5 text-brand" />
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
    </div>
  );
}

export default async function PromoteOverviewPage({ searchParams }: PageProps<"/promote">) {
  const agent = await requireAffiliate();
  const sp = await searchParams;
  const days = (DAYS.includes(Number(sp.days) as (typeof DAYS)[number]) ? Number(sp.days) : 1) as 1 | 7 | 30 | 90;
  const from = startOfShanghaiDay(-(days - 1));

  const [summary, balance, pending, effect, channels, settings, hasVisit, site] = await Promise.all([
    agentCommissionSummary(agent.id),
    agentBalance(agent.id),
    agentPendingWithdrawal(agent.id),
    agentPromoEffect(agent.id, days),
    agentChannelStats(agent.id, from),
    getPromoSettings(),
    agentHasClicks(agent.id),
    getSiteConfig(),
  ]);

  const link = absoluteUrl(`/r/${agent.code}`);
  const qrDataUrl = await QRCode.toDataURL(link, { width: 320, margin: 1, color: { dark: "#17151f", light: "#ffffff" } });
  const hasContact = Boolean(agent.wechat || agent.wechatQr || agent.qq || agent.telegram);
  const hasCommission = balance.totalCents > 0 || balance.pendingCents > 0;
  const stepsDone = Number(hasContact) + Number(hasVisit) + Number(hasCommission);
  const canWithdraw = !pending && balance.availableCents >= settings.minWithdrawCents && agent.status === "active";
  const withdrawReason = pending
    ? "有一笔提现申请正在处理中"
    : balance.availableCents < settings.minWithdrawCents
      ? `可提现金额不足 ${money(settings.minWithdrawCents)}`
      : agent.status !== "active"
        ? "代理账号当前不可提现"
        : "";

  const totals = effect.reduce(
    (acc, row) => ({
      visitors: acc.visitors + row.visitors,
      opens: acc.opens + row.opens,
      orders: acc.orders + row.orders,
      paid: acc.paid + row.paid,
    }),
    { visitors: 0, opens: 0, orders: 0, paid: 0 },
  );
  const conversion = totals.visitors > 0 ? `${((totals.paid / totals.visitors) * 100).toFixed(1)}%` : "—";
  const maxValue = Math.max(1, ...effect.flatMap((r) => [r.visitors, r.opens, r.orders, r.paid]));
  const svgW = 760;
  const svgH = 220;
  const pad = { left: 34, right: 12, top: 18, bottom: 24 };
  const innerW = svgW - pad.left - pad.right;
  const innerH = svgH - pad.top - pad.bottom;
  const point = (i: number, value: number) => {
    const x = pad.left + (effect.length <= 1 ? innerW / 2 : (i / (effect.length - 1)) * innerW);
    const y = pad.top + innerH - (value / maxValue) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const series = [
    { key: "visitors" as const, label: "访客", color: COLORS.visitors },
    { key: "opens" as const, label: "链接打开", color: COLORS.opens },
    { key: "orders" as const, label: "下单", color: COLORS.orders },
    { key: "paid" as const, label: "付款", color: COLORS.paid },
  ];
  const metrics = [
    { label: "访客", value: String(totals.visitors), note: "去重访客" },
    { label: "链接打开", value: String(totals.opens), note: "推广链接访问" },
    { label: "下单", value: String(totals.orders), note: "推广归因订单" },
    { label: "付款", value: String(totals.paid), note: "已付款 / 已交付" },
    { label: "付款转化率", value: conversion, note: "付款 / 访客" },
  ];

  return (
    <div className="scroll-smooth space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Overview</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">推广概览</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">欢迎回来，{agent.nickname || agent.email.split("@")[0]}。今天也一起把好价分享出去。</p>
        </div>
        <Link href={`/r/${agent.code}`} target="_blank" className="inline-flex h-9 w-fit items-center gap-1.5 rounded-xl border border-black/[0.08] px-3 text-xs transition hover:border-black/20 dark:border-white/[0.1] dark:hover:border-white/25">
          <Link2 className="size-3.5" />
          查看代理店铺
        </Link>
      </div>

      {!hasCommission && (
        <section className="rounded-[24px] border border-brand/15 bg-gradient-to-br from-brand/[0.09] via-white/60 to-brand-2/[0.06] p-5 dark:from-brand/[0.12] dark:via-white/[0.03] dark:to-brand-2/[0.07] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="size-4 text-brand" />
                开张三步
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">完成这三步，就可以开始拿到第一笔推广佣金。</p>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground dark:bg-white/[0.08]">
              {stepsDone}/3
            </span>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {[
              { title: "设置客服联系方式", desc: "在「联系方式」填写微信 / QQ / Telegram，或上传二维码；保存后会自动打勾", done: hasContact, pending: "", href: "/promote/contact", icon: CircleUserRound },
              { title: "发出推广海报或链接", desc: "发到朋友圈、群里或小红书。有人从你的链接进来，这一步就完成了", done: hasVisit, pending: "（未完成）", href: "#promo-code", icon: Link2 },
              { title: "拿到第一笔佣金", desc: "客户通过链接下单并完成付款", done: hasCommission, pending: "", href: "#effect", icon: Wallet },
            ].map((step, i) => (
              <Link key={step.title} href={step.href} className={cn("group rounded-2xl border p-3.5 transition", step.done ? "border-emerald-500/15 bg-emerald-500/[0.045]" : "border-black/[0.06] bg-white/60 hover:border-black/15 dark:border-white/[0.08] dark:bg-white/[0.03]")}>
                <div className="flex items-center justify-between">
                  <span
                    aria-label={step.done ? "已完成" : `第 ${i + 1} 步`}
                    className={cn(
                      "grid size-6 place-items-center rounded-md font-mono text-[11px]",
                      step.done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]",
                    )}
                  >
                    {step.done ? <Check className="size-3.5" strokeWidth={3} /> : `0${i + 1}`}
                  </span>
                  <step.icon className="size-4 text-muted-foreground/60 transition group-hover:text-brand" />
                </div>
                <div className={cn("mt-3 text-[13px] font-medium", step.done && "line-through decoration-emerald-500/60 decoration-1")}>
                  {step.title}
                  {!step.done && step.pending && <span className="ml-0.5 font-normal text-muted-foreground">{step.pending}</span>}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.desc}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="今日佣金" value={money(summary.today.amount)} hint={`${summary.today.orders} 笔成交`} icon={TrendingUp} />
        <StatCard label="昨日佣金" value={money(summary.yesterday.amount)} hint="已结算金额" icon={Clock3} />
        <StatCard label="本月佣金" value={money(summary.month.amount)} hint={`${summary.month.n} 笔返佣`} icon={BarChart3} />
        <StatCard label="可结算佣金" value={money(balance.availableCents)} hint={`${balance.settledCount} 笔可提现`} icon={Wallet} />
        <StatCard label="绑定客户" value={String(summary.customers)} hint="永久首绑" icon={Users} />
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">待打款</div>
              <p className="mt-1 text-[12px] text-muted-foreground">满 {money(settings.minWithdrawCents)} 可申请，人工支付宝转账。</p>
            </div>
            <span className="font-mono text-2xl font-semibold">{money(balance.availableCents)}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canWithdraw ? (
              <Link href="/promote/withdrawals" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-4 text-xs font-medium text-background transition hover:opacity-90">
                申请提现 <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center rounded-xl border border-black/[0.08] px-4 text-xs text-muted-foreground dark:border-white/[0.1]">
                暂不可申请
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{withdrawReason || "提交后金额会锁定，处理完成后才能再次申请。"}</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">推广规则</div>
            <ChevronDown className="size-4 text-muted-foreground" />
          </div>
          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-[12px] text-muted-foreground transition hover:text-foreground">展开查看返佣与绑定规则</summary>
            <ul className="mt-3 space-y-2 border-t border-black/[0.05] pt-3 text-[12px] leading-relaxed text-muted-foreground dark:border-white/[0.06]">
              <li>· 利润 100% 返佣，佣金 = 客户实付 − 商品成本。</li>
              <li>· 老客户回购仍归首次绑定代理。</li>
              <li>· 先绑定优先，同一客户不会改绑。</li>
              <li>· 代理自购不返佣；退款 / 关闭会撤销未提现佣金。</li>
            </ul>
          </details>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Crown className="size-3.5 text-amber-500" />
            当前佣金比例 {settings.commissionRate}%
          </div>
        </div>
      </section>

      <div id="promo-code" className="scroll-mt-28 sm:scroll-mt-32">
        <AgentPromoCard
          code={agent.code}
          link={link}
          qrDataUrl={qrDataUrl}
          commissionRate={settings.commissionRate}
          brandName={site.name}
          brandSlogan={site.slogan}
          logoUrl={site.logoUrl}
        />
      </div>

      <section id="effect" className="scroll-mt-28 rounded-[24px] sm:scroll-mt-32 border border-black/[0.06] bg-white p-5 dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">推广效果</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">访客、链接打开、下单和付款来自同一套归因数据。</p>
          </div>
          <div className="flex gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.06]">
            {[
              { value: 1, label: "今天" },
              { value: 7, label: "7 天" },
              { value: 30, label: "30 天" },
              { value: 90, label: "90 天" },
            ].map((x) => (
              <Link key={x.value} href={`/promote?days=${x.value}#effect`} className={cn("rounded-full px-3 py-1.5 text-[11px] transition", days === x.value ? "bg-white text-foreground shadow-sm dark:bg-white/[0.12]" : "text-muted-foreground hover:text-foreground")}>
                {x.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-black/[0.05] bg-black/[0.018] px-3.5 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <div className="text-[11px] text-muted-foreground">{m.label}</div>
              <div className="mt-1 font-mono text-xl font-semibold">{m.value}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{m.note}</div>
            </div>
          ))}
        </div>

        {days === 1 ? (
          <div className="relative mt-5 flex animate-in flex-col items-center justify-center overflow-hidden rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/[0.07] via-white/40 to-brand-2/[0.06] px-5 py-10 text-center duration-300 fade-in-0 dark:from-brand/[0.1] dark:via-white/[0.02] dark:to-brand-2/[0.07]">
            <span className="absolute -right-8 -top-10 size-28 rounded-full bg-brand/[0.08] blur-2xl" />
            <span className="absolute -bottom-12 -left-8 size-28 rounded-full bg-brand-2/[0.08] blur-2xl" />
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-brand shadow-sm dark:bg-white/[0.08]">
              <BarChart3 className="size-5" />
            </span>
            <span className="mt-3 rounded-full border border-brand/15 bg-white/70 px-2.5 py-0.5 text-[9px] font-medium text-brand dark:bg-white/[0.06]">今日实时快照</span>
            <p className="mt-2 text-[13px] font-medium">今天只看当日汇总</p>
            <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-muted-foreground">
              切换到 7 天、30 天或 90 天，查看四项指标趋势图和每日明细。
            </p>
            <div className="mt-4 flex gap-1.5">
              {[7, 30, 90].map((d) => (
                <Link key={d} href={`/promote?days=${d}#effect`} className="rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-brand/30 hover:text-brand dark:border-white/[0.1] dark:bg-white/[0.04]">
                  {d} 天
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        <div className="mt-5 overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="min-w-[620px] w-full" role="img" aria-label="推广效果趋势图">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={svgW - pad.right} y1={pad.top + innerH * t} y2={pad.top + innerH * t} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
                <text x={pad.left - 8} y={pad.top + innerH * t + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.4">{Math.round(maxValue * (1 - t))}</text>
              </g>
            ))}
            {series.map((s) => (
              <g key={s.key}>
                <polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={effect.map((r, i) => point(i, r[s.key])).join(" ")} />
                {effect.map((r, i) => <circle key={i} cx={point(i, r[s.key]).split(",")[0]} cy={point(i, r[s.key]).split(",")[1]} r={days <= 7 ? 2.4 : 1.2} fill={s.color} />)}
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.label}</span>
          ))}
        </div>

        <div className="mt-5 max-h-64 overflow-auto rounded-xl border border-black/[0.05] dark:border-white/[0.06]">
          <table className="w-full min-w-[520px] text-left text-[11px]">
            <thead className="sticky top-0 bg-[#faf9fc] text-muted-foreground dark:bg-[#15131b]">
              <tr><th className="px-3 py-2 font-medium">日期</th><th className="px-3 py-2 font-medium">访客</th><th className="px-3 py-2 font-medium">链接打开</th><th className="px-3 py-2 font-medium">下单</th><th className="px-3 py-2 font-medium">付款</th></tr>
            </thead>
            <tbody>
              {effect.map((r) => (
                <tr key={r.day} className="border-t border-black/[0.04] dark:border-white/[0.05]">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{r.day.slice(5)}</td><td className="px-3 py-2">{r.visitors}</td><td className="px-3 py-2">{r.opens}</td><td className="px-3 py-2">{r.orders}</td><td className="px-3 py-2">{r.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-xl border border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between border-b border-black/[0.04] px-3 py-2 dark:border-white/[0.05]">
            <div className="text-[11px] font-medium text-muted-foreground">渠道 / 价位码分码</div>
            <span className="text-[9px] text-muted-foreground">代理本人访问不计入</span>
          </div>
          <div className="hidden grid-cols-[1.4fr_repeat(3,70px)_90px] gap-2 border-b border-black/[0.04] px-3 py-1.5 text-[9px] text-muted-foreground dark:border-white/[0.05] sm:grid">
            <span>渠道 / 价位码</span><span className="text-right">访客</span><span className="text-right">打开</span><span className="text-right">订单</span><span className="text-right">成交额</span>
          </div>
          {channels.map((c) => (
            <div key={c.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-black/[0.04] px-3 py-2.5 last:border-0 dark:border-white/[0.05] sm:grid-cols-[1.4fr_repeat(3,70px)_90px] sm:items-center">
              <div className="min-w-0">
                <div className="truncate text-[11px] font-medium">{c.label}</div>
                <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{c.code || "—"}</div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground sm:contents">
                <span className="sm:text-right">访客 {c.visitors}</span>
                <span className="sm:text-right">打开 {c.opens}</span>
                <span className="sm:text-right">订单 {c.orders}</span>
              </div>
              <div className="col-span-2 text-right font-mono text-[10px] sm:col-span-1 sm:text-[11px]">¥{formatPrice(c.revenue)}</div>
            </div>
          ))}
          <div className="border-t border-black/[0.04] px-3 py-2 text-[10px] text-muted-foreground dark:border-white/[0.05]">
            {channels.every((c) => c.opens === 0 && c.orders === 0)
              ? "当前周期还没有外部访客或推广订单；把主链接或价位码链接分享出去后，这里会按链接归因。"
              : "数据按当前周期统计，价位码订单以客户下单时的价位码快照归因。"}
          </div>
        </div>
      </section>
    </div>
  );
}
