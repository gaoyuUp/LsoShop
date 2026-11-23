"use client";
import { ArrowDown, Mail, Search, ShieldCheck, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useT } from "@/i18n/provider";
import { LogoMark } from "./logo";

const ease = [0.22, 1, 0.36, 1] as const;
const icons = [Zap, ShieldCheck, Mail, Search];

export function Hero({ announcement }: { announcement: string }) {
  const t = useT();
  const item = (i: number) => ({
    initial: { opacity: 0, y: 22, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay: 0.15 + i * 0.1, ease },
  });

  return (
    <section className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-16 text-center sm:pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        className="relative mb-8"
      >
        <div className="brand-gradient absolute inset-0 -z-10 scale-150 rounded-full opacity-40 blur-2xl" />
        <div className="glass-strong grid size-20 place-items-center rounded-[26px]">
          <LogoMark animated className="size-12" />
        </div>
      </motion.div>

      {announcement && (
        <motion.div {...item(0)} className="glass mb-7 inline-flex max-w-full items-center gap-2 rounded-full px-4 py-1.5 text-xs text-muted-foreground">
          <span className="brand-gradient size-1.5 shrink-0 rounded-full" />
          <span className="truncate">{announcement}</span>
        </motion.div>
      )}

      <motion.h1 {...item(1)} className="text-balance text-[44px] font-semibold leading-[1.08] tracking-tight sm:text-7xl">
        {t.home.title1}
        <br />
        <span className="text-shimmer">{t.home.title2}</span>
      </motion.h1>

      <motion.p {...item(2)} className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {t.home.desc}
      </motion.p>

      <motion.div {...item(3)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#products"
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background shadow-lg shadow-foreground/10 transition hover:scale-[1.03] active:scale-[0.98]"
        >
          {t.home.cta}
          <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" />
        </a>
        <Link
          href="/orders"
          className="glass inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-medium transition hover:scale-[1.03] active:scale-[0.98]"
        >
          <Search className="size-4" />
          {t.home.lookup}
        </Link>
      </motion.div>

      <motion.ul {...item(4)} className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        {t.home.features.map((f, i) => {
          const Icon = icons[i];
          return (
            <li key={f.title} className="glass rounded-2xl px-4 py-4 text-left">
              <Icon className="size-[18px] text-brand" />
              <div className="mt-3 text-sm font-medium">{f.title}</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</div>
            </li>
          );
        })}
      </motion.ul>
    </section>
  );
}
