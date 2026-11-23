import { verifyAffiliateCodeAction } from "@/lib/actions/affiliate-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "参数不正确" }, { status: 400 });
  const result = await verifyAffiliateCodeAction({
    mode: body.mode === "login" ? "login" : "activate",
    email: String(body.email ?? ""),
    invite: String(body.invite ?? ""),
    code: String(body.code ?? ""),
  });
  return Response.json(result);
}
