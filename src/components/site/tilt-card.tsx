"use client";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * 3D 倾斜卡片：跟随指针倾斜 + 光斑高光 + 流光边框。
 * 子元素可用 data-depth 获得视差位移（越大越「浮」）。
 */
export function TiltCard({
  children,
  className,
  theme,
  max = 9,
  glare = true,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  theme?: string;
  max?: number;
  glare?: boolean;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const gx = useTransform(px, (v) => `${v * 100}%`);
  const gy = useTransform(py, (v) => `${v * 100}%`);
  const glareBg = useMotionTemplate`radial-gradient(520px circle at ${gx} ${gy}, color-mix(in oklch, white 30%, transparent), transparent 45%)`;
  const lift = useSpring(0, spring);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function onLeave() {
    px.set(0.5);
    py.set(0.5);
    lift.set(0);
  }

  return (
    <div style={{ perspective: 1100 }} className="h-full">
      <motion.div
        data-theme={theme}
        onPointerMove={onMove}
        onPointerEnter={() => lift.set(1)}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", z: useTransform(lift, [0, 1], [0, 24]) }}
        className={cn("beam glass group/tilt relative h-full rounded-[28px]", className)}
        {...rest}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover/tilt:opacity-100 dark:mix-blend-overlay"
            style={{ background: glareBg }}
          />
        )}
      </motion.div>
    </div>
  );
}
