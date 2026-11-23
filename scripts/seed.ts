/**
 * 初始化数据：pnpm db:seed
 * - 创建 / 更新后台管理员（读取 ADMIN_USERNAME / ADMIN_PASSWORD）
 * - 商品表为空时写入初始商品（可重复执行，不会覆盖已有商品）
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";
import { encryptSecret } from "../src/lib/crypto";

function hostAndUserReady(host: string, user: string, pass: string) {
  return Boolean(host && user && pass);
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  await conn.query("SET time_zone = '+00:00'");
  const db = drizzle(conn, { schema, mode: "default" });

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("请先在 .env.local 中设置 ADMIN_PASSWORD");
  const hash = await bcrypt.hash(password, 10);
  const [existing] = await db.select().from(schema.admins).where(eq(schema.admins.username, username));
  if (existing) {
    await db.update(schema.admins).set({ passwordHash: hash }).where(eq(schema.admins.id, existing.id));
    console.log(`✓ 已更新管理员 ${username} 的密码`);
  } else {
    await db.insert(schema.admins).values({ username, passwordHash: hash });
    console.log(`✓ 已创建管理员 ${username}`);
  }

  async function ensureCategory(slug: string, name: string, sort: number) {
    const [existing] = await db.select().from(schema.productCategories).where(eq(schema.productCategories.slug, slug));
    if (existing) return existing.id;
    const [created] = await db.insert(schema.productCategories).values({ slug, name, sort }).$returningId();
    return created.id;
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.products);
  if (Number(count) > 0) {
    console.log("· 已有商品数据，跳过商品初始化");
  } else {
    const museCategoryId = await ensureCategory("muse-ai", "Muse AI", 10);
    const plusCategoryId = await ensureCategory("plus-product", "Plus成品", 20);
    const museNotes = [
      { title: "仅质保首次登录", body: "不提供后续使用质保。首次登录有问题，请保留订单号和截图联系支持。\n不要去绑定 fb 或者 ins，可能导致 Muse 地区不可用！" },
      { title: "交付邮箱与接码链接", body: "账号发送至收件邮箱，通过接码链接获取登录验证码或者密码登录。" },
      { title: "登录后立即更换邮箱", body: "首次登录成功后，IP 质量好请立即在 Muse 内更换为自己的邮箱，并删除旧邮箱。\nIP 质量不好就用两天再换绑。" },
      { title: "不要随意删除聊天记录", body: "不要随意重置或删除聊天记录，可能会导致封号！" },
      { title: "登录前清除旧账号数据", body: "登录前清除之前的旧账号数据，不然出现人脸验证或者解除联系都是之前的账号残留数据。" },
    ];
    const museWarnings = [
      "购买后请在 6 小时内登录换绑，因购买后不及时换绑造成的账号失效，不在售后范围内。",
      "因网络环境或使用频率过高导致被限制生成视频，不在售后范围内。\n只能用日本、美国、新加坡 IP 进行使用。",
      "因注册 IP 过于纯净，现在不弹年龄验证，所以现在的号都是没验卡直接跳过年龄验证的。\n经过 5 天测试 0 封号，介意勿拍。",
    ];
    const plusNotes = [
      { title: "产品介绍", body: "- 28 天质保，月抛账号，不能长期使用。\n- 账号出现真实封号、订阅无故掉落等质量问题，按剩余未使用时长退款、补差价或重发新号。\n- 28 天内出现掉会员、登录失败、账号异常封号等问题，全程协助处理售后。\n- 仅产品质量问题可售后；无质量问题不退不换。" },
      { title: "发货格式（两种随机发货）", body: "- 微软邮箱（GPT 账号）+ 微软邮箱密码\n- 微软邮箱（GPT 账号）+ GPT 密码 + 微软邮箱密码" },
    ];
    const plusWarnings = [
      "月抛成品号！不知道是什么不要购买！",
      "网络要求：强烈建议固定使用【日本】节点，禁止频繁切换不同国家/地区；多设备登录也必须尽量保持同一地区节点。",
      "免责条款：因逆向破解、破限操作、网络滥用等违规行为导致账号被封，一律不质保。可通过账号邮件核验，存在「逆向告警 / 网络滥用」等相关邮件，直接拒保。",
      "Codex 验证说明：Codex 所需海外手机号需用户自行解决，不包含在售后范围内；使用过程中出现无效号码或二次手机号验证导致无法使用，不属于质保问题，介意勿拍。",
      "下单即视为已阅读并同意以上使用须知。因未阅读规则造成的问题，不作为退款或售后依据。",
    ];

    const [muse] = await db.insert(schema.products).values({
      categoryId: museCategoryId,
      slug: "muse-ai",
      name: "Muse AI",
      subtitle: "成品账号 · 即买即用",
      badge: "热卖",
      description: "Muse AI 成品账号，付款后自动发货，账号资料与接码链接即时交付。",
      image: "/products/muse.svg",
      theme: "violet",
      deliveryHint: "账号资料与接码链接，付款后自动交付",
      warnings: museWarnings,
      notes: museNotes,
      sort: 10,
    }).$returningId();
    await db.insert(schema.productVariants).values([
      { productId: muse.id, name: "精品 10 亿账号", description: "1 个账号 · 10 亿额度", priceCents: 1590, minQuantity: 1, maxQuantity: 10, sort: 10 },
      { productId: muse.id, name: "Muse 310 亿成品号", description: "1 个账号 · 310 亿额度", priceCents: 4900, minQuantity: 1, maxQuantity: 1, sort: 20 },
    ]);

    const [plus] = await db.insert(schema.products).values({
      categoryId: plusCategoryId,
      slug: "gpt-plus",
      name: "GPT Plus 成品号",
      subtitle: "日区 · 月抛 · 28 天质保",
      badge: "不懂不要下单",
      description: "ChatGPT Plus 日区成品号，月抛账号，28 天质保。",
      image: "/products/plus-japan.svg",
      theme: "emerald",
      deliveryHint: "账号资料付款后自动交付",
      warnings: plusWarnings,
      notes: plusNotes,
      sort: 20,
    }).$returningId();
    await db.insert(schema.productVariants).values([
      { productId: plus.id, name: "Plus 成品号 · 日区", description: "1 个账号 · 28 天质保", priceCents: 6600, minQuantity: 1, maxQuantity: 10, sort: 10 },
    ]);

    // 演示库存：每个规格放几条测试卡密，方便直接走通流程（后台可删除）
    const variants = await db.select().from(schema.productVariants);
    for (const v of variants) {
      await db.insert(schema.inventoryItems).values(
        Array.from({ length: 5 }, (_, i) => ({
          variantId: v.id,
          content: `【演示数据】\n账号：demo${v.id}${i + 1}@outlook.com\n密码：Demo#${1000 + v.id * 10 + i}\n接码链接：https://example.com/code/${v.id}${i + 1}`,
        })),
      );
    }
    console.log("✓ 已写入 2 个初始商品（含规格、须知、演示库存）");
  }

  const defaults: Record<string, string> = {
    announcement: "欢迎来到灵搜小店 · 付款后自动发货，交付内容可随时在「我的订单」中查看",
    supportQQ: "",
    supportWechat: "",
    supportEmail: "",
    supportTelegram: "",
    promo_min_withdraw_cents: "5000",
    promo_commission_rate: "100",
    promo_invite_ttl_days: "30",
    promo_max_price_codes: "10",
  };

  // 首次部署可用环境变量初始化邮件配置；已有的后台配置不会被覆盖。
  const mailHost = (process.env.MAIL_HOST || process.env.SMTP_HOST || "").trim();
  const mailUser = (process.env.MAIL_USER || process.env.SMTP_USER || "").trim();
  const mailPass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || "";
  const mailFrom = (process.env.MAIL_FROM || mailUser).trim();
  if (mailHost) {
    const port = process.env.MAIL_PORT || process.env.SMTP_PORT || "465";
    const secure = (process.env.MAIL_SECURE || process.env.SMTP_SECURE || "true") === "true" ? "1" : "0";
    Object.assign(defaults, {
      mailHost,
      mailPort: port,
      mailSecure: secure,
      mailUser,
      mailFrom,
      mailEnabled: hostAndUserReady(mailHost, mailUser, mailPass) ? "1" : "0",
    });
    if (mailPass) defaults.mailPass = encryptSecret(mailPass);
  }

  for (const [key, value] of Object.entries(defaults)) {
    await db.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { key } });
  }
  if (mailHost) console.log("✓ 已写入初始邮件配置（后台「设置 → 邮件服务」可修改）");

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
