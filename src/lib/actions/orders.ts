"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";
import {
  closeOrder,
  manualDeliver,
  markOrderPaid,
  OrderError,
  sendDeliveryEmail,
} from "@/lib/orders";

const { orders } = schema;

function backTo(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}
async function orderById(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  return order ?? null;
}
function refreshAdmin(id?: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  if (id) revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/emails");
}

export async function confirmPaymentAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const order = id ? await orderById(id) : null;
  if (!order) backTo("/admin/orders", { error: "订单不存在" });
  if (order.status !== "pending" && order.status !== "closed") {
    backTo(`/admin/orders/${id}`, { error: "当前订单不需要确认支付" });
  }
  let err = "";
  try {
    await markOrderPaid(order.orderNo, `ADMIN${Date.now()}`);
  } catch (e) {
    err = e instanceof OrderError ? e.message : "确认支付失败";
  }
  if (err) backTo(`/admin/orders/${id}`, { error: err });
  refreshAdmin(id);
  backTo(`/admin/orders/${id}`, { notice: "paid" });
}

export async function deliverOrderAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const content = String(fd.get("content") ?? "").trim();
  const notify = fd.get("notify") === "1";
  const order = id ? await orderById(id) : null;
  if (!order) backTo("/admin/orders", { error: "订单不存在" });
  if (!content) backTo(`/admin/orders/${id}`, { error: "交付内容不能为空" });
  let err = "";
  try {
    await manualDeliver(id, content, notify);
  } catch (e) {
    err = e instanceof OrderError ? e.message : "发货失败";
  }
  if (err) backTo(`/admin/orders/${id}`, { error: err });
  refreshAdmin(id);
  backTo(`/admin/orders/${id}`, { notice: "delivered" });
}

export async function resendDeliveryMailAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const order = id ? await orderById(id) : null;
  if (!order) backTo("/admin/orders", { error: "订单不存在" });
  if (!order.email) backTo(`/admin/orders/${id}`, { error: "订单没有收件邮箱，无法发送邮件" });
  if (!order.deliveryContent) backTo(`/admin/orders/${id}`, { error: "订单还没有交付内容" });

  let status = "";
  try {
    status = (await sendDeliveryEmail(id)) ?? "";
  } catch {
    status = "failed";
  }
  refreshAdmin(id);
  backTo(`/admin/orders/${id}`, { mail: status || "failed" });
}

export async function closeOrderAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const order = id ? await orderById(id) : null;
  if (!order) backTo("/admin/orders", { error: "订单不存在" });
  let err = "";
  try {
    await closeOrder(id);
  } catch (e) {
    err = e instanceof OrderError ? e.message : "操作失败";
  }
  if (err) backTo(`/admin/orders/${id}`, { error: err });
  refreshAdmin(id);
  backTo(`/admin/orders/${id}`, { notice: order.status === "pending" ? "closed" : "refunded" });
}

export async function saveOrderRemarkAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const remark = String(fd.get("remark") ?? "").trim().slice(0, 500);
  if (!id) return;
  await db.update(orders).set({ adminRemark: remark }).where(eq(orders.id, id));
  refreshAdmin(id);
  backTo(`/admin/orders/${id}`, { notice: "remark" });
}
