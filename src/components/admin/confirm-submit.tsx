"use client";
import { useRef } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export function ConfirmSubmit({
  message,
  children,
  className,
  title,
  dialogTitle = "请确认操作",
  confirmText = "确认",
  tone = "danger",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  dialogTitle?: string;
  confirmText?: string;
  tone?: "danger" | "success";
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const success = tone === "success";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button ref={triggerRef} type="button" title={title} className={className}>
          {children}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[420px] gap-0 overflow-hidden rounded-[24px] p-5">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-2xl",
              success ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {success ? <CheckCircle2 className="size-5" /> : <AlertTriangle className="size-5" />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <AlertDialogTitle className="text-[17px] font-semibold tracking-tight">{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription className="mt-1.5 max-h-[38vh] overflow-auto whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
              {message}
            </AlertDialogDescription>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel className="h-9 rounded-xl px-4 text-xs">取消</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "h-9 rounded-xl px-4 text-xs font-medium text-white",
              success ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500",
            )}
            onClick={() => triggerRef.current?.form?.requestSubmit()}
          >
            {confirmText}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
