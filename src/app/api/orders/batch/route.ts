import { z } from "zod";
import { clientIp, json, rateLimit } from "@/lib/http";
import { lookupOrder } from "@/lib/orders";

const Body = z.object({ items: z.array(z.object({ orderNo: z.string().max(40), token: z.string().max(40) })).max(50) });

/** 「我的订单」批量刷新本机订单状态 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!rateLimit(`batch:${ip}`, 30, 60_000)) return json({ error: "刷新太频繁，请稍后再试" }, 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "参数不正确" }, 400);
  const results = await Promise.all(parsed.data.items.map((i) => lookupOrder(i.orderNo, i.token)));
  return json({ orders: results.filter(Boolean) });
}
