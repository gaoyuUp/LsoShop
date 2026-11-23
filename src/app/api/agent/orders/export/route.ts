import { agentOrders } from "@/lib/affiliate";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { startOfShanghaiDay } from "@/lib/admin-data";

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const agent = await getCurrentAffiliate();
  if (!agent) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") === "self" ? "self" : "customers";
  const period = Math.max(0, Number(url.searchParams.get("period") ?? 0));
  const from = period > 0 ? startOfShanghaiDay(-(period - 1)) : undefined;
  const rows = await agentOrders(agent.id, scope, from);

  const lines = [
    ["订单号", "商品", "规格", "数量", "金额(元)", "佣金(元)", "状态", "邮箱", "渠道", "下单时间"].map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.orderNo,
        row.productName,
        row.variantName,
        row.quantity,
        (row.totalCents / 100).toFixed(2),
        (row.commissionCents / 100).toFixed(2),
        row.status,
        row.email,
        row.src,
        new Date(row.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
      ].map(csvCell).join(","),
    ),
  ];

  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agent-${scope}-orders.csv"`,
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
