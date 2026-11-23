import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Boxes, FolderTree, Plus, Save, Tags, TriangleAlert } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Pagination } from "@/components/admin/pagination";
import { SubmitButton } from "@/components/admin/submit-button";
import { createCategoryAction, deleteCategoryAction, updateCategoryAction } from "@/lib/actions/categories";
import { listCategoriesWithCounts } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "分类管理" };

const CATEGORY_TONES = [
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
];

export default async function AdminCategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await connection();
  const sp = await searchParams;
  const saved = sp.saved === "1";
  const deleted = sp.deleted === "1";
  const error = typeof sp.error === "string" ? sp.error : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const list = await listCategoriesWithCounts({ page, pageSize: 20 });
  const { rows: categories, total, productTotal, maxSort } = list;

  return (
    <div className="space-y-4">
      {saved && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          分类已保存，商品归属已同步
        </div>
      )}
      {deleted && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          分类已删除
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <FolderTree className="size-3.5" />
            共 <b className="font-mono text-foreground">{total}</b> 个分类
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Boxes className="size-3.5" />
            已归类 <b className="font-mono text-foreground">{productTotal}</b> 个商品
          </span>
        </div>
        <Link
          href="/admin/products"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
        >
          商品管理
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-3 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
                <Plus className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">新建分类</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">分类会出现在商品表单的必选项里</p>
              </div>
            </div>

            <form action={createCategoryAction} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">分类名称</span>
                <input
                  name="name"
                  required
                  maxLength={80}
                  placeholder="例如：Muse AI"
                  className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">链接标识（slug）</span>
                <input
                  name="slug"
                  maxLength={64}
                  placeholder="muse-ai（留空自动生成）"
                  className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition placeholder:font-sans placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">排序</span>
                <input
                  name="sort"
                  type="number"
                  defaultValue={maxSort + 10}
                  className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-3 font-mono text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                />
              </label>
              <SubmitButton pendingText="创建中…" className="w-full">
                <Plus className="mr-1 size-3.5" />
                添加分类
              </SubmitButton>
            </form>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-3.5 text-[12px] leading-relaxed text-amber-700 dark:text-amber-300">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <p>每个商品必须选择一个分类。分类下还有商品时不能删除，需要先把商品移动到其他分类。</p>
          </div>
        </div>

        <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Tags className="size-4 text-brand" />
                全部分类
              </h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">修改名称或 slug 后，前台商品会同步更新</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{total}</span>
          </div>

          {categories.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-foreground/15 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground">
                <FolderTree className="size-5" />
              </span>
              <p className="mt-3 text-xs font-medium">还没有商品分类</p>
              <p className="mt-1 text-[13px] text-muted-foreground">在左侧创建第一个分类，然后去商品编辑页选择它</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {categories.map((c, i) => (
                <article key={c.id} className="overflow-hidden rounded-xl border border-foreground/[0.08] bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/[0.06] bg-foreground/[0.015] px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn("grid size-6 place-items-center rounded-md", CATEGORY_TONES[i % CATEGORY_TONES.length])}>
                        <Tags className="size-3" />
                      </span>
                      <span className="truncate text-xs font-semibold">{c.name}</span>
                      <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[12px] text-muted-foreground">
                        {c.productCount} 个商品
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.productCount > 0 ? (
                        <span title="分类下还有商品，无法删除" className="cursor-not-allowed rounded-md px-2 py-1 text-[13px] text-muted-foreground/45">
                          删除
                        </span>
                      ) : (
                        <form action={deleteCategoryAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmSubmit
                            message={`确定删除分类「${c.name}」吗？此操作不可恢复。`}
                            dialogTitle="删除分类？"
                            confirmText="确认删除"
                            className="rounded-md px-2 py-1 text-[13px] text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            删除
                          </ConfirmSubmit>
                        </form>
                      )}
                    </div>
                  </div>

                  <form action={updateCategoryAction} className="p-3.5">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="grid gap-3 sm:grid-cols-[1.3fr_1.3fr_0.5fr]">
                      <label className="block">
                        <span className="mb-1 block text-[12px] font-medium text-muted-foreground">名称</span>
                        <input
                          name="name"
                          defaultValue={c.name}
                          required
                          maxLength={80}
                          className="h-8 w-full rounded-lg border border-foreground/10 bg-background px-2.5 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[12px] font-medium text-muted-foreground">slug</span>
                        <input
                          name="slug"
                          defaultValue={c.slug}
                          maxLength={64}
                          className="h-8 w-full rounded-lg border border-foreground/10 bg-background px-2.5 font-mono text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[12px] font-medium text-muted-foreground">排序</span>
                        <input
                          name="sort"
                          type="number"
                          defaultValue={c.sort}
                          className="h-8 w-full rounded-lg border border-foreground/10 bg-background px-2.5 font-mono text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <SubmitButton variant="outline" pendingText="保存中…" className="h-8 px-3 text-[13px]">
                        <Save className="mr-1 size-3" />
                        保存分类
                      </SubmitButton>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <Pagination basePath="/admin/categories" page={page} total={total} pageSize={list.pageSize} />
    </div>
  );
}
