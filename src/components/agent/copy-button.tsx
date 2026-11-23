"use client";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ value, label = "复制", className }: { value: string; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        toast.success("已复制");
      }}
      className={className ?? "inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"}
    >
      <Copy className="size-3" />
      {label}
    </button>
  );
}
