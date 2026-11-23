import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  basePath,
  page,
  total,
  pageSize,
  param = "page",
  query = {},
  className,
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
  param?: string;
  query?: Record<string, string | undefined>;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const current = Math.max(1, Math.min(pages, page));
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    if (p > 1) params.set(param, String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 border-t border-foreground/[0.06] px-1 pt-3 text-[11px] text-muted-foreground", className)}>
      <span>共 {total} 条 · 第 {current} / {pages} 页</span>
      <div className="flex items-center gap-1.5">
        <Link
          href={href(Math.max(1, current - 1))}
          aria-disabled={current <= 1}
          className={cn("inline-flex h-7 items-center gap-0.5 rounded-lg border border-foreground/10 px-2 transition hover:border-foreground/25 hover:text-foreground", current <= 1 && "pointer-events-none opacity-35")}
        >
          <ChevronLeft className="size-3" /> 上一页
        </Link>
        <Link
          href={href(Math.min(pages, current + 1))}
          aria-disabled={current >= pages}
          className={cn("inline-flex h-7 items-center gap-0.5 rounded-lg border border-foreground/10 px-2 transition hover:border-foreground/25 hover:text-foreground", current >= pages && "pointer-events-none opacity-35")}
        >
          下一页 <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
