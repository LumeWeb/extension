import { defineConfig } from "vite";
import optimizer from "vite-plugin-optimizer";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { resolve } from "path";

const config = {};

["background", "bootloader", "bridge", "crypto", "cryptoLoader"].forEach(
  (item) => {
    config[item] = {
      entry: resolve(__dirname, `./src/main/${item}.ts`),
      fileName: item,
    };
  },
);

const currentConfig = config[process.env.LIB_NAME];
if (currentConfig === undefined) {
  throw new Error("LIB_NAME is not defined or is not valid");
}

export default defineConfig({
  build: {
    outDir: "lib",
    lib: {
      entry: "build/index.js",
      name: "main",
      formats: ["cjs"],
      ...currentConfig,
    },
    minify: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  resolve: {
    dedupe: ["@lumeweb/libportal", "@lumeweb/libweb", "@lumeweb/libkernel"],
  },
  plugins: [
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
