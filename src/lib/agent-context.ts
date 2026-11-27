import "server-only";
import { cookies } from "next/headers";
import { resolveAgentEntry, getAffiliateById } from "@/lib/affiliate";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { getSupportContacts } from "@/lib/catalog";
import type { SupportContacts } from "@/lib/support";

/** 代理归因 cookie（httpOnly）：CODE:PRICECODE:SRC（空段留空） */
export const AFF_COOKIE = "lso_aff";
const AFF_COOKIE_TTL = 30 * 86_400;

type AgentContext = { affiliateId: number | null };

export const AFFILIATE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: AFF_COOKIE_TTL,
};

/** 主站价格上下文：未登录访客只看公开最高价，登录代理看自己的客户价 */
export async function getAgentPricingContext(): Promise<AgentContext> {
  const affiliate = await getCurrentAffiliate();
  return { affiliateId: affiliate?.id ?? null };
}

/** 只用于客服归属：优先读取并校验当前代理链接 Cookie，其次回退当前登录代理 */
async function getSupportAffiliateId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get(AFF_COOKIE)?.value;
  if (raw) {
    const [code, priceCode] = raw.split(":");
    if (code) {
      const entry = await resolveAgentEntry(code, priceCode || undefined);
      if (!("invalid" in entry)) return entry.affiliate.id;
    }
  }
  const current = await getCurrentAffiliate();
  return current?.id ?? null;
}

/** 店铺页客服：代理链接显示代理客服，根路径显示平台客服 */
async function resolveShopSupport(affiliateId: number | null): Promise<SupportContacts> {
  if (affiliateId) {
    const agent = await getAffiliateById(affiliateId);
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
  return resolveShopSupport(await getSupportAffiliateId());
}
