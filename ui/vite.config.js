import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rollupOptions: {
      input: {
        onboarding: resolve(__dirname, "onboarding.html"),
        account: resolve(__dirname, "account.html"),
        dashboard: resolve(__dirname, "dashboard.html"),
      },
    },
  },
});
