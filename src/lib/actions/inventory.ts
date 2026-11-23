"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/admin";

const { inventoryItems, productVariants, products } = schema;

const MAX_PER_IMPORT = 500;

/** 以单独一行 --- 分隔多份交付内容（与发货时的分隔符一致） */
function splitEntries(raw: string) {
  return raw
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PER_IMPORT);
}

function back(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

export async function addInventoryAction(fd: FormData) {
  await requireAdmin();
  const variantId = Number(fd.get("variantId"));
  if (!variantId) back("/admin/inventory", { error: "请选择规格" });

  const entries = splitEntries(String(fd.get("entries") ?? ""));
  if (entries.length === 0) back(`/admin/inventory?variantId=${variantId}`, { error: "请填写至少一份交付内容" });

  const [variant] = await db
    .select({ id: productVariants.id, productId: productVariants.productId, slug: products.slug })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(eq(productVariants.id, variantId));
  if (!variant) back("/admin/inventory", { error: "规格不存在" });

  for (let i = 0; i < entries.length; i += 100) {
    const chunk = entries.slice(i, i + 100);
    await db.insert(inventoryItems).values(chunk.map((content) => ({ variantId, content })));
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/"); 
  revalidatePath(`/products/${variant.slug}`);
  redirect(`/admin/inventory?variantId=${variantId}&added=${entries.length}`);
}

export async function deleteInventoryAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (!id) return;
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
  if (!item) return;
  if (item.status !== "available") {
    back(`/admin/inventory?variantId=${item.variantId}`, { error: "只有「可售」状态的库存可以删除" });
  }
  await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory?variantId=${item.variantId}&deleted=1`);
}

export async function clearAvailableInventoryAction(fd: FormData) {
  await requireAdmin();
  const variantId = Number(fd.get("variantId"));
  if (!variantId) return;
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.variantId, variantId), eq(inventoryItems.status, "available")));
  await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.variantId, variantId), eq(inventoryItems.status, "available")));
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory?variantId=${variantId}&cleared=${Number(row?.n ?? 0)}`);
}
