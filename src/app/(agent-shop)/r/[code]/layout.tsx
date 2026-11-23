import type { Metadata } from "next";
import { SiteBackground } from "@/components/site/site-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { AgentTracker } from "@/components/site/agent-tracker";
import { resolveAgentSupport } from "@/lib/agent-context";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AgentShopLayout({ children, params }: LayoutProps<"/r/[code]">) {
  const { code } = await params;
  const [support, affiliate] = await Promise.all([resolveAgentSupport(), getCurrentAffiliate()]);
  return (
    <>
      <SiteBackground />
      <SiteHeader support={support} agent={affiliate ? { code: affiliate.code, email: affiliate.email, nickname: affiliate.nickname } : null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AgentTracker code={code} />
    </>
  );
}
