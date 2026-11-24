import "server-only";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { clientIp, rateLimit } from "@/lib/http";
import { sendMail } from "@/lib/mail";
import { getSiteConfig } from "@/lib/site-config";

const { affiliateEmailCodes } = schema;

type Purpose = "activate" | "login";

const CODE_TTL_MS = 10 * 60_000; // 10 分钟有效
const RESEND_GAP_MS = 60_000; // 60 秒重发间隔
const MAX_ATTEMPTS = 5; // 同一验证码最多尝试次数
const CODE_LIMIT_PER_HOUR = 5;

export class EmailCodeError extends Error {}

/** 发送验证码（邮箱未配置时不真发，但代码仍生成并写入数据库，方便本地联调） */
export async function sendVerificationCode(email: string, purpose: Purpose) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new EmailCodeError("邮箱格式不正确");
  const ip = await clientIp();
  if (!rateLimit(`code-send:${ip}:${purpose}`, 6, 60_000)) throw new EmailCodeError("发送太频繁，请稍后再试");

  // 每小时同邮箱同用途限 5 次
  const hourAgo = new Date(Date.now() - 3_600_000);
  const [sentRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(affiliateEmailCodes)
    .where(
      and(
        eq(affiliateEmailCodes.email, normalized),
        eq(affiliateEmailCodes.purpose, purpose),
        gt(affiliateEmailCodes.createdAt, hourAgo),
      ),
    );
  if (Number(sentRow?.n ?? 0) >= CODE_LIMIT_PER_HOUR) {
    throw new EmailCodeError("该邮箱每小时最多发送 5 次验证码，请稍后再试");
  }

  // 重发间隔：60 秒内有未使用记录则拒绝
  const [last] = await db
    .select()
    .from(affiliateEmailCodes)
    .where(
      and(
        eq(affiliateEmailCodes.email, normalized),
        eq(affiliateEmailCodes.purpose, purpose),
        isNull(affiliateEmailCodes.usedAt),
      ),
    )
    .orderBy(desc(affiliateEmailCodes.createdAt))
    .limit(1);
  if (last && Date.now() - last.createdAt.getTime() < RESEND_GAP_MS) {
    throw new EmailCodeError("验证码已发送，请 60 秒后再试");
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db.insert(affiliateEmailCodes).values({
    email: normalized,
    code,
    purpose,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });

  const label = purpose === "activate" ? "开通代理账号" : "代理登录";
  const site = await getSiteConfig();
  const status = await sendMail({
    to: normalized,
    subject: `【${site.name}】${label}验证码 ${code}`,
    log: false,
    html: `<!doctype html><html><body style="margin:0;background:#f4f4f6;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #ececf0">
    <div style="font-size:20px;font-weight:600;color:#18181b">${site.name} · ${label}验证码</div>
    <p style="color:#52525b;font-size:14px;line-height:1.8">您正在${label}，验证码为：</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:4px;color:#18181b;font-family:ui-monospace,Menlo,monospace;text-align:center;margin:18px 0;background:#f5f5f7;border-radius:12px;padding:14px">${code}</div>
    <p style="color:#71717a;font-size:13px;line-height:1.8">验证码 10 分钟内有效。如非本人操作，请忽略本邮件。</p>
  </div></body></html>`,
  });
  // 本地 SMTP 未配置时允许开发环境直接显示验证码，生产环境绝不返回。
  return { sent: status === "sent", devCode: process.env.NODE_ENV === "production" ? undefined : code };
}

/** 校验验证码；成功标记已用，失败累计尝试次数 */
export async function verifyVerificationCode(email: string, code: string, purpose: Purpose): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const value = code.trim();
  if (!value) throw new EmailCodeError("请填写验证码");
  const [latest] = await db
    .select()
    .from(affiliateEmailCodes)
    .where(
      and(
        eq(affiliateEmailCodes.email, normalized),
        eq(affiliateEmailCodes.purpose, purpose),
        isNull(affiliateEmailCodes.usedAt),
      ),
    )
    .orderBy(desc(affiliateEmailCodes.createdAt))
    .limit(1);
  if (!latest) throw new EmailCodeError("验证码不存在或已使用，请重新发送");
  if (latest.expiresAt < new Date()) throw new EmailCodeError("验证码已过期，请重新发送");
  if (latest.attempts >= MAX_ATTEMPTS) throw new EmailCodeError("尝试次数过多，请重新发送验证码");
  if (latest.code !== value) {
    await db.update(affiliateEmailCodes).set({ attempts: latest.attempts + 1 }).where(eq(affiliateEmailCodes.id, latest.id));
    throw new EmailCodeError("验证码不正确");
  }
  await db.update(affiliateEmailCodes).set({ usedAt: new Date() }).where(eq(affiliateEmailCodes.id, latest.id));
}
