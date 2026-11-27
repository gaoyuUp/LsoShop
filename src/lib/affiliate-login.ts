import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db, schema } from "@/db";
import { clientIp } from "@/lib/http";

const { affiliateLoginLogs } = schema;

type GeoInfo = {
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  isp: string;
};

const EMPTY_GEO: GeoInfo = { countryCode: "", countryName: "", region: "", city: "", isp: "" };

function isLocalIp(ip: string) {
  const value = ip.trim().replace(/^::ffff:/, "");
  if (!value || value === "::1" || value === "localhost") return true;
  if (/^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value) || /^169\.254\./.test(value)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(value)) return true;
  return /^(fc|fd|fe80)/i.test(value);
}

async function lookupGeo(ip: string, headerCountry: string): Promise<GeoInfo> {
  if (!ip) return { ...EMPTY_GEO, countryName: "未知" };
  if (isLocalIp(ip)) return { countryCode: "LOCAL", countryName: "本地网络", region: "本机", city: "", isp: "" };

  const signal = AbortSignal.timeout(2500);
  const [ipWho, ipApiCo, ipApi] = await Promise.all([
    fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { cache: "no-store", signal })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.success === false) return null;
        return {
          countryCode: String(data.country_code ?? ""),
          countryName: String(data.country ?? ""),
          region: String(data.region ?? ""),
          city: String(data.city ?? ""),
          isp: String(data.connection?.isp ?? ""),
        };
      })
      .catch(() => null),
    fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { cache: "no-store", signal })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.error) return null;
        return {
          countryCode: String(data.country_code ?? ""),
          countryName: String(data.country_name ?? ""),
          region: String(data.region ?? ""),
          city: String(data.city ?? ""),
          isp: String(data.org ?? ""),
        };
      })
      .catch(() => null),
    fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=status,country,countryCode,regionName,city,isp`,
      { cache: "no-store", signal },
    )
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.status !== "success") return null;
        return {
          countryCode: String(data.countryCode ?? ""),
          countryName: String(data.country ?? ""),
          region: String(data.regionName ?? ""),
          city: String(data.city ?? ""),
          isp: String(data.isp ?? ""),
        };
      })
      .catch(() => null),
  ]);

  const found = ipApi ?? ipWho ?? ipApiCo;
  if (found && (found.countryName || found.countryCode)) return found;
  return { ...EMPTY_GEO, countryCode: headerCountry, countryName: "" };
}

export async function recordAffiliateLogin(
  affiliate: { id: number; email: string },
  method: "login" | "activate",
) {
  try {
    const h = await headers();
    const ip = (await clientIp()).trim().slice(0, 64);
    const headerCountry = (h.get("cf-ipcountry") || h.get("x-country-code") || h.get("x-geo-country") || "")
      .toUpperCase()
      .slice(0, 8);
    const geo = await lookupGeo(ip, headerCountry);
    await db.insert(affiliateLoginLogs).values({
      affiliateId: affiliate.id,
      email: affiliate.email.slice(0, 191),
      ip: ip || "未知",
      countryCode: geo.countryCode.slice(0, 8),
      countryName: geo.countryName.slice(0, 80),
      region: geo.region.slice(0, 80),
      city: geo.city.slice(0, 80),
      isp: geo.isp.slice(0, 120),
      userAgent: (h.get("user-agent") ?? "").slice(0, 500),
      method,
    });
  } catch (error) {
    console.error("[affiliate login log]", error);
  }
}

export async function listAffiliateLoginLogs(affiliateId: number, page = 1, pageSize = 10) {
  const size = Math.min(50, Math.max(1, Math.floor(pageSize) || 10));
  const where = eq(affiliateLoginLogs.affiliateId, affiliateId);
  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(affiliateLoginLogs).where(where);
  const total = Number(countRow?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  const rows = await db
    .select()
    .from(affiliateLoginLogs)
    .where(where)
    .orderBy(desc(affiliateLoginLogs.createdAt))
    .limit(size)
    .offset((current - 1) * size);
  return { rows, total, page: current, pageSize: size, pages };
}
