import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, lt, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, products, productVariants, inventoryItems, emailLogs, productCategories, orders: orderTable } = schema;

/** 北京时间当天 0 点对应的 UTC 时间 */
export function startOfShanghaiDay(offsetDays = 0) {
  const now = new Date();
  const sh = new Date(now.getTime() + 8 * 3600_000);
  const start = Date.UTC(sh.getUTCFullYear(), sh.getUTCMonth(), sh.getUTCDate() + offsetDays) - 8 * 3600_000;
  return new Date(start);
}

/** 北京时间日期键 YYYY-MM-DD */
export function shanghaiDayKey(d: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Date(date.getTime() + 8 * 3600_000).toISOString().slice(0, 10);
}

const paidStatuses = ["paid", "delivered"] as const;

export async function getDashboardData() {
  const today = startOfShanghaiDay();
  const yesterday = startOfShanghaiDay(-1);
  const weekStart = startOfShanghaiDay(-6);

  const [todayRow] = await db
    .select({
      orders: sql<number>`count(*)`,
      pendingShip: sql<number>`coalesce(sum(case when status = 'paid' then 1 else 0 end), 0)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, today));

  const [yesterdayOrdersRow] = await db
    .select({ orders: sql<number>`count(*)` })
    .from(orders)
    .where(and(gte(orders.createdAt, yesterday), lt(orders.createdAt, today)));

  const [todayPaidRow] = await db
    .select({ revenue: sql<number>`coalesce(sum(total_cents), 0)` })
    .from(orders)
    .where(and(gte(orders.paidAt, today), inArray(orders.status, paidStatuses)));

  const [yesterdayPaidRow] = await db
    .select({ revenue: sql<number>`coalesce(sum(total_cents), 0)` })
    .from(orders)
    .where(and(gte(orders.paidAt, yesterday), lt(orders.paidAt, today), inArray(orders.status, paidStatuses)));

  const [allTime] = await db
    .select({
      revenue: sql<number>`coalesce(sum(total_cents), 0)`,
      orders: sql<number>`count(*)`,
      delivered: sql<number>`coalesce(sum(case when status = 'delivered' then 1 else 0 end), 0)`,
    })
    .from(orders)
    .where(inArray(orders.status, paidStatuses));

  const [stock] = await db
    .select({
      available: sql<number>`coalesce(sum(case when status = 'available' then 1 else 0 end), 0)`,
      sold: sql<number>`coalesce(sum(case when status = 'sold' then 1 else 0 end), 0)`,
    })
    .from(inventoryItems);

  const [[productCountRow], [variantCountRow]] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(productVariants),
  ]);

  const seriesRows = await db
    .select({
      day: sql<string>`date_format(convert_tz(${orders.paidAt}, '+00:00', '+08:00'), '%Y-%m-%d')`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(orders)
    .where(and(gte(orders.paidAt, weekStart), inArray(orders.status, paidStatuses)))
    .groupBy(sql`1`);

  const series = Array.from({ length: 7 }, (_, i) => {
    const day = shanghaiDayKey(startOfShanghaiDay(i - 6));
    const row = seriesRows.find((r) => r.day === day);
    return { day, revenue: Number(row?.revenue ?? 0), count: Number(row?.count ?? 0) };
  });

  const recent = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      productName: orders.productName,
      variantName: orders.variantName,
      totalCents: orders.totalCents,
      status: orders.status,
      email: orders.email,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(7);

  const lowStock = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      productId: products.id,
      productName: products.name,
      stock: sql<number>`count(${inventoryItems.id})`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(
      inventoryItems,
      and(eq(inventoryItems.variantId, productVariants.id), eq(inventoryItems.status, "available")),
    )
    .where(and(eq(productVariants.listed, true), eq(products.listed, true), eq(productVariants.deliveryMode, "auto")))
    .groupBy(productVariants.id, products.id)
    .orderBy(sql`count(${inventoryItems.id}) asc`)
    .limit(4);

  const n = (v: unknown) => Number(v ?? 0);

  return {
    today: { orders: n(todayRow?.orders), pendingShip: n(todayRow?.pendingShip) },
    todayRevenue: n(todayPaidRow?.revenue),
    yesterday: { orders: n(yesterdayOrdersRow?.orders), revenue: n(yesterdayPaidRow?.revenue) },
    allTime: { revenue: n(allTime?.revenue), orders: n(allTime?.orders), delivered: n(allTime?.delivered) },
    stock: { available: n(stock?.available), sold: n(stock?.sold) },
    counts: { products: n(productCountRow?.n), variants: n(variantCountRow?.n) },
    series,
    recent,
    lowStock: lowStock.map((r) => ({ ...r, stock: n(r.stock) })),
  };
}

export type AdminVariant = {
  id: number;
  productId: number;
  name: string;
  description: string;
  priceCents: number;
  originalPriceCents: number;
  minQuantity: number;
  maxQuantity: number;
  deliveryMode: string;
  listed: boolean;
  sort: number;
  affiliateEnabled: boolean;
  affiliateCostCents: number;
  stock: number;
  sold: number;
};

export async function listAdminProducts(opts: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, opts.pageSize ?? 20);
  const [countRow, variantCountRow, listedCountRow] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(products),
    db.select({ n: sql<number>`count(*)` }).from(productVariants),
    db.select({ n: sql<number>`count(*)` }).from(products).where(eq(products.listed, true)),
  ]);
  const total = Number(countRow[0]?.n ?? 0);
  const list = await db
    .select()
    .from(products)
    .orderBy(asc(products.sort), asc(products.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  if (list.length === 0) {
    return {
      rows: [],
      page,
      pageSize,
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      summary: { variants: Number(variantCountRow[0]?.n ?? 0), listed: Number(listedCountRow[0]?.n ?? 0) },
    };
  }

  const categories = await db.select().from(productCategories).orderBy(asc(productCategories.sort), asc(productCategories.id));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const variants = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, list.map((p) => p.id)))
    .orderBy(asc(productVariants.sort), asc(productVariants.id));
  const variantIds = variants.map((v) => v.id);
  const counts = variantIds.length
    ? await db
        .select({
          variantId: inventoryItems.variantId,
          status: inventoryItems.status,
          count: sql<number>`count(*)`,
        })
        .from(inventoryItems)
        .where(inArray(inventoryItems.variantId, variantIds))
        .groupBy(inventoryItems.variantId, inventoryItems.status)
    : [];

  const stockMap = new Map<string, number>();
  for (const c of counts) stockMap.set(`${c.variantId}:${c.status}`, Number(c.count));

  const rows = list.map((p) => {
    const pv = variants
      .filter((v) => v.productId === p.id)
      .map<AdminVariant>((v) => ({
        ...v,
        stock: stockMap.get(`${v.id}:available`) ?? 0,
        sold: stockMap.get(`${v.id}:sold`) ?? 0,
      }));
    return {
      ...p,
      categoryName: categoryMap.get(p.categoryId)?.name ?? "未分类",
      categorySlug: categoryMap.get(p.categoryId)?.slug ?? "",
      variants: pv,
      minPriceCents: pv.length ? Math.min(...pv.map((v) => v.priceCents)) : 0,
      stock: pv.reduce((s, v) => s + v.stock, 0),
    };
  });
  return {
    rows,
    page,
    pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    summary: { variants: Number(variantCountRow[0]?.n ?? 0), listed: Number(listedCountRow[0]?.n ?? 0) },
  };
}

export async function getAdminProduct(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return null;
  const [category] = await db.select().from(productCategories).where(eq(productCategories.id, product.categoryId));
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sort), asc(productVariants.id));
  const counts = await db
    .select({ variantId: inventoryItems.variantId, status: inventoryItems.status, count: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(inArray(inventoryItems.variantId, variants.map((v) => v.id).concat([-1])))
    .groupBy(inventoryItems.variantId, inventoryItems.status);
  const map = new Map<string, number>();
  for (const c of counts) map.set(`${c.variantId}:${c.status}`, Number(c.count));
  return {
    ...product,
    categoryName: category?.name ?? "未分类",
    variants: variants.map<AdminVariant>((v) => ({
      ...v,
      stock: map.get(`${v.id}:available`) ?? 0,
      sold: map.get(`${v.id}:sold`) ?? 0,
    })),
  };
}

export async function listOrders(opts: { status?: string; q?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 20;
  const cond: SQL[] = [];
  if (opts.status && opts.status !== "all") cond.push(eq(orders.status, opts.status));
  if (opts.q) {
    const q = `%${opts.q.trim()}%`;
    cond.push(or(like(orders.orderNo, q), like(orders.email, q), like(orders.productName, q))!);
  }
  const where = cond.length ? and(...cond) : undefined;
  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(orders).where(where);
  const rows = await db
    .select()
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = Number(countRow?.n ?? 0);
  return { rows, page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getOrderDetail(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  if (!order) return null;
  const mails = await db
    .select()
    .from(emailLogs)
    .where(eq(emailLogs.orderId, id))
    .orderBy(desc(emailLogs.createdAt))
    .limit(20);
  return { order, mails };
}

export async function listInventory(opts: { variantId?: number; status?: string; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 40;
  const cond: SQL[] = [];
  if (opts.variantId) cond.push(eq(inventoryItems.variantId, opts.variantId));
  if (opts.status && opts.status !== "all") cond.push(eq(inventoryItems.status, opts.status));
  const where = cond.length ? and(...cond) : undefined;
  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(inventoryItems).where(where);
  const rows = await db
    .select({
      id: inventoryItems.id,
      variantId: inventoryItems.variantId,
      content: inventoryItems.content,
      status: inventoryItems.status,
      orderId: inventoryItems.orderId,
      soldAt: inventoryItems.soldAt,
      createdAt: inventoryItems.createdAt,
      variantName: productVariants.name,
      productName: products.name,
    })
    .from(inventoryItems)
    .innerJoin(productVariants, eq(productVariants.id, inventoryItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(where)
    .orderBy(desc(inventoryItems.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = Number(countRow?.n ?? 0);
  return { rows, page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function listVariantOptions() {
  return db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      productId: products.id,
      productName: products.name,
      deliveryMode: productVariants.deliveryMode,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .orderBy(asc(products.sort), asc(productVariants.sort));
}

export async function listEmailLogs(page = 1) {
  const pageSize = 30;
  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(emailLogs);
  const rows = await db
    .select({
      id: emailLogs.id,
      orderId: emailLogs.orderId,
      toEmail: emailLogs.toEmail,
      subject: emailLogs.subject,
      status: emailLogs.status,
      error: emailLogs.error,
      createdAt: emailLogs.createdAt,
      html: emailLogs.html,
      orderNo: orderTable.orderNo,
    })
    .from(emailLogs)
    .leftJoin(orderTable, eq(orderTable.id, emailLogs.orderId))
    .orderBy(desc(emailLogs.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const total = Number(countRow?.n ?? 0);
  return { rows, page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getSettingsMap(keys: string[]) {
  if (keys.length === 0) return {} as Record<string, string>;
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, keys));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getVariantStock(variantId: number) {
  const rows = await db
    .select({ status: inventoryItems.status, count: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(eq(inventoryItems.variantId, variantId))
    .groupBy(inventoryItems.status);
  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.count)])) as Record<string, number>;
  return { available: map.available ?? 0, locked: map.locked ?? 0, sold: map.sold ?? 0 };
}

export async function getInventorySummary(variantId?: number) {
  const rows = await db
    .select({ status: inventoryItems.status, count: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(variantId ? eq(inventoryItems.variantId, variantId) : undefined)
    .groupBy(inventoryItems.status);
  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.count)])) as Record<string, number>;
  return { available: map.available ?? 0, locked: map.locked ?? 0, sold: map.sold ?? 0, total: rows.reduce((s, r) => s + Number(r.count), 0) };
}

export async function getOrderSummary() {
  const rows = await db
    .select({ status: orders.status, n: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)` })
    .from(orders)
    .groupBy(orders.status);
  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)])) as Record<string, number>;
  const revenue = rows
    .filter((r) => r.status === "paid" || r.status === "delivered")
    .reduce((s, r) => s + Number(r.revenue), 0);
  return {
    all: rows.reduce((s, r) => s + Number(r.n), 0),
    pending: map.pending ?? 0,
    paid: map.paid ?? 0,
    delivered: map.delivered ?? 0,
    closed: map.closed ?? 0,
    refunded: map.refunded ?? 0,
    revenue,
  };
}

export async function getEmailSummary() {
  const rows = await db
    .select({ status: emailLogs.status, n: sql<number>`count(*)` })
    .from(emailLogs)
    .groupBy(emailLogs.status);
  const map = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)])) as Record<string, number>;
  return { sent: map.sent ?? 0, failed: map.failed ?? 0, skipped: map.skipped ?? 0, total: rows.reduce((s, r) => s + Number(r.n), 0) };
}


export async function listCategoryOptions() {
  return db
    .select({ id: productCategories.id, name: productCategories.name, slug: productCategories.slug })
    .from(productCategories)
    .orderBy(asc(productCategories.sort), asc(productCategories.id));
}

export async function listCategoriesWithCounts(opts: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, opts.pageSize ?? 20);
  const [countRow, productRow, maxRow] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(productCategories),
    db.select({ n: sql<number>`count(*)` }).from(products),
    db.select({ n: sql<number>`coalesce(max(${productCategories.sort}), 0)` }).from(productCategories),
  ]);
  const total = Number(countRow[0]?.n ?? 0);
  const rows = await db
    .select({
      id: productCategories.id,
      name: productCategories.name,
      slug: productCategories.slug,
      sort: productCategories.sort,
      createdAt: productCategories.createdAt,
      productCount: sql<number>`count(${products.id})`,
    })
    .from(productCategories)
    .leftJoin(products, eq(products.categoryId, productCategories.id))
    .groupBy(productCategories.id)
    .orderBy(asc(productCategories.sort), asc(productCategories.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    rows: rows.map((r) => ({ ...r, productCount: Number(r.productCount) })),
    page,
    pageSize,
    total,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    productTotal: Number(productRow[0]?.n ?? 0),
    maxSort: Number(maxRow[0]?.n ?? 0),
  };
}
