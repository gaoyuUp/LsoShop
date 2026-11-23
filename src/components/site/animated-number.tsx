"use client";
import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { useEffect } from "react";

export function AnimatedPrice({ cents, className }: { cents: number; className?: string }) {
  const mv = useMotionValue(cents);
  const text = useTransform(mv, (v) => (v / 100).toFixed(2));
  useEffect(() => {
    const c = animate(mv, cents, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return c.stop;
  }, [cents, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}
