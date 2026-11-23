import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/lib/seo";

// 使用运行时 SITE_URL，避免构建环境变量把 robots 固定成 localhost。
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isIndexable
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/join", "/promote", "/order/", "/orders", "/api/"],
          },
        ]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
