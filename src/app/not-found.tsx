import Link from "next/link";
import { ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { LogoMark } from "@/components/site/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-5 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 size-[26rem] translate-x-1/4 translate-y-1/4 rounded-full bg-brand-2/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, currentColor 3%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, currentColor 3%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000, transparent 80%)",
          }}
        />
      </div>

      <div className="glass-strong relative w-full max-w-md overflow-hidden rounded-[32px] p-8 text-center sm:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-foreground text-background shadow-lg">
          <LogoMark animated className="size-9" />
        </div>
        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">404 · Not Found</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">这个页面走丢了</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          链接可能已失效，或者商品已经下架。回首页看看在售的好东西吧。
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition hover:opacity-90 active:scale-[0.99]"
          >
            <ShoppingBag className="size-4" />
            回到首页
          </Link>
          <Link
            href="/orders"
            className="glass inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <Search className="size-4" />
            查询订单
          </Link>
        </div>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          灵搜小店 · 付款后自动发货
        </Link>
      </div>
    </div>
  );
}
