import type { NextConfig } from "next";

const privateRoutes = [
  "/admin",
  "/admin/:path*",
  "/join",
  "/promote",
  "/promote/:path*",
  "/order",
  "/order/:path*",
  "/orders",
  "/api",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 关闭开发环境左下角指示器，保持界面干净（生产环境本就不显示）
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      // 旧商品地址永久跳转到更符合 SEO 的新路径
      { source: "/p/:slug", destination: "/products/:slug", statusCode: 301 },
      // 商品父路径回到首页在售区，避免出现无意义的 404
      { source: "/products", destination: "/#products", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // 私有页面即使被直接抓取，也不进入搜索索引
      ...privateRoutes.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};

export default nextConfig;
