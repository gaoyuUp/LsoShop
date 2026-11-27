"use server";

import { resolveAgentEntry } from "@/lib/affiliate";
import { getProductBySlug } from "@/lib/catalog";
import { clientIp, rateLimit } from "@/lib/http";

type CouponResult =
  | { error: string }
  | {
      ok: true;
      code: string;
      label: string;
      variants: { id: number; priceCents: number }[];
    };

export async function applyCouponAction(input: { code: string; slug: string }): Promise<CouponResult> {
  const code = input.code.trim().toUpperCase().slice(0, 16);
  if (!/^[A-Z0-9]{4,16}$/.test(code)) return { error: "请输入正确的优惠码" };

  const ip = await clientIp();
  if (!rateLimit(`coupon:${ip}`, 30, 60_000)) return { error: "操作太频繁，请稍后再试" };

  const entry = await resolveAgentEntry(code);
  if ("invalid" in entry) return { error: "优惠码无效或已停用" };

  const product = await getProductBySlug(input.slug, {
    affiliateId: entry.affiliate.id,
    priceCodeId: entry.priceCode?.id ?? null,
  });
  if (!product) return { error: "商品不存在或已下架" };

  return {
    ok: true,
    code: entry.priceCode?.code ?? entry.affiliate.code,
    label: entry.priceCode
      ? `价位码 · ${entry.priceCode.name || entry.priceCode.code}`
      : "代理专属价",
    variants: product.variants.map((variant) => ({ id: variant.id, priceCents: variant.priceCents })),
  };
}
