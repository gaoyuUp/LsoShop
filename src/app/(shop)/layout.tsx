import { SiteBackground } from "@/components/site/site-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { absoluteUrl, serializeJsonLd, siteUrl } from "@/lib/seo";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { resolveAgentSupport } from "@/lib/agent-context";
import { getSiteConfig } from "@/lib/site-config";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [support, affiliate, site] = await Promise.all([resolveAgentSupport(), getCurrentAffiliate(), getSiteConfig()]);
  const organizationJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: site.name,
        url: siteUrl,
        logo: absoluteUrl(site.logoUrl || "/logo.png"),
        description: site.description,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: site.name,
        description: site.description,
        inLanguage: "zh-CN",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />
      <SiteBackground />
      <SiteHeader
        support={support}
        agent={affiliate ? { code: affiliate.code, email: affiliate.email, nickname: affiliate.nickname } : null}
        siteName={site.name}
        logoUrl={site.logoUrl}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter siteName={site.name} logoUrl={site.logoUrl} />
    </>
  );
}
