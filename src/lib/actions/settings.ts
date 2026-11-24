"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";
import { encryptSecret } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";
import { getMailConfig } from "@/lib/mail/config";
import { getSiteConfig } from "@/lib/site-config";

const { settings, admins } = schema;

function backTo(params: Record<string, string>): never {
  redirect(`/admin/settings?${new URLSearchParams(params).toString()}`);
}

async function upsertSettings(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
  }
}

export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const values: Record<string, string> = {
    announcement: String(fd.get("announcement") ?? "").trim().slice(0, 300),
    supportQQ: String(fd.get("supportQQ") ?? "").trim().slice(0, 120),
    supportWechat: String(fd.get("supportWechat") ?? "").trim().slice(0, 120),
    supportEmail: String(fd.get("supportEmail") ?? "").trim().slice(0, 191),
    supportTelegram: String(fd.get("supportTelegram") ?? "").trim().slice(0, 191),
  };
  if (values.supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.supportEmail)) {
    backTo({ error: "客服邮箱格式不正确" });
  }
  await upsertSettings(values);
  revalidatePath("/");
  revalidatePath("/orders");
  revalidatePath("/admin/settings");
  backTo({ saved: "1" });
}

function isAssetUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function saveSeoSettingsAction(fd: FormData) {
  await requireAdmin();
  const values: Record<string, string> = {
    siteName: String(fd.get("siteName") ?? "").trim().slice(0, 40),
    siteSlogan: String(fd.get("siteSlogan") ?? "").trim().slice(0, 60),
    siteTagline: String(fd.get("siteTagline") ?? "").trim().slice(0, 120),
    seoDescription: String(fd.get("seoDescription") ?? "").trim().slice(0, 200),
    seoKeywords: String(fd.get("seoKeywords") ?? "").trim().slice(0, 300),
    siteLogo: String(fd.get("siteLogo") ?? "").trim().slice(0, 512),
    siteIcon: String(fd.get("siteIcon") ?? "").trim().slice(0, 512),
    siteOgImage: String(fd.get("siteOgImage") ?? "").trim().slice(0, 512),
  };

  if (!values.siteName) backTo({ error: "站点名称不能为空" });
  if (!values.siteSlogan) backTo({ error: "站点副标题不能为空" });
  if (!isAssetUrl(values.siteLogo)) backTo({ error: "Logo 地址格式不正确" });
  if (!isAssetUrl(values.siteIcon)) backTo({ error: "站点图标地址格式不正确" });
  if (!isAssetUrl(values.siteOgImage)) backTo({ error: "分享图地址格式不正确" });

  await upsertSettings(values);
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  backTo({ seoSaved: "1" });
}

export async function changePasswordAction(fd: FormData) {
  const session = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!current || !next) backTo({ error: "请填写当前密码和新密码" });
  if (next.length < 8) backTo({ error: "新密码至少需要 8 位" });
  if (next !== confirm) backTo({ error: "两次输入的新密码不一致" });

  const [admin] = await db.select().from(admins).where(eq(admins.id, Number(session.sub)));
  if (!admin) backTo({ error: "管理员不存在，请重新登录" });
  const ok = await bcrypt.compare(current, admin.passwordHash);
  if (!ok) backTo({ error: "当前密码不正确" });

  await db.update(admins).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(admins.id, admin.id));
  backTo({ password: "1" });
}


export async function saveMailSettingsAction(fd: FormData) {
  await requireAdmin();

  const host = String(fd.get("mailHost") ?? "").trim().slice(0, 191);
  const port = Number(fd.get("mailPort"));
  const secure = String(fd.get("mailSecure") ?? "1") === "1";
  const user = String(fd.get("mailUser") ?? "").trim().slice(0, 191);
  const pass = String(fd.get("mailPass") ?? "").trim();
  const rawFrom = String(fd.get("mailFrom") ?? "").trim().slice(0, 255);
  const enabled = fd.get("mailEnabled") === "1";
  const from = rawFrom || user;

  if (host && !/^[a-z0-9.-]+$/i.test(host)) backTo({ error: "SMTP 服务器地址格式不正确" });
  if (!Number.isInteger(port) || port < 1 || port > 65535) backTo({ error: "SMTP 端口需在 1-65535 之间" });
  if (user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) backTo({ error: "发件邮箱格式不正确" });
  if (from && !from.includes("@")) backTo({ error: "发件人地址格式不正确" });

  if (enabled) {
    if (!host || !user || !from) backTo({ error: "启用真实发信前，请填写服务器、发件邮箱和发件人" });
    const current = await getMailConfig();
    if (!pass && !current.passwordSet) backTo({ error: "请填写 SMTP 授权码 / 密码" });
  }

  const values: Record<string, string> = {
    mailHost: host,
    mailPort: String(port),
    mailSecure: secure ? "1" : "0",
    mailUser: user,
    mailFrom: from,
    mailEnabled: enabled ? "1" : "0",
  };
  // 密码留空表示保持原密码不变
  if (pass) values.mailPass = encryptSecret(pass);

  await upsertSettings(values);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/emails");
  revalidatePath("/admin");
  backTo({ mailSaved: "1" });
}

export async function sendTestMailAction(fd: FormData) {
  await requireAdmin();
  const to = String(fd.get("to") ?? "").trim().slice(0, 191);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) backTo({ error: "请填写正确的测试收件邮箱" });

  const site = await getSiteConfig();
  const result = await sendMail({
    to,
    subject: `【${site.name}】SMTP 配置测试`,
    html: `<!doctype html><html><body style="margin:0;background:#f4f4f6;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #ececf0">
        <div style="font-size:20px;font-weight:600;color:#18181b">${site.name} · 邮件测试</div>
        <p style="color:#52525b;font-size:14px;line-height:1.8">这是一封来自${site.name}后台的 SMTP 测试邮件。</p>
        <p style="color:#52525b;font-size:14px;line-height:1.8">如果你收到了它，说明发件配置已经生效，订单交付邮件会正常发送。</p>
        <p style="color:#a1a1aa;font-size:12px;margin-top:24px">测试时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>
      </div></body></html>`,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/emails");
  backTo({ mailTest: result });
}

export async function savePromoSettingsAction(fd: FormData) {
  await requireAdmin();
  const minYuan = Number(fd.get("promoMinWithdraw"));
  const rate = Number(fd.get("promoCommissionRate"));
  const ttl = Number(fd.get("promoInviteTtlDays"));
  const maxCodes = Number(fd.get("promoMaxPriceCodes"));
  if (!Number.isFinite(minYuan) || minYuan < 0) redirect("/admin/settings?error=" + encodeURIComponent("最低提现金额不正确"));
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) redirect("/admin/settings?error=" + encodeURIComponent("佣金比例需在 0-100 之间"));
  if (!Number.isFinite(ttl) || ttl < 1 || ttl > 365) redirect("/admin/settings?error=" + encodeURIComponent("邀请码有效期需在 1-365 天之间"));
  if (!Number.isFinite(maxCodes) || maxCodes < 1 || maxCodes > 50) redirect("/admin/settings?error=" + encodeURIComponent("价位码数量需在 1-50 之间"));
  await upsertSettings({
    promo_min_withdraw_cents: String(Math.round(minYuan * 100)),
    promo_commission_rate: String(Math.round(rate)),
    promo_invite_ttl_days: String(Math.round(ttl)),
    promo_max_price_codes: String(Math.round(maxCodes)),
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/agents");
  revalidatePath("/promote");
  revalidatePath("/promote/pricing");
  redirect("/admin/settings?promoSaved=1");
}
