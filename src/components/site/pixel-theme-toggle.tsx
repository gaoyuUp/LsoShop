"use client";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { PixelToggle } from "./pixel-toggle/PixelToggle";

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

/** 从点击位置展开的液体墨迹轮廓，边缘带缓慢起伏 */
function blobFrames(x: number, y: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const maxRadius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y)) * 1.18;
  const steps = 28;
  const points = 44;
  const frames: string[] = [];

  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    const eased = 1 - Math.pow(1 - t, 2.35);
    const radius = Math.max(1, eased * maxRadius);
    const wobble = 0.09 * (1 - t * 0.45);
    const coords: string[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wave =
        1 +
        wobble * Math.sin(angle * 5 + t * 7.5) +
        wobble * 0.55 * Math.sin(angle * 9 - t * 5.5);
      coords.push(
        `${(x + Math.cos(angle) * radius * wave).toFixed(1)}px ${(y + Math.sin(angle) * radius * wave).toFixed(1)}px`,
      );
    }
    frames.push(`polygon(${coords.join(", ")})`);
  }

  return frames;
}

/**
 * 前台主题开关：
 * - 可视控件是裁切后的 PixelToggle
 * - 点击后先让像素滑块动一下，再用 View Transition 的液体墨迹展开整页新主题
 */
export function PixelThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const checked = resolvedTheme === "light";
  const cropRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const [busy, setBusy] = useState(false);

  const cleanup = useCallback(() => {
    document.documentElement.classList.remove("theme-blob");
    busyRef.current = false;
    setBusy(false);
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current = [];
      document.documentElement.classList.remove("theme-blob");
    };
  }, []);

  const handleCheckedChange = useCallback(
    (day: boolean) => {
      const next = day ? "light" : "dark";
      if (busyRef.current) return;

      const doc = document as ViewTransitionDocument;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || !doc.startViewTransition) {
        setTheme(next);
        return;
      }

      const rect = cropRef.current?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

      busyRef.current = true;
      setBusy(true);

      // 先让像素开关自己动一小段，再开始整页换肤
      const delay = window.setTimeout(() => {
        const root = document.documentElement;
        root.classList.add("theme-blob");

        let transition: ReturnType<NonNullable<ViewTransitionDocument["startViewTransition"]>>;
        try {
          transition = doc.startViewTransition!(() => {
            flushSync(() => setTheme(next));
          });
        } catch {
          root.classList.remove("theme-blob");
          setTheme(next);
          cleanup();
          return;
        }

        transition.ready
          .then(() => {
            try {
              root.animate(
                { clipPath: blobFrames(x, y) } as unknown as Keyframe[],
                {
                  duration: 900,
                  easing: "linear",
                  fill: "both",
                  pseudoElement: "::view-transition-new(root)",
                } as KeyframeAnimationOptions & { pseudoElement: string },
              );
            } catch {
              // 个别浏览器不支持伪元素动画时，让 View Transition 正常结束
            }
          })
          .catch(() => {});

        transition.finished.then(cleanup, cleanup);

        // 兜底，避免极端情况下页面一直处于 busy
        const safety = window.setTimeout(cleanup, 1900);
        timers.current.push(safety);
      }, 180);

      timers.current.push(delay);
    },
    [cleanup, setTheme],
  );

  const options = useMemo(
    () => ({
      checked,
      sound: true,
      onCheckedChange: handleCheckedChange,
    }),
    [checked, handleCheckedChange],
  );

  return (
    <div
      ref={cropRef}
      className={cn("pixel-theme-crop", busy && "pointer-events-none")}
      title="切换白天 / 夜间模式"
      aria-label="切换白天 / 夜间模式"
      aria-busy={busy}
      inert={busy ? true : undefined}
    >
      <PixelToggle options={options} className="pixel-theme-host" />
    </div>
  );
}
