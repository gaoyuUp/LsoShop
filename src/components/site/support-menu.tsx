"use client";
import { motion } from "motion/react";
import { Check, Copy, ExternalLink, Headset } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { copyText } from "@/lib/clipboard";
import {
  SUPPORT_CHANNELS,
  SUPPORT_LABEL,
  hasSupport,
  supportHref,
  type SupportChannel,
  type SupportContacts,
} from "@/lib/support";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { SUPPORT_TONE, SupportChannelIcon } from "./support-icons";

/** 导航栏客服按钮：点击后在按钮下方弹出联系渠道 */
export function SupportMenu({ support }: { support: SupportContacts }) {
  const t = useT();
  const [copied, setCopied] = useState<SupportChannel | null>(null);
  const channels = SUPPORT_CHANNELS.filter((c) => support[c].trim());

  if (!hasSupport(support)) return null;

  async function copy(channel: SupportChannel) {
    const ok = await copyText(support[channel].trim());
    if (!ok) return toast.error("复制失败，请手动选择文本");
    setCopied(channel);
    toast.success("联系方式已复制");
    setTimeout(() => setCopied((c) => (c === channel ? null : c)), 1600);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t.nav.support}
          className="group relative inline-flex h-8 items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-foreground/[0.02] px-2.5 text-[13px] text-muted-foreground transition hover:border-foreground/20 hover:bg-foreground/[0.04] hover:text-foreground data-[state=open]:border-foreground/20 data-[state=open]:bg-foreground/[0.05] data-[state=open]:text-foreground sm:px-3"
        >
          <span className="relative">
            <Headset className="size-4" />
            <span className="absolute -right-0.5 -top-0.5 size-1 rounded-full bg-emerald-500 shadow-[0_0_6px_1px] shadow-emerald-500/40" />
          </span>
          <span className="hidden sm:inline">{t.nav.support}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        className="w-[300px] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-popover p-0 shadow-[0_24px_70px_-24px_rgba(20,10,60,0.45)] ring-1 ring-foreground/10 sm:w-[360px]"
      >
        <div className="relative overflow-hidden border-b border-foreground/[0.06] bg-gradient-to-br from-brand/[0.1] via-background to-background px-3.5 py-3 sm:px-4 sm:py-4">
          <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex items-center gap-2.5 sm:gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background shadow-sm sm:size-10">
              <Headset className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold tracking-tight sm:text-sm">联系客服</div>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">订单、交付或使用问题，都可以找我们</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              可联系
            </span>
          </div>
        </div>

        <div className="space-y-1 p-2 sm:space-y-1.5 sm:p-3">
          {channels.map((channel, i) => {
            const value = support[channel].trim();
            const href = supportHref(channel, value);
            return (
              <motion.div
                key={channel}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 + i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition hover:border-foreground/[0.07] hover:bg-foreground/[0.025] sm:gap-2.5 sm:rounded-xl sm:py-2"
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg sm:size-8", SUPPORT_TONE[channel])}>
                  <SupportChannelIcon channel={channel} className="size-3.5 sm:size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-muted-foreground">{SUPPORT_LABEL[channel]}</div>
                  <div className="mt-0.5 break-words font-mono text-[11px] font-medium leading-relaxed">{channel === "email" && value.includes("@") ? <>{value.split("@")[0]}@<wbr />{value.split("@").slice(1).join("@")}</> : value}</div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {href && (
                    <a
                      href={href}
                      target={channel === "telegram" ? "_blank" : undefined}
                      rel={channel === "telegram" ? "noreferrer noopener" : undefined}
                      title={channel === "email" ? "发送邮件" : "打开 Telegram"}
                      className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                    >
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(channel)}
                    title="复制"
                    className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {copied === channel ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-foreground/[0.06] px-3.5 py-2 text-[9px] leading-relaxed text-muted-foreground sm:px-4 sm:py-2.5 sm:text-[10px]">
          咨询时请附上订单号，方便快速定位问题。
        </div>
      </PopoverContent>
    </Popover>
  );
}
