"use client";
import { usePathname } from "next/navigation";

/** 推广中心页面切换：保留导航，只让内容区做一次轻量入场 */
export function PromotePageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="promote-page-in">
      {children}
    </div>
  );
}
