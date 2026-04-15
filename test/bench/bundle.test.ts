import { describe, it, expect } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import * as rou3C from "../../src/compiler.ts";
import * as rou3CLatest from "rou3-latest/compiler";
import * as rou3 from "../../src/index.ts";
import * as rou3Latest from "rou3-latest";
import { largeRoutes } from "./input-large.ts";

describe("benchmark", () => {
  it("bundle size", async () => {
    const code = /* js */ `
      import { createRouter, addRoute, findRoute, findAllRoutes } from "../../src";
      createRouter();
      addRoute();
      findRoute();
      findAllRoutes();
    `;
    const { bytes, gzipSize } = await getBundleSize(code);
    console.log("bundle size", { bytes, gzipSize });
    expect(bytes).toBeLessThanOrEqual(5700); // <5.7kb
    expect(gzipSize).toBeLessThanOrEqual(2200); // <2.2kb
  });

  it("large router compiled code size", () => {
    const router = rou3.createRouter();
    const routerLatest = rou3Latest.createRouter();
    for (const route of largeRoutes) {
      rou3.addRoute(router, route.method, route.path, `[${route.method}] ${route.path}`);
      rou3Latest.addRoute(
        routerLatest,
        route.method,
        route.path,
        `[${route.method}] ${route.path}`,
      );
    }

    const compiled = rou3C.compileRouterToString(router, "find");
    const compiledLatest = rou3CLatest.compileRouterToString(routerLatest, "find");

    console.log("large compiled code size", {
      current: compiled.length,
      latest: compiledLatest.length,
      diff: compiled.length - compiledLatest.length,
      diffPct: ((compiled.length - compiledLatest.length) / compiledLatest.length * 100).toFixed(
        1,
      ),
    });

    // Sanity-check that neither implementation blows up unreasonably.
    expect(compiled.length).toBeLessThan(2_000_000);
    expect(compiledLatest.length).toBeLessThan(2_000_000);
  });
});

async function getBundleSize(code: string) {
  const res = await build({
    bundle: true,
    metafile: true,
    write: false,
    minify: true,
    format: "esm",
    platform: "node",
    outfile: "index.mjs",
    stdin: {
      contents: code,
      resolveDir: fileURLToPath(new URL(".", import.meta.url)),
      sourcefile: "index.mjs",
      loader: "js",
    },
  });
  const { bytes } = res.metafile.outputs["index.mjs"];
  const gzipSize = zlib.gzipSync(res.outputFiles[0].text).byteLength;
  return { bytes, gzipSize };
}
