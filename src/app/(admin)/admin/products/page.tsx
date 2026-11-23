import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowUpRight,
  Copy,
  Tag,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Pagination } from "@/components/admin/pagination";
import {
  deleteProductAction,
  duplicateProductAction,
  toggleProductListedAction,
} from "@/lib/actions/products";
import { listAdminProducts } from "@/lib/admin-data";
import { formatPrice, THEME_LABEL, type ThemeName } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "商品管理" };

const THEME_DOT: Record<string, string> = {
  violet: "linear-gradient(135deg,#7c5cff,#d96bff)",
  emerald: "linear-gradient(135deg,#2fbf8f,#5cc8ff)",
  sky: "linear-gradient(135deg,#4a9bff,#57d0ff)",
  amber: "linear-gradient(135deg,#f0a028,#ff7a45)",
  rose: "linear-gradient(135deg,#f25c86,#ff9a76)",
  mono: "linear-gradient(135deg,#6b7280,#a1a1aa)",
};

export default async function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  await connection();
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : "";
  const deleted = sp.deleted === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const list = await listAdminProducts({ page, pageSize: 20 });
  const { rows: products, total, summary } = list;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      {deleted && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          商品已删除
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShoppingBag className="size-3.5" />
            共 <b className="font-mono text-foreground">{total}</b> 个商品
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" />
            共 <b className="font-mono text-foreground">{summary.variants}</b> 个规格
          </span>
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Sparkles className="size-3.5" />
            在售 <b className="font-mono text-foreground">{summary.listed}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-3.5 text-xs text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
          >
            <Store className="size-3.5" />
            前台预览
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background transition hover:opacity-90"
          >
            <Plus className="size-3.5" />
            新建商品
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-background/60 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-foreground/[0.04]">
            <ShoppingBag className="size-6 text-muted-foreground" />
          </span>
          <h3 className="mt-4 text-sm font-medium">还没有商品</h3>
          <p className="mt-1 text-xs text-muted-foreground">创建第一个商品，添加规格和库存后即可开卖</p>
          <Link
            href="/admin/products/new"
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background"
          >
            <Plus className="size-3.5" />
            新建商品
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {products.map((p) => (
            <article
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur transition hover:border-foreground/15 hover:shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)]"
            >
              <div className="flex gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-foreground/[0.06] bg-foreground/[0.03]">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-muted-foreground">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                  {!p.listed && (
                    <span className="absolute inset-x-0 bottom-0 bg-background/85 py-0.5 text-center text-[11px] font-medium text-muted-foreground backdrop-blur">
                      已下架
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                        {p.isExpiring && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            会员 · {p.validityDays || "?"} 天
                          </span>
                        )}
                        {p.badge && (
                          <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 text-[11px] text-muted-foreground">
                            {p.badge}
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                            p.listed
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-foreground/[0.06] text-muted-foreground",
                          )}
                        >
                          {p.listed ? "在售" : "下架"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-brand">
                          <Tag className="size-2.5" />
                          {p.categoryName}
                        </span>
                        <span className="font-mono">/products/{p.slug}</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="size-2 rounded-full" style={{ background: THEME_DOT[p.theme] }} />
                          {THEME_LABEL[p.theme as ThemeName] ?? p.theme}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="grid size-7 shrink-0 place-items-center rounded-lg border border-foreground/10 text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                      title="编辑商品"
                    >
                      <Pencil className="size-3" />
                    </Link>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-foreground/[0.025] px-2 py-1.5">
                      <div className="text-[11px] text-muted-foreground">起售价</div>
                      <div className="mt-0.5 font-mono text-xs font-semibold">
                        {p.variants.length ? `¥${formatPrice(p.minPriceCents)}` : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-foreground/[0.025] px-2 py-1.5">
                      <div className="text-[11px] text-muted-foreground">规格</div>
                      <div className="mt-0.5 font-mono text-xs font-semibold">{p.variants.length}</div>
                    </div>
                    <div className="rounded-lg bg-foreground/[0.025] px-2 py-1.5">
                      <div className="text-[11px] text-muted-foreground">可售库存</div>
                      <div className="mt-0.5 font-mono text-xs font-semibold">{p.stock}</div>
                    </div>
                  </div>
                </div>
              </div>

              {p.variants.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.variants.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.07] bg-foreground/[0.02] px-2 py-1 text-[12px]"
                    >
                      <span className={cn("size-1.5 rounded-full", v.listed ? "bg-emerald-500" : "bg-foreground/25")} />
                      <span className="max-w-[140px] truncate">{v.name}</span>
                      <span className="font-mono text-muted-foreground">¥{formatPrice(v.priceCents)}</span>
                      <span className="font-mono text-muted-foreground">· {v.deliveryMode === "auto" ? `${v.stock}份` : "人工"}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-foreground/[0.05] pt-3">
                <div className="flex items-center gap-1">
                  <form action={toggleProductListedAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className={cn(
                        "inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition",
                        p.listed
                          ? "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
                          : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400",
                      )}
                    >
                      {p.listed ? "下架" : "上架"}
                    </button>
                  </form>
                  <form action={duplicateProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground"
                    >
                      <Copy className="size-3" />
                      复制
                    </button>
                  </form>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/products/${p.slug}`}
                    target="_blank"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    <ExternalLink className="size-3" />
                    查看
                  </Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmit
                      message={`确定删除「${p.name}」吗？\n\n商品、规格和未售出的库存都会被删除，此操作不可恢复。已有订单时无法删除。`}
                      dialogTitle="删除商品？"
                      confirmText="确认删除"
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="size-3" />
                      删除
                    </ConfirmSubmit>
                  </form>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition hover:bg-foreground/[0.05]"
                  >
                    编辑
                    <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination basePath="/admin/products" page={page} total={total} pageSize={list.pageSize} />
    </div>
  );
}
