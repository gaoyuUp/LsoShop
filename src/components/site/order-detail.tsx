"use client";
/* eslint-disable react-hooks/set-state-in-effect -- 挂载后从本地存储恢复查询口令、启动倒计时属于合理的外部状态同步 */
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  ClipboardCopy,
  Clock3,
  Copy,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  MailCheck,
  MailWarning,
  PackageCheck,
  QrCode,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/i18n/provider";
import { copyText } from "@/lib/clipboard";
import { formatPrice } from "@/lib/format";
import { findLocalToken, saveLocalOrder } from "@/lib/local-orders";
import { cn } from "@/lib/utils";
import { AlipayIcon } from "./alipay-icon";
import { ProductArt } from "./product-art";
import { SupportSection } from "./support-dialog";
import type { SupportContacts } from "@/lib/support";

type OrderView = {
  orderNo: string;
  status: string;
  productName: string;
  variantName: string;
  productImage: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  email: string;
  emailStatus: string;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  deliveryItems: string[];
  payment: { qrContent: string; mock: boolean } | null;
  serverNow: string;
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

const fmtDate = (d?: string | null) => (d ? dateFmt.format(new Date(d)) : "-");

async function fetchLookup(orderNo: string, credential: string): Promise<OrderView> {
  const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "未找到订单");
  return data as OrderView;
}

export function OrderDetail({ orderNo, support }: { orderNo: string; support: SupportContacts }) {
  const t = useT();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [credential, setCredential] = useState("");
  const [needsCredential, setNeedsCredential] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const expiredRef = useRef(false);

  const load = useCallback(
    async (cred: string, silent = false) => {
      if (silent) setRefreshing(true);
      try {
        const data = await fetchLookup(orderNo, cred);
        setOrder(data);
        setError("");
        setNeedsCredential(false);
      } catch (err) {
        if (!silent) setError(err instanceof Error ? err.message : t.order.notFound);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderNo, t.order.notFound],
  );

  useEffect(() => {
    const stored = findLocalToken(orderNo) || sessionStorage.getItem(`lso:cred:${orderNo}`);
    if (!stored) {
      setLoading(false);
      setNeedsCredential(true);
      return;
    }
    setCredential(stored);
    void load(stored);
  }, [load, orderNo]);

  // 待支付 / 待发货时轮询订单状态
  useEffect(() => {
    if (!credential || !order) return;
    if (order.status !== "pending" && order.status !== "paid") return;
    const id = setInterval(() => void load(credential, true), 8000);
    return () => clearInterval(id);
  }, [credential, load, order]);

  // 支付二维码
  useEffect(() => {
    let alive = true;
    const content = order?.payment?.qrContent;
    if (!content) return;
    import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(content, {
          width: 520,
          margin: 1,
          errorCorrectionLevel: "H",
          color: { dark: "#0d0d12", light: "#ffffff" },
        }),
      )
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [order?.payment?.qrContent]);

  const status = order?.status ?? "pending";
  const queryToken = credential && !credential.includes("@") ? credential.trim().toUpperCase() : "";
  async function copy(text: string, key: string) {
    const ok = await copyText(text);
    if (!ok) return toast.error("复制失败，请手动选择文本");
    setCopied(key);
    toast.success(t.order.copied);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
  }

  async function mockPay() {
    if (!order || !credential) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/orders/${order.orderNo}/mock-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "支付失败");
      setOrder(data as OrderView);
      toast.success(t.order.paySuccess);
      saveLocalOrder({
        orderNo,
        token: credential,
        productName: data.productName,
        variantName: data.variantName,
        totalCents: data.totalCents,
        createdAt: data.createdAt,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "支付失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  }

  async function submitCredential(e: React.FormEvent) {
    e.preventDefault();
    const cred = credential.trim();
    if (!cred) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchLookup(orderNo, cred);
      setOrder(data);
      setNeedsCredential(false);
      if (!cred.includes("@")) {
        if (findLocalToken(orderNo) === null) {
          saveLocalOrder({
            orderNo,
            token: cred,
            productName: data.productName,
            variantName: data.variantName,
            totalCents: data.totalCents,
            createdAt: data.createdAt,
          });
        }
      } else {
        sessionStorage.setItem(`lso:cred:${orderNo}`, cred);
      }
      setCredential(cred);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.order.notFound);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <OrderSkeleton />;

  if (needsCredential || (!order && error)) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 pb-10 pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative overflow-hidden rounded-[32px] p-7 sm:p-9"
        >
          <div className="brand-gradient pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-20 blur-3xl" />
          <div className="grid size-12 place-items-center rounded-2xl bg-foreground/[0.06]">
            <LockKeyhole className="size-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{t.order.queryToView}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.order.queryDesc}</p>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] px-3.5 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">{orderNo}</span>
            <button
              type="button"
              onClick={() => copy(orderNo, "gate-no")}
              className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
            >
              {copied === "gate-no" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
          <form onSubmit={submitCredential} className="mt-4 space-y-3">
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder={t.order.queryPlaceholder}
                autoFocus
                className="h-12 w-full rounded-xl border border-foreground/10 bg-background/60 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-[1.5px] focus:ring-brand dark:bg-foreground/[0.03]"
              />
            </div>
            {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            <button
              type="submit"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99]"
            >
              {t.orders.submit}
              <ArrowRight className="size-4" />
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between border-t border-foreground/[0.07] pt-4 text-xs text-muted-foreground">
            <Link href="/orders" className="inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="size-3.5" />
              {t.order.myOrders}
            </Link>
            <Link href="/#products" className="hover:text-foreground">
              {t.order.continueShop}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!order) return null;

  const meta = STATUS_META(t);
  const s = (meta as Record<string, (typeof meta)["closed"]>)[status] ?? meta.closed;
  const StatusIcon = s.icon;
  const allContent = order.deliveryItems.map((item, i) => `【${t.order.item(i + 1)}】\n${item}`).join("\n\n");

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t.order.myOrders}
      </Link>

      {/* 状态横幅 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative mt-4 overflow-hidden rounded-[30px] p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute inset-0 -z-10" style={{ background: s.bg }} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className={cn("relative grid size-12 shrink-0 place-items-center rounded-2xl", s.iconBox)}>
              <StatusIcon className={cn("size-5", s.spin && "animate-spin")} />
              {status === "pending" && <span className="absolute inset-0 animate-ping rounded-2xl border border-current opacity-20" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{s.title}</h1>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.chip)}>{s.chipText}</span>
              </div>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {status === "paid" ? t.order.paidWaitingDesc : s.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-foreground/[0.08] bg-background/40 px-3 py-1.5 sm:self-center">
            <span className="font-mono text-xs tracking-tight">{order.orderNo}</span>
            <button
              type="button"
              onClick={() => copy(order.orderNo, "no")}
              className="text-muted-foreground transition hover:text-foreground"
              aria-label={t.order.copy}
            >
              {copied === "no" ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {queryToken && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/20 bg-brand/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <KeyRound className="size-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                订单查询凭证
                <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">请保存</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                订单号 + 查询口令可在任意设备查单；忘记口令时，也可用下单邮箱查询。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand/15 bg-background/60 px-2.5 py-1.5">
              <span className="text-[10px] text-muted-foreground">口令</span>
              <span className="font-mono text-xs font-semibold tracking-[0.08em]">{queryToken}</span>
            </span>
            <button
              type="button"
              onClick={() => copy(`订单号：${order.orderNo}\n查询口令：${queryToken}`, "credential")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
            >
              {copied === "credential" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied === "credential" ? "已复制" : "复制凭证"}
            </button>
          </div>
        </motion.section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-5">
          {status === "pending" && (
            <PaymentCard
              order={order}
              qr={qr}
              paying={paying}
              refreshing={refreshing}
              onPay={mockPay}
              onRefresh={() => load(credential, true)}
              onExpire={() => {
                if (expiredRef.current) return;
                expiredRef.current = true;
                void load(credential, true);
              }}
            />
          )}

          {status === "paid" && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[28px] p-6 sm:p-8"
            >
              <div className="flex flex-col items-center py-8 text-center">
                <div className="relative">
                  <div className="brand-gradient absolute inset-0 animate-ping rounded-full opacity-20" />
                  <div className="relative grid size-16 place-items-center rounded-full bg-foreground text-background">
                    <Truck className="size-7" />
                  </div>
                </div>
                <h2 className="mt-6 text-lg font-semibold">{t.order.paidWaiting}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.order.paidWaitingDesc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  页面会自动刷新发货状态
                </div>
                <button
                  type="button"
                  onClick={() => load(credential, true)}
                  className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-full border border-foreground/10 px-4 text-xs text-muted-foreground transition hover:border-foreground/25 hover:text-foreground"
                >
                  <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
                  {t.order.refresh}
                </button>
              </div>
            </motion.section>
          )}

          {status === "delivered" && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass overflow-hidden rounded-[28px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/[0.07] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <PackageCheck className="size-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t.order.deliveredDesc}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {fmtDate(order.deliveredAt)} · 共 {order.deliveryItems.length} 份交付内容
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copy(allContent, "all")}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-medium text-background transition hover:opacity-90 active:scale-[0.98]"
                >
                  {copied === "all" ? <CheckCheck className="size-3.5" /> : <ClipboardCopy className="size-3.5" />}
                  {t.order.copyAll}
                </button>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                <AnimatePresence initial={false}>
                  {order.deliveryItems.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.4 }}
                      className="group relative overflow-hidden rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02]"
                    >
                      <div className="flex items-center justify-between border-b border-foreground/[0.06] px-4 py-2.5">
                        <span className="inline-flex items-center gap-2 text-xs font-medium">
                          <span className="grid size-5 place-items-center rounded-md bg-foreground font-mono text-[10px] text-background">
                            {i + 1}
                          </span>
                          {t.order.item(i + 1)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copy(item, `item-${i}`)}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                        >
                          {copied === `item-${i}` ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                          {copied === `item-${i}` ? t.order.copied : t.order.copy}
                        </button>
                      </div>
                      <div className="relative">
                        <pre className="thin-scroll overflow-x-auto whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-[1.75] text-foreground/90">
                          {item}
                        </pre>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background/60 to-transparent" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-foreground/[0.03] px-3.5 py-3 text-xs text-muted-foreground">
                  <EmailLine status={order.emailStatus} email={order.email} />
                </div>
              </div>
            </motion.section>
          )}

          {(status === "closed" || status === "refunded") && (
            <div className="glass rounded-[28px] p-7 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-foreground/[0.05]">
                {status === "closed" ? <XCircle className="size-6 text-muted-foreground" /> : <RotateCcw className="size-6 text-rose-500" />}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{s.title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <Link
                href="/#products"
                className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-5 text-xs font-medium text-background"
              >
                <ShoppingBag className="size-3.5" />
                {t.order.continueShop}
              </Link>
            </div>
          )}

        </div>

        {/* 订单摘要 */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="glass overflow-hidden rounded-[26px]">
            <div className="p-2.5">
              <ProductArt
                image={order.productImage}
                name={order.productName}
                theme="violet"
                className="aspect-[4/3] rounded-[18px]"
              />
            </div>
            <div className="px-5 pb-5 pt-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold leading-tight">{order.productName}</h2>
                <span className="shrink-0 rounded-full bg-foreground/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">
                  {order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{order.variantName}</p>
              <div className="my-4 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
              <dl className="space-y-2.5 text-sm">
                <Row label={t.order.unitPrice} value={`¥${formatPrice(order.unitPriceCents)}`} />
                <Row label={t.order.quantity} value={`× ${order.quantity}`} />
                <Row
                  label={t.order.amount}
                  value={
                    <span className="font-mono text-lg font-semibold">¥{formatPrice(order.totalCents)}</span>
                  }
                />
              </dl>
            </div>
          </section>

          <section className="glass rounded-[26px] p-5">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <ReceiptText className="size-4 text-brand" />
              {t.order.timeline}
            </h3>
            <Timeline order={order} />
          </section>
        </aside>
      </div>

      <SupportSection support={support} />
    </div>
  );
}

function PaymentCard({
  order,
  qr,
  paying,
  refreshing,
  onPay,
  onRefresh,
  onExpire,
}: {
  order: OrderView;
  qr: string;
  paying: boolean;
  refreshing: boolean;
  onPay: () => void;
  onRefresh: () => void;
  onExpire: () => void;
}) {
  const t = useT();
  const total = Math.max(1, new Date(order.expiresAt).getTime() - new Date(order.createdAt).getTime());
  const [now, setNow] = useState(() => new Date(order.serverNow).getTime());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, new Date(order.expiresAt).getTime() - now);
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mm = String(Math.floor(left / 60000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, "0");

  useEffect(() => {
    if (left === 0) onExpire();
  }, [left, onExpire]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass overflow-hidden rounded-[28px]"
    >
      <div className="grid sm:grid-cols-[240px_1fr]">
        <div className="relative flex flex-col items-center justify-center border-b border-foreground/[0.07] bg-white p-6 sm:border-b-0 sm:border-r">
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1677ff]">
            <AlipayIcon className="size-4" />
            支付宝
          </div>
          {order.payment?.mock && (
            <span className="absolute right-4 top-4 rounded-full bg-[#1677ff]/10 px-2 py-0.5 text-[10px] font-medium text-[#1677ff]">
              {t.order.mockMode}
            </span>
          )}
          <div className="relative mt-7">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="支付二维码" className="size-44 rounded-xl" />
            ) : (
              <div className="grid size-44 place-items-center rounded-xl bg-[#f4f6fb]">
                <QrCode className="size-10 animate-pulse text-[#9aa6bd]" />
              </div>
            )}
            <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg bg-white shadow-md ring-1 ring-black/5">
              <AlipayIcon className="size-5 text-[#1677ff]" />
            </span>
          </div>
          <p className="mt-4 text-center text-[11px] text-[#6b7688]">{t.order.scan}</p>
        </div>

        <div className="flex flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t.order.amount}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg">¥</span>
                <span className="font-mono text-4xl font-semibold tracking-tight">{formatPrice(order.totalCents)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                <Clock3 className="size-3" />
                {t.order.countdown}
              </div>
              <div className={cn("mt-1 font-mono text-xl font-semibold tabular-nums", left === 0 ? "text-rose-500" : "text-foreground")}>
                {left === 0 ? t.order.expired : `${mm}:${ss}`}
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-2))" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "linear" }}
            />
          </div>

          <div className="mt-auto pt-6">
            {order.payment?.mock ? (
              <>
                <button
                  type="button"
                  onClick={onPay}
                  disabled={paying || left === 0}
                  className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#1677ff] text-sm font-medium text-white shadow-[0_12px_32px_-12px_#1677ff] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                  {paying ? <Loader2 className="size-4 animate-spin" /> : <WalletCards className="size-4" />}
                  {paying ? "正在确认支付…" : t.order.mockPay}
                </button>
                <p className="mt-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">{t.order.mockTip}</p>
              </>
            ) : (
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                支付完成后页面会自动刷新，请勿关闭
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" />
                支付安全
              </span>
              <button type="button" onClick={onRefresh} className="inline-flex items-center gap-1 transition hover:text-foreground">
                <RefreshCw className={cn("size-3", refreshing && "animate-spin")} />
                {t.order.refresh}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function Timeline({ order }: { order: OrderView }) {
  const steps = [
    { label: "创建订单", time: order.createdAt, done: true, icon: ReceiptText },
    { label: "完成支付", time: order.paidAt, done: Boolean(order.paidAt), icon: WalletCards },
    {
      label: order.status === "delivered" ? "已发货" : "发货",
      time: order.deliveredAt,
      done: Boolean(order.deliveredAt),
      icon: PackageCheck,
    },
  ];
  return (
    <ol className="mt-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-[calc(100%-18px)] w-px",
                  step.done ? "bg-emerald-500/30" : "bg-foreground/10",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full",
                step.done ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-foreground/[0.05] text-muted-foreground",
              )}
            >
              <Icon className="size-3" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className={cn("text-xs", step.done ? "font-medium" : "text-muted-foreground")}>{step.label}</div>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                {step.time ? fmtDate(step.time) : step.done ? "" : "—"}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmailLine({ status, email }: { status: string; email: string }) {
  const t = useT();
  if (!email) {
    return (
      <>
        <MailWarning className="size-3.5" />
        未填写收件邮箱，请复制保存以上内容
      </>
    );
  }
  if (status === "sent") {
    return (
      <>
        <MailCheck className="size-3.5 text-emerald-500" />
        {t.order.emailSent(email)}
      </>
    );
  }
  if (status === "failed") {
    return (
      <>
        <MailWarning className="size-3.5 text-rose-500" />
        {t.order.emailFailed}
      </>
    );
  }
  return (
    <>
      <Mail className="size-3.5" />
      {status === "skipped" ? t.order.emailPending : t.order.emailSkipped}
      <span className="text-foreground/70">（{email}）</span>
    </>
  );
}

function OrderSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:px-6">
      <div className="h-4 w-20 animate-pulse rounded bg-foreground/[0.06]" />
      <div className="mt-4 h-32 animate-pulse rounded-[30px] bg-foreground/[0.04]" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="h-80 animate-pulse rounded-[28px] bg-foreground/[0.04]" />
        <div className="h-80 animate-pulse rounded-[26px] bg-foreground/[0.04]" />
      </div>
    </div>
  );
}

function STATUS_META(t: ReturnType<typeof useT>) {
  return {
    pending: {
      title: t.order.waitingPay,
      desc: "订单已创建，请使用支付宝扫码完成支付。支付后自动发货。",
      chipText: "待支付",
      chip: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      icon: Clock3,
      iconBox: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
      bg: "radial-gradient(80% 140% at 0% 0%, color-mix(in oklch, #f59e0b 10%, transparent), transparent 60%)",
      spin: false,
    },
    paid: {
      title: t.order.paidWaiting,
      desc: t.order.paidWaitingDesc,
      chipText: "已支付",
      chip: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
      icon: Truck,
      iconBox: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
      bg: "radial-gradient(80% 140% at 0% 0%, color-mix(in oklch, #0ea5e9 10%, transparent), transparent 60%)",
      spin: false,
    },
    delivered: {
      title: t.order.delivered,
      desc: "订单已完成，请妥善保存交付内容，切勿泄露给他人。",
      chipText: "已发货",
      chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      icon: PackageCheck,
      iconBox: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      bg: "radial-gradient(80% 140% at 0% 0%, color-mix(in oklch, #10b981 10%, transparent), transparent 60%)",
      spin: false,
    },
    closed: {
      title: t.order.closed,
      desc: t.order.closedDesc,
      chipText: "已关闭",
      chip: "bg-foreground/8 text-muted-foreground",
      icon: XCircle,
      iconBox: "bg-foreground/[0.06] text-muted-foreground",
      bg: "radial-gradient(80% 140% at 0% 0%, color-mix(in oklch, #71717a 8%, transparent), transparent 60%)",
      spin: false,
    },
    refunded: {
      title: t.order.refunded,
      desc: "该订单已退款，如有疑问请联系客服。",
      chipText: "已退款",
      chip: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      icon: RotateCcw,
      iconBox: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
      bg: "radial-gradient(80% 140% at 0% 0%, color-mix(in oklch, #f43f5e 10%, transparent), transparent 60%)",
      spin: false,
    },
  };
}
