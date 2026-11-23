/** 推广中心背景：与 /join 一致的简洁品牌光晕 + 淡网格 */
export function PromoteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden>
      <div className="absolute -left-40 top-[-20%] size-[42rem] rounded-full bg-brand/15 blur-[130px]" />
      <div className="absolute bottom-[-20%] right-[-10%] size-[38rem] rounded-full bg-brand-2/15 blur-[130px]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, currentColor 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, currentColor 4%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 35%, #000, transparent 82%)",
        }}
      />
    </div>
  );
}
