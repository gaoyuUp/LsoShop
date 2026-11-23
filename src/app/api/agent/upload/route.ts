import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { env } from "@/lib/env";
import { json } from "@/lib/http";

const MAX = 2 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export async function POST(req: Request) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) return json({ error: "未登录" }, 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "没有收到文件" }, 400);
  if (file.size === 0) return json({ error: "文件为空" }, 400);
  if (file.size > MAX) return json({ error: "二维码图片不能超过 2MB" }, 400);
  const ext = EXT[file.type];
  if (!ext) return json({ error: "仅支持 PNG / JPG / WEBP" }, 400);

  const now = new Date();
  const relDir = `agent-qr/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${randomUUID()}${ext}`;
  const root = path.resolve(env.uploadDir);
  await mkdir(path.join(root, relDir), { recursive: true });
  await writeFile(path.join(root, relDir, filename), Buffer.from(await file.arrayBuffer()));
  return json({ url: `/uploads/${relDir}/${filename}` });
}
