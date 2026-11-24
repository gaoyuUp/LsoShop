import { cn } from "@/lib/utils";

/** 灵搜小店 Logo（按原图矢量化，currentColor 自动适配日夜间） */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" aria-hidden className={cn(animated && "logo-draw", className)}>
      <path
        className="stroke"
        d="M80 141C55 141 39 127 39 107V53C39 44 48 40 55 46L100 86L145 46C152 40 161 44 161 53V107C161 127 145 141 120 141"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={300}
      />
      <circle cx="100" cy="166" r="8.5" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className,
  name = "灵搜小店",
  logoUrl,
}: {
  className?: string;
  name?: string;
  logoUrl?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="size-8 shrink-0 rounded-[10px] object-contain" />
      ) : (
        <span className="relative grid size-8 shrink-0 place-items-center rounded-[10px] bg-foreground text-background shadow-sm">
          <LogoMark className="size-6" />
        </span>
      )}
      <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">{name}</span>
    </span>
  );
}
