import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const createdAt = () =>
  datetime("created_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);
const updatedAt = () =>
  datetime("updated_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdate(() => new Date());

export type ProductNote = { title: string; body: string };

/** 商品分类 */
export const productCategories = mysqlTable(
  "product_categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    sort: int("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("uk_categories_slug").on(t.slug), uniqueIndex("uk_categories_name").on(t.name)],
);

/** 商品 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("category_id")
      .notNull()
      .references(() => productCategories.id, { onDelete: "restrict" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** 副标题，如「成品账号」 */
    subtitle: varchar("subtitle", { length: 160 }).notNull().default(""),
    /** 角标，如「热卖」「不懂不要下单」 */
    badge: varchar("badge", { length: 40 }).notNull().default(""),
    description: text("description"),
    /** 商品图（站内路径或外链） */
    image: varchar("image", { length: 500 }).notNull().default(""),
    /** 卡片主题色，用于光晕和渐变 */
    theme: varchar("theme", { length: 20 }).notNull().default("violet"),
    /** 交付说明，如「账号资料发送至邮箱」 */
    deliveryHint: varchar("delivery_hint", { length: 160 }).notNull().default(""),
    /** 购买前注意（醒目警示） */
    warnings: json("warnings").$type<string[]>().notNull().default([]),
    /** 购买须知（标题 + 内容） */
    notes: json("notes").$type<ProductNote[]>().notNull().default([]),
    requireEmail: boolean("require_email").notNull().default(true),
    /** 是否属于会过期的会员/订阅商品 */
    isExpiring: boolean("is_expiring").notNull().default(false),
    /** 有效期天数，0 表示不设置到期 */
    validityDays: int("validity_days").notNull().default(0),
    listed: boolean("listed").notNull().default(true),
    sort: int("sort").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("uk_products_slug").on(t.slug), index("idx_products_category").on(t.categoryId)],
);

/** 商品规格 */
export const productVariants = mysqlTable(
  "product_variants",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("product_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: varchar("description", { length: 255 }).notNull().default(""),
    /** 单价（分），系统公开价 */
    priceCents: int("price_cents").notNull(),
    /** 划线原价（分），0 表示不显示 */
    originalPriceCents: int("original_price_cents").notNull().default(0),
    minQuantity: int("min_quantity").notNull().default(1),
    maxQuantity: int("max_quantity").notNull().default(10),
    /** auto：从库存自动发货；manual：付款后人工发货 */
    deliveryMode: varchar("delivery_mode", { length: 16 }).notNull().default("auto"),
    listed: boolean("listed").notNull().default(true),
    sort: int("sort").notNull().default(0),
    /** 是否参与代理销售 */
    affiliateEnabled: boolean("affiliate_enabled").notNull().default(true),
    /** 代理成本价/客户价下限（分），0 = 以系统售价为下限 */
    affiliateCostCents: int("affiliate_cost_cents").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("idx_variants_product").on(t.productId)],
);

/** 库存（卡密 / 账号资料），一条即一份交付内容 */
export const inventoryItems = mysqlTable(
  "inventory_items",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    variantId: int("variant_id").notNull(),
    content: text("content").notNull(),
    /** available | locked | sold */
    status: varchar("status", { length: 16 }).notNull().default("available"),
    orderId: bigint("order_id", { mode: "number" }),
    soldAt: datetime("sold_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_inventory_variant_status").on(t.variantId, t.status),
    index("idx_inventory_order").on(t.orderId),
  ],
);

/** 订单 */
export const orders = mysqlTable(
  "orders",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    orderNo: varchar("order_no", { length: 32 }).notNull(),
    /** 查询口令的 SHA-256 */
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    email: varchar("email", { length: 191 }).notNull().default(""),
    productId: int("product_id").notNull(),
    variantId: int("variant_id").notNull(),
    productName: varchar("product_name", { length: 120 }).notNull(),
    variantName: varchar("variant_name", { length: 120 }).notNull(),
    productImage: varchar("product_image", { length: 500 }).notNull().default(""),
    /** normal 普通客户 | self 代理自购 | affiliate 代理推广客户 */
    orderType: varchar("order_type", { length: 16 }).notNull().default("normal"),
    /** 推广代理（订单创建时快照，代理被停用后历史归属不变） */
    affiliateId: int("affiliate_id"),
    /** 推广码快照 */
    affiliateCode: varchar("affiliate_code", { length: 16 }).notNull().default(""),
    /** 价位码值（无价位码为空） */
    priceCodeValue: varchar("price_code_value", { length: 16 }).notNull().default(""),
    /** 渠道来源（如 wechat） */
    src: varchar("src", { length: 40 }).notNull().default(""),
    /** 系统公开单价快照（分） */
    systemPriceCents: int("system_price_cents").notNull().default(0),
    /** 代理成本价快照（分） */
    costPriceCents: int("cost_price_cents").notNull().default(0),
    unitPriceCents: int("unit_price_cents").notNull(),
    quantity: int("quantity").notNull(),
    totalCents: int("total_cents").notNull(),
    /** 本单佣金（分），仅代理推广客户有值 */
    commissionCents: int("commission_cents").notNull().default(0),
    deliveryMode: varchar("delivery_mode", { length: 16 }).notNull().default("auto"),
    /** 下单时的会员有效期快照（天），0 表示永久 */
    validityDays: int("validity_days").notNull().default(0),
    /** pending 待支付 | paid 已付款待发货 | delivered 已发货 | closed 已关闭 | refunded 已退款 */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("alipay"),
    /** 支付渠道交易号 */
    tradeNo: varchar("trade_no", { length: 64 }),
    /** 交付内容快照（发货后写入） */
    deliveryContent: text("delivery_content"),
    /** none | queued | sent | failed | skipped */
    emailStatus: varchar("email_status", { length: 16 }).notNull().default("none"),
    adminRemark: varchar("admin_remark", { length: 500 }).notNull().default(""),
    clientIp: varchar("client_ip", { length: 64 }).notNull().default(""),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    paidAt: datetime("paid_at", { mode: "date", fsp: 3 }),
    deliveredAt: datetime("delivered_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_orders_no").on(t.orderNo),
    index("idx_orders_status").on(t.status),
    index("idx_orders_email").on(t.email),
    index("idx_orders_created").on(t.createdAt),
    index("idx_orders_affiliate").on(t.affiliateId),
    index("idx_orders_type").on(t.orderType),
    index("idx_orders_src").on(t.src),
  ],
);

/** 邮件发件箱：未配置 SMTP 时仅记录，配置后真实发送 */
export const emailLogs = mysqlTable(
  "email_logs",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    orderId: bigint("order_id", { mode: "number" }),
    toEmail: varchar("to_email", { length: 191 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    html: text("html").notNull(),
    /** sent | failed | skipped */
    status: varchar("status", { length: 16 }).notNull(),
    error: varchar("error", { length: 500 }).notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("idx_email_order").on(t.orderId)],
);

/** 后台管理员 */
export const admins = mysqlTable(
  "admins",
  {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 60 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("uk_admins_username").on(t.username)],
);

/** 站点设置（键值） */
export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
});

/** 代理邀请码（管理员创建，每码只能开通一个代理） */
export const affiliateInvites = mysqlTable(
  "affiliate_invites",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 24 }).notNull(),
    /** unused | used | disabled */
    status: varchar("status", { length: 16 }).notNull().default("unused"),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }),
    affiliateId: int("affiliate_id"),
    usedEmail: varchar("used_email", { length: 191 }).notNull().default(""),
    usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
    remark: varchar("remark", { length: 200 }).notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_invite_code").on(t.code),
    index("idx_invites_status").on(t.status),
    index("idx_invites_affiliate").on(t.affiliateId),
  ],
);

/** 代理账号 */
export const affiliates = mysqlTable(
  "affiliates",
  {
    id: int("id").autoincrement().primaryKey(),
    /** 登录邮箱（小写） */
    email: varchar("email", { length: 191 }).notNull(),
    /** 代理展示名（排行榜 / 后台），空时使用邮箱前缀 */
    nickname: varchar("nickname", { length: 60 }).notNull().default(""),
    /** 推广码（/r/:code） */
    code: varchar("code", { length: 16 }).notNull(),
    /** active | disabled */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    /** 客服联系方式（代理自填，与站点客服分开） */
    wechat: varchar("wechat", { length: 120 }).notNull().default(""),
    wechatQr: varchar("wechat_qr", { length: 500 }).notNull().default(""),
    qq: varchar("qq", { length: 120 }).notNull().default(""),
    telegram: varchar("telegram", { length: 191 }).notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_affiliates_email").on(t.email),
    uniqueIndex("uk_affiliates_code").on(t.code),
    index("idx_affiliates_status").on(t.status),
  ],
);

/** 价位码：代理为不同客群生成独立价格表 */
export const priceCodes = mysqlTable(
  "price_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    name: varchar("name", { length: 60 }).notNull().default(""),
    code: varchar("code", { length: 16 }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_price_code_value").on(t.code),
    index("idx_price_code_affiliate").on(t.affiliateId),
  ],
);

/** 代理客户价（按规格；priceCodeId 为空表示代理主价格） */
export const affiliatePricing = mysqlTable(
  "affiliate_pricing",
  {
    id: int("id").autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    variantId: int("variant_id").notNull(),
    /** 该规格的客户售价（分） */
    priceCents: int("price_cents").notNull(),
    priceCodeId: int("price_code_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_affiliate_price").on(t.affiliateId, t.variantId, t.priceCodeId),
    index("idx_price_variant").on(t.variantId),
  ],
);

/** 推广链接访问记录 */
export const affiliateClicks = mysqlTable(
  "affiliate_clicks",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    priceCodeId: int("price_code_id"),
    /** 渠道来源 */
    src: varchar("src", { length: 40 }).notNull().default(""),
    /** 浏览器访客标识 */
    visitorKey: varchar("visitor_key", { length: 64 }).notNull().default(""),
    /** 代理本人访问：不计入开张第二步和访客统计 */
    isSelf: boolean("is_self").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_clicks_affiliate").on(t.affiliateId, t.createdAt),
    index("idx_clicks_visitor").on(t.visitorKey),
  ],
);

/** 客户绑定：开通账号邮箱永久归属首位推广代理 */
export const customerBindings = mysqlTable(
  "customer_bindings",
  {
    id: int("id").autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    /** 客户收件/开通账号邮箱（小写） */
    customerEmail: varchar("customer_email", { length: 191 }).notNull(),
    /** 首次绑定订单 */
    firstOrderId: bigint("first_order_id", { mode: "number" }),
    /** 是否已经产生第二笔及以上的成交 */
    repeatBuy: boolean("repeat_buy").notNull().default(false),
    /** 预留的会员到期时间；空 = 未设置，不影响推广绑定 */
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }),
    lastOrderAt: datetime("last_order_at", { mode: "date", fsp: 3 }),
    remark: varchar("remark", { length: 200 }).notNull().default(""),
    boundAt: datetime("bound_at", { mode: "date", fsp: 3 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_binding_email").on(t.customerEmail),
    index("idx_binding_affiliate").on(t.affiliateId),
  ],
);

/** 客户会员/订阅权益：按订单记录具体商品到期时间 */
export const customerEntitlements = mysqlTable(
  "customer_entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    customerEmail: varchar("customer_email", { length: 191 }).notNull(),
    orderId: int("order_id").notNull(),
    orderNo: varchar("order_no", { length: 32 }).notNull(),
    productId: int("product_id").notNull(),
    productName: varchar("product_name", { length: 120 }).notNull(),
    variantName: varchar("variant_name", { length: 120 }).notNull(),
    startsAt: datetime("starts_at", { mode: "date", fsp: 3 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    /** active | expired | ended */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_entitlement_order").on(t.orderId),
    index("idx_entitlement_affiliate").on(t.affiliateId),
    index("idx_entitlement_email").on(t.customerEmail),
    index("idx_entitlement_expires").on(t.expiresAt),
  ],
);

/** 佣金流水（与订单一一关联，记录结算/撤销过程） */
export const commissions = mysqlTable(
  "commissions",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: bigint("order_id", { mode: "number" }).notNull(),
    affiliateId: int("affiliate_id").notNull(),
    orderNo: varchar("order_no", { length: 32 }).notNull(),
    amountCents: int("amount_cents").notNull(),
    /** 下单时的成本价快照（分），用于解释佣金口径 */
    costCents: int("cost_cents").notNull().default(0),
    /** pending 待结算 | settled 可提现 | withdrawn 已提现 | revoked 已撤销 */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    settledAt: datetime("settled_at", { mode: "date", fsp: 3 }),
    revokeReason: varchar("revoke_reason", { length: 200 }).notNull().default(""),
    revokedAt: datetime("revoked_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("uk_commission_order").on(t.orderId),
    index("idx_commission_affiliate").on(t.affiliateId, t.status),
    index("idx_commission_created").on(t.createdAt),
  ],
);

/** 提现申请 */
export const withdrawals = mysqlTable(
  "withdrawals",
  {
    id: int("id").autoincrement().primaryKey(),
    affiliateId: int("affiliate_id").notNull(),
    amountCents: int("amount_cents").notNull(),
    /** 收款信息快照 */
    alipayAccount: varchar("alipay_account", { length: 191 }).notNull(),
    payeeName: varchar("payee_name", { length: 60 }).notNull(),
    /** pending 待审核 | paid 已打款 | rejected 已拒绝 | canceled 已撤回 */
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    rejectReason: varchar("reject_reason", { length: 300 }).notNull().default(""),
    processNote: varchar("process_note", { length: 300 }).notNull().default(""),
    processedAt: datetime("processed_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("idx_withdraw_affiliate").on(t.affiliateId, t.status),
    index("idx_withdraw_status").on(t.status),
  ],
);

/** 邮箱验证码（邀请码开通 / 代理登录） */
export const affiliateEmailCodes = mysqlTable(
  "affiliate_email_codes",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 191 }).notNull(),
    code: varchar("code", { length: 12 }).notNull(),
    /** activate 开通代理 | login 代理登录 */
    purpose: varchar("purpose", { length: 16 }).notNull().default("activate"),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }).notNull(),
    attempts: int("attempts").notNull().default(0),
    usedAt: datetime("used_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("idx_email_code_email").on(t.email, t.purpose),
    index("idx_email_code_expires").on(t.expiresAt),
  ],
);

export type Product = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type EmailLog = typeof emailLogs.$inferSelect;
export type Affiliate = typeof affiliates.$inferSelect;
export type AffiliateInvite = typeof affiliateInvites.$inferSelect;
export type PriceCode = typeof priceCodes.$inferSelect;
export type AffiliatePrice = typeof affiliatePricing.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type CustomerEntitlement = typeof customerEntitlements.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
