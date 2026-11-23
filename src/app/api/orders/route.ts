import { z } from "zod";
import { cookies } from "next/headers";
import { AFF_COOKIE } from "@/lib/agent-context";
import { clientIp, json, rateLimit } from "@/lib/http";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { createOrder, OrderError } from "@/lib/orders";

const Body = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive().max(1000),
  email: z.string().max(191).default(""),
});

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`create:${ip}`, 12, 60_000)) return json({ error: "操作太频繁，请稍后再试" }, 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "参数不正确" }, 400);

  // 推广归因：httpOnly 归因 cookie（访问 /r/码 时由服务端校验后写入），客户端不可伪造代理价
  const store = await cookies();
  const [code, priceCode, ...srcParts] = (store.get(AFF_COOKIE)?.value ?? "").split(":");
  const buyer = await getCurrentAffiliate();
  // 已登录代理不带 /r 链接时，也按自己的代理价下单（自购不返佣）
  const effectiveCode = code || buyer?.code || "";

  try {
    const result = await createOrder({
      ...parsed.data,
      clientIp: ip,
      affiliateCode: effectiveCode || undefined,
      priceCode: priceCode || undefined,
      src: srcParts.join(":") || undefined,
      buyerAffiliateId: buyer?.id ?? null,
    });
    return json(result);
  } catch (e) {
    if (e instanceof OrderError) return json({ error: e.message }, 400);
    console.error("[create order]", e);
    return json({ error: "下单失败，请稍后重试" }, 500);
  }
}
