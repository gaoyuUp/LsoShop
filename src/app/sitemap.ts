import type { MetadataRoute } from "next";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { absoluteUrl } from "@/lib/seo";

// 商品和库存是动态数据，按请求生成，避免构建时依赖数据库。
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await db
    .select({
      slug: schema.products.slug,
      image: schema.products.image,
      updatedAt: schema.products.updatedAt,
    })
    .from(schema.products)
    .where(eq(schema.products.listed, true))
    .orderBy(asc(schema.products.sort), asc(schema.products.id));

  const latestUpdate = rows.reduce(
    (latest, product) => (product.updatedAt > latest ? product.updatedAt : latest),
    new Date(0),
  );

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latestUpdate > new Date(0) ? latestUpdate : new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...rows.map((product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.image ? [absoluteUrl(product.image)] : undefined,
    })),
  ];
}
