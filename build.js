import esbuild from "esbuild";

esbuild.buildSync({
  entryPoints: ["src/main/background.ts"],
  outfile: "dist/background.js",
  format: "iife",
  bundle: true,
  legalComments: "external",
  //  minify: true
  define: {
    global: "self",
  },
});

esbuild.buildSync({
  entryPoints: ["src/main/bootloader.ts"],
  outfile: "dist/bootloader.js",
  format: "esm",
  bundle: true,
  legalComments: "external",
  //  minify: true
  define: {
    global: "self",
  },
});
esbuild.buildSync({
  entryPoints: ["src/main/bridge.ts"],
  outfile: "dist/bridge.js",
  format: "esm",
  bundle: true,
  legalComments: "external",
  //  minify: true
  define: {
    global: "self",
  },
});
