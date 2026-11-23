import "server-only";
import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getStockMap, releaseExpiredOrders } from "@/lib/orders";

const { products, productVariants, productCategories } = schema;

export type PublicVariant = {
  id: number;
  name: string;
  description: string;
  priceCents: number;
  originalPriceCents: number;
  minQuantity: number;
  maxQuantity: number;
  deliveryMode: string;
  /** 是否参与代理销售 */
  affiliateEnabled: boolean;
  /** 自动发货的可售库存；人工发货为 null（不限） */
  stock: number | null;
};

export type PublicProduct = {
  id: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  categorySort: number;
  slug: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  image: string;
  theme: string;
  deliveryHint: string;
  warnings: string[];
  notes: { title: string; body: string }[];
  requireEmail: boolean;
  isExpiring: boolean;
  validityDays: number;
  variants: PublicVariant[];
  minPriceCents: number;
  totalStock: number | null;
};

/** 代理视角：把可见规格价格替换为代理客户价（未设价 / 规格不参与代理销售时保持系统价） */
export type AgentShopContext = { affiliateId: number; priceCodeId: number | null };

async function load(where?: ReturnType<typeof eq>, agent?: AgentShopContext) {
  await releaseExpiredOrders();
  const list = await db
    .select()
    .from(products)
    .where(where ? and(eq(products.listed, true), where) : eq(products.listed, true))
    .orderBy(asc(products.sort), asc(products.id));
  if (list.length === 0) return [];
  const categories = await db.select().from(productCategories);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const variants = await db
    .select()
    .from(productVariants)
    .where(and(inArray(productVariants.productId, list.map((p) => p.id)), eq(productVariants.listed, true)))
    .orderBy(asc(productVariants.sort), asc(productVariants.id));
  const stock = await getStockMap(variants.map((v) => v.id));

  // 动态 import 避免与 lib/affiliate 的模块循环
  let agentMap: Map<number, { priceCents: number }> | null = null;
  if (agent) {
    const { getVariantPriceMap } = await import("@/lib/affiliate");
    agentMap = await getVariantPriceMap(agent.affiliateId, agent.priceCodeId, variants.map((v) => v.id));
  }

  return list.map<PublicProduct>((p) => {
    const vs = variants
      .filter((v) => v.productId === p.id)
      .map<PublicVariant>((v) => {
        const info = agentMap?.get(v.id);
        return {
          id: v.id,
          name: v.name,
          description: v.description,
          priceCents: info ? info.priceCents : v.priceCents,
          originalPriceCents: v.originalPriceCents,
          minQuantity: v.minQuantity,
          maxQuantity: v.maxQuantity,
          deliveryMode: v.deliveryMode,
          affiliateEnabled: v.affiliateEnabled,
          stock: v.deliveryMode === "auto" ? (stock.get(v.id) ?? 0) : null,
        };
      });
    const hasManual = vs.some((v) => v.stock === null);
    return {
      id: p.id,
      categoryId: p.categoryId,
      categoryName: categoryMap.get(p.categoryId)?.name ?? "未分类",
      categorySlug: categoryMap.get(p.categoryId)?.slug ?? "",
      categorySort: categoryMap.get(p.categoryId)?.sort ?? 0,
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      badge: p.badge,
      description: p.description ?? "",
      image: p.image,
      theme: p.theme,
      deliveryHint: p.deliveryHint,
      warnings: p.warnings ?? [],
      notes: p.notes ?? [],
      requireEmail: p.requireEmail,
      isExpiring: p.isExpiring,
      validityDays: p.validityDays,
      variants: vs,
      minPriceCents: vs.length ? Math.min(...vs.map((v) => v.priceCents)) : 0,
      totalStock: hasManual ? null : vs.reduce((s, v) => s + (v.stock ?? 0), 0),
    };
  });
}

export const getListedProducts = (agent?: AgentShopContext) => load(undefined, agent);

/** 同一请求内 metadata 与页面共用，避免重复查询。 */
export const getProductBySlug = cache(async (slug: string, agent?: AgentShopContext) => {
  const [p] = await load(eq(products.slug, slug), agent);
  return p ?? null;
});

export async function getSetting(key: string, fallback = "") {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
  return row?.value ?? fallback;
}

/** 前台客服渠道：QQ / 微信 / 邮箱 / Telegram（空值不会展示） */
export async function getSupportContacts() {
  const keys = ["supportQQ", "supportWechat", "supportEmail", "supportTelegram"] as const;
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, [...keys]));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string | undefined>;
  return {
    qq: map.supportQQ ?? "",
    wechat: map.supportWechat ?? "",
    email: map.supportEmail ?? "",
    telegram: map.supportTelegram ?? "",
    wechatQr: "",
  };
}
