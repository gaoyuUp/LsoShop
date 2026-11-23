import { SiteBackground } from "@/components/site/site-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getDictionary } from "@/i18n";
import { absoluteUrl, serializeJsonLd, siteUrl } from "@/lib/seo";
import { getCurrentAffiliate } from "@/lib/auth/affiliate-server";
import { resolveAgentSupport } from "@/lib/agent-context";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const [support, affiliate] = await Promise.all([resolveAgentSupport(), getCurrentAffiliate()]);
  const t = getDictionary();
  const organizationJsonLd = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: t.brand.name,
        url: siteUrl,
        logo: absoluteUrl("/logo.png"),
        description: `${t.brand.slogan}，${t.brand.tagline}。`,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: t.brand.name,
        description: `${t.brand.slogan}，${t.brand.tagline}。`,
        inLanguage: "zh-CN",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd }} />
      <SiteBackground />
      <SiteHeader support={support} agent={affiliate ? { code: affiliate.code, email: affiliate.email, nickname: affiliate.nickname } : null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
