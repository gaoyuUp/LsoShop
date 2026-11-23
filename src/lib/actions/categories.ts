"use server";
import { eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";

const { productCategories, products } = schema;

function text(fd: FormData, key: string, max = 80) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function makeSlug(raw: string, name: string) {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
  return clean(raw) || clean(name) || `cat-${Date.now().toString(36)}`;
}
function backTo(params: Record<string, string>): never {
  redirect(`/admin/categories?${new URLSearchParams(params).toString()}`);
}
function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function createCategoryAction(fd: FormData) {
  await requireAdmin();
  const name = text(fd, "name", 80);
  if (!name) backTo({ error: "请填写分类名称" });
  const slug = makeSlug(text(fd, "slug", 64), name);
  const sort = Math.max(-9999, Math.min(9999, int(fd, "sort", 10)));

  const [dup] = await db
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(or(eq(productCategories.slug, slug), eq(productCategories.name, name)));
  if (dup) backTo({ error: "分类名称或链接标识已存在" });

  try {
    await db.insert(productCategories).values({ name, slug, sort });
  } catch {
    backTo({ error: "创建失败，请检查分类名称或链接标识" });
  }
  refresh();
  redirect("/admin/categories?saved=1");
}

export async function updateCategoryAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) backTo({ error: "参数错误" });
  const name = text(fd, "name", 80);
  if (!name) backTo({ error: "请填写分类名称" });
  const slug = makeSlug(text(fd, "slug", 64), name);
  const sort = Math.max(-9999, Math.min(9999, int(fd, "sort", 10)));

  const [exists] = await db.select().from(productCategories).where(eq(productCategories.id, id));
  if (!exists) backTo({ error: "分类不存在" });

  const [dup] = await db
    .select({ id: productCategories.id })
    .from(productCategories)
    .where(or(eq(productCategories.slug, slug), eq(productCategories.name, name)));
  if (dup && dup.id !== id) backTo({ error: "分类名称或链接标识已被其他分类使用" });

  try {
    await db.update(productCategories).set({ name, slug, sort }).where(eq(productCategories.id, id));
  } catch {
    backTo({ error: "保存失败，请检查填写内容" });
  }
  refresh();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) backTo({ error: "参数错误" });

  const [used] = await db
    .select({ n: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.categoryId, id));
  if (Number(used?.n ?? 0) > 0) backTo({ error: "该分类下还有商品，请先把商品移到其他分类后再删除" });

  await db.delete(productCategories).where(eq(productCategories.id, id));
  refresh();
  redirect("/admin/categories?deleted=1");
}
