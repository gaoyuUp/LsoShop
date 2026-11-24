import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { defaultLocale } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";
import { isIndexable, siteUrl } from "@/lib/seo";
import { getSiteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const siteTitle = `${site.name} · ${site.slogan}`;
  const ogImage = { url: site.ogImageUrl, width: 1200, height: 630, alt: site.ogImageAlt };

  return {
    title: { default: siteTitle, template: `%s · ${site.name}` },
    description: site.description,
    metadataBase: new URL(siteUrl),
    applicationName: site.name,
    authors: [{ name: site.name }],
    creator: site.name,
    publisher: site.name,
    category: "shopping",
    keywords: site.keywords,
    // 本地开发不收录；线上换成正式域名后自动允许搜索引擎收录
    robots: isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    icons: {
      icon: [{ url: site.iconUrl }],
      shortcut: [{ url: site.iconUrl }],
      ...(site.iconUrl.endsWith(".svg") ? {} : { apple: [{ url: site.iconUrl }] }),
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: siteUrl,
      siteName: site.name,
      title: siteTitle,
      description: site.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: site.description,
      images: [ogImage.url],
    },
    formatDetection: { email: false, address: false, telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <I18nProvider locale={defaultLocale}>
            {children}
            <Toaster position="top-center" richColors />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
