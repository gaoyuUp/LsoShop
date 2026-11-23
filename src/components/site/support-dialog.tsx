"use client";
import { ArrowUpRight, Check, Copy, ExternalLink, LifeBuoy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { copyText } from "@/lib/clipboard";
import { SUPPORT_CHANNELS, SUPPORT_LABEL, hasSupport, type SupportChannel, type SupportContacts } from "@/lib/support";
import { cn } from "@/lib/utils";
import { SUPPORT_TONE, SupportChannelIcon } from "./support-icons";

function telegramHref(value: string) {
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("@")) return `https://t.me/${value.slice(1)}`;
  if (/^t\.me\//i.test(value)) return `https://${value}`;
  return "";
}

function openHref(channel: SupportChannel, value: string) {
  if (channel === "email") return `mailto:${value}`;
  if (channel === "telegram") return telegramHref(value);
  if (channel === "wechatQr" && (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"))) return value;
  return "";
}

export function SupportDialog({ support }: { support: SupportContacts }) {
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
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
        >
          <LifeBuoy className="size-4" />
          联系支持
          <ArrowUpRight className="size-3.5 opacity-70" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[26px] p-0">
        <div className="border-b border-foreground/[0.07] bg-foreground/[0.02] px-5 py-5 pr-12">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
              <LifeBuoy className="size-4" />
            </span>
            联系支持
          </DialogTitle>
          <DialogDescription className="mt-2 text-xs leading-relaxed text-muted-foreground">
            选择下方任一渠道联系我们。咨询时请附上订单号，方便快速定位问题。
          </DialogDescription>
        </div>

        <div className="space-y-2 p-4">
          {channels.map((channel) => {
            const value = support[channel].trim();
            const href = openHref(channel, value);
            return (
              <div
                key={channel}
                className="flex items-center gap-3 rounded-2xl border border-foreground/[0.07] bg-foreground/[0.015] p-3 transition hover:border-foreground/15"
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", SUPPORT_TONE[channel])}>
                  <SupportChannelIcon channel={channel} className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted-foreground">{SUPPORT_LABEL[channel]}</div>
                  <div className="mt-0.5 break-words font-mono text-[13px] font-medium leading-relaxed">{channel === "email" && value.includes("@") ? <>{value.split("@")[0]}@<wbr />{value.split("@").slice(1).join("@")}</> : value}</div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {href && (
                    <a
                      href={href}
                      target={channel === "telegram" ? "_blank" : undefined}
                      rel={channel === "telegram" ? "noreferrer noopener" : undefined}
                      title={channel === "email" ? "发送邮件" : "打开 Telegram"}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(channel)}
                    title="复制"
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                  >
                    {copied === channel ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-foreground/[0.06] px-5 py-3 text-[10px] leading-relaxed text-muted-foreground">
          虚拟商品发货后不支持无理由退款，购买前请确认已阅读购买须知。
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SupportSection({ support }: { support: SupportContacts }) {
  if (!hasSupport(support)) return null;
  return (
    <section className="mt-5 flex flex-col items-start gap-4 rounded-[24px] border border-foreground/[0.07] bg-background/40 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <LifeBuoy className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">遇到问题？</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">订单、交付或使用上有疑问，可以直接联系支持。</p>
        </div>
      </div>
      <SupportDialog support={support} />
    </section>
  );
}
