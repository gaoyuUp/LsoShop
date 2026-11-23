import { cn } from "@/lib/utils";

/**
 * 商品舞台：主题色光晕 + 轨道环 + 星点 + 悬浮商品图。
 * 纯 CSS 动画，服务端组件即可使用。
 */
export function ProductArt({
  image,
  name,
  theme,
  size = "md",
  className,
}: {
  image: string;
  name: string;
  theme: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const lg = size === "lg";
  return (
    <div data-theme={theme} className={cn("relative isolate grid place-items-center overflow-hidden", className)}>
      {/* 渐变底 */}
      <div
        className="absolute inset-0 -z-20 opacity-90"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, color-mix(in oklch, var(--t1) 26%, transparent), transparent 60%), radial-gradient(90% 80% at 100% 100%, color-mix(in oklch, var(--t2) 24%, transparent), transparent 60%)",
        }}
      />
      {/* 呼吸光晕 */}
      <div
        className="halo-breathe absolute -z-10 aspect-square w-[62%] rounded-full blur-3xl"
        style={{ background: "conic-gradient(from 140deg, var(--t1), var(--t2), var(--t3), var(--t1))", opacity: 0.55 }}
      />
      {/* 轨道环 */}
      <div className="orbit absolute -z-10 aspect-square w-[78%] rounded-full border border-dashed border-foreground/10">
        <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_12px_2px_var(--t1)]" style={{ background: "var(--t1)" }} />
      </div>
      <div className="orbit-rev absolute -z-10 aspect-square w-[96%] rounded-full border border-foreground/[0.06]">
        <span className="absolute bottom-[14%] right-[6%] size-1.5 rounded-full shadow-[0_0_10px_2px_var(--t2)]" style={{ background: "var(--t2)" }} />
      </div>
      {/* 商品图 */}
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          draggable={false}
          className={cn(
            "float-y relative select-none object-contain drop-shadow-[0_24px_32px_rgba(20,10,60,0.28)]",
            lg ? "w-[68%] max-w-[430px]" : "w-[52%] max-w-[200px]",
          )}
        />
      ) : (
        <div className="float-y grid aspect-square w-[40%] place-items-center rounded-[28%] text-3xl font-semibold text-white shadow-2xl" style={{ background: "linear-gradient(135deg, var(--t1), var(--t2))" }}>
          {name.slice(0, 1)}
        </div>
      )}
    </div>
  );
}
