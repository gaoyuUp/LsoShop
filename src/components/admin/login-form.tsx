"use client";
import { ArrowRight, Loader2, LockKeyhole, UserRound } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/lib/actions/auth";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">管理员账号</span>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="username"
            autoComplete="username"
            required
            placeholder="请输入账号"
            className="h-12 w-full rounded-xl border border-foreground/10 bg-background/70 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
          />
        </div>
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium">密码</span>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="请输入密码"
            className="h-12 w-full rounded-xl border border-foreground/10 bg-background/70 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
          />
        </div>
      </label>

      {state.error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-600 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <SubmitButton />
      <p className="pt-1 text-center text-[13px] leading-relaxed text-muted-foreground">
        仅限站长使用 · 登录状态保留 7 天
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          登录中…
        </>
      ) : (
        <>
          进入后台
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}
