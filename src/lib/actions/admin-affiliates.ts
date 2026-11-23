"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { db, schema } from "@/db";
import {
  AffiliateError,
  createInvite,
  deleteAffiliateAccount,
  deleteInvite,
  disableInvite,
  getPromoSettings,
  processWithdrawal,
  toggleAffiliateStatus,
} from "@/lib/affiliate";

function back(path: string, params: Record<string, string> = {}): never {
  redirect(`${path}${Object.keys(params).length ? `?${new URLSearchParams(params)}` : ""}`);
}

export async function createInviteAction(fd: FormData) {
  await requireAdmin();
  const remark = String(fd.get("remark") ?? "").trim().slice(0, 200);
  const settings = await getPromoSettings();
  await createInvite(remark, settings.inviteTtlDays);
  revalidatePath("/admin/agents");
  back("/admin/agents", { created: "1" });
}

export async function disableInviteAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (Number.isFinite(id) && id > 0) await disableInvite(id);
  revalidatePath("/admin/agents");
  back("/admin/agents", { disabled: "1" });
}

export async function clearTestCodesAction() {
  await requireAdmin();
  await db.delete(schema.affiliateEmailCodes);
  revalidatePath("/admin/dev/codes");
  redirect("/admin/dev/codes?cleared=1");
}

export async function deleteInviteAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  try {
    if (Number.isFinite(id) && id > 0) await deleteInvite(id);
  } catch (e) {
    if (e instanceof AffiliateError) back("/admin/agents", { error: e.message });
    throw e;
  }
  revalidatePath("/admin/agents");
  back("/admin/agents", { deletedInvite: "1" });
}

export async function deleteAffiliateAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  try {
    if (!Number.isFinite(id) || id <= 0) throw new AffiliateError("代理参数不正确");
    await deleteAffiliateAccount(id);
  } catch (e) {
    if (e instanceof AffiliateError) back("/admin/agents", { error: e.message });
    throw e;
  }
  revalidatePath("/admin/agents");
  back("/admin/agents", { deletedAgent: "1" });
}

export async function toggleAffiliateAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status") ?? "") === "active" ? "active" : "disabled";
  const fromList = fd.get("fromList") === "1";
  if (Number.isFinite(id) && id > 0) await toggleAffiliateStatus(id, status);
  revalidatePath("/admin/agents");
  if (Number.isFinite(id) && id > 0) revalidatePath(`/admin/agents/${id}`);
  back(fromList ? "/admin/agents" : `/admin/agents${id ? `/${id}` : ""}`, { status: "1" });
}

export async function processWithdrawalAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const action = String(fd.get("action") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  if (!Number.isFinite(id) || id <= 0 || (action !== "paid" && action !== "rejected")) {
    back("/admin/withdrawals", { error: "参数不正确" });
  }
  try {
    await processWithdrawal(id, action, note);
  } catch (e) {
    if (e instanceof AffiliateError) back("/admin/withdrawals", { error: e.message });
    throw e;
  }
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin/agents");
  revalidatePath("/promote/withdrawals");
  back("/admin/withdrawals", { processed: action });
}
