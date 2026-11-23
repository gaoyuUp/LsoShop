import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const agentFieldClass =
  "h-11 w-full rounded-xl border border-black/[0.07] bg-black/[0.025] px-3.5 text-[12px] text-foreground outline-none transition placeholder:text-muted-foreground/55 hover:border-black/[0.13] focus:border-brand/45 focus:bg-white focus:ring-4 focus:ring-brand/[0.08] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.035] dark:hover:border-white/[0.16] dark:focus:border-brand/50 dark:focus:bg-white/[0.06]";

export function AgentField({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground/70">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[10px] leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function AgentIconInput({
  icon: Icon,
  className,
  inputClassName,
  ...props
}: ComponentProps<"input"> & { icon: LucideIcon; inputClassName?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75" />
      <input {...props} className={cn(agentFieldClass, "pl-10", inputClassName)} />
    </div>
  );
}
