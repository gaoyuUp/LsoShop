"use client";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, ChevronDown, LogOut, Store } from "lucide-react";
import { affiliateLogoutAction } from "@/lib/actions/affiliate-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Agent = { code: string; email: string; nickname: string };

/** 代理固定标识：不使用用户首字母，统一展示代理认证徽标 */
function AgentBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-label="代理账号"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_3px_10px_-4px_var(--brand)] ring-1 ring-white/20",
        size === "sm" ? "size-7" : "size-9",
      )}
    >
      <BadgeCheck className={size === "sm" ? "size-4" : "size-5"} strokeWidth={2.2} />
    </span>
  );
}

export function AgentAccountMenu({
  agent,
  className,
  compact = false,
  iconOnly = false,
}: {
  agent: Agent;
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const name = agent.nickname || agent.email.split("@")[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`${agent.email} · 代理账号`}
          aria-label="代理账号"
          className={cn(
            iconOnly
              ? "inline-flex size-9 items-center justify-center rounded-full border border-foreground/[0.08] bg-foreground/[0.025] p-0 transition hover:border-foreground/20 hover:bg-foreground/[0.05]"
              : "inline-flex h-8 items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-foreground/[0.025] py-0.5 pl-0.5 pr-2.5 text-left transition hover:border-foreground/20 hover:bg-foreground/[0.05]",
            className,
          )}
        >
          <AgentBadge />
          {!iconOnly && <span className="max-w-[88px] truncate text-[11px] font-medium text-foreground/85">{name}</span>}
          {!iconOnly && !compact && <span className="size-1 rounded-full bg-emerald-500" />}
          {!iconOnly && <ChevronDown className="size-3 text-muted-foreground" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[260px] rounded-2xl p-3.5 sm:w-[288px] sm:p-4">
        <div className="flex items-center gap-2.5">
          <AgentBadge size="md" />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{name}</div>
            <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{agent.email}</div>
          </div>
        </div>
        <div className="mt-2.5 rounded-xl border border-brand/15 bg-brand/[0.05] px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground sm:mt-3 sm:px-3 sm:py-2.5 sm:text-[11px]">
          报价和下单按代理价；没有设置代理价的商品按原价。
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-foreground/[0.06] pt-2.5 sm:mt-3 sm:pt-3">
          <Link href="/promote" className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline">
            推广中心 <ArrowUpRight className="size-3" />
          </Link>
          <Link href={`/r/${agent.code}`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <Store className="size-3" /> 我的店铺
          </Link>
        </div>
        <form action={affiliateLogoutAction} className="mt-1.5 border-t border-foreground/[0.06] pt-1.5 sm:mt-2 sm:pt-2">
          <button type="submit" className="inline-flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-[11px] text-muted-foreground transition hover:text-rose-500">
            <LogOut className="size-3.5" />
            退出登录
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
