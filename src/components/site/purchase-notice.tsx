"use client";
import { AlertTriangle, ChevronDown, ScrollText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useT } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * 购买提示：
 * - 「购买前请注意」可折叠，展开时条目错峰上浮 + 模糊消散，和须知的时间轴区分开
 * - 「购买须知」默认全部折叠，点击条目或「全部展开」查看
 */
export function PurchaseNotice({ warnings, notes }: { warnings: string[]; notes: { title: string; body: string }[] }) {
  const t = useT();
  const [warnOpen, setWarnOpen] = useState(false);
  const [open, setOpen] = useState<number | "all">(-1);

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <motion.div
          layout
          transition={{ duration: 0.45, ease }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.1] via-amber-500/[0.05] to-transparent"
        >
          <div className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-36 rounded-full bg-orange-400/10 blur-3xl" />

          <button
            type="button"
            onClick={() => setWarnOpen((v) => !v)}
            aria-expanded={warnOpen}
            aria-controls="purchase-warnings"
            className="relative flex w-full items-center gap-3 p-4 text-left"
          >
            <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              {warnOpen && <span className="absolute inset-0 animate-ping rounded-xl border border-amber-500/30" />}
              <AlertTriangle className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t.product.warningsTitle}</span>
                <span className="rounded-full bg-amber-500/12 px-1.5 py-0.5 font-mono text-[10px] font-medium text-amber-700/80 dark:text-amber-300/80">
                  {warnings.length}
                </span>
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-amber-800/55 dark:text-amber-100/45">
                {warnOpen ? "下单前请逐条确认，避免不必要的损失" : "有重要提醒，点击展开查看"}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-amber-700/70 dark:text-amber-300/60">
              <span className="hidden sm:inline">{warnOpen ? "收起" : "展开"}</span>
              <motion.span animate={{ rotate: warnOpen ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
                <ChevronDown className="size-4" />
              </motion.span>
            </span>
          </button>

          <AnimatePresence initial={false}>
            {warnOpen && (
              <motion.div
                key="warnings"
                id="purchase-warnings"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ height: { duration: 0.38, ease }, opacity: { duration: 0.24 } }}
                className="overflow-hidden"
              >
                <div className="relative px-4 pb-4">
                  <motion.span
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.55, ease }}
                    className="mb-3 block h-px origin-left bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-transparent"
                  />
                  <ul className="space-y-2.5">
                    {warnings.map((w, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.05 + i * 0.06, duration: 0.4, ease }}
                        className="flex gap-2.5 text-[13px] leading-relaxed text-amber-900/80 dark:text-amber-100/75"
                      >
                        <span className="mt-[0.2em] grid size-[18px] shrink-0 place-items-center rounded-md bg-amber-500/12 font-mono text-[10px] font-semibold text-amber-700/80 dark:text-amber-300/80">
                          {i + 1}
                        </span>
                        <RichText text={w} />
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {notes.length > 0 && (
        <div className="rounded-2xl border border-foreground/[0.07] bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-6 place-items-center rounded-full bg-foreground/[0.06]">
                <ScrollText className="size-3.5" />
              </span>
              {t.product.notesTitle}
              <span className="rounded-full bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                {notes.length}
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs text-muted-foreground transition hover:text-foreground"
              onClick={() => setOpen(open === "all" ? -1 : "all")}
            >
              {open === "all" ? "全部收起" : "全部展开"}
            </button>
          </div>

          <ol className="relative mt-3">
            {notes.map((n, i) => {
              const expanded = open === "all" || open === i;
              const last = i === notes.length - 1;
              return (
                <li key={i} className="relative flex gap-3.5 pb-2.5 last:pb-0">
                  {!last && (
                    <span
                      className={cn(
                        "absolute left-[11px] top-8 h-[calc(100%-24px)] w-px bg-gradient-to-b",
                        expanded ? "from-foreground/15 to-foreground/[0.03]" : "from-foreground/[0.08] to-transparent",
                      )}
                    />
                  )}
                  <span
                    className="relative z-10 mt-1 grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-semibold text-white shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--t1, var(--brand)), var(--t2, var(--brand-2)))" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded && open !== "all" ? -1 : i)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left text-sm font-medium transition hover:text-brand"
                    >
                      {n.title}
                      <ChevronDown
                        className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", expanded && "rotate-180 text-brand")}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <RichText text={n.body} className="pb-2 pt-1 text-[13px] leading-relaxed text-muted-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>
              );
            })}
          </ol>

          {open === -1 && (
            <p className="mt-2.5 flex items-center gap-1.5 border-t border-foreground/[0.05] pt-2.5 text-[10px] text-muted-foreground/70">
              <span className="size-1 rounded-full bg-brand/60" />
              点击任意条目展开查看
            </p>
          )}
        </div>
      )}
    </div>
  );
}
