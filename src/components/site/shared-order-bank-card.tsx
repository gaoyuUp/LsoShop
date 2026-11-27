"use client";

import { useReducedMotion, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import { LogoMark } from "./logo";

type BankCardOrder = {
  orderNo: string;
  productName: string;
  variantName: string;
  productImage: string;
  quantity: number;
  createdAt: string;
};

export function SharedOrderBankCard({
  order,
  brandName,
  logoUrl,
  statusLabel,
  statusTone,
}: {
  order: BankCardOrder;
  brandName: string;
  logoUrl?: string;
  statusLabel: string;
  statusTone: string;
}) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 22 };
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [7, -7]), spring);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-9, 9]), spring);
  const lift = useSpring(0, spring);
  const z = useTransform(lift, [0, 1], [0, 20]);
  const glareX = useTransform(pointerX, [0, 1], [8, 92]);
  const glareY = useTransform(pointerY, [0, 1], [8, 92]);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.26), transparent 46%)`;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width);
    pointerY.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || e.pointerType !== "mouse") return;
    lift.set(1);
  }

  function onPointerLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
    lift.set(0);
  }

  return (
    <div style={{ perspective: 1200 }} className="mx-auto w-full max-w-[560px]">
      <motion.div
        onPointerMove={onPointerMove}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", z }}
        className="group/card relative aspect-[1.42/1] w-full overflow-hidden rounded-[26px] border border-white/15 bg-[#151020] p-4 text-white shadow-[0_34px_80px_-34px_rgba(88,52,200,0.9)] transition-shadow duration-300 sm:aspect-[1.586/1] sm:p-6"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 82% 8%, color-mix(in oklch, var(--brand) 48%, transparent), transparent 58%), radial-gradient(ellipse at 4% 100%, color-mix(in oklch, var(--brand-2) 30%, transparent), transparent 56%), linear-gradient(155deg, rgba(255,255,255,0.07), transparent 42%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "46px 46px",
          }}
        />
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-brand/20 blur-3xl" />
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: glare }}
        />

        <div className="relative flex h-full flex-col justify-between" style={{ transform: "translateZ(28px)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brandName} className="size-9 shrink-0 rounded-xl object-contain" />
              ) : (
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_8px_24px_-10px_var(--brand)]">
                  <LogoMark className="size-6" />
                </span>
              )}
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold tracking-tight text-white sm:text-[13px]">{brandName}</div>
                <div className="text-[8px] uppercase tracking-[0.24em] text-white/40">Order card</div>
              </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] ${statusTone}`}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-end justify-between gap-3" style={{ transform: "translateZ(20px)" }}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-grid h-5 w-7 grid-cols-2 gap-px rounded-[4px] bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 p-1 shadow-inner sm:h-6 sm:w-8">
                  <span className="rounded-[1px] bg-amber-700/25" />
                  <span className="rounded-[1px] bg-amber-700/25" />
                  <span className="rounded-[1px] bg-amber-700/25" />
                  <span className="rounded-[1px] bg-amber-700/25" />
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-white/40">Digital product</span>
              </div>
              <h2 className="mt-2 truncate text-[20px] font-semibold tracking-tight sm:text-[26px]">{order.productName}</h2>
              <p className="mt-1 truncate text-[10px] text-white/50 sm:text-xs">
                {order.variantName} · {order.quantity} 份
              </p>
            </div>
            <div
              className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:size-24 sm:p-3"
              style={{ transform: "translateZ(32px)" }}
            >
              {order.productImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={order.productImage} alt={order.productName} className="size-full object-contain" />
              ) : (
                <span className="grid size-full place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-2 text-2xl font-semibold">
                  {order.productName.slice(0, 1)}
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[8px] uppercase tracking-[0.22em] text-white/35">Order no</div>
            <div className="mt-1 truncate font-mono text-[11px] tracking-[0.16em] text-white/80 sm:text-[15px]">{order.orderNo}</div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-[8px] text-white/35 sm:text-[9px]">
              <span>{order.createdAt}</span>
              <span className="uppercase tracking-[0.16em]">Thank you</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
