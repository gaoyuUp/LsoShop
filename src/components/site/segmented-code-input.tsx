"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export function SegmentedCodeInput({
  value,
  onChange,
  length,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  length: number;
  ariaLabel: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function commit(nextChars: string[]) {
    onChange(nextChars.join("").slice(0, length));
  }

  function setChar(index: number, char: string) {
    const next = Array.from({ length }, (_, i) => chars[i] ?? "");
    next[index] = char;
    commit(next);
  }

  function focus(index: number) {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  function handleInput(index: number, raw: string) {
    const clean = raw.replace(/\s+/g, "");
    if (!clean) {
      setChar(index, "");
      return;
    }
    if (clean.length > 1) {
      const next = Array.from({ length }, (_, i) => chars[i] ?? "");
      for (let i = 0; i < clean.length && index + i < length; i++) next[index + i] = clean[i];
      commit(next);
      focus(index + clean.length);
      return;
    }
    setChar(index, clean.slice(-1));
    if (index < length - 1) focus(index + 1);
  }

  function handlePaste(index: number, event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const text = event.clipboardData.getData("text").replace(/\s+/g, "").slice(0, length);
    if (!text) return;
    const next = Array.from({ length }, (_, i) => chars[i] ?? "");
    for (let i = 0; i < text.length && index + i < length; i++) next[index + i] = text[i];
    commit(next);
    focus(index + text.length);
  }

  return (
    <div className="grid w-full max-w-[300px] grid-cols-6 gap-2" role="group" aria-label={ariaLabel}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={chars[index]}
          onChange={(e) => handleInput(index, e.target.value)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[index] && index > 0) {
              e.preventDefault();
              setChar(index - 1, "");
              focus(index - 1);
            } else if (e.key === "ArrowLeft" && index > 0) {
              e.preventDefault();
              focus(index - 1);
            } else if (e.key === "ArrowRight" && index < length - 1) {
              e.preventDefault();
              focus(index + 1);
            }
          }}
          aria-label={`${ariaLabel}第 ${index + 1} 位`}
          inputMode="text"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className={cn(
            "aspect-square min-w-0 rounded-lg border bg-foreground/[0.035] text-center font-mono text-lg font-semibold caret-[var(--t1)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 selection:bg-brand/20 focus:scale-[1.04] sm:text-xl dark:bg-foreground/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
            chars[index]
              ? "border-brand/30 bg-brand/[0.055]"
              : "border-foreground/12 hover:border-foreground/22",
            "focus:border-transparent focus:shadow-[0_0_0_1.5px_var(--t1),0_0_0_5px_color-mix(in_oklch,var(--t1)_12%,transparent)]",
          )}
        />
      ))}
    </div>
  );
}
