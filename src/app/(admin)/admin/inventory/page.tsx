import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  Filter,
  LockKeyhole,
  PackageSearch,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { InventoryStatusBadge } from "@/components/admin/badges";
import { InventoryImport } from "@/components/admin/inventory-import";
import { clearAvailableInventoryAction, deleteInventoryAction } from "@/lib/actions/inventory";
import { getInventorySummary, getVariantStock, listInventory, listVariantOptions } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "库存管理" };

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "available", label: "可售" },
  { value: "locked", label: "已锁定" },
  { value: "sold", label: "已售出" },
];

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await connection();
  const sp = await searchParams;
  const variantIdRaw = typeof sp.variantId === "string" ? sp.variantId : "";
  const variantId = variantIdRaw ? Number(variantIdRaw) || undefined : undefined;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);

  const [options, list, summary] = await Promise.all([
    listVariantOptions(),
    listInventory({ variantId, status, page }),
    getInventorySummary(variantId),
  ]);
  const selected = variantId ? options.find((o) => o.id === variantId) : undefined;
  const variantStock = variantId ? await getVariantStock(variantId) : null;

  const added = typeof sp.added === "string" ? sp.added : "";
  const deleted = sp.deleted === "1";
  const cleared = typeof sp.cleared === "string" ? sp.cleared : "";
  const error = typeof sp.error === "string" ? sp.error : "";

  const qs = (p: number) => {
    const q = new URLSearchParams();
    if (variantId) q.set("variantId", String(variantId));
    if (status !== "all") q.set("status", status);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `/admin/inventory${s ? `?${s}` : ""}`;
  };

  const cards = [
    { label: "可售库存", value: summary.available, icon: CheckCircle2, tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { label: "订单锁定", value: summary.locked, icon: LockKeyhole, tone: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
    { label: "已售出", value: summary.sold, icon: ShoppingBag, tone: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
    { label: "合计", value: summary.total, icon: Boxes, tone: "text-muted-foreground bg-foreground/[0.05]" },
  ];

  return (
    <div className="space-y-4">
      {added && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          成功导入 {added} 份库存
        </div>
      )}
      {deleted && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          库存已删除
        </div>
      )}
      {cleared && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
          已清空 {cleared} 份可售库存
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.07] px-4 py-3 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-xl border border-foreground/[0.07] bg-background/70 p-3.5 backdrop-blur">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", c.tone)}>
              <c.icon className="size-4" />
            </span>
            <div>
              <div className="text-[12px] text-muted-foreground">{c.label}</div>
              <div className="font-mono text-lg font-semibold leading-tight">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <InventoryImport options={options} defaultVariantId={variantId} />

      <section className="overflow-hidden rounded-2xl border border-foreground/[0.07] bg-background/70 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/[0.06] px-4 py-3.5 sm:px-5">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <PackageSearch className="size-4" />
              库存明细
              {selected && (
                <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[12px] font-normal text-muted-foreground">
                  {selected.productName} · {selected.name}
                </span>
              )}
            </h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {variantStock
                ? `当前规格：可售 ${variantStock.available} · 锁定 ${variantStock.locked} · 已售 ${variantStock.sold}`
                : "查看全部规格的库存状态"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {variantId && summary.available > 0 && (
              <form action={clearAvailableInventoryAction}>
                <input type="hidden" name="variantId" value={variantId} />
                <ConfirmSubmit
                  message={`确定清空该规格下全部 ${summary.available} 份「可售」库存吗？\n\n已锁定和已售出的库存不会被删除。`}
                  dialogTitle="清空可售库存？"
                  confirmText="确认清空"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-500/15 px-2.5 text-[12px] text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                >
                  <Trash2 className="size-3" />
                  清空可售
                </ConfirmSubmit>
              </form>
            )}
            <form method="get" className="flex items-center gap-1.5">
              <div className="hidden items-center gap-1.5 rounded-lg border border-foreground/10 px-2 sm:flex">
                <Filter className="size-3 text-muted-foreground" />
                <select
                  name="status"
                  defaultValue={status}
                  className="h-7 appearance-none bg-transparent text-[12px] outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <select
                name="variantId"
                defaultValue={variantId ?? ""}
                className="h-8 max-w-[180px] rounded-lg border border-foreground/10 bg-background px-2 text-[12px] outline-none"
              >
                <option value="">全部规格</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.productName} · {o.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-2.5 text-[12px] font-medium text-background"
              >
                筛选
              </button>
            </form>
          </div>
        </div>

        {list.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.04] text-muted-foreground">
              <Boxes className="size-5" />
            </span>
            <p className="mt-3 text-xs font-medium">{variantId ? "该规格还没有库存" : "没有匹配的库存记录"}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {variantId ? "使用上方「批量导入」添加交付内容，导入后即可自动发货" : "调整筛选条件，或选择规格后导入库存"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead>
                <tr className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium sm:px-5">ID</th>
                  <th className="px-3 py-2.5 font-medium">交付内容</th>
                  <th className="px-3 py-2.5 font-medium">规格</th>
                  <th className="px-3 py-2.5 font-medium">状态</th>
                  <th className="px-3 py-2.5 font-medium">时间</th>
                  <th className="px-3 py-2.5 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <tr key={row.id} className="border-t border-foreground/[0.04] align-top transition hover:bg-foreground/[0.015]">
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground sm:px-5">#{row.id}</td>
                    <td className="max-w-[360px] px-3 py-3">
                      <details className="group">
                        <summary className="line-clamp-1 cursor-pointer list-none font-mono text-[13px] text-foreground/80 transition group-open:mb-2 group-open:text-foreground">
                          {row.content}
                        </summary>
                        <pre className="thin-scroll max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-foreground/[0.07] bg-foreground/[0.02] p-2.5 font-mono text-[12px] leading-relaxed text-foreground/80">
                          {row.content}
                        </pre>
                      </details>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[160px] truncate text-[13px]">{row.productName}</div>
                      <div className="mt-0.5 max-w-[160px] truncate text-[12px] text-muted-foreground">{row.variantName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <InventoryStatusBadge status={row.status} />
                    </td>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Clock3 className="size-2.5" />
                        {formatDateTime(row.createdAt)}
                      </div>
                      {row.soldAt && <div className="mt-0.5">售出 {formatDateTime(row.soldAt)}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.orderId && (
                          <Link
                            href={`/admin/orders/${row.orderId}`}
                            className="inline-flex h-6 items-center gap-1 rounded-md border border-foreground/10 px-1.5 text-[12px] text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                          >
                            订单
                            <ArrowRight className="size-2.5" />
                          </Link>
                        )}
                        {row.status === "available" && (
                          <form action={deleteInventoryAction}>
                            <input type="hidden" name="id" value={row.id} />
                            <ConfirmSubmit
                              message="确定删除这份可售库存吗？"
                              dialogTitle="删除库存？"
                              confirmText="删除"
                              className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                            >
                              <Trash2 className="size-3" />
                            </ConfirmSubmit>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {list.pages > 1 && (
          <div className="flex items-center justify-between border-t border-foreground/[0.06] px-4 py-3 text-[12px] text-muted-foreground sm:px-5">
            <span>
              共 {list.total} 条 · 第 {list.page} / {list.pages} 页
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href={qs(Math.max(1, list.page - 1))}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page <= 1 && "pointer-events-none opacity-40",
                )}
              >
                <ArrowLeft className="size-3" />
                上一页
              </Link>
              <Link
                href={qs(Math.min(list.pages, list.page + 1))}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border border-foreground/10 px-2 transition hover:border-foreground/25",
                  list.page >= list.pages && "pointer-events-none opacity-40",
                )}
              >
                下一页
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
