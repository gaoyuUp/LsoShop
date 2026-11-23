/** 前台客服渠道（后台只保存填写的渠道，空值不会展示） */
export type SupportContacts = {
  qq: string;
  wechat: string;
  email: string;
  telegram: string;
  /** 代理上传的微信二维码 URL（平台客服没有） */
  wechatQr: string;
};

export const SUPPORT_CHANNELS = ["qq", "wechat", "email", "telegram", "wechatQr"] as const;
export type SupportChannel = (typeof SUPPORT_CHANNELS)[number];

export const SUPPORT_LABEL: Record<SupportChannel, string> = {
  qq: "QQ",
  wechat: "微信",
  email: "邮箱",
  telegram: "Telegram",
  wechatQr: "微信二维码",
};

export function hasSupport(support: SupportContacts) {
  return SUPPORT_CHANNELS.some((channel) => support[channel].trim().length > 0);
}

export function supportHref(channel: SupportChannel, value: string) {
  if (channel === "email") return `mailto:${value}`;
  if (channel === "telegram") {
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    if (value.startsWith("@")) return `https://t.me/${value.slice(1)}`;
    if (/^t\.me\//i.test(value)) return `https://${value}`;
  }
  if (channel === "wechatQr" && (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://"))) return value;
  return "";
}
