import { ORDER_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER_TONE: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
  paid: "bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400",
  delivered: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400",
  closed: "bg-foreground/[0.05] text-muted-foreground ring-foreground/10",
  refunded: "bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = ORDER_STATUS[status] ?? { label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[13px] font-medium ring-1 ring-inset",
        ORDER_TONE[status] ?? ORDER_TONE.closed,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

const EMAIL_TONE: Record<string, string> = {
  sent: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400",
  skipped: "bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400",
  failed: "bg-rose-500/10 text-rose-600 ring-rose-500/15 dark:text-rose-400",
  none: "bg-foreground/[0.05] text-muted-foreground ring-foreground/10",
  queued: "bg-sky-500/10 text-sky-600 ring-sky-500/15 dark:text-sky-400",
};

const EMAIL_LABEL: Record<string, string> = {
  sent: "已发送",
  skipped: "邮箱未启用",
  failed: "发送失败",
  none: "未发送",
  queued: "排队中",
};

export function EmailStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-medium ring-1 ring-inset",
        EMAIL_TONE[status] ?? EMAIL_TONE.none,
        className,
      )}
    >
      {EMAIL_LABEL[status] ?? status}
    </span>
  );
}

const INV_STATUS: Record<string, { label: string; className: string }> = {
  available: { label: "可售", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  locked: { label: "已锁定", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  sold: { label: "已售出", className: "bg-foreground/[0.05] text-muted-foreground" },
};

export function InventoryStatusBadge({ status }: { status: string }) {
  const meta = INV_STATUS[status] ?? INV_STATUS.available;
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[13px] font-medium", meta.className)}>{meta.label}</span>;
}
