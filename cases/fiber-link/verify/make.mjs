// Writes the drive scenarios for both themes: node verify/make.mjs
import { writeFileSync } from "node:fs";
const set = (pairs) => `(() => { const set = (id, v) => { const i = document.getElementById('edu-p-' + id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }; const pick = (label) => [...document.querySelectorAll('.edu-seg')].find(b => b.textContent.trim() === label).click(); ${pairs} return 1; })()`;
const formulas = "[...document.querySelectorAll('.edu-formula dd')].map(d => d.textContent).join(' | ') + ' || ' + document.querySelector('[data-edu-status]').textContent";
for (const T of ["dark", "light"]) {
  const a = [
    ["wait", 900],
    ["shot", `shots/final/ko-desktop-${T}.png`, ".edu", 1],
    ["move", '[data-piece="mandrel"]', 0.5, 0.4], ["wait", 500], ["shot", `shots/final/ko-tooltip-${T}.png`, ".edu-figure", 1.5],
    ["move", '[data-piece="cladding"]', 0.5, 0.5], ["wait", 500], ["shot", `shots/final/ko-tooltip-cladding-${T}.png`, ".edu-figure", 1.5],
    ["move", ".edu-head", 0.5, 0.5],
    ["eval", set("set('theta0', 0); set('n2', 1.4); set('L', 0); pick('15 mm');")], ["wait", 400],
    ["eval", formulas],
    ["shot", `shots/final/ko-var-min-${T}.png`, ".edu-layout", 1],
    ["eval", set("set('theta0', 30); set('n2', 1.475); set('L', 150); pick('5 mm');")], ["click", "#edu-p-send"], ["wait", 3500],
    ["eval", formulas],
    ["shot", `shots/final/ko-var-max-${T}.png`, ".edu-layout", 1],
    ["shot", `shots/final/ko-window-max-${T}.png`, ".iso-stage", 3, [380, 175, 250, 115]],
    ["eval", set("set('theta0', 22); set('n2', 1.46); set('L', 20); pick('10 mm');")], ["wait", 400],
    ["shot", `shots/final/ko-window-leak-${T}.png`, ".iso-stage", 3, [380, 175, 250, 115]],
    ["eval", set("set('theta0', 12); set('n2', 1.46); set('L', 100); pick('5 mm');")], ["click", "#edu-p-send"], ["wait", 4100],
    ["shot", `shots/final/ko-bend-glow-${T}.png`, ".iso-stage", 3, [560, 330, 190, 140]],
    ["click", "#edu-tab-steps"], ["click", ".edu-dot:nth-child(4)"], ["wait", 2200],
    ["shot", `shots/final/ko-steps-${T}.png`, ".edu-layout", 1],
    ["click", ".edu-dot:nth-child(7)"], ["wait", 4200],
    ["shot", `shots/final/ko-steps-bend-${T}.png`, ".edu-layout", 1],
    ["click", "#edu-tab-questions"], ["wait", 200],
    ["click", ".edu-q:nth-of-type(1) .edu-choice:nth-child(3)"], ["wait", 2400],
    ["click", ".edu-q:nth-of-type(3) .edu-choice:nth-child(3)"], ["wait", 8000],
    ["shot", `shots/final/ko-questions-${T}.png`, ".edu-layout", 1],
    ["eval", "document.querySelector('[data-readout]').textContent"],
    ["click", "#edu-tab-parts"], ["wait", 200],
    ["eval", "(() => { const b = [...document.querySelectorAll('.edu-part')][10]; b.click(); b.focus(); return b.textContent; })()"], ["wait", 400],
    ["shot", `shots/final/ko-parts-${T}.png`, ".edu-layout", 1],
  ];
  writeFileSync(new URL(`./final-${T}.json`, import.meta.url), JSON.stringify(a));
}
// Line ends in resting poses (highlight cleared by moving to the parts tab).
const lines = [["wait", 600]];
for (const [n, wait] of [[1, 3000], [4, 1500], [5, 1500], [7, 5500], [9, 1500]]) lines.push(["click", "#edu-tab-steps"], ["click", `.edu-dot:nth-child(${n})`], ["wait", wait], ["click", "#edu-tab-parts"], ["wait", 400], ["eval", "document.querySelector('[data-readout]').textContent"], ["lines", null]);
writeFileSync(new URL("./lines.json", import.meta.url), JSON.stringify(lines));
// Keyboard: type on the figure, check the receiver decodes it.
writeFileSync(new URL("./keys.json", import.meta.url), JSON.stringify([
  ["wait", 500], ["click", ".iso-stage", 0.1, 0.1],
  ["key", "O", ".iso-stage"], ["key", "K", ".iso-stage"], ["wait", 300],
  ["eval", "document.querySelector('[data-edu-autoplay], #edu-autoplay')?.getAttribute('aria-checked') + ' ' + document.querySelector('[data-readout]').textContent"],
  ["until", "document.querySelector('[data-readout]').textContent.includes('OK')", 15000],
  ["eval", "document.querySelector('[data-readout]').textContent"],
  ["key", "ArrowRight", "#edu-p-L"], ["key", "ArrowRight", "#edu-p-L"],
  ["eval", "document.getElementById('edu-p-L').value + ' | ' + document.querySelector('.fl-km').textContent"],
  ["shot", "shots/t-keys.png", ".edu-figure", 1],
]));
writeFileSync(new URL("./phone.json", import.meta.url), JSON.stringify([
  ["wait", 1500], ["shot", "shots/final/ko-phone-THEME.png", ".edu", 1.5],
  ["eval", "(() => { document.getElementById('edu-tab-steps').click(); document.querySelectorAll('.edu-dot')[3].click(); return document.querySelector('.edu-step-title').textContent; })()"], ["wait", 1500],
  ["shot", "shots/final/ko-phone-steps-THEME.png", ".edu-layout", 1.5],
  ["eval", "document.documentElement.scrollWidth + ' ' + window.innerWidth"],
]));
