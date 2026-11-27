import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, isNotNull, like, lt, or, sql, type SQL } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db, schema } from "@/db";
import { getListedProducts, getSetting, type PublicProduct } from "@/lib/catalog";
import { shanghaiDayKey, startOfShanghaiDay } from "@/lib/admin-data";

const {
  affiliates,
  affiliateInvites,
  priceCodes,
  affiliatePricing,
  affiliateClicks,
  customerBindings,
  commissions,
  withdrawals,
  customerEntitlements,
  affiliateEmailCodes,
  productVariants,
  orders,
} = schema;

const randomInvite = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 4);
const randomAffiliate = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);
const randomPriceCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6);

function newInviteCode() {
  return `${randomInvite()}-${randomInvite()}-${randomInvite()}`;
}
function newAffiliateCode() {
  return randomAffiliate();
}
function newPriceCodeValue() {
  return randomPriceCode();
}

export class AffiliateError extends Error {}

/** 代理推广设置（settings 键，缺省值即一期口径） */
export async function getPromoSettings() {
  const [minRaw, rateRaw, ttlRaw, maxCodesRaw] = await Promise.all([
    getSetting("promo_min_withdraw_cents", "5000"),
    getSetting("promo_commission_rate", "100"),
    getSetting("promo_invite_ttl_days", "30"),
    getSetting("promo_max_price_codes", "10"),
  ]);
  return {
    minWithdrawCents: Math.max(0, Number(minRaw) || 0),
    commissionRate: Math.min(100, Math.max(0, Number(rateRaw) || 100)),
    inviteTtlDays: Math.max(1, Number(ttlRaw) || 30),
    maxPriceCodes: Math.min(50, Math.max(1, Number(maxCodesRaw) || 10)),
  };
}

/* ---------------- 代理账号 ---------------- */

export async function getAffiliateByEmail(email: string) {
  const [row] = await db.select().from(affiliates).where(eq(affiliates.email, email.trim().toLowerCase()));
  return row ?? null;
}

export async function getAffiliateByCode(code: string) {
  const [row] = await db.select().from(affiliates).where(eq(affiliates.code, code.trim().toUpperCase()));
  return row ?? null;
}

export async function getAffiliateById(id: number) {
  const [row] = await db.select().from(affiliates).where(eq(affiliates.id, id));
  return row ?? null;
}

/** 校验邀请码可用性（不消费），供发送验证码前预检 */
export async function validateInvite(codeValue: string) {
  const code = codeValue.trim().toUpperCase();
  if (!code) throw new AffiliateError("请填写邀请码");
  const [invite] = await db.select().from(affiliateInvites).where(eq(affiliateInvites.code, code));
  if (!invite) throw new AffiliateError("邀请码不存在，请核对后重试");
  if (invite.status === "disabled") throw new AffiliateError("该邀请码已停用");
  if (invite.status === "used") throw new AffiliateError("该邀请码已被使用，每个邀请码只能开通一个账号");
  if (invite.status === "expired" || (invite.expiresAt && invite.expiresAt < new Date())) {
    throw new AffiliateError("该邀请码已过期");
  }
  return invite;
}

/** 邀请码开通：校验码值 / 停用 / 过期 / 已使用，成功后标记已用并关联代理 */
export async function redeemInvite(codeValue: string, email: string) {
  const code = codeValue.trim().toUpperCase();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new AffiliateError("邮箱格式不正确");

  const createdId = await db.transaction(async (tx) => {
    const [invite] = await tx.select().from(affiliateInvites).where(eq(affiliateInvites.code, code)).for("update");
    if (!invite) throw new AffiliateError("邀请码不存在，请核对后重试");
    if (invite.status === "disabled") throw new AffiliateError("该邀请码已停用");
    if (invite.status === "used") throw new AffiliateError("该邀请码已被使用，每个邀请码只能开通一个账号");
    if (invite.status === "expired" || (invite.expiresAt && invite.expiresAt < new Date())) {
      throw new AffiliateError("该邀请码已过期");
    }

    const [existing] = await tx.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.email, normalized));
    if (existing) throw new AffiliateError("该邮箱已开通代理账号，请直接登录");

    let codeValueNew = newAffiliateCode();
    for (let i = 0; i < 5; i++) {
      const [used] = await tx.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.code, codeValueNew));
      const [usedPrice] = await tx.select({ id: priceCodes.id }).from(priceCodes).where(eq(priceCodes.code, codeValueNew));
      if (!used && !usedPrice) break;
      codeValueNew = newAffiliateCode();
    }

    const [created] = await tx
      .insert(affiliates)
      .values({ email: normalized, nickname: normalized.split("@")[0].slice(0, 60), code: codeValueNew })
      .$returningId();
    await tx
      .update(affiliateInvites)
      .set({ status: "used", affiliateId: created.id, usedEmail: normalized, usedAt: new Date() })
      .where(eq(affiliateInvites.id, invite.id));
    return created.id;
  });
  return getAffiliateById(createdId);
}

/* ---------------- 代理客户价 ---------------- */

type VariantPriceInfo = {
  variantId: number;
  /** 展示给客户的价格（分） */
  priceCents: number;
  /** 未设置代理价，使用系统公开价 */
  isDefault: boolean;
  /** 佣金基准价（分）：管理员设置的代理成本价，0 时等于系统公开价 */
  costCents: number;
  minCents: number;
  maxCents: number;
  /** 该单价的预估佣金（分） */
  commissionCents: number;
  systemPriceCents: number;
};

async function loadVariantRows(variantIds: number[]) {
  if (variantIds.length === 0) return new Map<number, (typeof productVariants.$inferSelect)>();
  const rows = await db.select().from(productVariants).where(inArray(productVariants.id, variantIds));
  return new Map(rows.map((r) => [r.id, r]));
}

/** 某代理某价位码下各规格的最终客户价与佣金口径 */
export async function getVariantPriceMap(
  affiliateId: number,
  priceCodeId: number | null,
  variantIds: number[],
): Promise<Map<number, VariantPriceInfo>> {
  const settings = await getPromoSettings();
  const variants = await loadVariantRows(variantIds);
  // 价位码未单独配置的规格回退到代理主价格，再回退系统价
  const pricing = await db
    .select()
    .from(affiliatePricing)
    .where(
      and(
        eq(affiliatePricing.affiliateId, affiliateId),
        priceCodeId === null
          ? isNull(affiliatePricing.priceCodeId)
          : or(isNull(affiliatePricing.priceCodeId), eq(affiliatePricing.priceCodeId, priceCodeId)),
      ),
    );
  const mainPrices = new Map<number, number>();
  const codePrices = new Map<number, number>();
  for (const row of pricing) {
    if (row.priceCodeId === null) mainPrices.set(row.variantId, row.priceCents);
    else codePrices.set(row.variantId, row.priceCents);
  }
  const map = new Map<number, VariantPriceInfo>();
  for (const id of variantIds) {
    const v = variants.get(id);
    if (!v) continue;
    if (!v.affiliateEnabled) {
      map.set(id, {
        variantId: id,
        priceCents: v.priceCents,
        isDefault: true,
        costCents: v.priceCents,
        minCents: v.priceCents,
        maxCents: v.priceCents,
        commissionCents: 0,
        systemPriceCents: v.priceCents,
      });
      continue;
    }
    const costCents = v.affiliateCostCents > 0 ? v.affiliateCostCents : v.priceCents;
    // 代理可设置区间：系统售价 → 划线原价（无划线价则最高为系统售价）
    const minCents = v.priceCents;
    const maxCents = Math.max(v.originalPriceCents > 0 ? v.originalPriceCents : v.priceCents, minCents);
    const custom = priceCodeId !== null ? (codePrices.get(id) ?? mainPrices.get(id)) : mainPrices.get(id);
    const priceCents = custom !== undefined ? Math.max(minCents, Math.min(maxCents, custom)) : v.priceCents;
    const commissionCents =
      settings.commissionRate > 0 ? Math.max(0, Math.round(((priceCents - costCents) * settings.commissionRate) / 100)) : 0;
    map.set(id, {
      variantId: id,
      priceCents,
      isDefault: custom === undefined,
      costCents,
      minCents,
      maxCents,
      commissionCents,
      systemPriceCents: v.priceCents,
    });
  }
  return map;
}

/** 校验并保存代理价格（主价格 priceCodeId=null 或价位码），越界自动收拢到 [min,max] */
export async function saveAgentPricing(
  affiliateId: number,
  priceCodeId: number | null,
  entries: { variantId: number; priceCents: number }[],
) {
  const variantIds = [...new Set(entries.map((e) => e.variantId))];
  const variants = await loadVariantRows(variantIds);
  await db.transaction(async (tx) => {
    for (const entry of entries) {
      const v = variants.get(entry.variantId);
      if (!v || !v.listed || !v.affiliateEnabled) continue;
      const minCents = v.priceCents;
      const maxCents = Math.max(v.originalPriceCents > 0 ? v.originalPriceCents : v.priceCents, minCents);
      const price = Math.round(Math.max(minCents, Math.min(maxCents, entry.priceCents)));
      const where = and(
        eq(affiliatePricing.affiliateId, affiliateId),
        eq(affiliatePricing.variantId, entry.variantId),
        priceCodeId === null ? isNull(affiliatePricing.priceCodeId) : eq(affiliatePricing.priceCodeId, priceCodeId),
      );
      const [existing] = await tx.select({ id: affiliatePricing.id }).from(affiliatePricing).where(where).limit(1);
      if (existing) {
        await tx.update(affiliatePricing).set({ priceCents: price }).where(eq(affiliatePricing.id, existing.id));
      } else {
        await tx.insert(affiliatePricing).values({ affiliateId, variantId: entry.variantId, priceCents: price, priceCodeId });
      }
    }
  });
}

/* ---------------- 代理店铺（/r/:code） ---------------- */

type AgentShop = {
  affiliate: { id: number; code: string; status: string };
  /** 当前生效的价位码（null = 主价格） */
  priceCode: { id: number; code: string; name: string } | null;
  /** 规范入口码：价位码优先，否则代理推广码，用于店铺内链接保持优惠 */
  entryCode: string;
  products: PublicProduct[];
  /** variantId → 客户价与佣金口径 */
  prices: Map<number, VariantPriceInfo>;
};

type PriceCodeSummary = { id: number; code: string; name: string };

type AgentEntry = {
  affiliate: typeof affiliates.$inferSelect;
  priceCode: PriceCodeSummary | null;
  /** 规范入口码：价位码优先，否则代理推广码 */
  entryCode: string;
};

/** 解析 /r/:code 入口：同时支持代理推广码和价位码，并兼容旧的 ?pc= 参数 */
export async function resolveAgentEntry(
  codeValue: string,
  legacyPriceCode?: string,
): Promise<AgentEntry | { invalid: true; reason: "unknown" | "disabled" }> {
  const code = codeValue.trim().toUpperCase();
  if (!code) return { invalid: true, reason: "unknown" };

  const affiliate = await getAffiliateByCode(code);
  if (affiliate) {
    if (affiliate.status !== "active") return { invalid: true, reason: "disabled" };
    const priceCode = legacyPriceCode ? await resolvePriceCode(affiliate.id, legacyPriceCode) : null;
    const summary = priceCode ? { id: priceCode.id, code: priceCode.code, name: priceCode.name } : null;
    return { affiliate, priceCode: summary, entryCode: summary?.code ?? affiliate.code };
  }

  const [priceCode] = await db.select().from(priceCodes).where(eq(priceCodes.code, code));
  if (!priceCode) return { invalid: true, reason: "unknown" };
  if (!priceCode.active) return { invalid: true, reason: "disabled" };
  const owner = await getAffiliateById(priceCode.affiliateId);
  if (!owner) return { invalid: true, reason: "unknown" };
  if (owner.status !== "active") return { invalid: true, reason: "disabled" };
  return {
    affiliate: owner,
    priceCode: { id: priceCode.id, code: priceCode.code, name: priceCode.name },
    entryCode: priceCode.code,
  };
}

export async function getAgentShop(
  code: string,
  priceCodeValue?: string,
): Promise<AgentShop | { invalid: true; reason: "unknown" | "disabled" }> {
  const entry = await resolveAgentEntry(code, priceCodeValue);
  if ("invalid" in entry) return entry;
  const { affiliate, priceCode } = entry;

  const products = await getListedProducts({ affiliateId: affiliate.id, priceCodeId: priceCode?.id ?? null });
  const variantIds = products.flatMap((p) => p.variants.map((v) => v.id));
  const prices = await getVariantPriceMap(affiliate.id, priceCode?.id ?? null, variantIds);
  return {
    affiliate: { id: affiliate.id, code: affiliate.code, status: affiliate.status },
    priceCode,
    entryCode: entry.entryCode,
    products,
    prices,
  };
}

/** 下单时服务端重新计算的有效客户价（不信任客户端传价） */
export async function effectivePriceFor(
  affiliateId: number,
  variantId: number,
  priceCodeId: number | null,
): Promise<VariantPriceInfo> {
  const map = await getVariantPriceMap(affiliateId, priceCodeId, [variantId]);
  const info = map.get(variantId);
  if (!info) throw new AffiliateError("该规格暂不可通过代理购买");
  return info;
}

/** 下单时按码值找价位码（无码值为 null 主价格） */
export async function resolvePriceCode(affiliateId: number, value?: string) {
  if (!value) return null;
  const [row] = await db
    .select()
    .from(priceCodes)
    .where(
      and(
        eq(priceCodes.code, value.trim().toUpperCase()),
        eq(priceCodes.affiliateId, affiliateId),
        eq(priceCodes.active, true),
      ),
    );
  return row ?? null;
}

/* ---------------- 客户绑定 ---------------- */

/** 结算时绑定客户：同一邮箱永久归属首位代理，后来者不改绑 */
async function bindCustomer(affiliateId: number, email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;
  const [existing] = await db.select().from(customerBindings).where(eq(customerBindings.customerEmail, normalized));
  if (!existing) {
    try {
      await db.insert(customerBindings).values({
        affiliateId,
        customerEmail: normalized,
        boundAt: new Date(),
      });
    } catch {
      // 并发下唯一键冲突：重新读取，只有同一代理才允许记回购
      const [raced] = await db.select().from(customerBindings).where(eq(customerBindings.customerEmail, normalized));
      if (raced?.affiliateId === affiliateId) {
        await db
          .update(customerBindings)
          .set({ repeatBuy: true })
          .where(eq(customerBindings.id, raced.id));
      }
    }
    return;
  }
  // 首绑永久：后来使用其他代理的码也不改绑
  if (existing.affiliateId !== affiliateId) return;
  await db
    .update(customerBindings)
    .set({ repeatBuy: true })
    .where(eq(customerBindings.id, existing.id));
}

export async function listAgentCustomers(affiliateId: number) {
  const rows = await db.select().from(customerBindings).where(eq(customerBindings.affiliateId, affiliateId));
  if (rows.length === 0) return [];
  const emails = rows.map((r) => r.customerEmail);
  const orderStats = await db
    .select({ email: orders.email, n: sql<number>`count(*)`, total: sql<number>`coalesce(sum(${orders.totalCents}), 0)` })
    .from(orders)
    .where(and(inArray(orders.email, emails), inArray(orders.status, ["paid", "delivered"]), eq(orders.affiliateId, affiliateId)))
    .groupBy(orders.email);
  const statMap = new Map(orderStats.map((s) => [s.email.toLowerCase(), s]));
  const entitlementRows = await db
    .select()
    .from(customerEntitlements)
    .where(eq(customerEntitlements.affiliateId, affiliateId))
    .orderBy(asc(customerEntitlements.expiresAt));
  const now = Date.now();
  const entitlementMap = new Map<string, typeof entitlementRows>();
  for (const e of entitlementRows) {
    const list = entitlementMap.get(e.customerEmail) ?? [];
    list.push(e);
    entitlementMap.set(e.customerEmail, list);
  }
  return rows.map((r) => ({
    id: r.id,
    customerEmail: r.customerEmail,
    remark: r.remark,
    boundAt: r.boundAt,
    expiresAt: r.expiresAt,
    repeatBuy: r.repeatBuy,
    /** 绑定关系与会员状态分开：到期不等于解绑 */
    status: r.expiresAt && r.expiresAt.getTime() < now ? "会员已到期" : r.repeatBuy ? "回头客" : "绑定中",
    orderCount: Number(statMap.get(r.customerEmail)?.n ?? 0),
    totalCents: Number(statMap.get(r.customerEmail)?.total ?? 0),
    entitlements: (entitlementMap.get(r.customerEmail) ?? []).map((e) => {
      const left = e.expiresAt.getTime() - now;
      return {
        id: e.id,
        productName: e.productName,
        variantName: e.variantName,
        orderNo: e.orderNo,
        expiresAt: e.expiresAt,
        status: e.status === "ended" ? "ended" : left <= 0 ? "expired" : "active",
        daysLeft: Math.ceil(left / 86_400_000),
        isExpiringSoon: e.status !== "ended" && left > 0 && left <= 7 * 86_400_000,
      };
    }),
  }));
}

export async function updateBindingRemark(affiliateId: number, bindingId: number, remark: string) {
  await db
    .update(customerBindings)
    .set({ remark: remark.slice(0, 200) })
    .where(and(eq(customerBindings.id, bindingId), eq(customerBindings.affiliateId, affiliateId)));
}

/* ---------------- 佣金生命周期 ---------------- */

/** 付款成功：自动发货规格直接结算并绑定客户；人工发货规格挂起等发货 */
export async function settleOrderCommissions(orderId: number, orderNo: string, settleNow: boolean) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.orderType !== "affiliate" || !order.affiliateId || order.commissionCents <= 0) return;
  await db
    .insert(commissions)
    .values({
      orderId,
      affiliateId: order.affiliateId,
      orderNo,
      amountCents: order.commissionCents,
      costCents: order.costPriceCents,
      status: settleNow ? "settled" : "pending",
      settledAt: settleNow ? new Date() : null,
    });
  if (settleNow) await bindCustomer(order.affiliateId, order.email);
}

/** 发货成功：人工发货规格的佣金在此结算并绑定客户 */
export async function settleDeliveredCommissions(orderId: number) {
  let changed = false;
  await db.transaction(async (tx) => {
    const [pending] = await tx
      .select()
      .from(commissions)
      .where(and(eq(commissions.orderId, orderId), eq(commissions.status, "pending")))
      .for("update");
    if (!pending) return;
    await tx.update(commissions).set({ status: "settled", settledAt: new Date() }).where(eq(commissions.id, pending.id));
    changed = true;
  });
  if (!changed) return;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (order?.orderType === "affiliate" && order.affiliateId) {
    await bindCustomer(order.affiliateId, order.email);
  }
}

/** 退款 / 关闭：撤销未提现的佣金 */
export async function revokeOrderCommissions(orderId: number, reason: string) {
  await db
    .update(commissions)
    .set({ status: "revoked", revokeReason: reason.slice(0, 200), revokedAt: new Date() })
    .where(and(inArray(commissions.orderId, [orderId]), inArray(commissions.status, ["pending", "settled"])));
}

/* ---------------- 代理统计 ---------------- */

/** 可提现余额 = 已结算佣金 - 已申请（待审核/已打款，不含拒绝/撤回） */
export async function agentBalance(affiliateId: number) {
  const [commissionRow] = await db
    .select({
      settled: sql<number>`coalesce(sum(case when ${commissions.status} = 'settled' then ${commissions.amountCents} else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${commissions.status} = 'pending' then ${commissions.amountCents} else 0 end), 0)`,
      total: sql<number>`coalesce(sum(case when ${commissions.status} in ('settled','withdrawn') then ${commissions.amountCents} else 0 end), 0)`,
      settledCount: sql<number>`coalesce(sum(case when ${commissions.status} = 'settled' then 1 else 0 end), 0)`,
    })
    .from(commissions)
    .where(eq(commissions.affiliateId, affiliateId));
  const [withdrawRow] = await db
    .select({
      reserved: sql<number>`coalesce(sum(case when ${withdrawals.status} in ('pending','paid') then ${withdrawals.amountCents} else 0 end), 0)`,
    })
    .from(withdrawals)
    .where(eq(withdrawals.affiliateId, affiliateId));
  const settled = Number(commissionRow?.settled ?? 0);
  const reserved = Number(withdrawRow?.reserved ?? 0);
  return {
    settledCents: settled,
    pendingCents: Number(commissionRow?.pending ?? 0),
    totalCents: Number(commissionRow?.total ?? 0),
    settledCount: Number(commissionRow?.settledCount ?? 0),
    reservedCents: reserved,
    availableCents: Math.max(0, settled - reserved),
  };
}

export async function agentCommissionSummary(affiliateId: number) {
  const today = startOfShanghaiDay();
  const yesterday = startOfShanghaiDay(-1);
  const firstOfMonth = startOfShanghaiDay(-(new Date().getUTCDate() - 1));
  const base = and(eq(commissions.affiliateId, affiliateId));

  async function sum(where: SQL) {
    const [row] = await db
      .select({ amount: sql<number>`coalesce(sum(${commissions.amountCents}), 0)`, n: sql<number>`count(*)` })
      .from(commissions)
      .where(where);
    return { amount: Number(row?.amount ?? 0), n: Number(row?.n ?? 0) };
  }

  const [todayRow, yesterdayRow, monthRow, pendingRow, ordersTodayRows, customerRows, balance] = await Promise.all([
    sum(and(base, eq(commissions.status, "settled"), gte(commissions.settledAt, today))!),
    sum(and(base, eq(commissions.status, "settled"), gte(commissions.settledAt, yesterday), lt(commissions.settledAt, today))!),
    sum(and(base, inArray(commissions.status, ["settled", "withdrawn"]), gte(commissions.settledAt, firstOfMonth))!),
    sum(and(base, eq(commissions.status, "pending"))!),
    db
      .select({ n: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.affiliateId, affiliateId),
          eq(orders.orderType, "affiliate"),
          inArray(orders.status, ["paid", "delivered"]),
          gte(orders.paidAt, today),
        ),
      ),
    db
      .select({ n: sql<number>`count(*)` })
      .from(customerBindings)
      .where(eq(customerBindings.affiliateId, affiliateId)),
    agentBalance(affiliateId),
  ]);

  return {
    today: { ...todayRow, orders: Number(ordersTodayRows[0]?.n ?? 0) },
    yesterday: yesterdayRow,
    month: monthRow,
    pending: pendingRow,
    withdrawable: { amount: balance.availableCents, n: balance.settledCount },
    customers: Number(customerRows[0]?.n ?? 0),
    balance,
  };
}

/** 是否已经有访客从代理链接进入（开张第二步） */
export async function agentHasClicks(affiliateId: number) {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(affiliateClicks)
    .where(and(eq(affiliateClicks.affiliateId, affiliateId), eq(affiliateClicks.isSelf, false)));
  return Number(row?.n ?? 0) > 0;
}

export async function agentPendingWithdrawal(affiliateId: number) {
  const [row] = await db
    .select()
    .from(withdrawals)
    .where(and(eq(withdrawals.affiliateId, affiliateId), eq(withdrawals.status, "pending")))
    .orderBy(desc(withdrawals.createdAt))
    .limit(1);
  return row ?? null;
}

/** 代理订单（客户单 / 自购单） */
export async function agentOrderDetail(affiliateId: number, orderNo: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNo, orderNo.toUpperCase()), eq(orders.affiliateId, affiliateId)));
  if (!order) return null;
  const [commission] = await db.select().from(commissions).where(eq(commissions.orderId, order.id));
  return { order, commission: commission ?? null };
}

export async function agentOrders(affiliateId: number, scope: "customers" | "self", from?: Date, to?: Date) {
  const cond: SQL[] = [
    eq(orders.affiliateId, affiliateId),
    scope === "self" ? eq(orders.orderType, "self") : eq(orders.orderType, "affiliate"),
  ];
  if (from) cond.push(gte(orders.createdAt, from));
  if (to) cond.push(lt(orders.createdAt, to));
  return db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      orderType: orders.orderType,
      productName: orders.productName,
      variantName: orders.variantName,
      quantity: orders.quantity,
      totalCents: orders.totalCents,
      commissionCents: orders.commissionCents,
      status: orders.status,
      src: orders.src,
      email: orders.email,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
      priceCodeValue: orders.priceCodeValue,
    })
    .from(orders)
    .where(and(...cond)!)
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

/** 代理订单列表：包含推广订单和自购订单，可按价位码来源筛选 */
export async function listAffiliateOrders(opts: {
  affiliateId: number;
  scope?: "all" | "affiliate" | "self";
  channel?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const cond: SQL[] = [
    eq(orders.affiliateId, opts.affiliateId),
    inArray(orders.orderType, opts.scope === "affiliate" ? ["affiliate"] : opts.scope === "self" ? ["self"] : ["affiliate", "self"]),
  ];
  if (opts.channel && opts.channel !== "all") {
    cond.push(eq(orders.priceCodeValue, opts.channel === "main" ? "" : opts.channel));
  }
  const where = and(...cond)!;
  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(orders).where(where);
  const total = Number(countRow?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pages, Math.max(1, Math.floor(opts.page ?? 1) || 1));
  const rows = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      orderType: orders.orderType,
      productName: orders.productName,
      variantName: orders.variantName,
      quantity: orders.quantity,
      unitPriceCents: orders.unitPriceCents,
      totalCents: orders.totalCents,
      commissionCents: orders.commissionCents,
      status: orders.status,
      src: orders.src,
      email: orders.email,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
      priceCodeValue: orders.priceCodeValue,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return { rows, total, page, pageSize, pages };
}

export async function agentOrderStats(affiliateId: number, scope: "customers" | "self") {
  const type = scope === "self" ? "self" : "affiliate";
  const cond: SQL[] = [eq(orders.affiliateId, affiliateId), eq(orders.orderType, type)];
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','delivered') then ${orders.totalCents} else 0 end), 0)`,
      commission: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','delivered') then ${orders.commissionCents} else 0 end), 0)`,
    })
    .from(orders)
    .where(and(...cond)!);
  const productRows = await db
    .select({
      productName: orders.productName,
      n: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.affiliateId, affiliateId), eq(orders.orderType, type), inArray(orders.status, ["paid", "delivered"]))!)
    .groupBy(orders.productName);
  return {
    total: Number(row?.total ?? 0),
    revenue: Number(row?.revenue ?? 0),
    commission: Number(row?.commission ?? 0),
    products: productRows.map((r) => ({ name: r.productName, n: Number(r.n), revenue: Number(r.revenue) })),
  };
}

/** 排行榜：完成且符合返佣条件的客户推广订单（自购排除），按商品汇总 */
export async function agentLeaderboard(opts: { productId?: number; metric: "revenue" | "orders"; days: 1 | 7 | 30 | 0 }) {
  const from = opts.days > 0 ? startOfShanghaiDay(-(opts.days - 1)) : undefined;
  const cond: SQL[] = [eq(orders.orderType, "affiliate"), inArray(orders.status, ["paid", "delivered"])];
  if (opts.productId) cond.push(eq(orders.productId, opts.productId));
  if (from) cond.push(gte(orders.paidAt, from));
  const rows = await db
    .select({
      affiliateId: orders.affiliateId,
      code: affiliates.code,
      email: affiliates.email,
      nickname: affiliates.nickname,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      orders: sql<number>`count(*)`,
    })
    .from(orders)
    .innerJoin(affiliates, eq(affiliates.id, orders.affiliateId))
    .where(and(...cond)!)
    .groupBy(orders.affiliateId)
    .orderBy(opts.metric === "revenue" ? desc(sql`coalesce(sum(${orders.totalCents}), 0)`) : desc(sql`count(*)`))
    .limit(200);
  return rows.map((r) => ({
    affiliateId: r.affiliateId,
    code: r.code,
    name: r.nickname || r.email.split("@")[0],
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));
}

/* ---------------- 推广效果统计 ---------------- */

type PromoEffectRow = {
  day: string;
  visitors: number;
  opens: number;
  orders: number;
  paid: number;
};

export async function agentPromoEffect(affiliateId: number, days: 1 | 7 | 30 | 90) {
  const from = startOfShanghaiDay(-(days - 1));
  const [openRows, orderRows] = await Promise.all([
    db
      .select({
        day: sql<string>`date_format(convert_tz(${affiliateClicks.createdAt}, '+00:00', '+08:00'), '%Y-%m-%d')`,
        opens: sql<number>`count(*)`,
        visitors: sql<number>`count(distinct ${affiliateClicks.visitorKey})`,
      })
      .from(affiliateClicks)
      .where(and(eq(affiliateClicks.affiliateId, affiliateId), eq(affiliateClicks.isSelf, false), gte(affiliateClicks.createdAt, from)))
      .groupBy(sql`1`),
    db
      .select({
        day: sql<string>`date_format(convert_tz(${orders.createdAt}, '+00:00', '+08:00'), '%Y-%m-%d')`,
        orders: sql<number>`count(*)`,
        paid: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','delivered') then 1 else 0 end), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.affiliateId, affiliateId), eq(orders.orderType, "affiliate"), gte(orders.createdAt, from)))
      .groupBy(sql`1`),
  ]);
  const openMap = new Map(openRows.map((r) => [r.day, r]));
  const orderMap = new Map(orderRows.map((r) => [r.day, r]));
  const result: PromoEffectRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = shanghaiDayKey(startOfShanghaiDay(-i));
    const o = openMap.get(key);
    const ord = orderMap.get(key);
    result.push({
      day: key,
      visitors: Number(o?.visitors ?? 0),
      opens: Number(o?.opens ?? 0),
      orders: Number(ord?.orders ?? 0),
      paid: Number(ord?.paid ?? 0),
    });
  }
  return result;
}

/** 推广码 / 价位码分码统计：访问和订单都归因，零数据也保留主链接行 */
export async function agentChannelStats(affiliateId: number, from: Date) {
  const [codes, clickRows, orderRows] = await Promise.all([
    db
      .select({ id: priceCodes.id, name: priceCodes.name, code: priceCodes.code })
      .from(priceCodes)
      .where(eq(priceCodes.affiliateId, affiliateId))
      .orderBy(desc(priceCodes.createdAt)),
    db
      .select({
        priceCodeId: affiliateClicks.priceCodeId,
        visitors: sql<number>`count(distinct ${affiliateClicks.visitorKey})`,
        opens: sql<number>`count(*)`,
      })
      .from(affiliateClicks)
      .where(and(eq(affiliateClicks.affiliateId, affiliateId), eq(affiliateClicks.isSelf, false), gte(affiliateClicks.createdAt, from)))
      .groupBy(affiliateClicks.priceCodeId),
    db
      .select({
        priceCodeValue: orders.priceCodeValue,
        orders: sql<number>`count(*)`,
        paid: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','delivered') then 1 else 0 end), 0)`,
        revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.affiliateId, affiliateId), eq(orders.orderType, "affiliate"), gte(orders.createdAt, from)))
      .groupBy(orders.priceCodeValue),
  ]);

  const clickMap = new Map(clickRows.map((r) => [r.priceCodeId, r]));
  const orderMap = new Map(orderRows.map((r) => [r.priceCodeValue, r]));
  const mainClicks = clickMap.get(null);
  const mainOrders = orderMap.get("");
  const rows = [{
    key: "main",
    label: "主链接",
    code: "",
    visitors: Number(mainClicks?.visitors ?? 0),
    opens: Number(mainClicks?.opens ?? 0),
    orders: Number(mainOrders?.orders ?? 0),
    paid: Number(mainOrders?.paid ?? 0),
    revenue: Number(mainOrders?.revenue ?? 0),
  }];
  for (const c of codes) {
    const clicks = clickMap.get(c.id);
    const ord = orderMap.get(c.code);
    rows.push({
      key: `code-${c.id}`,
      label: c.name || c.code,
      code: c.code,
      visitors: Number(clicks?.visitors ?? 0),
      opens: Number(clicks?.opens ?? 0),
      orders: Number(ord?.orders ?? 0),
      paid: Number(ord?.paid ?? 0),
      revenue: Number(ord?.revenue ?? 0),
    });
  }
  return rows;
}

export async function recordClick(
  affiliateId: number,
  priceCodeId: number | null,
  src: string,
  visitorKey: string,
  isSelf = false,
) {
  await db.insert(affiliateClicks).values({
    affiliateId,
    priceCodeId,
    src: src.slice(0, 40),
    visitorKey: visitorKey.slice(0, 64),
    isSelf,
  });
}

export async function agentWithdrawals(affiliateId: number) {
  return db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.affiliateId, affiliateId))
    .orderBy(desc(withdrawals.createdAt))
    .limit(100);
}

/** 代理申请提现：锁金额、一代理一笔 pending */
export async function createWithdrawal(
  affiliateId: number,
  input: { amountCents: number; alipayAccount: string; payeeName: string },
) {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) throw new AffiliateError("请填写正确的提现金额");
  const settings = await getPromoSettings();
  if (input.amountCents < settings.minWithdrawCents) {
    throw new AffiliateError(`最低提现金额为 ¥${(settings.minWithdrawCents / 100).toFixed(2)}`);
  }
  if (!input.alipayAccount.trim() || !input.payeeName.trim()) throw new AffiliateError("请填写支付宝账号和收款人姓名");

  await db.transaction(async (tx) => {
    // 串行化同一代理的提现申请，避免重复锁定
    await tx.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.id, affiliateId)).for("update");
    const [pending] = await tx
      .select({ id: withdrawals.id })
      .from(withdrawals)
      .where(and(eq(withdrawals.affiliateId, affiliateId), eq(withdrawals.status, "pending")))
      .limit(1);
    if (pending) throw new AffiliateError("已有一笔待处理的提现申请，请处理完成后再申请");

    const [commissionRow] = await tx
      .select({ settled: sql<number>`coalesce(sum(case when ${commissions.status} = 'settled' then ${commissions.amountCents} else 0 end), 0)` })
      .from(commissions)
      .where(eq(commissions.affiliateId, affiliateId));
    const [withdrawRow] = await tx
      .select({ reserved: sql<number>`coalesce(sum(case when ${withdrawals.status} in ('pending','paid') then ${withdrawals.amountCents} else 0 end), 0)` })
      .from(withdrawals)
      .where(eq(withdrawals.affiliateId, affiliateId));
    const available = Number(commissionRow?.settled ?? 0) - Number(withdrawRow?.reserved ?? 0);
    if (input.amountCents > available) throw new AffiliateError("提现金额不能超过可提现余额");

    await tx.insert(withdrawals).values({
      affiliateId,
      amountCents: input.amountCents,
      alipayAccount: input.alipayAccount.trim().slice(0, 191),
      payeeName: input.payeeName.trim().slice(0, 60),
    });
  });
}

export async function cancelWithdrawal(affiliateId: number, id: number) {
  const [row] = await db
    .select()
    .from(withdrawals)
    .where(and(eq(withdrawals.id, id), eq(withdrawals.affiliateId, affiliateId), eq(withdrawals.status, "pending")));
  if (!row) throw new AffiliateError("只有待审核的申请可以撤回");
  await db.update(withdrawals).set({ status: "canceled", processedAt: new Date() }).where(eq(withdrawals.id, id));
}

export async function listAdminWithdrawals(status?: string, opts?: { page?: number; pageSize?: number }) {
  const pageSize = Math.max(1, opts?.pageSize ?? 20);
  const base = db
    .select({
      id: withdrawals.id,
      affiliateId: withdrawals.affiliateId,
      email: affiliates.email,
      nickname: affiliates.nickname,
      amountCents: withdrawals.amountCents,
      alipayAccount: withdrawals.alipayAccount,
      payeeName: withdrawals.payeeName,
      status: withdrawals.status,
      rejectReason: withdrawals.rejectReason,
      processNote: withdrawals.processNote,
      processedAt: withdrawals.processedAt,
      createdAt: withdrawals.createdAt,
    })
    .from(withdrawals)
    .innerJoin(affiliates, eq(affiliates.id, withdrawals.affiliateId))
    .where(status ? eq(withdrawals.status, status) : undefined)
    .orderBy(desc(withdrawals.createdAt));
  if (!opts?.page) return base;
  return base.limit(pageSize).offset((Math.max(1, opts.page) - 1) * pageSize);
}

export async function getAdminWithdrawalSummary() {
  const [all] = await db.select({ n: sql<number>`count(*)` }).from(withdrawals);
  const [pending] = await db
    .select({
      n: sql<number>`count(*)`,
      amount: sql<number>`coalesce(sum(${withdrawals.amountCents}), 0)`,
    })
    .from(withdrawals)
    .where(eq(withdrawals.status, "pending"));
  return {
    total: Number(all?.n ?? 0),
    pendingCount: Number(pending?.n ?? 0),
    pendingAmount: Number(pending?.amount ?? 0),
  };
}

export async function processWithdrawal(
  id: number,
  action: "paid" | "rejected",
  note = "",
) {
  const [row] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
  if (!row || row.status !== "pending") throw new AffiliateError("该提现申请已处理");
  await db
    .update(withdrawals)
    .set({
      status: action,
      rejectReason: action === "rejected" ? note.slice(0, 300) : "",
      processNote: note.slice(0, 300),
      processedAt: new Date(),
    })
    .where(eq(withdrawals.id, id));
}

/* ---------------- 价位码 ---------------- */

export async function getAgentPriceCodes(affiliateId: number) {
  const rows = await db
    .select()
    .from(priceCodes)
    .where(eq(priceCodes.affiliateId, affiliateId))
    .orderBy(desc(priceCodes.createdAt));
  if (rows.length === 0) return [];

  const codeRows = await db
    .select({
      priceCodeId: affiliatePricing.priceCodeId,
      variantId: affiliatePricing.variantId,
      priceCents: affiliatePricing.priceCents,
    })
    .from(affiliatePricing)
    .where(and(eq(affiliatePricing.affiliateId, affiliateId), isNotNull(affiliatePricing.priceCodeId)));
  if (codeRows.length === 0) {
    return rows.map((r) => ({ ...r, variantCount: 0, customProductCount: 0 }));
  }

  const variantIds = [...new Set(codeRows.map((r) => r.variantId))];
  const variantRows = await db
    .select({ id: productVariants.id, productId: productVariants.productId, priceCents: productVariants.priceCents })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));
  const variantMap = new Map(variantRows.map((v) => [v.id, v]));
  const mainRows = await db
    .select({ variantId: affiliatePricing.variantId, priceCents: affiliatePricing.priceCents })
    .from(affiliatePricing)
    .where(and(eq(affiliatePricing.affiliateId, affiliateId), isNull(affiliatePricing.priceCodeId), inArray(affiliatePricing.variantId, variantIds)));
  const mainMap = new Map(mainRows.map((r) => [r.variantId, r.priceCents]));

  const entriesByCode = new Map<number, number>();
  const productsByCode = new Map<number, Set<number>>();
  for (const row of codeRows) {
    if (!row.priceCodeId) continue;
    entriesByCode.set(row.priceCodeId, (entriesByCode.get(row.priceCodeId) ?? 0) + 1);
    const variant = variantMap.get(row.variantId);
    if (!variant) continue;
    const baseline = mainMap.get(row.variantId) ?? variant.priceCents;
    if (row.priceCents === baseline) continue;
    const set = productsByCode.get(row.priceCodeId) ?? new Set<number>();
    set.add(variant.productId);
    productsByCode.set(row.priceCodeId, set);
  }

  return rows.map((r) => ({
    ...r,
    variantCount: entriesByCode.get(r.id) ?? 0,
    customProductCount: productsByCode.get(r.id)?.size ?? 0,
  }));
}

export async function createPriceCode(affiliateId: number, name: string, copyCurrentPrices = true) {
  const cleanName = name.trim().slice(0, 60);
  if (!cleanName) throw new AffiliateError("请填写价位码名称");
  const settings = await getPromoSettings();
  const [countRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(priceCodes)
    .where(eq(priceCodes.affiliateId, affiliateId));
  if (Number(countRow?.n ?? 0) >= settings.maxPriceCodes) {
    throw new AffiliateError(`每位代理最多创建 ${settings.maxPriceCodes} 个价位码`);
  }

  let code = newPriceCodeValue();
  for (let i = 0; i < 8; i++) {
    const [usedPrice] = await db.select({ id: priceCodes.id }).from(priceCodes).where(eq(priceCodes.code, code));
    const [usedAffiliate] = await db.select({ id: affiliates.id }).from(affiliates).where(eq(affiliates.code, code));
    if (!usedPrice && !usedAffiliate) break;
    code = newPriceCodeValue();
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(priceCodes)
      .values({ affiliateId, name: cleanName, code })
      .$returningId();
    if (copyCurrentPrices) {
      const current = await tx
        .select({ variantId: affiliatePricing.variantId, priceCents: affiliatePricing.priceCents })
        .from(affiliatePricing)
        .where(and(eq(affiliatePricing.affiliateId, affiliateId), isNull(affiliatePricing.priceCodeId)));
      if (current.length > 0) {
        await tx.insert(affiliatePricing).values(
          current.map((p) => ({ affiliateId, variantId: p.variantId, priceCents: p.priceCents, priceCodeId: row.id })),
        );
      }
    }
    return row.id;
  });
}

export async function deletePriceCode(affiliateId: number, priceCodeId: number) {
  const [row] = await db
    .select()
    .from(priceCodes)
    .where(and(eq(priceCodes.id, priceCodeId), eq(priceCodes.affiliateId, affiliateId)));
  if (!row) throw new AffiliateError("价位码不存在");
  await db.transaction(async (tx) => {
    await tx.delete(affiliatePricing).where(and(eq(affiliatePricing.affiliateId, affiliateId), eq(affiliatePricing.priceCodeId, priceCodeId)));
    await tx.delete(priceCodes).where(and(eq(priceCodes.id, priceCodeId), eq(priceCodes.affiliateId, affiliateId)));
  });
}

export async function getAgentPriceCode(affiliateId: number, priceCodeId: number) {
  const [row] = await db
    .select()
    .from(priceCodes)
    .where(and(eq(priceCodes.id, priceCodeId), eq(priceCodes.affiliateId, affiliateId)));
  return row ?? null;
}

export async function togglePriceCode(affiliateId: number, priceCodeId: number, active: boolean) {
  await db
    .update(priceCodes)
    .set({ active })
    .where(and(eq(priceCodes.id, priceCodeId), eq(priceCodes.affiliateId, affiliateId)));
}

/* ---------------- 邀请码管理（后台） ---------------- */

export async function deleteInvite(id: number) {
  const [row] = await db.select().from(affiliateInvites).where(eq(affiliateInvites.id, id));
  if (!row) throw new AffiliateError("邀请码不存在");
  if (row.status === "used") throw new AffiliateError("已使用的邀请码不能删除");
  await db.delete(affiliateInvites).where(eq(affiliateInvites.id, id));
}

export async function listInvites(opts?: { status?: string; page?: number; pageSize?: number }) {
  const where = opts?.status ? eq(affiliateInvites.status, opts.status) : undefined;
  const pageSize = Math.max(1, opts?.pageSize ?? 10);
  const base = db.select().from(affiliateInvites).where(where).orderBy(desc(affiliateInvites.createdAt));
  if (!opts?.page) return base;
  return base.limit(pageSize).offset((Math.max(1, opts.page) - 1) * pageSize);
}

export async function countInvites() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(affiliateInvites);
  return Number(row?.n ?? 0);
}

export async function countUnusedInvites() {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(affiliateInvites)
    .where(eq(affiliateInvites.status, "unused"));
  return Number(row?.n ?? 0);
}

export async function createInvite(remark: string, ttlDays: number) {
  await db
    .insert(affiliateInvites)
    .values({ code: newInviteCode(), remark: remark.slice(0, 200), expiresAt: new Date(Date.now() + ttlDays * 86_400_000) });
}

export async function disableInvite(id: number) {
  await db
    .update(affiliateInvites)
    .set({ status: "disabled" })
    .where(and(eq(affiliateInvites.id, id), eq(affiliateInvites.status, "unused")));
}

function affiliateSearchWhere(q?: string) {
  const term = q?.trim().toLowerCase();
  if (!term) return undefined;
  return or(
    like(affiliates.email, `%${term}%`),
    like(affiliates.nickname, `%${term}%`),
    like(affiliates.code, `%${term.toUpperCase()}%`),
  );
}

export async function countAdminAffiliates(q?: string) {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(affiliates).where(affiliateSearchWhere(q));
  return Number(row?.n ?? 0);
}

export async function getAdminAffiliateSummary() {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`coalesce(sum(case when ${affiliates.status} = 'active' then 1 else 0 end), 0)`,
    })
    .from(affiliates);
  const [revenueRow] = await db
    .select({ revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)` })
    .from(orders)
    .where(and(isNotNull(orders.affiliateId), inArray(orders.status, ["paid", "delivered"])));
  const [settledRow] = await db
    .select({ settled: sql<number>`coalesce(sum(${commissions.amountCents}), 0)` })
    .from(commissions)
    .where(eq(commissions.status, "settled"));
  const [reservedRow] = await db
    .select({ reserved: sql<number>`coalesce(sum(${withdrawals.amountCents}), 0)` })
    .from(withdrawals)
    .where(inArray(withdrawals.status, ["pending", "paid"]));
  return {
    total: Number(counts?.total ?? 0),
    active: Number(counts?.active ?? 0),
    revenue: Number(revenueRow?.revenue ?? 0),
    withdrawable: Math.max(0, Number(settledRow?.settled ?? 0) - Number(reservedRow?.reserved ?? 0)),
  };
}

export async function deleteAffiliateAccount(affiliateId: number) {
  const [agent] = await db.select().from(affiliates).where(eq(affiliates.id, affiliateId));
  if (!agent) throw new AffiliateError("代理不存在");
  const checks = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.affiliateId, affiliateId)),
    db.select({ n: sql<number>`count(*)` }).from(commissions).where(eq(commissions.affiliateId, affiliateId)),
    db.select({ n: sql<number>`count(*)` }).from(withdrawals).where(eq(withdrawals.affiliateId, affiliateId)),
    db.select({ n: sql<number>`count(*)` }).from(customerBindings).where(eq(customerBindings.affiliateId, affiliateId)),
    db.select({ n: sql<number>`count(*)` }).from(customerEntitlements).where(eq(customerEntitlements.affiliateId, affiliateId)),
  ]);
  if (checks.some((rows) => Number(rows[0]?.n ?? 0) > 0)) {
    throw new AffiliateError("该代理已有订单、客户或资金记录，不能删除，请使用停用");
  }
  await db.transaction(async (tx) => {
    await tx.delete(affiliatePricing).where(eq(affiliatePricing.affiliateId, affiliateId));
    await tx.delete(priceCodes).where(eq(priceCodes.affiliateId, affiliateId));
    await tx.delete(affiliateClicks).where(eq(affiliateClicks.affiliateId, affiliateId));
    await tx.delete(affiliateInvites).where(eq(affiliateInvites.affiliateId, affiliateId));
    await tx.delete(affiliateEmailCodes).where(eq(affiliateEmailCodes.email, agent.email));
    await tx.delete(affiliates).where(eq(affiliates.id, affiliateId));
  });
}

export async function listAdminAffiliates(opts?: { q?: string; page?: number; pageSize?: number }) {
  const pageSize = Math.max(1, opts?.pageSize ?? 20);
  const base = db.select().from(affiliates).where(affiliateSearchWhere(opts?.q)).orderBy(desc(affiliates.createdAt));
  const rows = opts?.page
    ? await base.limit(pageSize).offset((Math.max(1, opts.page) - 1) * pageSize)
    : await base;
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const stats = await db
    .select({
      affiliateId: orders.affiliateId,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)`,
      commission: sql<number>`coalesce(sum(case when ${orders.status} in ('paid','delivered') then ${orders.commissionCents} else 0 end), 0)`,
      customers: sql<number>`count(distinct ${orders.email})`,
    })
    .from(orders)
    .where(and(inArray(orders.affiliateId, ids), inArray(orders.status, ["paid", "delivered"])))
    .groupBy(orders.affiliateId);
  const statMap = new Map(stats.map((s) => [s.affiliateId, s]));
  const balances = await db
    .select({
      affiliateId: commissions.affiliateId,
      settled: sql<number>`coalesce(sum(case when ${commissions.status} = 'settled' then ${commissions.amountCents} else 0 end), 0)`,
      pending: sql<number>`coalesce(sum(case when ${commissions.status} = 'pending' then ${commissions.amountCents} else 0 end), 0)`,
    })
    .from(commissions)
    .where(and(inArray(commissions.affiliateId, ids), isNotNull(commissions.affiliateId)))
    .groupBy(commissions.affiliateId);
  const balanceMap = new Map(balances.map((b) => [b.affiliateId, b]));
  const reservedRows = await db
    .select({
      affiliateId: withdrawals.affiliateId,
      reserved: sql<number>`coalesce(sum(${withdrawals.amountCents}), 0)`,
    })
    .from(withdrawals)
    .where(and(inArray(withdrawals.affiliateId, ids), inArray(withdrawals.status, ["pending", "paid"])))
    .groupBy(withdrawals.affiliateId);
  const reservedMap = new Map(reservedRows.map((r) => [r.affiliateId, Number(r.reserved)]));
  const bindingRows = await db
    .select({ affiliateId: customerBindings.affiliateId, n: sql<number>`count(*)` })
    .from(customerBindings)
    .where(inArray(customerBindings.affiliateId, ids))
    .groupBy(customerBindings.affiliateId);
  const bindingMap = new Map(bindingRows.map((r) => [r.affiliateId, Number(r.n)]));
  return rows.map((r) => ({
    ...r,
    orderCount: Number(statMap.get(r.id)?.orders ?? 0),
    revenue: Number(statMap.get(r.id)?.revenue ?? 0),
    commission: Number(statMap.get(r.id)?.commission ?? 0),
    customers: bindingMap.get(r.id) ?? 0,
    withdrawable: Math.max(0, Number(balanceMap.get(r.id)?.settled ?? 0) - (reservedMap.get(r.id) ?? 0)),
    pendingCommission: Number(balanceMap.get(r.id)?.pending ?? 0),
  }));
}

export async function getAdminAffiliateDetail(id: number) {
  const affiliate = await getAffiliateById(id);
  if (!affiliate) return null;
  const [invites, codes, bindings, agentOrderRows, commissionRows, withdrawalRows, balance] = await Promise.all([
    db.select().from(affiliateInvites).where(eq(affiliateInvites.affiliateId, id)).orderBy(desc(affiliateInvites.createdAt)),
    getAgentPriceCodes(id),
    db.select().from(customerBindings).where(eq(customerBindings.affiliateId, id)).orderBy(desc(customerBindings.boundAt)),
    agentOrders(id, "customers"),
    db.select().from(commissions).where(eq(commissions.affiliateId, id)).orderBy(desc(commissions.createdAt)).limit(100),
    agentWithdrawals(id),
    agentBalance(id),
  ]);
  return { affiliate, invites, codes, bindings, orders: agentOrderRows, commissions: commissionRows, withdrawals: withdrawalRows, balance };
}

export async function toggleAffiliateStatus(affiliateId: number, status: "active" | "disabled") {
  await db
    .update(affiliates)
    .set({ status })
    .where(eq(affiliates.id, affiliateId));
}
