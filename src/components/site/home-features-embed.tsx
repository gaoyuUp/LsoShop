"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot() {
  return "dark";
}

export function HomeFeaturesEmbed() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const notify = () => {
      frameRef.current?.contentWindow?.postMessage(
        { type: "lso-carousel-visibility", visible: !document.hidden },
        "*",
      );
    };
    const frame = frameRef.current;
    document.addEventListener("visibilitychange", notify);
    frame?.addEventListener("load", notify);
    notify();
    return () => {
      document.removeEventListener("visibilitychange", notify);
      frame?.removeEventListener("load", notify);
    };
  }, [theme]);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-end justify-between px-1">
        <div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">service promise</div>
          <div className="mt-1 text-left text-[11px] font-medium text-foreground/75">服务保障</div>
        </div>
        <div className="hidden items-center gap-1.5 text-[9px] text-muted-foreground/60 sm:flex">
          <span className="size-1 rounded-full bg-brand/60" /> 自动轮播 · 点击切换
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[30px] border border-black/[0.06] bg-[#f4f0ff] shadow-[0_24px_60px_-38px_rgba(40,20,100,0.45)] dark:border-white/[0.08] dark:bg-[#040405]">
        <iframe
          ref={frameRef}
          key={theme}
          src={`/leibox-elemental/index.html?theme=${theme}`}
          title="服务保障卡片轮播"
          className="block h-[290px] w-full border-0 sm:h-[255px] lg:h-[270px]"
          scrolling="no"
          loading="eager"
        />
      </div>
    </div>
  );
}
