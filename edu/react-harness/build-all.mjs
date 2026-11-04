// Builds single-file pages into dist/.
//   node build-all.mjs            all: test-rig, spot-plate (stage 1) and test-rig-ko, spot-plate-ko (stage 2)
//   node build-all.mjs ko         only the Korean teaching pages
//   node build-all.mjs test-rig   one figure (both themes)
// Each figure gets <name>.html (dark) and <name>-light.html. Teaching pages (*-ko) are checked with edu-kit's
// checkContent() first and are also copied next to their sources: <anatomy>/edu/<name>/<name>-ko(-light).html.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ANATOMY = process.env.ANATOMY_REPO ?? fileURLToPath(new URL("../..", import.meta.url));
const ALL = ["test-rig", "spot-plate", "test-rig-ko", "spot-plate-ko"];
const asked = process.argv.slice(2);
const figures = !asked.length ? ALL : asked.includes("ko") ? ALL.filter((fig) => fig.endsWith("-ko")) : ALL.filter((fig) => asked.includes(fig));
if (!figures.length) throw new Error(`nothing to build for ${asked.join(" ")}; known: ${ALL.join(", ")}, ko`);

const vite = join("node_modules", "vite", "bin", "vite.js");
mkdirSync("dist", { recursive: true });
for (const fig of figures) {
  if (fig.endsWith("-ko")) {
    const name = fig.slice(0, -3);
    const { checkContent } = await import(pathToFileURL(join(ANATOMY, "edu", "kit", "edu.mjs")).href);
    const { default: content } = await import(pathToFileURL(join(ANATOMY, "edu", name, "ko.mjs")).href);
    checkContent(content);
    console.log(`checked edu/${name}/ko.mjs`);
  }
  for (const theme of ["dark", "light"]) {
    const out = join("dist", `.tmp-${fig}-${theme}`);
    const file = theme === "light" ? `${fig}-light.html` : `${fig}.html`;
    rmSync(join("dist", file), { force: true });
    execFileSync(process.execPath, [vite, "build"], { stdio: "inherit", env: { ...process.env, HARNESS_FIG: fig, HARNESS_THEME: theme, HARNESS_OUT: out } });
    renameSync(join(out, "index.html"), join("dist", file));
    rmSync(out, { recursive: true, force: true });
    console.log("wrote dist/" + file);
    if (fig.endsWith("-ko")) {
      const name = fig.slice(0, -3);
      copyFileSync(join("dist", file), join(ANATOMY, "edu", name, file));
      console.log(`copied to edu/${name}/${file}`);
    }
  }
}
