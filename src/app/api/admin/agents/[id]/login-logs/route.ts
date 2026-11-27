import { getAdmin } from "@/lib/auth/admin";
import { listAffiliateLoginLogs } from "@/lib/affiliate-login";
import { json } from "@/lib/http";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return json({ error: "未登录" }, 401);

  const { id } = await params;
  const affiliateId = Number(id);
  if (!Number.isInteger(affiliateId) || affiliateId <= 0) return json({ error: "参数不正确" }, 400);

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1") || 1;
  const data = await listAffiliateLoginLogs(affiliateId, page, 10);
  return json({
    ...data,
    rows: data.rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
