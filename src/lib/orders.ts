import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db, schema } from "@/db";
import { env } from "@/lib/env";
import { deliveryEmailHtml, sendMail } from "@/lib/mail";
import { getPaymentProvider, isMockPayment } from "@/lib/payment";
import { getSiteConfig } from "@/lib/site-config";

const { orders, inventoryItems, products, productVariants, customerEntitlements } = schema;

const randomDigits = customAlphabet("0123456789", 6);
const randomToken = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 12);

export class OrderError extends Error {}

/** 交付内容中多份之间的分隔符 */
const DELIVERY_SEPARATOR = "\n---\n";

function hashToken(token: string) {
  return createHash("sha256").update(token.trim().toUpperCase()).digest("hex");
}

function newOrderNo() {
  const d = new Date(Date.now() + 8 * 3600_000); // 北京时间
  const pad = (n: number) => String(n).padStart(2, "0");
  return `LS${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${randomDigits()}`;
}

/** 关闭超时未支付的订单并释放其锁定库存（惰性执行，无需定时任务） */
export async function releaseExpiredOrders() {
  const expired = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.status, "pending"), lt(orders.expiresAt, new Date())));
  if (expired.length === 0) return;
  const ids = expired.map((o) => o.id);
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "closed", adminRemark: "超时未支付，自动关闭" })
      .where(and(inArray(orders.id, ids), eq(orders.status, "pending")));
    await tx
      .update(inventoryItems)
      .set({ status: "available", orderId: null })
      .where(and(inArray(inventoryItems.orderId, ids), eq(inventoryItems.status, "locked")));
  });
}

/** 各规格可售库存 */
export async function getStockMap(variantIds: number[]) {
  const map = new Map<number, number>();
  if (variantIds.length === 0) return map;
  const rows = await db
    .select({ variantId: inventoryItems.variantId, count: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(and(inArray(inventoryItems.variantId, variantIds), eq(inventoryItems.status, "available")))
    .groupBy(inventoryItems.variantId);
  for (const r of rows) map.set(r.variantId, Number(r.count));
  return map;
}

type CreateOrderInput = {
  variantId: number;
  quantity: number;
  email: string;
  clientIp?: string;
  /** 推广代理码（来自 lso_aff cookie，服务端校验） */
  affiliateCode?: string;
  /** 价位码值 */
  priceCode?: string;
  /** 渠道来源 */
  src?: string;
  /** 当前登录代理 id（用于识别代理自购） */
  buyerAffiliateId?: number | null;
};

type OrderAttribution = {
  orderType: "normal" | "self" | "affiliate";
  affiliateId: number | null;
  affiliateCode: string;
  priceCodeValue: string;
  src: string;
  /** 有效客户价（分）；规格未启用代理销售或无有效归因时缺省，按系统价计 */
  unitPriceCents?: number;
  systemPriceCents: number;
  costPriceCents: number;
  commissionCents: number;
  priceCodeId: number | null;
};

/** 解析订单的推广归因：代理码 / 价位码 / 自购识别，价格服务端重算 */
async function resolveOrderAttribution(
  input: {
    affiliateCode?: string;
    priceCode?: string;
    src?: string;
    email: string;
    variantId: number;
    buyerAffiliateId?: number | null;
  },
  variant: { priceCents: number; affiliateCostCents: number },
): Promise<OrderAttribution> {
  const src = (input.src ?? "").slice(0, 40);
  const fallbackCost = variant.affiliateCostCents > 0 ? variant.affiliateCostCents : variant.priceCents;
  const base = {
    orderType: "normal" as const,
    affiliateId: null as number | null,
    affiliateCode: "",
    priceCodeValue: "",
    src,
    unitPriceCents: variant.priceCents,
    systemPriceCents: variant.priceCents,
    costPriceCents: fallbackCost,
    commissionCents: 0,
    priceCodeId: null as number | null,
  };
  const code = (input.affiliateCode ?? "").trim().toUpperCase();
  if (!code) return base;

  const { getAffiliateByCode, resolvePriceCode, effectivePriceFor, getPromoSettings, AffiliateError } = await import(
    "@/lib/affiliate"
  );
  const affiliate = await getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") return base; // 无效 / 已停用 → 回退系统价，不悄悄归属

  const priceCode = await resolvePriceCode(affiliate.id, input.priceCode);
  let info;
  try {
    info = await effectivePriceFor(affiliate.id, input.variantId, priceCode?.id ?? null);
  } catch (e) {
    if (e instanceof AffiliateError) {
      return { ...base, affiliateId: affiliate.id, affiliateCode: affiliate.code };
    }
    throw e;
  }

  const selfPurchase =
    input.email.trim().toLowerCase() === affiliate.email ||
    (input.buyerAffiliateId != null && input.buyerAffiliateId === affiliate.id);
  const orderType: OrderAttribution["orderType"] = selfPurchase ? "self" : "affiliate";
  const settings = await getPromoSettings();
  const commissionCents =
    orderType === "affiliate"
      ? Math.max(0, Math.round(((info.priceCents - info.costCents) * settings.commissionRate) / 100))
      : 0;

  return {
    orderType,
    affiliateId: affiliate.id,
    affiliateCode: affiliate.code,
    priceCodeValue: priceCode?.code ?? "",
    src,
    unitPriceCents: info.priceCents,
    systemPriceCents: info.systemPriceCents,
    costPriceCents: info.costCents,
    commissionCents,
    priceCodeId: priceCode?.id ?? null,
  };
}

export async function createOrder(input: CreateOrderInput) {
  await releaseExpiredOrders();

  const [row] = await db
    .select({ variant: productVariants, product: products })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, input.variantId));
  if (!row || !row.product.listed || !row.variant.listed) throw new OrderError("该商品暂不可购买");

  const { product, variant } = row;
  const quantity = Math.floor(input.quantity);
  if (!Number.isFinite(quantity) || quantity < variant.minQuantity || quantity > variant.maxQuantity) {
    throw new OrderError(`购买数量需在 ${variant.minQuantity} ~ ${variant.maxQuantity} 之间`);
  }
  const email = input.email.trim().toLowerCase();
  if (product.requireEmail && !email) throw new OrderError("请填写收件邮箱");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderError("邮箱格式不正确");

  // 推广归因：代理码来自 cookie（服务端校验），规格未启用代理销售时回退系统价
  const attribution = await resolveOrderAttribution(
    {
      affiliateCode: variant.affiliateEnabled ? input.affiliateCode : undefined,
      priceCode: variant.affiliateEnabled ? input.priceCode : undefined,
      src: input.src,
      email,
      variantId: variant.id,
      buyerAffiliateId: input.buyerAffiliateId,
    },
    variant,
  );

  const orderNo = newOrderNo();
  const token = randomToken();
  const unitPriceCents = (attribution.unitPriceCents ?? variant.priceCents) > 0 ? (attribution.unitPriceCents ?? variant.priceCents) : variant.priceCents;
  const totalCents = unitPriceCents * quantity;
  const expiresAt = new Date(Date.now() + env.orderExpireMinutes * 60_000);

  await db.transaction(async (tx) => {
    let itemIds: number[] = [];
    if (variant.deliveryMode === "auto") {
      const items = await tx
        .select({ id: inventoryItems.id })
        .from(inventoryItems)
        .where(and(eq(inventoryItems.variantId, variant.id), eq(inventoryItems.status, "available")))
        .orderBy(asc(inventoryItems.id))
        .limit(quantity)
        .for("update", { skipLocked: true });
      if (items.length < quantity) {
        throw new OrderError(items.length === 0 ? "该规格已售罄，请稍后再来" : `库存不足，当前仅剩 ${items.length} 份`);
      }
      itemIds = items.map((i) => i.id);
    }

    const [created] = await tx
      .insert(orders)
      .values({
        orderNo,
        tokenHash: hashToken(token),
        email,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        productImage: product.image,
        orderType: attribution.orderType,
        affiliateId: attribution.affiliateId,
        affiliateCode: attribution.affiliateCode,
        priceCodeValue: attribution.priceCodeValue,
        src: attribution.src,
        systemPriceCents: attribution.systemPriceCents,
        costPriceCents: attribution.costPriceCents,
        unitPriceCents,
        quantity,
        totalCents,
        commissionCents: attribution.commissionCents * quantity,
        deliveryMode: variant.deliveryMode,
        validityDays: product.validityDays,
        paymentMethod: "alipay",
        clientIp: (input.clientIp || "").slice(0, 64),
        expiresAt,
      })
      .$returningId();

    if (itemIds.length) {
      await tx
        .update(inventoryItems)
        .set({ status: "locked", orderId: created.id })
        .where(inArray(inventoryItems.id, itemIds));
    }
  });

  return { orderNo, token };
}

/**
 * 支付成功入口（支付宝异步通知 / 模拟支付 / 后台手动确认 都走这里）。
 * 幂等：重复调用不会重复发货。
 */
export async function markOrderPaid(orderNo: string, tradeNo?: string) {
  const result = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.orderNo, orderNo)).for("update");
    if (!order) throw new OrderError("订单不存在");
    if (order.status === "paid" || order.status === "delivered") return { order, justPaid: false };
    if (order.status === "refunded") throw new OrderError("订单已退款");

    // 订单已因超时关闭但用户仍完成了付款：重新尝试锁定库存
    if (order.status === "closed" && order.deliveryMode === "auto") {
      const items = await tx
        .select({ id: inventoryItems.id })
        .from(inventoryItems)
        .where(and(eq(inventoryItems.variantId, order.variantId), eq(inventoryItems.status, "available")))
        .orderBy(asc(inventoryItems.id))
        .limit(order.quantity)
        .for("update", { skipLocked: true });
      if (items.length === order.quantity) {
        await tx
          .update(inventoryItems)
          .set({ status: "locked", orderId: order.id })
          .where(inArray(inventoryItems.id, items.map((i) => i.id)));
      }
    }

    await tx
      .update(orders)
      .set({ status: "paid", paidAt: new Date(), tradeNo: tradeNo ?? null, adminRemark: "" })
      .where(eq(orders.id, order.id));
    return { order, justPaid: true };
  });

  if (result.justPaid) {
    const { settleOrderCommissions } = await import("@/lib/affiliate");
    // 佣金结算：自动发货规格付款即结算；人工发货规格挂起，发货时结算
    await settleOrderCommissions(result.order.id, result.order.orderNo, result.order.deliveryMode === "auto");
    if (result.order.deliveryMode === "auto") {
      await autoDeliver(result.order.id);
    }
  }
}

/** 自动发货：把锁定的库存标记为已售，写入交付内容并发邮件 */
async function autoDeliver(orderId: number) {
  const delivered = await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order || order.status !== "paid") return false;
    const items = await tx
      .select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.orderId, orderId), eq(inventoryItems.status, "locked")))
      .orderBy(asc(inventoryItems.id));
    if (items.length < order.quantity) return false; // 库存不够 → 保持「待发货」等人工处理
    const now = new Date();
    await tx
      .update(inventoryItems)
      .set({ status: "sold", soldAt: now })
      .where(inArray(inventoryItems.id, items.map((i) => i.id)));
    await tx
      .update(orders)
      .set({
        status: "delivered",
        deliveredAt: now,
        deliveryContent: items.map((i) => i.content.trim()).join(DELIVERY_SEPARATOR),
      })
      .where(eq(orders.id, orderId));
    return true;
  });
  if (delivered) {
    const { settleDeliveredCommissions } = await import("@/lib/affiliate");
    await settleDeliveredCommissions(orderId);
    await recordEntitlement(orderId);
    await sendDeliveryEmail(orderId);
  }
}

/** 后台手动发货 / 修改交付内容 */
export async function manualDeliver(orderId: number, content: string, notify = true) {
  const text = content.trim();
  if (!text) throw new OrderError("交付内容不能为空");
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new OrderError("订单不存在");
  if (order.status === "pending" || order.status === "closed" || order.status === "refunded") {
    throw new OrderError("订单未付款，不能发货");
  }
  const wasDelivered = order.status === "delivered";
  await db
    .update(orders)
    .set({ status: "delivered", deliveredAt: order.deliveredAt ?? new Date(), deliveryContent: text })
    .where(eq(orders.id, orderId));
  if (!wasDelivered) {
    const { settleDeliveredCommissions } = await import("@/lib/affiliate");
    await settleDeliveredCommissions(orderId);
  }
  await recordEntitlement(orderId);
  if (notify) await sendDeliveryEmail(orderId);
}

export async function sendDeliveryEmail(orderId: number) {
  const [order, site] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .then((rows) => rows[0]),
    getSiteConfig(),
  ]);
  if (!order || !order.email || !order.deliveryContent) return null;
  const status = await sendMail({
    to: order.email,
    orderId: order.id,
    subject: `【${site.name}】订单 ${order.orderNo} 已发货`,
    html: deliveryEmailHtml({
      brandName: site.name,
      orderNo: order.orderNo,
      productName: order.productName,
      variantName: order.variantName,
      quantity: order.quantity,
      content: order.deliveryContent,
    }),
  });
  await db.update(orders).set({ emailStatus: status }).where(eq(orders.id, orderId));
  return status;
}

/** 订单交付后记录会员到期权益（同一个订单幂等） */
async function recordEntitlement(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || !order.affiliateId || order.orderType !== "affiliate") return;
  if (!order.validityDays || order.validityDays <= 0 || !order.email) return;
  const startsAt = order.deliveredAt ?? new Date();
  const expiresAt = new Date(startsAt.getTime() + order.validityDays * 86_400_000);
  await db
    .insert(customerEntitlements)
    .values({
      affiliateId: order.affiliateId,
      customerEmail: order.email.trim().toLowerCase(),
      orderId: order.id,
      orderNo: order.orderNo,
      productId: order.productId,
      productName: order.productName,
      variantName: order.variantName,
      startsAt,
      expiresAt,
      status: "active",
    })
    .onDuplicateKeyUpdate({ set: { expiresAt, status: "active" } });
  // 兼容旧客户列表字段：记录最近一次会员到期时间
  await db
    .update(schema.customerBindings)
    .set({ expiresAt })
    .where(and(eq(schema.customerBindings.affiliateId, order.affiliateId), eq(schema.customerBindings.customerEmail, order.email.trim().toLowerCase())));
}

/** 后台关闭订单（释放库存） */
export async function closeOrder(orderId: number) {
  let revokeReason = "订单关闭";
  await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for("update");
    if (!order) throw new OrderError("订单不存在");
    if (order.status !== "pending" && order.status !== "paid" && order.status !== "delivered") {
      throw new OrderError("当前状态不能关闭或退款");
    }
    if (order.status !== "pending") revokeReason = "订单退款";
    // 已发货订单退款不回收已售库存；待发货订单退款时释放锁定库存
    await tx
      .update(orders)
      .set({ status: order.status === "pending" ? "closed" : "refunded" })
      .where(eq(orders.id, orderId));
    await tx
      .update(inventoryItems)
      .set({ status: "available", orderId: null })
      .where(and(eq(inventoryItems.orderId, orderId), eq(inventoryItems.status, "locked")));
  });
  // 关闭 / 退款：未提现的推广佣金撤销（自动发货规格退款前已结算的也要撤销）
  const { revokeOrderCommissions } = await import("@/lib/affiliate");
  await revokeOrderCommissions(orderId, revokeReason);
  await db.update(customerEntitlements).set({ status: "ended" }).where(eq(customerEntitlements.orderId, orderId));
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function toPublicOrder(order: typeof orders.$inferSelect) {
  const payment =
    order.status === "pending" ? await getPaymentProvider().createPayment({
      orderNo: order.orderNo,
      subject: `${order.productName} ${order.variantName}`,
      totalCents: order.totalCents,
    }) : null;
  return {
    orderNo: order.orderNo,
    status: order.status,
    productName: order.productName,
    variantName: order.variantName,
    productImage: order.productImage,
    quantity: order.quantity,
    unitPriceCents: order.unitPriceCents,
    totalCents: order.totalCents,
    email: order.email,
    emailStatus: order.emailStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    deliveryItems:
      order.status === "delivered" && order.deliveryContent
        ? order.deliveryContent.split(DELIVERY_SEPARATOR).map((s) => s.trim()).filter(Boolean)
        : [],
    payment: payment ? { qrContent: payment.qrContent, mock: payment.mock } : null,
    serverNow: new Date().toISOString(),
  };
}

/** 前台查询：订单号 + 查询口令 或 订单号 + 下单邮箱 */
export async function lookupOrder(orderNo: string, credential: string) {
  await releaseExpiredOrders();
  const no = orderNo.trim().toUpperCase();
  const cred = credential.trim();
  if (!no || !cred) return null;
  const [order] = await db.select().from(orders).where(eq(orders.orderNo, no));
  if (!order) return null;
  const byToken = safeEqual(order.tokenHash, hashToken(cred));
  const byEmail = cred.includes("@") && order.email !== "" && safeEqual(order.email, cred.toLowerCase());
  if (!byToken && !byEmail) return null;
  return toPublicOrder(order);
}

export { isMockPayment };
