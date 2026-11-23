import type { Metadata } from "next";
import { OrdersClient } from "@/components/site/orders-client";
import { getDictionary } from "@/i18n";

export const metadata: Metadata = {
  title: "我的订单",
  description: "查看保存在本机的订单，或用订单号 + 查询口令 / 下单邮箱跨设备查询。",
  robots: { index: false, follow: false, nocache: true },
};

export default function OrdersPage() {
  const t = getDictionary();
  return <OrdersClient title={t.orders.title} desc={t.orders.desc} />;
}
