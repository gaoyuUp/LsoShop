import Link from "next/link";
import { Boxes, ChevronDown, Layers, PackagePlus, Plus, Sparkles } from "lucide-react";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  createVariantAction,
  deleteVariantAction,
  toggleVariantListedAction,
  updateVariantAction,
} from "@/lib/actions/variants";
import type { AdminVariant } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

const input =
  "h-8 w-full rounded-lg border border-foreground/10 bg-background px-2.5 text-xs outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand";
const select =
  "h-8 w-full appearance-none rounded-lg border border-foreground/10 bg-background px-2.5 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand";

export function VariantsEditor({
  productId,
  variants,
}: {
  productId: number;
  variants: AdminVariant[];
}) {
  const nextSort = variants.length ? Math.max(...variants.map((v) => v.sort)) + 10 : 10;

  return (
    <section id="variants" className="scroll-mt-24 rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Layers className="size-4 text-brand" />
            规格与价格
            <span className="rounded-full bg-foreground/[0.05] px-2 py-0.5 font-mono text-[12px] text-muted-foreground">
              {variants.length}
            </span>
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            每个规格独立定价、独立库存。自动发货的规格需要有可售库存。
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span>可售 {variants.reduce((s, v) => s + v.stock, 0)}</span>
          <span>已售 {variants.reduce((s, v) => s + v.sold, 0)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {variants.length === 0 && (
          <div className="rounded-xl border border-dashed border-amber-500/25 bg-amber-500/[0.05] px-4 py-3 text-[13px] text-amber-700 dark:text-amber-300">
            还没有规格，商品暂时无法购买。请在下方添加第一个规格。
          </div>
        )}

        {variants.map((v, i) => (
          <article key={v.id} className="overflow-hidden rounded-xl border border-foreground/[0.08] bg-background">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/[0.06] bg-foreground/[0.015] px-3.5 py-2.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="grid size-5 place-items-center rounded-md bg-foreground font-mono text-[11px] text-background">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 className="truncate text-xs font-semibold">{v.name || "未命名规格"}</h4>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                    v.listed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-foreground/[0.06] text-muted-foreground",
                  )}
                >
                  {v.listed ? "可购买" : "已停用"}
                </span>
                <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {v.deliveryMode === "auto" ? "自动发货" : "人工发货"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px]">
                <span className={cn("font-mono", v.stock === 0 && v.deliveryMode === "auto" ? "text-rose-500" : "text-muted-foreground")}>
                  库存 {v.deliveryMode === "auto" ? v.stock : "不限"}
                </span>
                <Link
                  href={`/admin/inventory?variantId=${v.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-foreground/10 px-2 py-1 text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                >
                  <Boxes className="size-3" />
                  管理库存
                </Link>
                <form action={toggleVariantListedAction}>
                  <input type="hidden" name="id" value={v.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-md px-2 py-1 text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground"
                  >
                    {v.listed ? "停用" : "启用"}
                  </button>
                </form>
              </div>
            </div>

            <form action={updateVariantAction} className="p-3.5">
              <input type="hidden" name="id" value={v.id} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">规格名称</span>
                  <input name="name" defaultValue={v.name} required maxLength={120} className={input} placeholder="例如：精品 10 亿账号" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">规格说明</span>
                  <input name="description" defaultValue={v.description} maxLength={255} className={input} placeholder="1 个账号 · 10 亿额度" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">售价（元）</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">¥</span>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={(v.priceCents / 100).toFixed(2)}
                      className={cn(input, "pl-6 font-mono")}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">划线原价（元）</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">¥</span>
                    <input
                      name="originalPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={v.originalPriceCents ? (v.originalPriceCents / 100).toFixed(2) : ""}
                      placeholder="选填"
                      className={cn(input, "pl-6 font-mono")}
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">每单最少</span>
                  <input name="minQuantity" type="number" min="1" max="999" defaultValue={v.minQuantity} className={cn(input, "font-mono")} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">每单最多</span>
                  <input name="maxQuantity" type="number" min="1" max="999" defaultValue={v.maxQuantity} className={cn(input, "font-mono")} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">代理成本价（元）</span>
                  <input name="affiliateCost" type="number" step="0.01" min="0" defaultValue={v.affiliateCostCents ? (v.affiliateCostCents / 100).toFixed(2) : ""} placeholder="0 = 系统售价" className={cn(input, "font-mono")} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">交付方式</span>
                  <select name="deliveryMode" defaultValue={v.deliveryMode} className={select}>
                    <option value="auto">自动发货（库存）</option>
                    <option value="manual">人工发货</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-medium text-muted-foreground">排序</span>
                  <input name="sort" type="number" defaultValue={v.sort} className={cn(input, "font-mono")} />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                    <input type="checkbox" name="listed" value="1" defaultChecked={v.listed} className="size-3.5 accent-emerald-500" />
                    前台可购买
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                    <input type="checkbox" name="affiliateEnabled" value="1" defaultChecked={v.affiliateEnabled} className="size-3.5 accent-brand" />
                    参与代理销售
                  </label>
                </div>
                <SubmitButton pendingText="保存中…">保存规格</SubmitButton>
              </div>
            </form>

            <div className="flex items-center justify-between border-t border-foreground/[0.05] px-3.5 py-2">
              <span className="text-[11px] text-muted-foreground">
                {v.deliveryMode === "auto" ? "付款后自动从库存取一份交付" : "付款后需在订单详情手动填写交付内容"}
              </span>
              <form action={deleteVariantAction}>
                <input type="hidden" name="id" value={v.id} />
                <ConfirmSubmit
                  message={`确定删除规格「${v.name}」吗？\n\n该规格下未售出的库存会一并删除，历史订单不受影响。`}
                  dialogTitle="删除规格？"
                  confirmText="确认删除"
                  className="rounded-md px-2 py-1 text-[12px] text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
                >
                  删除规格
                </ConfirmSubmit>
              </form>
            </div>
          </article>
        ))}
      </div>

      {/* 新增规格 */}
      <details className="group mt-4 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.015]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3 text-xs font-medium transition hover:text-brand">
          <span className="inline-flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-foreground/[0.05]">
              <Plus className="size-3.5" />
            </span>
            添加新规格
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-foreground/[0.06] p-3.5">
          <form action={createVariantAction}>
            <input type="hidden" name="productId" value={productId} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">规格名称</span>
                <input name="name" required maxLength={120} className={input} placeholder="例如：Plus 成品号 · 日区" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">规格说明</span>
                <input name="description" maxLength={255} className={input} placeholder="1 个账号 · 28 天质保" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">售价（元）</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">¥</span>
                  <input name="price" type="number" step="0.01" min="0" required placeholder="0.00" className={cn(input, "pl-6 font-mono")} />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">划线原价（元）</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">¥</span>
                  <input name="originalPrice" type="number" step="0.01" min="0" placeholder="选填" className={cn(input, "pl-6 font-mono")} />
                </div>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">每单最少</span>
                <input name="minQuantity" type="number" min="1" max="999" defaultValue={1} className={cn(input, "font-mono")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">每单最多</span>
                <input name="maxQuantity" type="number" min="1" max="999" defaultValue={10} className={cn(input, "font-mono")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">代理成本价（元）</span>
                <input name="affiliateCost" type="number" step="0.01" min="0" placeholder="0 = 系统售价" className={cn(input, "font-mono")} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">交付方式</span>
                <select name="deliveryMode" defaultValue="auto" className={select}>
                  <option value="auto">自动发货（库存）</option>
                  <option value="manual">人工发货</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-muted-foreground">排序</span>
                <input name="sort" type="number" defaultValue={nextSort} className={cn(input, "font-mono")} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                  <input type="checkbox" name="listed" value="1" defaultChecked className="size-3.5 accent-emerald-500" />
                  创建后立即上架
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                  <input type="checkbox" name="affiliateEnabled" value="1" defaultChecked className="size-3.5 accent-brand" />
                  参与代理销售
                </label>
              </div>
              <SubmitButton pendingText="添加中…">
                <PackagePlus className="mr-1 size-3.5" />
                添加规格
              </SubmitButton>
            </div>
          </form>
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Sparkles className="size-3" />
            提示：自动发货规格添加后，记得去库存页导入交付内容，否则会显示售罄。
          </p>
        </div>
      </details>
    </section>
  );
}
