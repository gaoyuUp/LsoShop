"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import {
  AffiliateError,
  cancelWithdrawal,
  createPriceCode,
  createWithdrawal,
  deletePriceCode,
  getAgentPriceCode,
  saveAgentPricing,
  togglePriceCode,
  updateBindingRemark,
} from "@/lib/affiliate";
import { requireAffiliate } from "@/lib/auth/affiliate-server";

const { affiliates } = schema;

function text(fd: FormData, key: string, max = 200) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

function yuanToCents(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function back(path: string, params: Record<string, string> = {}): never {
  redirect(`${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`);
}

export async function saveAgentPricingAction(fd: FormData) {
  const agent = await requireAffiliate();
  const rawPriceCodeId = Number(fd.get("priceCodeId") ?? 0);
  const priceCodeId = Number.isFinite(rawPriceCodeId) && rawPriceCodeId > 0 ? rawPriceCodeId : null;

  if (priceCodeId) {
    const code = await getAgentPriceCode(agent.id, priceCodeId);
    if (!code) back("/promote/pricing", { error: "价位码不存在" });
  }

  const entries: { variantId: number; priceCents: number }[] = [];
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith("price_")) continue;
    const variantId = Number(key.slice(6));
    if (!Number.isFinite(variantId) || typeof value !== "string" || !value.trim()) continue;
    entries.push({ variantId, priceCents: yuanToCents(value) });
  }

  try {
    await saveAgentPricing(agent.id, priceCodeId, entries);
  } catch (e) {
    if (e instanceof AffiliateError) back(`/promote/pricing${priceCodeId ? `?pc=${priceCodeId}` : "?pc=0"}`, { error: e.message });
    throw e;
  }

  revalidatePath("/promote/pricing");
  revalidatePath("/promote", "layout");
  revalidatePath("/", "layout");
  revalidatePath(`/r/${agent.code}`);
  revalidatePath("/");
  back(`/promote/pricing?pc=${priceCodeId ?? 0}&saved=1`, {});
}

export async function saveAgentContactAction(fd: FormData) {
  const agent = await requireAffiliate();
  await db
    .update(affiliates)
    .set({
      nickname: text(fd, "nickname", 60),
      wechat: text(fd, "wechat", 120),
      wechatQr: text(fd, "wechatQr", 500),
      qq: text(fd, "qq", 120),
      telegram: text(fd, "telegram", 191),
    })
    .where(eq(affiliates.id, agent.id));
  revalidatePath("/promote/contact");
  revalidatePath("/promote", "layout");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath(`/r/${agent.code}`);
  redirect("/promote/contact?saved=1");
}

export async function createPriceCodeAction(fd: FormData) {
  const agent = await requireAffiliate();
  const name = text(fd, "name", 60);
  const copyCurrent = fd.get("copyCurrent") === "1";
  let id = 0;
  try {
    id = await createPriceCode(agent.id, name, copyCurrent);
  } catch (e) {
    if (e instanceof AffiliateError) back("/promote/pricing", { error: e.message });
    throw e;
  }
  revalidatePath("/promote/pricing");
  revalidatePath("/", "layout");
  redirect(`/promote/pricing?pc=${id}&created=1`);
}

export async function deletePriceCodeAction(fd: FormData) {
  const agent = await requireAffiliate();
  const id = Number(fd.get("id"));
  try {
    if (Number.isFinite(id) && id > 0) await deletePriceCode(agent.id, id);
  } catch (e) {
    if (e instanceof AffiliateError) back("/promote/pricing", { error: e.message });
    throw e;
  }
  revalidatePath("/promote/pricing");
  revalidatePath("/", "layout");
  revalidatePath(`/r/${agent.code}`);
  redirect("/promote/pricing?deleted=1");
}

export async function togglePriceCodeAction(fd: FormData) {
  const agent = await requireAffiliate();
  const id = Number(fd.get("id"));
  const active = String(fd.get("active") ?? "") === "1";
  if (Number.isFinite(id) && id > 0) {
    await togglePriceCode(agent.id, id, active);
  }
  revalidatePath("/promote/pricing");
  revalidatePath("/promote", "layout");
  revalidatePath("/", "layout");
  revalidatePath(`/r/${agent.code}`);
  redirect("/promote/pricing");
}

export async function updateCustomerRemarkAction(fd: FormData) {
  const agent = await requireAffiliate();
  const id = Number(fd.get("id"));
  if (Number.isFinite(id) && id > 0) {
    await updateBindingRemark(agent.id, id, text(fd, "remark", 200));
  }
  revalidatePath("/promote/customers");
  redirect("/promote/customers?saved=1");
}

export async function requestWithdrawalAction(fd: FormData) {
  const agent = await requireAffiliate();
  try {
    await createWithdrawal(agent.id, {
      amountCents: yuanToCents(String(fd.get("amount") ?? "")),
      alipayAccount: text(fd, "alipayAccount", 191),
      payeeName: text(fd, "payeeName", 60),
    });
  } catch (e) {
    if (e instanceof AffiliateError) back("/promote/withdrawals", { error: e.message });
    throw e;
  }
  revalidatePath("/promote/withdrawals");
  revalidatePath("/promote");
  redirect("/promote/withdrawals?requested=1");
}

export async function cancelWithdrawalAction(fd: FormData) {
  const agent = await requireAffiliate();
  const id = Number(fd.get("id"));
  try {
    if (Number.isFinite(id) && id > 0) await cancelWithdrawal(agent.id, id);
  } catch (e) {
    if (e instanceof AffiliateError) back("/promote/withdrawals", { error: e.message });
    throw e;
  }
  revalidatePath("/promote/withdrawals");
  revalidatePath("/promote");
  redirect("/promote/withdrawals?canceled=1");
}
