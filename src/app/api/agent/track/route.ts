import { z } from "zod";
import { cookies } from "next/headers";
import { AFFILIATE_COOKIE_OPTIONS, AFF_COOKIE } from "@/lib/agent-context";
import { recordClick, resolveAgentEntry } from "@/lib/affiliate";
import { clientIp, json } from "@/lib/http";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";

const Body = z.object({
  code: z.string().max(16),
  priceCode: z.string().max(16).optional(),
  src: z.string().max(40).optional(),
  /** 浏览器访客标识（客户端生成的匿名 key） */
  visitor: z.string().max(64).optional(),
});

/** 访问 /r/:code 时由客户端调用：记录推广点击并写入归因 cookie（服务端校验代理有效性） */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false });
  const { code, priceCode, src, visitor } = parsed.data;

  const affiliateEntry = await resolveAgentEntry(code, priceCode);
  if ("invalid" in affiliateEntry) {
    // 无效 / 已停用：清除可能残留的归因
    const store = await cookies();
    store.delete(AFF_COOKIE);
    return json({ ok: false, valid: false });
  }
  const affiliate = affiliateEntry.affiliate;
  const priceCodeId = affiliateEntry.priceCode?.id ?? null;

  const ip = await clientIp();
  const visitorKey = (visitor || ip || "").slice(0, 64);
  const current = await getCurrentAffiliate();
  // 代理本人点自己的链接不冒充外部访客，不点亮“开张第二步”
  const isSelf = current?.id === affiliate.id;
  await recordClick(affiliate.id, priceCodeId, src ?? "", visitorKey, isSelf);

  const store = await cookies();
  store.set(
    AFF_COOKIE,
    [affiliate.code, affiliateEntry.priceCode?.code ?? "", src ?? ""].join(":"),
    AFFILIATE_COOKIE_OPTIONS,
  );
  return json({ ok: true, valid: true, code: affiliate.code });
}
