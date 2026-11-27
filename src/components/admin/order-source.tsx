import Link from "next/link";
import { cn } from "@/lib/utils";

function sourceLabel(orderType: string) {
  if (orderType === "affiliate") return "代理推广";
  if (orderType === "self") return "代理自购";
  return "主站订单";
}

export function OrderSourceInfo({
  orderType,
  affiliateId,
  affiliateName,
  affiliateCode,
  priceCodeValue,
  src,
  showAgent = true,
  className,
}: {
  orderType: string;
  affiliateId?: number | null;
  affiliateName?: string | null;
  affiliateCode?: string;
  priceCodeValue?: string;
  src?: string;
  showAgent?: boolean;
  className?: string;
}) {
  const isAgent = orderType === "affiliate" || orderType === "self";
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5 text-[10px]", className)}>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 font-medium",
          orderType === "affiliate"
            ? "bg-brand/10 text-brand"
            : orderType === "self"
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "bg-foreground/[0.05] text-muted-foreground",
        )}
      >
        {sourceLabel(orderType)}
      </span>
      {showAgent && isAgent && affiliateId && (
        <Link
          href={`/admin/agents/${affiliateId}/orders`}
          className="max-w-[170px] truncate rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-foreground transition hover:bg-foreground/[0.08] hover:underline"
        >
          {affiliateName || affiliateCode || `代理 #${affiliateId}`}
        </Link>
      )}
      {showAgent && isAgent && affiliateCode && (
        <span className="rounded-full bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-muted-foreground">{affiliateCode}</span>
      )}
      {isAgent && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5",
            priceCodeValue ? "bg-sky-500/10 text-sky-600 dark:text-sky-400" : "bg-foreground/[0.04] text-muted-foreground",
          )}
        >
          {priceCodeValue ? `价位码 ${priceCodeValue}` : "主链接"}
        </span>
      )}
      {src && <span className="rounded-full bg-foreground/[0.04] px-1.5 py-0.5 text-muted-foreground">src {src}</span>}
    </div>
  );
}
