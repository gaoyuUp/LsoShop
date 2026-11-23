import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  AFFILIATE_COOKIE,
  affiliateCookieOptions,
  signAffiliateSession,
  verifyAffiliateSession,
} from "@/lib/auth/affiliate";

export async function getCurrentAffiliate() {
  const store = await cookies();
  const session = await verifyAffiliateSession(store.get(AFFILIATE_COOKIE)?.value);
  if (!session) return null;
  const id = Number(session.sub);
  if (!Number.isFinite(id)) return null;
  const [affiliate] = await db.select().from(schema.affiliates).where(eq(schema.affiliates.id, id));
  if (!affiliate || affiliate.status !== "active") return null;
  return affiliate;
}

export async function requireAffiliate() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/join?login=1&next=/promote");
  return affiliate;
}

export async function setAffiliateLogin(affiliate: { id: number; email: string }) {
  const token = await signAffiliateSession({ sub: String(affiliate.id), email: affiliate.email });
  const store = await cookies();
  store.set(AFFILIATE_COOKIE, token, affiliateCookieOptions);
}

export async function clearAffiliateLogin() {
  const store = await cookies();
  store.delete(AFFILIATE_COOKIE);
}
