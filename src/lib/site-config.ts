import "server-only";
import { cache } from "react";
import { getDictionary } from "@/i18n";
import { getSettingsMap } from "@/lib/admin-data";

const t = getDictionary();

export const SITE_SETTING_KEYS = [
  "siteName",
  "siteSlogan",
  "siteTagline",
  "seoDescription",
  "seoKeywords",
  "siteLogo",
  "siteIcon",
  "siteOgImage",
] as const;

type SiteConfig = {
  name: string;
  slogan: string;
  tagline: string;
  /** 实际用于 meta description 的文案 */
  description: string;
  /** 后台自定义的 SEO 描述；为空时使用自动组合 */
  customDescription: string;
  keywords: string[];
  customKeywords: string[];
  /** 留空表示使用内置矢量 Logo */
  logoUrl: string;
  iconUrl: string;
  ogImageUrl: string;
  ogImageAlt: string;
};

const DEFAULT_KEYWORDS = ["Muse AI", "GPT Plus", "ChatGPT Plus", "AI 账号", "成品账号", "订阅服务"];

const DEFAULT_SITE_CONFIG: SiteConfig = {
  name: t.brand.name,
  slogan: t.brand.slogan,
  tagline: t.brand.tagline,
  description: `${t.brand.slogan}，${t.brand.tagline}。`,
  customDescription: "",
  keywords: [t.brand.name, ...DEFAULT_KEYWORDS],
  customKeywords: [],
  logoUrl: "",
  iconUrl: "/icon.svg",
  ogImageUrl: "/og-image.png",
  ogImageAlt: `${t.brand.name} · ${t.brand.slogan}`,
};

function parseKeywords(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** 后台可配置的站点品牌与 SEO 信息；同一请求内自动去重 */
export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  let stored: Record<string, string> = {};
  try {
    stored = await getSettingsMap([...SITE_SETTING_KEYS]);
  } catch {
    // 构建或数据库暂时不可用时回退到默认品牌，避免整站无法渲染。
  }

  const name = stored.siteName?.trim() || DEFAULT_SITE_CONFIG.name;
  const slogan = stored.siteSlogan?.trim() || DEFAULT_SITE_CONFIG.slogan;
  const tagline = stored.siteTagline?.trim() || DEFAULT_SITE_CONFIG.tagline;
  const customDescription = stored.seoDescription?.trim() ?? "";
  const customKeywords = parseKeywords(stored.seoKeywords ?? "");
  const logoUrl = stored.siteLogo?.trim() || "";
  const iconUrl = stored.siteIcon?.trim() || DEFAULT_SITE_CONFIG.iconUrl;
  const ogImageUrl = stored.siteOgImage?.trim() || DEFAULT_SITE_CONFIG.ogImageUrl;

  return {
    name,
    slogan,
    tagline,
    description: customDescription || `${slogan}，${tagline}。`,
    customDescription,
    keywords: customKeywords.length ? customKeywords : [name, ...DEFAULT_KEYWORDS],
    customKeywords,
    logoUrl,
    iconUrl,
    ogImageUrl,
    ogImageAlt: `${name} · ${slogan}`,
  };
});
