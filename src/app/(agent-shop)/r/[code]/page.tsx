import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { AgentProductGrid } from "@/components/site/agent-product-grid";
import { getDictionary } from "@/i18n";
import { getAgentShop } from "@/lib/affiliate";
import { getSiteConfig } from "@/lib/site-config";

export async function generateMetadata({ params }: PageProps<"/r/[code]">): Promise<Metadata> {
  const { code } = await params;
  const [shop, site] = await Promise.all([getAgentShop(code), getSiteConfig()]);
  if ("invalid" in shop) {
    return {
      title: "推广链接无效",
      robots: { index: false, follow: false, nocache: true },
    };
  }
  return {
    title: "专属价",
    description: `${site.slogan}，本链接展示推广人专属价格`,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function AgentShopPage({ params, searchParams }: PageProps<"/r/[code]">) {
  await connection();
  const { code } = await params;
  const sp = await searchParams;
  const t = getDictionary();

  // 价位码参数；渠道 src 由 layout 的访问埋点读取
  const pc = typeof sp.pc === "string" ? sp.pc : "";

  const [shop, site] = await Promise.all([getAgentShop(code, pc || undefined), getSiteConfig()]);
  if ("invalid" in shop) {
    // 无效码不产生归属；getAgentContext / 下单接口都会再次校验，不会算到错误代理
    const reason = shop.reason === "disabled" ? t.agent.disabledCode : t.agent.invalidCode;
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
        <div className="glass rounded-[28px] p-8">
          <h1 className="text-2xl font-semibold tracking-tight">推广链接{reason}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            该链接不存在或已被停用。下方为平台公开价，购买与订单功能不受影响。
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
          >
            查看平台价
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Hero announcement={""} logoUrl={site.logoUrl} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-brand/15 bg-brand/[0.05] px-4 py-2.5 text-xs text-brand">
          <span className="size-1.5 rounded-full bg-brand" />
          {t.agent.priceNote}
          {shop.priceCode && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 font-mono text-[11px]">
              价位码 {shop.priceCode.name || shop.priceCode.code}
            </span>
          )}
        </div>
        <AgentProductGrid products={shop.products} agentCode={shop.affiliate.code} priceCode={shop.priceCode?.code} />
      </div>
    </>
  );
}
