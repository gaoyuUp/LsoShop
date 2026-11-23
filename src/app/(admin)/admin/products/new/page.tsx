import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { createProductAction } from "@/lib/actions/products";
import { listCategoryOptions } from "@/lib/admin-data";

export const metadata: Metadata = { title: "新建商品" };

export default async function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : "";
  const categories = await listCategoryOptions();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          返回商品列表
        </Link>
        <span className="text-[12px] text-muted-foreground">新建后会自动跳转到编辑页，继续添加规格</span>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          先填写商品基础信息、购买须知与展示样式；创建成功后再添加「规格」和「库存」。商品只有添加了规格后才会出现在前台。
        </p>
      </div>

      <ProductForm action={createProductAction} mode="create" categories={categories} />
    </div>
  );
}
