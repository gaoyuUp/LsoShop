"use client";
import { ClipboardList, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { SubmitButton } from "@/components/admin/submit-button";
import { addInventoryAction } from "@/lib/actions/inventory";
import { cn } from "@/lib/utils";

type Option = {
  id: number;
  name: string;
  productName: string;
  deliveryMode: string;
};

const SAMPLE = `【示例 · 交付内容可自由填写】
账号：demo@outlook.com
密码：Demo#2024
接码链接：https://example.com/code/xxxx
---
第二份内容从这里开始
账号：demo2@outlook.com
密码：Demo#2025`;

export function InventoryImport({
  options,
  defaultVariantId,
}: {
  options: Option[];
  defaultVariantId?: number;
}) {
  const [variantId, setVariantId] = useState(defaultVariantId ? String(defaultVariantId) : String(options[0]?.id ?? ""));
  const [entries, setEntries] = useState("");
  const count = entries
    .split(/\n\s*-{3,}\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const selected = options.find((o) => String(o.id) === variantId);

  return (
    <section className="rounded-2xl border border-foreground/[0.07] bg-background/70 p-4 backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand">
              <ClipboardList className="size-4" />
            </span>
            批量导入交付内容
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            每份交付内容之间用单独一行 <code className="rounded bg-foreground/[0.06] px-1 font-mono">---</code> 分隔；一份内容可以有多行，支持账号密码、卡密、链接等任意文本。
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[12px] text-muted-foreground">
          <Sparkles className="size-3" />
          单次最多 500 份
        </span>
      </div>

      <form action={addInventoryAction} className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted-foreground">导入到规格</span>
            <select
              name="variantId"
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="h-9 w-full rounded-lg border border-foreground/10 bg-background px-2.5 text-xs outline-none transition focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.productName} · {o.name}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <div className="rounded-xl border border-foreground/[0.07] bg-foreground/[0.02] p-3">
              <div className="text-[12px] text-muted-foreground">当前规格交付方式</div>
              <div className="mt-1 text-xs font-medium">
                {selected.deliveryMode === "auto" ? "自动发货 · 付款后从库存取一份" : "人工发货 · 导入的库存仅作参考"}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setEntries(SAMPLE)}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-foreground/15 text-[13px] text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
          >
            <Wand2 className="size-3.5" />
            填入示例内容
          </button>
          <div className="rounded-xl bg-foreground/[0.02] p-3 text-[12px] leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground/70">小提示</p>
            <p className="mt-1">导入后的内容会在付款成功时自动发给买家，并同步发送到买家邮箱。</p>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted-foreground">交付内容</span>
            <span className={cn("rounded-full px-2 py-0.5 font-mono text-[12px]", count > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-foreground/[0.04] text-muted-foreground")}>
              {count} 份
            </span>
          </div>
          <textarea
            name="entries"
            value={entries}
            onChange={(e) => setEntries(e.target.value)}
            rows={9}
            required
            placeholder={`账号：xxx@outlook.com\n密码：xxxxxx\n接码链接：https://...\n---\n下一份交付内容...`}
            className="mt-1.5 min-h-[180px] w-full flex-1 resize-y rounded-xl border border-foreground/10 bg-background p-3 font-mono text-[13px] leading-relaxed outline-none transition placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted-foreground">
              {count === 0 ? "尚未检测到交付内容" : `将新增 ${count} 份库存`}
            </span>
            <SubmitButton pendingText="导入中…">
              {count > 0 ? `导入 ${count} 份` : "导入库存"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </section>
  );
}
