// edu-kit build helper: wraps an Anatomy figure in the Korean teaching layer.
// Usage and the ko.mjs schema are in edu/kit/README.md.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The runtime source (defines one global, `EDU`). Inline it before the figure's live script. */
export const eduScript = () => readFileSync(join(HERE, "edu.js"), "utf8");
/** The teaching layer's CSS. */
export const eduCss = () => readFileSync(join(HERE, "edu.css"), "utf8");

const KEYS_SCHEMA = ["parts", "params", "formulas", "steps", "questions"];

/** Checks a ko.mjs content object and throws on the mistakes that would only show in the browser. */
export function checkContent(content) {
  const problems = [];
  const ids = new Set((content.parts || []).map((part) => part.id));
  const params = new Set((content.params || []).map((param) => param.id));
  for (const key of KEYS_SCHEMA) if (content[key] !== undefined && !Array.isArray(content[key])) problems.push(`${key} must be an array`);
  if (!content.card?.title) problems.push("card.title is missing");
  for (const part of content.parts || []) {
    if (!part.id || !part.name || !part.say) problems.push(`part ${part.id || "?"}: needs id, name and say (select defaults to [data-piece="id"])`);
  }
  for (const param of content.params || []) {
    if (!["range", "toggle", "choice", "action"].includes(param.type)) problems.push(`param ${param.id}: type must be range, toggle, choice or action`);
    if (param.type === "action" && !param.label) problems.push(`param ${param.id}: an action needs a label`);
    if (param.type === "range" && !(param.min < param.max && param.step > 0)) problems.push(`param ${param.id}: range needs min < max and step > 0`);
    if (param.type === "choice" && !(param.options || []).some((option) => option.value === param.value)) problems.push(`param ${param.id}: value is not one of its options`);
  }
  const focusOf = (where, list) => {
    for (const id of list || []) if (!ids.has(id)) problems.push(`${where}: focus "${id}" is not a part id`);
  };
  (content.steps || []).forEach((step, index) => {
    if (!step.title || !step.text) problems.push(`step ${index + 1}: needs title and text`);
    focusOf(`step ${index + 1}`, step.focus);
  });
  (content.questions || []).forEach((question, index) => {
    if (!question.q || !(question.choices || []).length) problems.push(`question ${index + 1}: needs q and choices`);
    if ((question.choices || []).filter((choice) => choice.correct).length !== 1) problems.push(`question ${index + 1}: exactly one choice must be correct`);
    focusOf(`question ${index + 1}`, question.focus);
  });
  for (const [where, pose] of [
    ...(content.steps || []).map((step, index) => [`step ${index + 1}`, step.pose]),
    ...(content.questions || []).flatMap((question, index) => [[`question ${index + 1} from`, question.from], [`question ${index + 1} to`, question.to]]),
  ]) {
    for (const [key, value] of Object.entries(pose || {})) {
      const param = (content.params || []).find((entry) => entry.id === key);
      if (param?.type === "range" && (value < param.min || value > param.max)) problems.push(`${where}: ${key} = ${value} is outside ${param.min}..${param.max}`);
    }
  }
  if (problems.length) throw new Error(`ko.mjs content:\n  ${problems.join("\n  ")}`);
  return content;
}

/**
 * Builds the whole teaching page.
 * @param {object} o
 * @param {object} o.content  the ko.mjs default export
 * @param {"dark"|"light"} o.theme
 * @param {string} o.stage    the figure's stage markup: `<div class="iso-stage" ...><svg>…</svg></div>`
 * @param {string} [o.css]    the figure's own CSS
 * @param {string} o.script   the figure's script: kitScript() (+ glScript()) + live; it calls EDU.mount(adapter)
 * @param {string} [o.head]   extra markup before the plate inside the card body (a PDF button, say)
 * @param {number} [o.width]  page width in px (default 1120)
 * @param {string} [o.figureClass]  extra class on the figure wrapper (.edu-figure), for CSS scoped to the example (e.g. "rp")
 * @param {string} [o.pageClass]    extra class on the page wrapper (.edu)
 */
export function eduPage({ content, theme = "dark", stage, css = "", script, head = "", width = 1120, figureClass = "", pageClass = "" }) {
  checkContent(content);
  const card = content.card;
  const plate = k.plateHtml({
    fig: card.fig || "그림 1",
    title: card.title,
    hint: card.hint || "",
    readout: card.readout || "",
    keys: card.keys || [],
    caption: card.caption,
    body: `${head}${stage}<div class="edu-status" data-edu-status role="status" aria-live="polite"></div><div class="edu-tip" data-edu-tip role="tooltip" id="edu-tip" hidden></div>`,
  });
  const page = content.page || {};
  const header = `<header class="edu-head">${page.kicker ? `<p class="edu-kicker">${escape(page.kicker)}</p>` : ""}<h1 class="edu-title">${escape(page.heading || card.title)}</h1>${page.lead ? `<p class="edu-lead">${escape(page.lead)}</p>` : ""}</header>`;
  const json = JSON.stringify(content).replace(/</g, "\\u003c");
  const body = `<style>${eduCss()}${css}</style><div class="edu${pageClass ? ` ${escape(pageClass)}` : ""}">${header}<div class="edu-layout"><div class="edu-figure${figureClass ? ` ${escape(figureClass)}` : ""}">${plate}</div><aside class="edu-panel" data-edu-panel aria-label="${escape(page.panelLabel || "학습 패널")}"></aside></div>${page.footer ? `<footer class="edu-foot">${escape(page.footer)}</footer>` : ""}</div><script type="application/json" id="edu-content">${json}</script>`;
  const html = k.pageHtml({ title: page.title || card.title, theme, body, script: eduScript() + "\n" + script, width });
  return html.replace('<html lang="en">', `<html lang="${content.lang || "ko"}">`);
}

/** Writes the page next to the build and logs it, like the examples do. */
export function writePage(dir, name, html) {
  writeFileSync(join(dir, name), html);
  console.log("wrote", name);
}
