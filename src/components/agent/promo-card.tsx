"use client";
import {
  BadgePercent,
  Copy,
  Download,
  ExternalLink,
  QrCode,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { toast } from "sonner";
import { LogoMark } from "@/components/site/logo";

export function AgentPromoCard({
  code,
  link,
  qrDataUrl,
  commissionRate,
}: {
  code: string;
  link: string;
  qrDataUrl: string;
  commissionRate: number;
}) {
  const [copied, setCopied] = useState<"link" | "code" | "text" | null>(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), { stiffness: 180, damping: 24 });
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-9, 9]), { stiffness: 180, damping: 24 });
  const glareX = useTransform(pointerX, [0, 1], [5, 95]);
  const glareY = useTransform(pointerY, [0, 1], [5, 95]);
  const glare = useMotionTemplate`radial-gradient(360px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.22), transparent 48%)`;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width);
    pointerY.set((e.clientY - rect.top) / rect.height);
  }
  function resetTilt() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  async function copy(kind: "link" | "code" | "text", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    toast.success(kind === "code" ? "推广码已复制" : kind === "text" ? "推广文案已复制" : "推广链接已复制");
    window.setTimeout(() => setCopied(null), 1500);
  }

  const displayLink = link.replace(/^https?:\/\//, "");

  return (
    <section className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_18px_50px_-35px_rgba(30,20,80,0.35)] dark:border-white/[0.08] dark:bg-white/[0.04] sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,430px)_1fr] lg:items-start">
        {/* 左侧 3D 推广卡 */}
        <div style={{ perspective: "1100px" }} className="min-w-0">
          <motion.div
            onPointerMove={onPointerMove}
            onPointerLeave={resetTilt}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="group relative mx-auto aspect-[1.58/1] min-h-[250px] w-full max-w-[430px] overflow-hidden rounded-[28px] border border-white/10 bg-[#151020] p-5 shadow-[0_30px_70px_-32px_rgba(88,52,200,0.8)] transition-shadow duration-300 hover:shadow-[0_38px_82px_-30px_rgba(112,64,230,0.9)] sm:p-6"
          >
            {/* 底纹 */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 82% 8%, color-mix(in oklch, var(--brand) 48%, transparent), transparent 58%), radial-gradient(ellipse at 4% 100%, color-mix(in oklch, var(--brand-2) 30%, transparent), transparent 56%), linear-gradient(155deg, rgba(255,255,255,0.06), transparent 42%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 0 47%, rgba(255,255,255,0.09) 47.2%, transparent 47.5%), linear-gradient(65deg, transparent 0 67%, rgba(255,255,255,0.06) 67.2%, transparent 67.5%), linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
                backgroundSize: "100% 100%, 100% 100%, 46px 46px, 46px 46px",
              }}
            />
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <motion.div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glare }} />
            <div className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-6 size-32 rounded-full border border-white/[0.08]" />
            <div className="pointer-events-none absolute -bottom-20 -left-14 size-48 rounded-full bg-brand/20 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between" style={{ transform: "translateZ(28px)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-10px_var(--brand)]">
                    <LogoMark className="size-6" />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold tracking-tight text-white">灵搜小店</div>
                    <div className="text-[8px] uppercase tracking-[0.22em] text-white/45">Agent promo</div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.08] px-2.5 py-1 text-[10px] font-medium text-white/85 backdrop-blur">
                  <BadgePercent className="size-3 text-brand-2" />
                  佣金 {commissionRate}%
                </span>
              </div>

              <div className="mt-4" style={{ transform: "translateZ(20px)" }}>
                <div className="text-[9px] font-medium uppercase tracking-[0.34em] text-white/45">Promo code</div>
                <div className="mt-1 break-all bg-gradient-to-br from-white via-white to-brand-2 bg-clip-text font-mono text-[clamp(28px,8vw,48px)] font-semibold leading-none tracking-[0.08em] text-transparent drop-shadow-[0_4px_20px_rgba(124,92,255,0.25)]">{code}</div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3" style={{ transform: "translateZ(34px)" }}>
                <div className="min-w-0">
                  <div className="truncate text-[10px] text-white/45">{displayLink}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-brand-2">
                    <Sparkles className="size-3" /> 专属客户价 · 永久绑定
                  </div>
                </div>
                <div className="shrink-0 rounded-xl bg-white p-1.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] ring-1 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt={`${code} 推广二维码`} className="size-[72px] rounded-lg object-contain sm:size-20" />
                </div>
              </div>
            </div>
          </motion.div>
          <p className="mt-2 text-center text-[9px] text-muted-foreground lg:text-left">移动鼠标，卡片会跟随倾斜 · 二维码已内置在卡片中</p>
        </div>

        {/* 右侧操作区 */}
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">My promo code</div>
                <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight"><Sparkles className="size-4 text-brand" /> 我的推广码</h3>
              </div>
              <Link href={`/r/${code}`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline">
                打开代理店铺 <ExternalLink className="size-3" />
              </Link>
            </div>
            <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-muted-foreground">
              客户通过你的专属链接进入，会看到你设置的客户价。链接可带渠道参数，比如 <code className="rounded bg-black/[0.05] px-1 py-0.5 font-mono text-[11px] dark:bg-white/[0.08]">?src=wechat</code>。
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/[0.07] bg-black/[0.025] px-3 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <span className="min-w-0 flex-1 truncate font-mono text-[12px]">{link}</span>
              <button type="button" onClick={() => copy("link", link)} className="shrink-0 text-muted-foreground transition hover:text-foreground" aria-label="复制推广链接">
                <Copy className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy("link", link)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90">
              <Copy className="size-3.5" />
              {copied === "link" ? "已复制" : "复制链接"}
            </button>
            <button type="button" onClick={() => copy("code", code)} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.08] px-3 text-xs transition hover:border-black/20 dark:border-white/[0.1] dark:hover:border-white/25">
              <Copy className="size-3.5" />
              复制推广码
            </button>
            <a href={qrDataUrl} download={`lso-agent-${code}.png`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.08] px-3 text-xs transition hover:border-black/20 dark:border-white/[0.1] dark:hover:border-white/25">
              <Download className="size-3.5" />
              下载二维码
            </a>
            <button
              type="button"
              onClick={() => copy("text", `【灵搜小店】精选 AI 账号与订阅服务，专属价购买：${link}\n推广码：${code}`)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.08] px-3 text-xs transition hover:border-black/20 dark:border-white/[0.1] dark:hover:border-white/25"
            >
              <Copy className="size-3.5" />
              复制文案
            </button>
            <button
              type="button"
              disabled
              title="推广海报即将开放"
              className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-xl border border-dashed border-black/[0.1] px-3 text-xs text-muted-foreground opacity-60 dark:border-white/[0.12]"
            >
              <QrCode className="size-3.5" />
              推广海报 · 即将开放
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-2xl border border-black/[0.05] bg-black/[0.02] px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground dark:border-white/[0.06] dark:bg-white/[0.02]">
            <QrCode className="mt-0.5 size-3.5 shrink-0 text-brand" />
            二维码指向 <span className="font-mono">/r/{code}</span>，已放在卡片内，可直接截图发朋友圈或聊天窗口。
          </div>
        </div>
      </div>
    </section>
  );
}
