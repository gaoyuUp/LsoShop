"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 打开弹窗后从后台接口加载登录记录属于外部数据同步 */

import { History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/admin/copy-button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type LoginLog = {
  id: number;
  email: string;
  ip: string;
  countryCode: string;
  countryName: string;
  region: string;
  city: string;
  isp: string;
  userAgent: string;
  method: string;
  createdAt: string;
};

type LogsResponse = {
  rows: LoginLog[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

const dateFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function deviceSummary(ua: string) {
  if (!ua) return "—";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /iPhone|iPad|iPod/i.test(ua)
      ? "iOS"
      : /Mac OS X/i.test(ua)
        ? "macOS"
        : /Android/i.test(ua)
          ? "Android"
          : /Linux/i.test(ua)
            ? "Linux"
            : "";
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome\//i.test(ua)
      ? "Chrome"
      : /Firefox\//i.test(ua)
        ? "Firefox"
        : /Safari\//i.test(ua)
          ? "Safari"
          : "";
  return [os, browser].filter(Boolean).join(" · ") || "未知设备";
}

export function AgentLoginLogsDialog({
  affiliateId,
  affiliateName,
  label = "登录记录",
  className,
}: {
  affiliateId: number;
  affiliateName: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/admin/agents/${affiliateId}/login-logs?page=${page}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || "加载失败");
        setData(json as LogsResponse);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [affiliateId, open, page]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPage(1);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground", className)}
        >
          <History className="size-3" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] sm:max-w-4xl">
        <div className="pr-8">
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4 text-brand" />
            代理登录记录
          </DialogTitle>
          <DialogDescription>
            {affiliateName}
            {data ? ` · 共 ${data.total} 条` : ""}，记录登录时间、IP、国家地区和设备信息。
          </DialogDescription>
        </div>

        <div className="overflow-x-auto rounded-xl border border-foreground/[0.07]">
          <table className="w-full min-w-[760px] text-left text-[12px]">
            <thead className="bg-foreground/[0.025] text-[11px] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">时间</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">国家 / 地区</th>
                <th className="px-3 py-2 font-medium">城市 / ISP</th>
                <th className="px-3 py-2 font-medium">设备</th>
                <th className="px-3 py-2 font-medium">方式</th>
              </tr>
            </thead>
            <tbody>
              {!data && loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                    <span className="mt-2 block text-[11px]">正在加载登录记录…</span>
                  </td>
                </tr>
              )}
              {!data && !loading && error && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              )}
              {data && data.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                    暂无登录记录
                  </td>
                </tr>
              )}
              {data?.rows.map((row) => (
                <tr key={row.id} className="border-t border-foreground/[0.05] align-top">
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{dateFmt.format(new Date(row.createdAt))}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span>{row.ip || "—"}</span>
                      {row.ip && row.ip !== "未知" && <CopyButton text={row.ip} />}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{row.countryName || row.countryCode || "未知"}</div>
                    {row.countryCode && row.countryCode !== row.countryName && (
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{row.countryCode}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div>{[row.region, row.city].filter(Boolean).join(" · ") || "—"}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{row.isp || "—"}</div>
                  </td>
                  <td className="max-w-[180px] px-3 py-2.5">
                    <div title={row.userAgent}>{deviceSummary(row.userAgent)}</div>
                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground" title={row.userAgent}>
                      {row.userAgent || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        row.method === "activate"
                          ? "bg-brand/10 text-brand"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      )}
                    >
                      {row.method === "activate" ? "开通" : "登录"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && data && <p className="text-[11px] text-rose-500">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/[0.06] pt-3 text-[11px] text-muted-foreground">
          <span>{data ? `共 ${data.total} 条 · 第 ${data.page} / ${data.pages} 页` : "—"}</span>
          <div className="flex items-center gap-1.5">
            {loading && data && <Loader2 className="mr-1 size-3 animate-spin" />}
            <button
              type="button"
              disabled={!data || data.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-7 items-center rounded-lg border border-foreground/10 px-2 transition hover:border-foreground/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={!data || data.page >= data.pages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex h-7 items-center rounded-lg border border-foreground/10 px-2 transition hover:border-foreground/25 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
            >
              下一页
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
