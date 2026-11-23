"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";

const { productVariants, products, inventoryItems } = schema;

function text(fd: FormData, key: string, max = 500) {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}
function int(fd: FormData, key: string, fallback = 0) {
  const n = Number(fd.get(key));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function cents(fd: FormData, key: string) {
  const n = Number(String(fd.get(key) ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
function backTo(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}#variants`);
}
function refresh(productId: number) {
  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/inventory");
}

async function productSlug(productId: number) {
  const [p] = await db.select({ slug: products.slug }).from(products).where(eq(products.id, productId));
  return p?.slug ?? "";
}

export async function createVariantAction(fd: FormData) {
  await requireAdmin();
  const productId = int(fd, "productId");
  if (!productId) backTo("/admin/products", { varError: "参数错误" });

  const name = text(fd, "name", 120);
  const price = cents(fd, "price");
  if (!name) backTo(`/admin/products/${productId}`, { varError: "请填写规格名称" });
  if (price === null) backTo(`/admin/products/${productId}`, { varError: "请填写正确的价格" });

  const minQ = Math.max(1, Math.min(999, int(fd, "minQuantity", 1)));
  const maxQ = Math.max(minQ, Math.min(999, int(fd, "maxQuantity", 10)));
  const original = cents(fd, "originalPrice");
  const mode = text(fd, "deliveryMode", 16) === "manual" ? "manual" : "auto";

  await db.insert(productVariants).values({
    productId,
    name,
    description: text(fd, "description", 255),
    priceCents: price,
    originalPriceCents: original !== null && original > price ? original : 0,
    minQuantity: minQ,
    maxQuantity: maxQ,
    deliveryMode: mode,
    listed: fd.get("listed") === "1",
    affiliateEnabled: fd.get("affiliateEnabled") === "1",
    affiliateCostCents: cents(fd, "affiliateCost") ?? 0,
    sort: Math.max(-9999, Math.min(9999, int(fd, "sort", 10))),
  });

  const slug = await productSlug(productId);
  refresh(productId);
  if (slug) revalidatePath(`/products/${slug}`);
  redirect(`/admin/products/${productId}?varSaved=1#variants`);
}

export async function updateVariantAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) redirect("/admin/products");
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
  if (!variant) redirect("/admin/products");

  const name = text(fd, "name", 120);
  const price = cents(fd, "price");
  if (!name) backTo(`/admin/products/${variant.productId}`, { varError: "请填写规格名称" });
  if (price === null) backTo(`/admin/products/${variant.productId}`, { varError: "请填写正确的价格" });

  const minQ = Math.max(1, Math.min(999, int(fd, "minQuantity", 1)));
  const maxQ = Math.max(minQ, Math.min(999, int(fd, "maxQuantity", 10)));
  const original = cents(fd, "originalPrice");

  await db
    .update(productVariants)
    .set({
      name,
      description: text(fd, "description", 255),
      priceCents: price,
      originalPriceCents: original !== null && original > price ? original : 0,
      minQuantity: minQ,
      maxQuantity: maxQ,
      deliveryMode: text(fd, "deliveryMode", 16) === "manual" ? "manual" : "auto",
      listed: fd.get("listed") === "1",
      affiliateEnabled: fd.get("affiliateEnabled") === "1",
      affiliateCostCents: cents(fd, "affiliateCost") ?? 0,
      sort: Math.max(-9999, Math.min(9999, int(fd, "sort", 10))),
    })
    .where(eq(productVariants.id, id));

  const slug = await productSlug(variant.productId);
  refresh(variant.productId);
  if (slug) revalidatePath(`/products/${slug}`);
  redirect(`/admin/products/${variant.productId}?varSaved=1#variants`);
}

export async function toggleVariantListedAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) return;
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
  if (!variant) return;
  await db.update(productVariants).set({ listed: !variant.listed }).where(eq(productVariants.id, id));
  const slug = await productSlug(variant.productId);
  refresh(variant.productId);
  if (slug) revalidatePath(`/products/${slug}`);
}

export async function deleteVariantAction(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  if (!id) return;
  const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
  if (!variant) return;
  await db.transaction(async (tx) => {
    await tx.delete(inventoryItems).where(eq(inventoryItems.variantId, id));
    await tx.delete(productVariants).where(eq(productVariants.id, id));
  });
  const slug = await productSlug(variant.productId);
  refresh(variant.productId);
  if (slug) revalidatePath(`/products/${slug}`);
  redirect(`/admin/products/${variant.productId}?varSaved=1#variants`);
}
