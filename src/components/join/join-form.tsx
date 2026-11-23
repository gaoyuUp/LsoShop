"use client";
import { ArrowRight, Loader2, Mail, ShieldCheck, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Mode = "activate" | "login";

export function JoinForm({ initialInvite = "", initialMode = "activate" }: { initialInvite?: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [invite, setInvite] = useState(initialInvite);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function switchMode(next: Mode) {
    setMode(next);
    setSent(false);
    setCode("");
    setDevCode("");
    setError("");
  }

  function sendCode() {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/affiliate/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, email, invite }),
        });
        const result = (await res.json()) as { error?: string; devCode?: string };
        if (!res.ok || result.error) {
          setError(result.error || "验证码发送失败，请稍后重试");
          return;
        }
        setSent(true);
        setDevCode(result.devCode ?? "");
        toast.success(result.devCode ? "验证码已生成，请在后台测试验证码页面查看" : "验证码已发送，请检查邮箱");
      } catch {
        setError("网络异常，请稍后重试");
      }
    });
  }

  function verify() {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/affiliate/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, email, invite, code }),
        });
        const result = (await res.json()) as { error?: string; ok?: boolean };
        if (!res.ok || result.error) {
          setError(result.error || "验证失败，请稍后重试");
          return;
        }
        if (result.ok) {
          router.push("/");
          router.refresh();
        }
      } catch {
        setError("网络异常，请稍后重试");
      }
    });
  }

  return (
    <div className="glass-strong rounded-[30px] p-5 sm:p-7">
      <div className="flex items-center gap-1 rounded-full border border-foreground/[0.07] bg-foreground/[0.025] p-1">
        {[
          { value: "activate" as const, label: "开通账号" },
          { value: "login" as const, label: "代理登录" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => switchMode(tab.value)}
            className={cn(
              "h-9 flex-1 rounded-full text-xs font-medium transition",
              mode === tab.value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold tracking-tight">{mode === "activate" ? "开通代理账号" : "代理登录"}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          {mode === "activate"
            ? "管理员只提供邀请码；邮箱请填写代理本人的邮箱。测试阶段未开启邮件发送时，验证码由管理员在后台「测试验证码」页面查看。每个邀请码只能开通一个账号。"
            : "使用开通时的邮箱接收验证码，不需要密码。"}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {mode === "activate" && (
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-muted-foreground">邀请码</span>
            <div className="relative">
              <Ticket className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-foreground/10 bg-background/65 pl-10 pr-4 font-mono text-sm uppercase tracking-wider outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
              />
            </div>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-muted-foreground">邮箱地址</span>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="用于登录和接收验证码"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-foreground/10 bg-background/65 pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
            />
          </div>
        </label>

        {!sent ? (
          <button
            type="button"
            onClick={sendCode}
            disabled={pending || !email || (mode === "activate" && !invite)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {pending ? "发送中…" : "发送验证码"}
          </button>
        ) : (
          <>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-muted-foreground">邮箱验证码</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 位数字验证码"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="h-12 w-full rounded-xl border border-foreground/10 bg-background/65 px-4 text-center font-mono text-lg tracking-[0.35em] outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-transparent focus:ring-[1.5px] focus:ring-brand"
              />
            </label>
            {devCode && (
              <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
                本地调试验证码：<span className="font-mono font-semibold">{devCode}</span>（仅开发环境显示）
              </p>
            )}
            <button
              type="button"
              onClick={verify}
              disabled={pending || code.length !== 6}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {pending ? "验证中…" : mode === "activate" ? "验证并开通" : "登录推广后台"}
              {!pending && <ArrowRight className="size-4" />}
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={pending}
              className="w-full text-center text-[12px] text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
            >
              没收到？重新发送
            </button>
          </>
        )}

        {error && (
          <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="border-t border-foreground/[0.06] pt-4 text-center text-[12px] text-muted-foreground">
          {mode === "activate" ? (
            <>
              已有代理账号？{" "}
              <button type="button" onClick={() => switchMode("login")} className="font-medium text-foreground underline-offset-2 hover:underline">
                去登录
              </button>
            </>
          ) : (
            <>
              还没有代理账号？{" "}
              <button type="button" onClick={() => switchMode("activate")} className="font-medium text-foreground underline-offset-2 hover:underline">
                使用邀请码开通
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
