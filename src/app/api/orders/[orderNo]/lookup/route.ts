import { clientIp, json, rateLimit } from "@/lib/http";
import { lookupOrder } from "@/lib/orders";

export async function POST(req: Request, ctx: RouteContext<"/api/orders/[orderNo]/lookup">) {
  const { orderNo } = await ctx.params;
  const ip = await clientIp();
  if (!rateLimit(`lookup:${ip}`, 60, 60_000)) return json({ error: "查询太频繁，请稍后再试" }, 429);
  const body = (await req.json().catch(() => ({}))) as { credential?: string };
  const order = await lookupOrder(orderNo, String(body.credential ?? ""));
  if (!order) return json({ error: "未找到订单，请检查订单号和查询口令" }, 404);
  return json(order);
}
