import { json } from "@/lib/http";
import { isMockPayment, lookupOrder, markOrderPaid, OrderError } from "@/lib/orders";

/** 模拟支付（仅 PAYMENT_MODE=mock 时可用） */
export async function POST(req: Request, ctx: RouteContext<"/api/orders/[orderNo]/mock-pay">) {
  if (!isMockPayment()) return json({ error: "模拟支付未开启" }, 403);
  const { orderNo } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { credential?: string };
  const credential = String(body.credential ?? "");
  const order = await lookupOrder(orderNo, credential);
  if (!order) return json({ error: "订单不存在" }, 404);
  if (order.status !== "pending") return json(order);
  try {
    await markOrderPaid(order.orderNo, `MOCK${Date.now()}`);
  } catch (e) {
    return json({ error: e instanceof OrderError ? e.message : "支付处理失败" }, 400);
  }
  return json(await lookupOrder(orderNo, credential));
}
