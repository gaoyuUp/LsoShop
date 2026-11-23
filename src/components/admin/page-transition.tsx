"use client";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * 后台路由切换动效：
 * 只做 opacity / transform，不阻塞导航，也不等待接口返回。
 * key=pathname 让新页面挂载时重播一次轻量入场。
 */
export function AdminPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  return (
    <div key={key} className="admin-page-in">
      {children}
    </div>
  );
}
