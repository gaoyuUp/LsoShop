"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CircleUserRound,
  Copy,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { affiliateLogoutAction } from "@/lib/actions/affiliate-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/promote", label: "概览", icon: LayoutDashboard },
  { href: "/promote/orders", label: "订单", icon: Package },
  { href: "/promote/leaderboard", label: "排行榜", icon: BarChart3 },
  { href: "/promote/pricing", label: "客户价", icon: Percent },
  { href: "/promote/customers", label: "客户", icon: Users },
  { href: "/promote/withdrawals", label: "提现", icon: Wallet },
  { href: "/promote/contact", label: "联系方式", icon: CircleUserRound },
];

export function PromotionNav({ agent }: { agent: { code: string; email: string; nickname: string } }) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(agent.code);
    setCopied(true);
    toast.success("推广码已复制");
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-[22px] border border-black/[0.06] bg-white/70 p-2.5 backdrop-blur dark:border-white/[0.08] dark:bg-white/[0.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2">
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">推广中心</span>
          <span className="h-3 w-px bg-black/10 dark:bg-white/10" />
          <span className="font-mono">{agent.code}</span>
          <button type="button" onClick={copyCode} className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground">
            <Copy className="size-3" /> {copied ? "已复制" : "复制"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/r/${agent.code}`} target="_blank" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground">
            <Store className="size-3.5" /> 我的店铺
          </Link>
          <form action={affiliateLogoutAction}>
            <button type="submit" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-rose-500">
              <LogOut className="size-3.5" /> 退出
            </button>
          </form>
        </div>
      </div>
      <nav className="thin-scroll flex gap-1 overflow-x-auto">
        {NAV.map((item) => {
          const active = item.href === "/promote" ? pathname === "/promote" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] transition-colors",
                active ? "font-medium text-background" : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]",
              )}
            >
              {active && (
                <span aria-hidden className="absolute inset-0 -z-10 rounded-full bg-foreground shadow-sm" />
              )}
              <item.icon className="relative size-3.5" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
