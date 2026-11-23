"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";

/** 日夜切换：从按钮位置圆形扩散（View Transitions），不支持时直接切换 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const next = isDark ? "light" : "dark";
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduce) return setTheme(next);
    const { clientX: x, clientY: y } = e;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement;
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${r}px`);
    root.classList.add("theme-circle");
    const transition = doc.startViewTransition(() => flushSync(() => setTheme(next)));
    transition.finished.finally(() => root.classList.remove("theme-circle"));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="切换白天 / 夜间模式"
      title="切换白天 / 夜间模式"
      className={cn(
        "relative grid size-9 place-items-center overflow-hidden rounded-full text-foreground/80 transition hover:bg-foreground/[0.06] hover:text-foreground",
        className,
      )}
    >
      <Sun className="size-[18px] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-[18px] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
    </button>
  );
}
