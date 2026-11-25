"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAffiliateByEmail, redeemInvite, validateInvite, AffiliateError } from "@/lib/affiliate";
import { EmailCodeError, sendVerificationCode, verifyVerificationCode } from "@/lib/affiliate-mail";
import { clearAffiliateLogin, setAffiliateLogin } from "@/lib/auth/affiliate-server";
import { clientIp, rateLimit } from "@/lib/http";

type Mode = "activate" | "login";
type Input = { mode: Mode; email: string; invite?: string; code?: string };

type JoinActionState = {
  error?: string;
  sent?: boolean;
  devCode?: string;
  email?: string;
  invite?: string;
  mode?: Mode;
  ok?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendAffiliateCodeAction(input: Input): Promise<JoinActionState> {
  const email = input.email.trim().toLowerCase();
  const invite = (input.invite ?? "").trim().toUpperCase();
  if (!EMAIL_RE.test(email)) return { error: "请输入正确的邮箱地址" };

  const ip = await clientIp();
  if (!rateLimit(`aff-code-send:${ip}`, 10, 60_000)) return { error: "操作太频繁，请稍后再试" };

  try {
    if (input.mode === "activate") {
      if (!invite) return { error: "请填写管理员提供的邀请码" };
      await validateInvite(invite);
      const existing = await getAffiliateByEmail(email);
      if (existing) return { error: "该邮箱已开通代理账号，请直接登录" };
    } else {
      const affiliate = await getAffiliateByEmail(email);
      if (!affiliate || affiliate.status !== "active") return { error: "该邮箱尚未开通代理账号" };
    }

    const result = await sendVerificationCode(email, input.mode);
    return {
      sent: true,
      devCode: result.devCode,
      email,
      invite,
      mode: input.mode,
    };
  } catch (e) {
    if (e instanceof EmailCodeError || e instanceof AffiliateError) return { error: e.message };
    console.error("[affiliate send code]", e);
    return { error: "验证码发送失败，请稍后重试" };
  }
}

export async function verifyAffiliateCodeAction(input: Input): Promise<JoinActionState> {
  const email = input.email.trim().toLowerCase();
  const invite = (input.invite ?? "").trim().toUpperCase();
  const code = (input.code ?? "").trim();
  if (!EMAIL_RE.test(email)) return { error: "请输入正确的邮箱地址" };
  if (!code) return { error: "请输入邮箱验证码" };

  try {
    await verifyVerificationCode(email, code, input.mode);
    const affiliate =
      input.mode === "activate"
        ? await redeemInvite(invite, email)
        : await getAffiliateByEmail(email);

    if (!affiliate || affiliate.status !== "active") return { error: "该代理账号已停用，请联系管理员" };
    await setAffiliateLogin({ id: affiliate.id, email: affiliate.email });
  } catch (e) {
    if (e instanceof EmailCodeError || e instanceof AffiliateError) return { error: e.message };
    console.error("[affiliate verify]", e);
    return { error: "开通失败，请稍后重试" };
  }

  return { ok: true, email, mode: input.mode };
}

export async function affiliateLogoutAction() {
  await clearAffiliateLogin();
  const store = await cookies();
  // 退出代理后不保留自己的推广归因，回到普通用户视角
  store.delete("lso_aff");
  redirect("/join");
}
