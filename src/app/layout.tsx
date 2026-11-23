import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { defaultLocale, getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";
import { defaultOgImage, isIndexable, siteUrl } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const t = getDictionary();
const siteTitle = `${t.brand.name} · ${t.brand.slogan}`;
const siteDescription = `${t.brand.slogan}，${t.brand.tagline}。`;

export const metadata: Metadata = {
  title: { default: siteTitle, template: `%s · ${t.brand.name}` },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  applicationName: t.brand.name,
  authors: [{ name: t.brand.name }],
  creator: t.brand.name,
  publisher: t.brand.name,
  category: "shopping",
  keywords: ["灵搜小店", "Muse AI", "GPT Plus", "ChatGPT Plus", "AI 账号", "成品账号", "订阅服务"],
  // 本地开发不收录；线上换成正式域名后自动允许搜索引擎收录
  robots: isIndexable
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    siteName: t.brand.name,
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImage.url],
  },
  formatDetection: { email: false, address: false, telephone: false },
};

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
