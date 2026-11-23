import "server-only";

export const env = {
  siteUrl: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  authSecret: process.env.AUTH_SECRET || "",
  paymentMode: (process.env.PAYMENT_MODE || "mock") as "mock" | "alipay",
  orderExpireMinutes: Number(process.env.ORDER_EXPIRE_MINUTES || 15),
  uploadDir: process.env.UPLOAD_DIR || "./storage/uploads",
  // 邮件配置优先从后台读取；环境变量仅作为首次部署 / 兜底配置。
  smtp: {
    host: process.env.MAIL_HOST || process.env.SMTP_HOST || "",
    port: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 465),
    secure: (process.env.MAIL_SECURE || process.env.SMTP_SECURE || "true") === "true",
    user: process.env.MAIL_USER || process.env.SMTP_USER || "",
    pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASS || "",
    from: process.env.MAIL_FROM || "灵搜小店 <no-reply@example.com>",
  },
};
