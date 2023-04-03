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
  inject: ["./polyfill.js"],
});

esbuild.buildSync({
  entryPoints: ["src/main/bootloader.ts"],
  outfile: "dist/bootloader.js",
  format: "iife",
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
  format: "iife",
  bundle: true,
  legalComments: "external",
  //  minify: true
  define: {
    global: "self",
  },
}); /*
esbuild.buildSync({
    entryPoints: ["src/main/crypto.ts"],
    outfile: "dist/crypto.js",
    format: "iife",
    bundle: true,
    legalComments: "external",
    //  minify: true
    define: {
        global: "window",
    },
    inject: ["./polyfill.js"],
});
esbuild.buildSync({
    entryPoints: ["src/main/cryptoLoader.ts"],
    outfile: "dist/cryptoLoader.js",
    format: "iife",
    bundle: true,
    legalComments: "external",
    //  minify: true
    define: {
        global: "window",
    }
});
*/
