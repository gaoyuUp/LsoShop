"use client";
import { useMemo, useState } from "react";
import type { PublicProduct } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  const categories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; count: number; sort: number }>();
    for (const p of products) {
      const current = map.get(p.categoryId);
      if (current) current.count += 1;
      else map.set(p.categoryId, { id: p.categoryId, name: p.categoryName, count: 1, sort: p.categorySort });
    }
    return [...map.values()].sort((a, b) => a.sort - b.sort || a.id - b.id);
  }, [products]);

  const [active, setActive] = useState<number | "all">("all");
  const visible = active === "all" ? products : products.filter((p) => p.categoryId === active);

  return (
    <>
      {categories.length > 1 && (
        <div className="thin-scroll mb-5 flex items-center gap-1.5 overflow-x-auto px-2 pb-1">
          <FilterPill active={active === "all"} onClick={() => setActive("all")} label="全部" count={products.length} />
          {categories.map((c) => (
            <FilterPill key={c.id} active={active === c.id} onClick={() => setActive(c.id)} label={c.name} count={c.count} />
          ))}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      {visible.length === 0 && (
        <div className="glass rounded-3xl py-16 text-center text-sm text-muted-foreground">该分类暂无在售商品</div>
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-foreground/[0.09] bg-background/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1 py-0.5 font-mono text-[10px]",
          active ? "bg-background/15 text-background/75" : "bg-foreground/[0.05] text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
