"use server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { ADMIN_COOKIE, adminCookieOptions, signAdminSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/http";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "请输入账号和密码" };

  const ip = await clientIp();
  if (!rateLimit(`admin-login:${ip}`, 10, 60_000)) {
    return { error: "尝试次数过多，请一分钟后再试" };
  }

  const [admin] = await db.select().from(schema.admins).where(eq(schema.admins.username, username));
  const ok = admin ? await bcrypt.compare(password, admin.passwordHash) : false;
  if (!admin || !ok) return { error: "账号或密码不正确" };

  const token = await signAdminSession({ sub: String(admin.id), username: admin.username });
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, adminCookieOptions);
  redirect("/admin");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
