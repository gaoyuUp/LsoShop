import zhCN, { type Dictionary } from "./zh-CN";

export const locales = ["zh-CN"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-CN";

const dictionaries: Record<Locale, Dictionary> = { "zh-CN": zhCN };

/** 服务端/客户端通用：按语言取字典（目前只有中文） */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? zhCN;
}

export type { Dictionary };
