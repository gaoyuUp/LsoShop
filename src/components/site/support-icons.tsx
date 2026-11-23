import { Mail, QrCode, Send } from "lucide-react";
import type { SupportChannel } from "@/lib/support";
import { cn } from "@/lib/utils";

/** 自绘 QQ / 微信图标，邮箱与 TG 使用现有线性图标 */
export function SupportChannelIcon({ channel, className }: { channel: SupportChannel; className?: string }) {
  if (channel === "email") return <Mail className={cn("size-4", className)} />;
  if (channel === "telegram") return <Send className={cn("size-4", className)} />;
  if (channel === "wechatQr") return <QrCode className={cn("size-4", className)} />;

  if (channel === "wechat") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={cn("size-4", className)}>
        <path d="M9.1 3.8C5.6 3.8 2.8 6.4 2.8 9.5c0 1.7.9 3.2 2.4 4.2l-.6 1.9 2.4-1.2c.5.2 1.1.2 1.7.3-.1-.4-.2-.8-.2-1.2 0-3 2.9-5.4 6.5-5.4h.5c-.6-2.5-3.1-4.3-6.4-4.3Z" />
        <path d="M21.2 13.3c0-2.5-2.4-4.6-5.4-4.6s-5.4 2.1-5.4 4.6 2.4 4.6 5.4 4.6c.6 0 1.2-.1 1.7-.2l2.1 1-.5-2c1.3-.9 2.1-2.1 2.1-3.4Z" />
        <circle cx="7.1" cy="8.2" r=".9" fill="var(--background)" />
        <circle cx="11.1" cy="8.2" r=".9" fill="var(--background)" />
        <circle cx="13.8" cy="12.6" r=".75" fill="var(--background)" />
        <circle cx="17.1" cy="12.6" r=".75" fill="var(--background)" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden className={cn("size-4", className)}>
      <path d="M12 2.4c-3.6 0-5.9 2.4-5.9 5.8 0 1 .3 2 .8 2.9-.6.8-1 1.7-1 2.5 0 .6.3 1.1.9 1.3.5.2 1 .1 1.5-.3.9 1.2 2.2 2 3.7 2.2l-.7 2.4c-.1.4.2.8.6.8h2.2c.4 0 .7-.4.6-.8l-.7-2.4c1.5-.2 2.8-1 3.7-2.2.5.4 1 .5 1.5.3.6-.2.9-.7.9-1.3 0-.8-.4-1.7-1-2.5.5-.9.8-1.9.8-2.9 0-3.4-2.3-5.8-5.9-5.8Zm-2.1 6.5c.5 0 .9.5.9 1.1s-.4 1.1-.9 1.1-.9-.5-.9-1.1.4-1.1.9-1.1Zm4.2 0c.5 0 .9.5.9 1.1s-.4 1.1-.9 1.1-.9-.5-.9-1.1.4-1.1.9-1.1Z" />
    </svg>
  );
}

export const SUPPORT_TONE: Record<SupportChannel, string> = {
  qq: "bg-[#12b7f5]/10 text-[#12b7f5]",
  wechat: "bg-[#07c160]/10 text-[#07c160]",
  email: "bg-brand/10 text-brand",
  telegram: "bg-[#229ed9]/10 text-[#229ed9]",
  wechatQr: "bg-[#07c160]/10 text-[#07c160]",
};
