"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Megaphone, ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "全部商品", icon: LayoutGrid, match: (p: string) => p === "/" || p.startsWith("/products/") || p.startsWith("/r/") },
  { href: "/orders", label: "我的订单", icon: ReceiptText, match: (p: string) => p === "/orders" || p.startsWith("/order/") },
  { href: "/promote", label: "推广中心", icon: Megaphone, match: (p: string) => p.startsWith("/promote") },
];

export function MobileBottomNav({ showPromote = false }: { showPromote?: boolean }) {
  const pathname = usePathname();
  const items = showPromote ? NAV : NAV.slice(0, 2);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-[338px] items-center gap-0.5 rounded-[22px] border border-black/[0.07] bg-white/75 p-1 shadow-[0_12px_36px_-22px_rgba(30,20,80,0.5)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[#15101f]/85">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-10 min-w-0 flex-1 flex-col items-center justify-center gap-0 rounded-[17px] text-[10px] transition-colors",
                active ? "font-medium text-brand" : "text-muted-foreground",
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[17px] bg-brand/[0.1] ring-1 ring-brand/10 dark:bg-brand/[0.16]"
                />
              )}
              <Icon className={cn("size-4", active ? "text-brand" : "text-muted-foreground/75")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
