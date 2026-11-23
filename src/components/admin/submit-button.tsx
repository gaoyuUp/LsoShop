"use client";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText = "保存中…",
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "primary" | "outline" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-medium transition active:scale-[0.99] disabled:opacity-50",
        variant === "primary" && "bg-foreground text-background hover:opacity-90",
        variant === "outline" && "border border-foreground/10 bg-background hover:border-foreground/25",
        variant === "danger" && "bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-400",
        className,
      )}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      {pending ? pendingText : children}
    </button>
  );
}
