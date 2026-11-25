import "server-only";
import nodemailer from "nodemailer";
import { db, schema } from "@/db";
import { env } from "@/lib/env";
import { getSiteConfig } from "@/lib/site-config";
import { getMailConfig } from "./config";

type SendInput = { to: string; subject: string; html: string; orderId?: number; /** 是否写入后台邮件记录 */ log?: boolean };
type SendResult = "sent" | "failed" | "skipped";

/**
 * 统一发信入口。
 * - 后台未启用 / 未配置邮箱：不发送，记录为 skipped（后台「邮件记录」可预览内容）
 * - 已配置并启用：通过 SMTP 真实发送，记录 sent / failed
 */
export async function sendMail({ to, subject, html, orderId, log = true }: SendInput): Promise<SendResult> {
  let status: SendResult = "skipped";
  let error = "";
  const [config, site] = await Promise.all([getMailConfig(), getSiteConfig()]);

  if (!config.enabled) {
    error = "邮箱服务未启用或配置不完整";
  } else {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        connectionTimeout: 12_000,
        greetingTimeout: 12_000,
        socketTimeout: 30_000,
      });
      const from = config.from.includes("<") ? config.from : `${site.name} <${config.from}>`;
      const info = await transporter.sendMail({ from, to, subject, html });
      status = info.accepted && info.accepted.length > 0 ? "sent" : "failed";
      if (status === "failed") error = "SMTP 未接受该收件人，请检查发件域限制";
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message.slice(0, 480) : "未知错误";
    }
  }

  // 代理验证码邮件不进入后台「邮件记录」，验证码统一在测试收件箱查看。
  if (log) {
    await db.insert(schema.emailLogs).values({ orderId: orderId ?? null, toEmail: to, subject, html, status, error });
  }
  return status;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function deliveryEmailHtml(input: {
  brandName: string;
  orderNo: string;
  productName: string;
  variantName: string;
  quantity: number;
  content: string;
}) {
  const blocks = input.content
    .split(/\n-{3,}\n/)
    .map(
      (b, i) => `<div style="margin:0 0 12px;padding:14px 16px;border-radius:12px;background:#f5f5f7;border:1px solid #e7e7ec">
        <div style="font-size:12px;color:#8a8a93;margin-bottom:6px">第 ${i + 1} 份</div>
        <pre style="margin:0;white-space:pre-wrap;word-break:break-all;font:14px/1.7 ui-monospace,Menlo,monospace;color:#18181b">${esc(b.trim())}</pre></div>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f4f4f6;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #ececf0">
    <div style="font-size:20px;font-weight:600;color:#18181b">${esc(input.brandName)} · 发货通知</div>
    <p style="color:#52525b;font-size:14px;line-height:1.7">您购买的 <b>${esc(input.productName)}</b>（${esc(input.variantName)} × ${input.quantity}）已发货，交付内容如下：</p>
    ${blocks}
    <p style="color:#71717a;font-size:13px;line-height:1.7">订单号：${esc(input.orderNo)}<br/>查询订单：订单号 + 本邮箱地址（或订单号 + 查询口令）。<br/>也可以随时在 <a href="${env.siteUrl}/orders" style="color:#6d4aff">我的订单</a> 中查看。请妥善保管，切勿泄露给他人。</p>
  </div></body></html>`;
}
