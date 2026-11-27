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
  buyerInput: z.string().max(255).default(""),
  couponCode: z.string().max(16).default(""),
});

export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`create:${ip}`, 12, 60_000)) return json({ error: "操作太频繁，请稍后再试" }, 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "参数不正确" }, 400);

  // 价格归因只认本次下单携带的优惠码；未带码时按主站最高价。
  // 已登录代理在自己主站下单时使用自己的推广码，保留自购价。
  const store = await cookies();
  const src = (store.get(AFF_COOKIE)?.value ?? "").split(":").slice(2).join(":") || undefined;
  const buyer = await getCurrentAffiliate();
  const couponCode = parsed.data.couponCode.trim().toUpperCase() || buyer?.code || "";

  try {
    const result = await createOrder({
      ...parsed.data,
      couponCode,
      clientIp: ip,
      src,
      buyerAffiliateId: buyer?.id ?? null,
    });
    return json(result);
  } catch (e) {
    if (e instanceof OrderError) return json({ error: e.message }, 400);
    console.error("[create order]", e);
    return json({ error: "下单失败，请稍后重试" }, 500);
  }
}
