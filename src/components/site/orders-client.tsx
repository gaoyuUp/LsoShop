"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 挂载后读取本机订单属于外部状态同步 */
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  KeyRound,
  Loader2,
  PackageSearch,
  ReceiptText,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ORDER_STATUS } from "@/lib/format";
import { formatPrice } from "@/lib/format";
import { findLocalToken, getLocalOrders, removeLocalOrder, saveLocalOrder, type LocalOrder } from "@/lib/local-orders";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type LiveOrder = { orderNo: string; status: string; deliveredAt: string | null };

const dateFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  paid: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  delivered: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  closed: "bg-foreground/8 text-muted-foreground",
  refunded: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
};

export function OrdersClient({ title, desc }: { title: string; desc: string }) {
  const t = useT();
  const router = useRouter();
  const [local, setLocal] = useState<LocalOrder[]>([]);
  const [live, setLive] = useState<Record<string, LiveOrder>>({});
  const [mounted, setMounted] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [credential, setCredential] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
    const list = getLocalOrders();
    setLocal(list);
    if (list.length === 0) return;
    fetch("/api/orders/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: list.map((o) => ({ orderNo: o.orderNo, token: o.token })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { orders?: LiveOrder[] } | null) => {
        if (!data?.orders) return;
        setLive(Object.fromEntries(data.orders.map((o) => [o.orderNo, o])));
      })
      .catch(() => {});
  }, []);

  const sorted = useMemo(
    () => [...local].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [local],
  );

  function remove(no: string) {
    removeLocalOrder(no);
    setLocal(getLocalOrders());
    toast.success(t.orders.remove + " ✓");
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const no = orderNo.trim().toUpperCase();
    const cred = credential.trim();
    if (!no || !cred) return;
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(no)}/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: cred }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.order.notFound);
      if (!cred.includes("@")) {
        // 口令查询：顺手把订单保存到本机
        if (findLocalToken(no) === null) {
          saveLocalOrder({
            orderNo: no,
            token: cred.toUpperCase(),
            productName: data.productName,
            variantName: data.variantName,
            totalCents: data.totalCents,
            createdAt: data.createdAt,
          });
        }
        localStorage.setItem(`lso:cred:${no}`, cred.toUpperCase());
      } else {
        sessionStorage.setItem(`lso:cred:${no}`, cred);
      }
      router.push(`/order/${no}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.notFound);
      setSearching(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-xs text-muted-foreground">
            <ReceiptText className="size-3.5" />
            ORDERS
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{desc}</p>
        </div>
        <Link
          href="/#products"
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-foreground/10 px-4 text-sm text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
        >
          <Sparkles className="size-4" />
          {t.orders.emptyAction}
        </Link>
      </motion.div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        {/* 本机订单 */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="glass overflow-hidden rounded-[28px]"
        >
          <div className="flex items-center justify-between border-b border-foreground/[0.07] px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="size-4 text-brand" />
              {t.orders.local}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {String(sorted.length).padStart(2, "0")}
            </span>
          </div>

          {!mounted ? (
            <div className="space-y-3 p-5">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-foreground/[0.04]" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-foreground/[0.04]">
                <PackageSearch className="size-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">{t.orders.empty}</p>
              <Link
                href="/#products"
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background transition hover:scale-[1.03]"
              >
                {t.orders.emptyAction}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-foreground/[0.06]">
              {sorted.map((o) => {
                const status = live[o.orderNo]?.status ?? "pending";
                const meta = ORDER_STATUS[status] ?? { label: status, tone: "zinc" as const };
                return (
                  <li key={o.orderNo} className="group relative p-4 transition-colors hover:bg-foreground/[0.025] sm:p-5">
                    <Link href={`/order/${o.orderNo}`} className="block">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-[15px] font-medium">{o.productName}</span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                STATUS_STYLE[status] ?? STATUS_STYLE.closed,
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {o.variantName} · {o.orderNo}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-lg font-semibold leading-none">¥{formatPrice(o.totalCents)}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {dateFmt.format(new Date(o.createdAt))}
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {status === "delivered" ? (
                          <>
                            <KeyRound className="size-3.5 text-emerald-500" />
                            {t.order.deliveredDesc}
                          </>
                        ) : (
                          <>
                            <Clock3 className="size-3.5" />
                            {status === "pending" ? t.order.waitingPay : meta.label}
                          </>
                        )}
                      </span>
                      <div className="flex items-center gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              title={t.orders.remove}
                              className="grid size-8 place-items-center rounded-full text-muted-foreground opacity-60 transition hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[400px] gap-0 rounded-[24px] p-5">
                            <div className="flex items-start gap-3.5">
                              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                              </span>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <AlertDialogTitle className="text-[17px] font-semibold tracking-tight">
                                  移除本机订单？
                                </AlertDialogTitle>
                                <AlertDialogDescription className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                                  只会从这台设备的「我的订单」中移除，不会影响订单本身和已交付内容。你仍可以用订单号 + 查询口令，或订单号 + 下单邮箱重新查询。
                                </AlertDialogDescription>
                              </div>
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                              <AlertDialogCancel className="h-9 rounded-xl px-4 text-xs">取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(o.orderNo)}
                                className="h-9 rounded-xl bg-rose-600 px-4 text-xs font-medium text-white hover:bg-rose-500"
                              >
                                确认移除
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Link
                          href={`/order/${o.orderNo}`}
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-foreground/[0.06] px-3 text-xs font-medium transition hover:bg-foreground/[0.1]"
                        >
                          {status === "pending" ? t.order.waitingPay : "查看"}
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {/* 查询与账号 */}
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="glass rounded-[28px] p-5 sm:p-6"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Search className="size-4 text-brand" />
              {t.orders.lookup}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              付款完成后订单页会显示 12 位查询口令；换设备可用「订单号 + 口令」或「订单号 + 下单邮箱」查询。
            </p>
            <form onSubmit={lookup} className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">{t.orders.orderNo}</span>
                <input
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
                  placeholder={t.orders.orderNoPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="h-11 w-full rounded-xl border border-foreground/10 bg-background/50 px-3.5 font-mono text-sm uppercase outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand dark:bg-foreground/[0.03]"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs text-muted-foreground">{t.orders.credential}</span>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <input
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder={t.orders.credentialPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 w-full rounded-xl border border-foreground/10 bg-background/50 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand dark:bg-foreground/[0.03]"
                  />
                </div>
              </label>
              {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
              <button
                type="submit"
                disabled={searching || !orderNo.trim() || !credential.trim()}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-40"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {searching ? t.common.loading : t.orders.submit}
              </button>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
