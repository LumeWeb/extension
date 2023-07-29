import { defineConfig } from "vite";
import { resolve } from "path";
import optimizer from "vite-plugin-optimizer";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        onboarding: resolve(__dirname, "onboarding.html"),
        account: resolve(__dirname, "account.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
    minify: false,
  },
  resolve: {
    dedupe: ["@lumeweb/libportal", "@lumeweb/libweb", "@lumeweb/libkernel"],
  },
  plugins: [
    react(),
    optimizer({
      "node-fetch":
        "const e = undefined; export default e;export {e as Response, e as FormData, e as Blob};",
    }),
    nodePolyfills({
      exclude: ["fs"],
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
});
