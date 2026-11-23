import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck, KeyRound, Sparkles, Tags } from "lucide-react";
import { JoinForm } from "@/components/join/join-form";
import { LogoMark } from "@/components/site/logo";
import { getDictionary } from "@/i18n";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";

export const metadata: Metadata = {
  title: "代理开通",
  description: "使用邀请码开通灵搜小店代理账号，通过邮箱验证码登录推广后台。",
  robots: { index: false, follow: false, nocache: true },
};

export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const current = await getCurrentAffiliate();
  if (current) redirect("/");
  const sp = await searchParams;
  const invite = typeof sp.invite === "string" ? sp.invite.toUpperCase() : "";
  const initialMode = sp.login === "1" ? "login" : "activate";
  const t = getDictionary();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-20%] size-[42rem] rounded-full bg-brand/15 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-10%] size-[38rem] rounded-full bg-brand-2/15 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, currentColor 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, currentColor 4%, transparent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 75% 70% at 50% 35%, #000, transparent 82%)",
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background">
            <LogoMark className="size-7" />
          </span>
          <span className="text-sm font-semibold tracking-tight">{t.brand.name}</span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          回到商店
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pt-14">
        <section className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 text-xs text-brand">
            <Sparkles className="size-3.5" />
            PARTNER PROGRAM
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">把好价，分享给需要的人。</h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            邀请制代理计划。拿到邀请码后开通账号，即可用自己的链接售卖全部商品，客户免登录购买，佣金自动结算。
          </p>
          <div className="mt-8">
            <JoinForm initialInvite={invite} initialMode={initialMode} />
          </div>
        </section>

        <aside className="space-y-4 lg:pt-20">
          <div className="glass-strong relative overflow-hidden rounded-[28px] p-5">
            <div className="absolute -right-8 -top-10 size-36 rounded-full bg-brand/20 blur-3xl" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">代理工作台预览</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                邀请制
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-foreground text-background">
                <LogoMark className="size-8" />
              </span>
              <div>
                <div className="text-sm font-semibold">你的专属代理</div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">/r/XXXXXX</div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "客户价", value: "自定义" },
                { label: "返佣", value: "100%" },
                { label: "提现", value: "¥50 起" },
              ].map((x) => (
                <div key={x.label} className="rounded-xl border border-foreground/[0.07] bg-background/45 px-2 py-3">
                  <div className="text-[11px] text-muted-foreground">{x.label}</div>
                  <div className="mt-1 text-sm font-semibold">{x.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-[28px] p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="size-4 text-brand" />
              {t.join.after}
            </div>
            <ul className="mt-4 space-y-3">
              {t.join.afterItems.map((item, i) => {
                const Icon = [Tags, KeyRound, BadgeCheck, ArrowUpRight][i] ?? Sparkles;
                return (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-foreground/[0.08] bg-foreground/[0.03]">
                      <Icon className="size-3.5 text-brand" />
                    </span>
                    <div>
                      <div className="text-[13px] font-medium">{item.title}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{item.desc}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground/70">
            开通即代表同意推广规则 · 会员到期不影响客户绑定 · 自购不计佣金
          </p>
        </aside>
      </main>
    </div>
  );
}
