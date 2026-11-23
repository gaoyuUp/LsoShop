export function formatPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export const ORDER_STATUS: Record<string, { label: string; tone: "amber" | "sky" | "emerald" | "zinc" | "rose" }> = {
  pending: { label: "待支付", tone: "amber" },
  paid: { label: "待发货", tone: "sky" },
  delivered: { label: "已发货", tone: "emerald" },
  closed: { label: "已关闭", tone: "zinc" },
  refunded: { label: "已退款", tone: "rose" },
};

export const EMAIL_STATUS: Record<string, string> = {
  none: "未发送",
  queued: "排队中",
  sent: "已发送",
  failed: "发送失败",
  skipped: "未配置邮箱",
};

export const THEMES = ["violet", "emerald", "sky", "amber", "rose", "mono"] as const;
export type ThemeName = (typeof THEMES)[number];
export const THEME_LABEL: Record<ThemeName, string> = {
  violet: "星云紫",
  emerald: "极光绿",
  sky: "晴空蓝",
  amber: "琥珀金",
  rose: "樱花粉",
  mono: "石墨灰",
};
