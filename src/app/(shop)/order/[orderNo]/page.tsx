import type { Metadata } from "next";
import { connection } from "next/server";
import { OrderDetail } from "@/components/site/order-detail";
import { resolveAgentSupport } from "@/lib/agent-context";

export const metadata: Metadata = {
  title: "订单详情",
  description: "查看订单状态、支付信息与交付内容。",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderPage({ params }: PageProps<"/order/[orderNo]">) {
  await connection();
  const { orderNo } = await params;
  const support = await resolveAgentSupport();
  return <OrderDetail orderNo={orderNo.toUpperCase()} support={support} />;
}
