import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Copy, ExternalLink, ShoppingBag, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ProductForm } from "@/components/admin/product-form";
import { VariantsEditor } from "@/components/admin/variants-editor";
import { deleteProductAction, duplicateProductAction, updateProductAction } from "@/lib/actions/products";
import { getAdminProduct, listCategoryOptions } from "@/lib/admin-data";

export const metadata: Metadata = { title: "编辑商品" };

const NOTICES: Record<string, { text: string; tone: "ok" | "warn" | "error" }> = {
  saved: { text: "商品信息已保存，前台已同步更新", tone: "ok" },
  created: { text: "商品创建成功。请继续添加规格与库存", tone: "ok" },
  copied: { text: "已复制商品（默认下架），请修改名称与链接标识后上架", tone: "ok" },
  varSaved: { text: "规格已保存", tone: "ok" },
};

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await connection();
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProduct(Number(id)), listCategoryOptions()]);
  if (!product) notFound();
  const sp = await searchParams;

  const error = typeof sp.error === "string" ? sp.error : "";
  const varError = typeof sp.varError === "string" ? sp.varError : "";
  const noticeKey = ["saved", "created", "copied", "varSaved"].find((k) => sp[k] === "1");
  const notice = noticeKey ? NOTICES[noticeKey] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          返回商品列表
        </Link>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className="font-mono">ID #{product.id}</span>
          <span className="h-3 w-px bg-foreground/10" />
          <span className="font-mono">/products/{product.slug}</span>
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <ExternalLink className="size-3" />
            前台查看
          </Link>
        </div>
      </div>

      {notice && (
        <div
          className={
            notice.tone === "ok"
              ? "rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400"
              : "rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-600 dark:text-amber-400"
          }
        >
          {notice.text}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      {varError && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {varError}
        </div>
      )}

      <ProductForm
        action={updateProductAction}
        mode="edit"
        categories={categories}
        values={{
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          slug: product.slug,
          subtitle: product.subtitle,
          badge: product.badge,
          description: product.description ?? "",
          image: product.image,
          theme: product.theme,
          deliveryHint: product.deliveryHint,
          warnings: product.warnings ?? [],
          notes: product.notes ?? [],
          requireEmail: product.requireEmail,
          buyerInputLabel: product.buyerInputLabel,
          buyerInputPlaceholder: product.buyerInputPlaceholder,
          buyerInputHint: product.buyerInputHint,
          buyerInputLength: product.buyerInputLength,
          isExpiring: product.isExpiring,
          validityDays: product.validityDays || 30,
          listed: product.listed,
          sort: product.sort,
        }}
      />

      <VariantsEditor productId={product.id} variants={product.variants} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/[0.07] bg-background/70 p-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Copy className="size-3.5 text-muted-foreground" />
              复制商品
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">连同规格复制一份，默认下架，方便快速上新品</p>
          </div>
          <form action={duplicateProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-foreground/10 px-3 text-[13px] transition hover:border-foreground/25"
            >
              复制
            </button>
          </form>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/15 bg-rose-500/[0.03] p-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
              <Trash2 className="size-3.5" />
              删除商品
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">已有订单的商品无法删除，建议下架保留数据</p>
          </div>
          <form action={deleteProductAction}>
            <input type="hidden" name="id" value={product.id} />
            <ConfirmSubmit
              message={`确定删除「${product.name}」吗？\n\n商品、规格和未售出的库存都会被删除，此操作不可恢复。已有订单时无法删除。`}
              dialogTitle="删除商品？"
              confirmText="确认删除"
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-rose-500/10 px-3 text-[13px] text-rose-600 transition hover:bg-rose-500/15 dark:text-rose-400"
            >
              删除
            </ConfirmSubmit>
          </form>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pb-2 text-[12px] text-muted-foreground">
        <ShoppingBag className="size-3" />
        商品编辑与规格修改会立即同步到前台，无需重新部署
      </div>
    </div>
  );
}
