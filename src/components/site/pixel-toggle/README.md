# Pixel Toggle

来源：LeiBox「像素日夜开关」
<https://leibox.pantoria.cn/docs/animations/pixel-toggle>

本项目将组件裁切后用于前台导航栏，并接入 `next-themes` 与前台液体墨迹换肤转场。引擎与运行时文件保留上游实现，仅将开关的 `aria-label` 改为中文；`PixelToggle.tsx` 负责 React 生命周期适配。

- `PixelToggleEngine.js`：Canvas / WebGL 渲染与交互引擎
- `PixelToggleEngine.d.ts`：引擎类型声明
- `motion-runtime.ts`：Shadow DOM、帧循环和事件生命周期
- `PixelToggle.tsx`：React 挂载与参数同步

上游组件版权归原作者所有，使用前请遵守 LeiBox 的来源与许可说明。
