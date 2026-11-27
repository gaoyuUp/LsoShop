import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { OrderDetail } from "@/components/site/order-detail";
import { SharedOrderView } from "@/components/site/shared-order-view";
import { resolveAgentSupport } from "@/lib/agent-context";
import { getSharedOrderData, verifyOrderShareToken } from "@/lib/orders";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "订单详情",
  description: "查看订单状态、支付信息与交付内容。",
  robots: { index: false, follow: false, nocache: true },
};

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[orderNo]">) {
  await connection();
  const { orderNo } = await params;
  const sp = await searchParams;
  const share = typeof sp.share === "string" ? sp.share : "";

  if (share && verifyOrderShareToken(orderNo, share)) {
    const [order, site] = await Promise.all([getSharedOrderData(orderNo), getSiteConfig()]);
    if (!order) notFound();
    return <SharedOrderView order={order} brandName={site.name} logoUrl={site.logoUrl} />;
  }

  const support = await resolveAgentSupport();
  return <OrderDetail orderNo={orderNo.toUpperCase()} support={support} />;
}
