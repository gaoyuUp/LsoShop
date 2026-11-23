"use client";
// 像素日夜开关来源：LeiBox（https://leibox.pantoria.cn/docs/animations/pixel-toggle），裁切适配站点导航。
import { useEffect, useRef } from "react";
import { mountPixelToggle, type PixelToggleOptions } from "./PixelToggleEngine.js";
import type { MotionController } from "./motion-runtime";

/**
 * 像素日夜开关。原生 WebGL/Canvas 渲染，带可拖动滑块与开关音效。
 * 这里只负责生命周期，具体尺寸由外层容器控制。
 */
export function PixelToggle({ options, className }: { options?: PixelToggleOptions; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<MotionController | null>(null);

  useEffect(() => {
    const instance = mountPixelToggle(host.current!, options);
    controller.current = instance;
    return () => {
      instance.destroy();
      controller.current = null;
    };
    // 挂载一次，参数变化通过下面的 update 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controller.current?.update(options ?? {});
  }, [options]);

  return <div ref={host} className={className} data-motion-component="pixel-toggle" />;
}
