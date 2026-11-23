"use client";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="glass w-full max-w-md rounded-2xl p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
          <AlertTriangle className="size-5" />
        </span>
        <h2 className="mt-4 text-base font-semibold">后台加载失败</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          可能是数据库连接中断或数据异常。请稍后重试，若持续出现请查看服务端日志。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition hover:opacity-90"
        >
          <RotateCcw className="size-3.5" />
          重新加载
        </button>
      </div>
    </div>
  );
}
