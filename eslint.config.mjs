import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 本地验收脚本产物，不参与代码检查
    ".chrome-*/**",
    "screenshots/**",
    "scripts/shots.mjs",
    "scripts/e2e.mjs",
    "scripts/e2e2.mjs",
  ]),
]);

export default eslintConfig;
