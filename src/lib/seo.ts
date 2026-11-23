import "server-only";
import { env } from "@/lib/env";

const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export const siteUrl = normalizeSiteUrl(env.siteUrl);
export const isIndexable = !/^(localhost|127\.0\.0\.1|\[::1\])$/i.test(new URL(siteUrl).hostname);

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function plainText(value: string, fallback: string, max = 160) {
  const text = value.replace(/[#*_>`\[\]()]/g, " ").replace(/\s+/g, " ").trim() || fallback;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export const defaultOgImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "灵搜小店 · 精选 AI 账号与订阅服务",
} as const;
