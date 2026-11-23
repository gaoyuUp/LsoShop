import "server-only";
import { cookies } from "next/headers";
import { getAffiliateByCode, resolvePriceCode, getAffiliateById } from "@/lib/affiliate";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { getSupportContacts } from "@/lib/catalog";
import type { SupportContacts } from "@/lib/support";

/** 代理归因 cookie（httpOnly）：CODE:PRICECODE:SRC（空段留空） */
export const AFF_COOKIE = "lso_aff";
export const AFF_COOKIE_TTL = 30 * 86_400;

export type AgentContext = {
  /** 已校验有效的推广码；无效 / 已停用为 null（回退系统价） */
  code: string | null;
  /** 当前价位码值（无为主价格） */
  priceCode: string | null;
  /** 渠道来源 */
  src: string;
  affiliateId: number | null;
  /** 已校验的价位码 id（仅 affiliateId 有效时） */
  priceCodeId: number | null;
};

function parseCookie(value: string): AgentContext {
  const [code, pc, ...srcParts] = value.split(":");
  const src = srcParts.join(":");
  return {
    code: code?.toUpperCase() || null,
    priceCode: pc?.toUpperCase() || null,
    src: (src ?? "").slice(0, 40),
    affiliateId: null,
    priceCodeId: null,
  };
}

export const AFFILIATE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: AFF_COOKIE_TTL,
};

/** 读取并校验当前请求的代理归因（无效码不产生归属，避免悄悄算给错误代理） */
export async function getAgentContext(): Promise<AgentContext> {
  const store = await cookies();
  const raw = store.get(AFF_COOKIE)?.value;
  if (!raw) {
    // 代理登录后即使没有带 /r 链接，也按自己的客户价和客服配置逛店/下单。
    const affiliate = await getCurrentAffiliate();
    return affiliate
      ? { code: affiliate.code, priceCode: null, src: "", affiliateId: affiliate.id, priceCodeId: null }
      : { code: null, priceCode: null, src: "", affiliateId: null, priceCodeId: null };
  }
  const ctx = parseCookie(raw);
  if (!ctx.code) return ctx;
  const affiliate = await getAffiliateByCode(ctx.code);
  if (!affiliate || affiliate.status !== "active") {
    const current = await getCurrentAffiliate();
    return current
      ? { code: current.code, priceCode: null, src: ctx.src, affiliateId: current.id, priceCodeId: null }
      : { code: null, priceCode: null, src: ctx.src, affiliateId: null, priceCodeId: null };
  }
  ctx.affiliateId = affiliate.id;
  if (ctx.priceCode) {
    const pc = await resolvePriceCode(affiliate.id, ctx.priceCode);
    if (pc) ctx.priceCodeId = pc.id;
    else ctx.priceCode = null;
  }
  return ctx;
}

/** 店铺页客服：代理链接显示代理客服，根路径显示平台客服 */
export async function resolveShopSupport(ctx: AgentContext): Promise<SupportContacts> {
  if (ctx.affiliateId) {
    const agent = await getAffiliateById(ctx.affiliateId);
    if (agent) {
      const hasChannel = Boolean(agent.wechat || agent.wechatQr || agent.qq || agent.telegram);
      if (hasChannel) {
        // 代理配了任意一种客服，就完全使用代理自己的渠道（含二维码）
        return {
          qq: agent.qq,
          wechat: agent.wechat,
          email: "",
          telegram: agent.telegram,
          wechatQr: agent.wechatQr,
        };
      }
    }
  }
  // 代理没有配置客服时回退平台客服
  return getSupportContacts();
}

/** 当前请求归因下的店铺客服（layout 用） */
export async function resolveAgentSupport(): Promise<SupportContacts> {
  return resolveShopSupport(await getAgentContext());
}

export { getAffiliateByCode, resolvePriceCode, getAffiliateById };
