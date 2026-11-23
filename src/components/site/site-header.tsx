"use client";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AgentAccountMenu } from "./agent-account-menu";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { SupportContacts } from "@/lib/support";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { Wordmark } from "./logo";
import { PixelThemeToggle } from "./pixel-theme-toggle";
import { SupportMenu } from "./support-menu";

export function SiteHeader({
  support,
  agent,
}: {
  support: SupportContacts;
  agent?: { code: string; email: string; nickname: string } | null;
}) {
  const t = useT();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));

  const links = [
    { href: "/", label: t.nav.products, active: pathname === "/" || pathname.startsWith("/products/") },
    { href: "/orders", label: t.nav.orders, active: pathname.startsWith("/orders") || pathname.startsWith("/order/") },
  ];

  return (
    <>
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-2xl px-2.5 transition-all duration-500 sm:px-4",
          scrolled ? "glass-strong" : "border border-transparent",
        )}
      >
        <Link href="/" className="rounded-xl outline-offset-4">
          <Wordmark />
        </Link>

        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden items-center gap-0.5 md:flex md:gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative whitespace-nowrap rounded-full px-2 py-1.5 text-sm transition-colors sm:px-3.5",
                  l.active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-foreground/[0.07]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                {l.label}
              </Link>
            ))}
            {agent && (
              <Link
                href="/promote"
                title="进入推广中心"
                className="ml-1 hidden h-8 items-center gap-1 rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 text-[12px] font-medium text-brand transition hover:bg-brand/10 md:inline-flex"
              >
                <Sparkles className="size-3.5" />
                推广
              </Link>
            )}
          </div>
          <SupportMenu support={support} />
          <span className="mx-1 h-5 w-px bg-border" />
          <PixelThemeToggle />
          {agent && <AgentAccountMenu agent={agent} className="ml-1 hidden md:inline-flex" />}
          {agent && <AgentAccountMenu agent={agent} iconOnly className="ml-0.5 md:hidden" />}
        </nav>
      </div>

    </header>
    <MobileBottomNav showPromote={Boolean(agent)} />
    </>
  );
}
