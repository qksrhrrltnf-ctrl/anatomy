import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";

// One build per (figure, theme). build-all.mjs sets these and renames the output.
// *-ko are the Korean teaching pages (stage 2). Their sources live in the anatomy repo, edu/<name>/ (alias @edu).
const FIGURES: Record<string, { title: string; lang: string }> = {
  "test-rig": { title: "Press and pull", lang: "en" },
  "spot-plate": { title: "Spot plate", lang: "en" },
  "test-rig-ko": { title: "누르고 당기기 · 교육판", lang: "ko" },
  "spot-plate-ko": { title: "반점판 · 교육판", lang: "ko" },
};
const fig = process.env.HARNESS_FIG ?? "test-rig";
const theme = process.env.HARNESS_THEME === "light" ? "light" : "dark";
if (!(fig in FIGURES)) throw new Error(`unknown HARNESS_FIG ${fig}`);
export const ANATOMY = process.env.ANATOMY_REPO ?? fileURLToPath(new URL("../..", import.meta.url));

const page = (): Plugin => ({
  name: "harness-page",
  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html
        .replaceAll("%HARNESS_LANG%", FIGURES[fig]!.lang)
        .replaceAll("%HARNESS_TITLE%", FIGURES[fig]!.title)
        .replaceAll("%HARNESS_THEME%", theme)
        .replaceAll("%HARNESS_FIG%", fig),
  },
});

export default defineConfig({
  base: "./",
  plugins: [page(), react(), viteSingleFile()],
  resolve: {
    // kit/ ships iso-kit.ts next to iso-kit.mjs; the React kit is written against the .ts one.
    extensions: [".tsx", ".ts", ".jsx", ".mjs", ".js", ".json"],
    // The teaching sources sit outside this folder, where there is no node_modules: resolve React from here.
    alias: { "@edu": `${ANATOMY}/edu` },
    dedupe: ["react", "react-dom"],
  },
  server: { fs: { allow: [fileURLToPath(new URL(".", import.meta.url)), ANATOMY] } },
  build: {
    outDir: process.env.HARNESS_OUT ?? "dist/.tmp",
    emptyOutDir: true,
  },
});
