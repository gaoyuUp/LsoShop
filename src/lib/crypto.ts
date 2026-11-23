import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * 敏感配置加密（SMTP 授权码等）。
 * 使用 AUTH_SECRET 派生 256 位密钥，AES-256-GCM 认证加密。
 * 注意：更换 AUTH_SECRET 后，后台已保存的邮箱密码需要重新填写。
 */
function key() {
  return createHash("sha256").update(process.env.AUTH_SECRET || "lso-local-dev-secret").digest();
}

export function encryptSecret(plain: string) {
  if (!plain) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload) return "";
  if (!payload.startsWith("v1:")) return payload; // 兼容历史明文配置
  try {
    const [, ivB64, tagB64, dataB64] = payload.split(":");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
