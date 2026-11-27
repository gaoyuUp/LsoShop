import type { Metadata } from "next";
import { SiteBackground } from "@/components/site/site-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { AgentTracker } from "@/components/site/agent-tracker";
import { resolveAgentSupport } from "@/lib/agent-context";
import { resolveAgentEntry } from "@/lib/affiliate";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AgentShopLayout({ children, params }: LayoutProps<"/r/[code]">) {
  const { code } = await params;
  const [entry, support, affiliate, site] = await Promise.all([
    resolveAgentEntry(code),
    resolveAgentSupport(),
    getCurrentAffiliate(),
    getSiteConfig(),
  ]);
  const homeHref = entry && !("invalid" in entry) ? `/r/${entry.entryCode}` : `/r/${code}`;
  return (
    <>
      <SiteBackground />
      <SiteHeader
        support={support}
        agent={affiliate ? { code: affiliate.code, email: affiliate.email, nickname: affiliate.nickname } : null}
        siteName={site.name}
        logoUrl={site.logoUrl}
        homeHref={homeHref}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter siteName={site.name} logoUrl={site.logoUrl} />
      <AgentTracker code={code} />
    </>
  );
}
