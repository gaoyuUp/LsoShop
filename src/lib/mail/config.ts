import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";

export const MAIL_SETTING_KEYS = [
  "mailHost",
  "mailPort",
  "mailSecure",
  "mailUser",
  "mailPass",
  "mailFrom",
  "mailEnabled",
] as const;

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  enabled: boolean;
  passwordSet: boolean;
  source: "admin" | "env" | "none";
};

/**
 * 读取当前生效的邮件配置。
 * 后台「设置 → 邮件服务」保存的配置优先，环境变量作为首次部署兜底。
 * SMTP 密码在数据库中加密保存，仅在服务端解密。
 */
export async function getMailConfig(): Promise<MailConfig> {
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, [...MAIL_SETTING_KEYS]));
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string | undefined>;

  const host = (map.mailHost ?? env.smtp.host ?? "").trim();
  const user = (map.mailUser ?? env.smtp.user ?? "").trim();
  const storedPass = map.mailPass ? decryptSecret(map.mailPass) : "";
  const pass = storedPass || env.smtp.pass || "";
  const portRaw = Number(map.mailPort ?? env.smtp.port ?? 465);
  const port = Number.isFinite(portRaw) && portRaw > 0 ? portRaw : 465;
  const secure = map.mailSecure !== undefined ? map.mailSecure === "1" : env.smtp.secure;
  const from = (map.mailFrom || env.smtp.from || user).trim();
  const enabled =
    map.mailEnabled !== "0" &&
    Boolean(host && user && pass);

  return {
    host,
    port,
    secure,
    user,
    pass,
    from: from || user,
    enabled,
    passwordSet: Boolean(pass),
    source: map.mailHost ? "admin" : env.smtp.host ? "env" : "none",
  };
}

/** 不向前端暴露密码的公开状态 */
export async function getMailStatus() {
  const config = await getMailConfig();
  return {
    enabled: config.enabled,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    from: config.from,
    passwordSet: config.passwordSet,
    source: config.source,
  };
}
