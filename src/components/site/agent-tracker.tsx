"use client";
import { useEffect, useRef } from "react";

/**
 * 代理店铺访问埋点，挂在 /r/[code] layout 上：
 * - 主店铺、商品详情等所有代理页都会计数
 * - pc / src 从当前 URL 读取
 * - ref 防止 React StrictMode 下 effect 重复触发写入两条
 */
export function AgentTracker({ code }: { code: string }) {
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const priceCode = params.get("pc") ?? "";
    const src = params.get("src") ?? "";
    const key = `${code}|${priceCode}|${src}`;
    if (tracked.current === key) return;
    tracked.current = key;

    let visitor = sessionStorage.getItem("lso:visitor");
    if (!visitor) {
      visitor = Math.random().toString(36).slice(2, 18);
      sessionStorage.setItem("lso:visitor", visitor);
    }
    fetch("/api/agent/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, priceCode, src, visitor }),
    }).catch(() => {});
  }, [code]);

  return null;
}
