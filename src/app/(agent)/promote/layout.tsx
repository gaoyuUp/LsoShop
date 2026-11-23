import type { Metadata } from "next";
import { PromotionNav } from "@/components/agent/promotion-nav";
import { PromotePageTransition } from "@/components/agent/promote-page-transition";
import { PromoteBackground } from "@/components/agent/promote-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { requireAffiliate } from "@/lib/auth/affiliate-server";
import { resolveAgentSupport } from "@/lib/agent-context";

export const metadata: Metadata = {
  title: "推广中心",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PromoteLayout({ children }: LayoutProps<"/promote">) {
  const [agent, support] = await Promise.all([requireAffiliate(), resolveAgentSupport()]);
  const headerAgent = { code: agent.code, email: agent.email, nickname: agent.nickname };

  return (
    <>
      <PromoteBackground />
      <SiteHeader support={support} agent={headerAgent} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <PromotionNav agent={headerAgent} />
        <div className="mt-6"><PromotePageTransition>{children}</PromotePageTransition></div>
      </main>
      <SiteFooter />
    </>
  );
}
