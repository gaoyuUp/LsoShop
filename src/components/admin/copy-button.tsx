"use client";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

export function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(text);
        if (!ok) return toast.error("复制失败，请手动选择文本");
        setCopied(true);
        toast.success("已复制");
        setTimeout(() => setCopied(false), 1600);
      }}
      title="复制"
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground",
        className,
      )}
    >
      {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      {label && <span>{copied ? "已复制" : label}</span>}
    </button>
  );
}
