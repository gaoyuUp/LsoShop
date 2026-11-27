"use server";
import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";
import { THEMES } from "@/lib/format";
import type { ProductNote } from "@/db/schema";

const { products, productVariants, inventoryItems, orders, productCategories } = schema;

function text(fd: FormData, key: string, max = 2000) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function parseNotes(raw: FormDataEntryValue | null): ProductNote[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, 30)
      .map((n) => ({
        title: String(n?.title ?? "").trim().slice(0, 120),
        body: String(n?.body ?? "").trim().slice(0, 8000),
      }))
      .filter((n) => n.title || n.body);
  } catch {
    return [];
  }
}
function parseWarnings(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((s) => s.slice(0, 1500));
}
function makeSlug(raw: string, name: string) {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64);
  return clean(raw) || clean(name) || `p-${Date.now().toString(36)}`;
}
function backTo(path: string, params: Record<string, string>): never {
  const sp = new URLSearchParams(params);
  redirect(`${path}?${sp.toString()}`);
}
function refreshStore(slug: string) {
  revalidatePath("/");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
}

function payload(fd: FormData) {
  const name = text(fd, "name", 120);
  const slug = makeSlug(text(fd, "slug", 64), name);
  const themeRaw = text(fd, "theme", 20);
  const theme = (THEMES as readonly string[]).includes(themeRaw) ? themeRaw : "violet";
  const sort = Math.max(-9999, Math.min(9999, int(fd, "sort")));
  return {
    categoryId: int(fd, "categoryId"),
    name,
    slug,
    subtitle: text(fd, "subtitle", 160),
    badge: text(fd, "badge", 40),
    description: text(fd, "description", 20000),
    image: text(fd, "image", 500),
    theme,
    deliveryHint: text(fd, "deliveryHint", 160),
    warnings: parseWarnings(fd.get("warnings")),
    notes: parseNotes(fd.get("notes")),
    requireEmail: fd.get("requireEmail") === "1",
    buyerInputLabel: text(fd, "buyerInputLabel", 60),
    buyerInputPlaceholder: text(fd, "buyerInputPlaceholder", 160),
    buyerInputHint: text(fd, "buyerInputHint", 200),
    buyerInputLength: Math.max(0, Math.min(12, int(fd, "buyerInputLength"))),
    isExpiring: fd.get("isExpiring") === "1",
    validityDays: Math.max(0, Math.min(3650, int(fd, "validityDays"))),
    listed: fd.get("listed") === "1",
    sort,
  };
}

export async function createProductAction(fd: FormData) {
  await requireAdmin();
  const data = payload(fd);
  if (!data.name) backTo("/admin/products/new", { error: "请填写商品名称" });
  if (data.isExpiring && data.validityDays <= 0) backTo("/admin/products/new", { error: "会员商品请填写大于 0 的有效期天数" });
  if (!data.categoryId) backTo("/admin/products/new", { error: "请选择商品分类" });
  const [category] = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.id, data.categoryId));
  if (!category) backTo("/admin/products/new", { error: "商品分类不存在，请重新选择" });

  const [dup] = await db.select({ id: products.id }).from(products).where(eq(products.slug, data.slug));
  if (dup) backTo("/admin/products/new", { error: `链接标识「${data.slug}」已被使用，请换一个` });

  let newId = 0;
  try {
    const [row] = await db.insert(products).values(data).$returningId();
    newId = row.id;
  } catch {
    backTo("/admin/products/new", { error: "创建失败，请检查填写内容后重试" });
  }

  refreshStore(data.slug);
  redirect(`/admin/products/${newId}?created=1`);
}

export async function updateProductAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) backTo("/admin/products", { error: "参数错误" });
  const data = payload(fd);
  if (!data.name) backTo(`/admin/products/${id}`, { error: "请填写商品名称" });
  if (data.isExpiring && data.validityDays <= 0) backTo(`/admin/products/${id}`, { error: "会员商品请填写大于 0 的有效期天数" });
  if (!data.categoryId) backTo(`/admin/products/${id}`, { error: "请选择商品分类" });
  const [category] = await db.select({ id: productCategories.id }).from(productCategories).where(eq(productCategories.id, data.categoryId));
  if (!category) backTo(`/admin/products/${id}`, { error: "商品分类不存在，请重新选择" });

  const [old] = await db.select().from(products).where(eq(products.id, id));
  if (!old) backTo("/admin/products", { error: "商品不存在" });

  const [dup] = await db.select({ id: products.id }).from(products).where(eq(products.slug, data.slug));
  if (dup && dup.id !== id) backTo(`/admin/products/${id}`, { error: `链接标识「${data.slug}」已被使用` });

  await db.update(products).set(data).where(eq(products.id, id));
  refreshStore(data.slug);
  if (old.slug !== data.slug) revalidatePath(`/products/${old.slug}`);
  redirect(`/admin/products/${id}?saved=1`);
}

export async function toggleProductListedAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) return;
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return;
  await db.update(products).set({ listed: !product.listed }).where(eq(products.id, id));
  refreshStore(product.slug);
}

export async function deleteProductAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) return;
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return;

  const [used] = await db.select({ n: sql<number>`count(*)` }).from(orders).where(eq(orders.productId, id));
  if (Number(used?.n ?? 0) > 0) {
    backTo(`/admin/products/${id}`, { error: "该商品已有订单记录，建议下架而不是删除" });
  }

  const variants = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id));
  const vids = variants.map((v) => v.id);
  await db.transaction(async (tx) => {
    if (vids.length) {
      await tx.delete(inventoryItems).where(inArray(inventoryItems.variantId, vids));
      await tx.delete(productVariants).where(inArray(productVariants.id, vids));
    }
    await tx.delete(products).where(eq(products.id, id));
  });

  revalidatePath("/");
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  redirect("/admin/products?deleted=1");
}

export async function duplicateProductAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) return;
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return;
  const baseSlug = `${product.slug}-copy`;
  let slug = baseSlug;
  let i = 2;
  while ((await db.select({ id: products.id }).from(products).where(eq(products.slug, slug))).length > 0) {
    slug = `${baseSlug}-${i++}`;
  }
  const [row] = await db
    .insert(products)
    .values({
      categoryId: product.categoryId,
      slug,
      name: `${product.name} 副本`,
      subtitle: product.subtitle,
      badge: product.badge,
      description: product.description,
      image: product.image,
      theme: product.theme,
      deliveryHint: product.deliveryHint,
      warnings: product.warnings,
      notes: product.notes,
      requireEmail: product.requireEmail,
      buyerInputLabel: product.buyerInputLabel,
      buyerInputPlaceholder: product.buyerInputPlaceholder,
      buyerInputHint: product.buyerInputHint,
      buyerInputLength: product.buyerInputLength,
      isExpiring: product.isExpiring,
      validityDays: product.validityDays,
      listed: false,
      sort: product.sort + 1,
    })
    .$returningId();
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, id));
  if (variants.length) {
    await db.insert(productVariants).values(
      variants.map((v) => ({
        productId: row.id,
        name: v.name,
        description: v.description,
        priceCents: v.priceCents,
        originalPriceCents: v.originalPriceCents,
        minQuantity: v.minQuantity,
        maxQuantity: v.maxQuantity,
        deliveryMode: v.deliveryMode,
        listed: v.listed,
        sort: v.sort,
      })),
    );
  }
  refreshStore(slug);
  redirect(`/admin/products/${row.id}?copied=1`);
}
