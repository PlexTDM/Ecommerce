import { defineConfig, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: ["dist/**", "cache.json", "server/public/**"],
  },
  lint: {
    ignorePatterns: ["dist/**", "server/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  build: {
    // The isolated, lazy-loaded 3D figure chunk is intentionally large.
    chunkSizeWarningLimit: 1_000,
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 3000,
    watch: {
      usePolling: true,
    },
  },
});
