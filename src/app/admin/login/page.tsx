import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Boxes, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { LogoMark } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { getAdmin } from "@/lib/auth/admin";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "后台登录",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage() {
  const [admin, site] = await Promise.all([getAdmin(), getSiteConfig()]);
  if (admin) redirect("/admin");

  return (
    <div className="relative grid min-h-dvh overflow-hidden bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* 左侧品牌区 */}
      <div className="relative hidden overflow-hidden bg-[#0b0b10] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 size-[34rem] rounded-full bg-[#6d4aff]/35 blur-[120px]" />
          <div className="absolute bottom-0 right-0 size-[28rem] translate-x-1/3 translate-y-1/3 rounded-full bg-[#ff5c9d]/25 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.13]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse 80% 80% at 30% 20%, #000, transparent 75%)",
            }}
          />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-3">
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logoUrl} alt={site.name} className="size-10 shrink-0 rounded-xl object-contain" />
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur">
                <LogoMark animated className="size-7" />
              </span>
            )}
            <span className="text-[15px] font-semibold tracking-tight">{site.name} · 管理后台</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs text-white/70 backdrop-blur">
            <Sparkles className="size-3.5" />
            LSOSHOP CONSOLE
          </div>
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight">
            把每一笔订单，
            <br />
            <span className="bg-gradient-to-r from-white via-[#c4b5fd] to-[#f9a8d4] bg-clip-text text-transparent">
              交付得漂亮。
            </span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/55">
            商品、规格、库存、订单与邮件记录，都在一个安静的界面里。保存即生效，发货即时通知。
          </p>
          <ul className="mt-9 space-y-4">
            {[
              { icon: Boxes, title: "库存自动锁定", desc: "下单锁库，超时自动释放，不超卖" },
              { icon: Mail, title: "交付自动留痕", desc: "每封邮件都有记录，可随时补发" },
              { icon: ShieldCheck, title: "安全可控", desc: "后台独立鉴权，游客下单不受影响" },
            ].map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
                  <f.icon className="size-4 text-white/80" />
                </span>
                <div>
                  <div className="text-sm font-medium text-white/90">{f.title}</div>
                  <div className="mt-0.5 text-xs text-white/45">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/30">© {new Date().getFullYear()} {site.name} · 保留所有权利</p>
      </div>

      {/* 右侧登录区 */}
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5 lg:invisible">
            {site.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.logoUrl} alt={site.name} className="size-8 shrink-0 rounded-[10px] object-contain" />
            ) : (
              <span className="grid size-8 place-items-center rounded-[10px] bg-foreground text-background">
                <LogoMark className="size-6" />
              </span>
            )}
            <span className="text-sm font-semibold">{site.name}</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-semibold tracking-tight">欢迎回来</h2>
            <p className="mt-2 text-sm text-muted-foreground">登录后管理商品、库存与订单发货。</p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
