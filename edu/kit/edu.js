// edu-kit runtime: Korean teaching layer for Anatomy figures.
// Inlined before the figure's live script; defines one global, EDU. See edu/kit/README.md.
const EDU = (() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const mounted = new WeakMap(); // stage → handle, so a second mount on the same stage is ignored
  const UI = {
    tabsLabel: "학습 도구",
    tabs: { params: "실험", steps: "단계", questions: "질문", parts: "부품" },
    formulas: "공식으로 계산한 값",
    reset: "처음 값으로",
    autoplay: "자동 재생",
    autoplayHelp: "그림이 스스로 움직이며 원리를 보여 줍니다. 그림이나 패널을 조작하면 꺼집니다.",
    step: "단계",
    prev: "이전",
    next: "다음",
    stepFocus: "강조한 부품",
    stepPick: "단계 고르기",
    partsHint: "부품을 누르면 그림에서 강조합니다. 한 번 더 누르면 풀립니다.",
    question: "질문",
    questionsHint: "먼저 예측하고 답을 고르십시오. 그림이 그 조건으로 바뀌어 답을 확인시켜 줍니다.",
    checking: "그림으로 확인하는 중입니다…",
    correct: "정답입니다.",
    wrong: "아쉽습니다. 정답은 ‘{answer}’입니다.",
    retry: "다시 풀기",
    replay: "다시 보기",
  };

  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : String(value));
    }
    for (const kid of kids.flat()) if (kid !== undefined && kid !== null && kid !== false) el.append(kid);
    return el;
  };
  const trimNumber = (value, digits) => (digits === undefined ? String(value) : String(+Number(value).toFixed(digits)));

  /**
   * Mounts the teaching layer on one figure. Returns a handle; handle.destroy() undoes everything.
   * adapter: { stage?, root?, panel?, set, values?, pose?, takeOver?, tour?, highlight?, hoverTips? }
   */
  function mount(adapter, options = {}) {
    const stage = adapter.stage || document.querySelector(".iso-stage");
    if (mounted.has(stage)) return mounted.get(stage);
    const content = options.content || JSON.parse(document.getElementById("edu-content").textContent);
    const ui = { ...UI, ...(content.ui || {}), tabs: { ...UI.tabs, ...(content.ui?.tabs || {}) } };
    // Where parts live: every <svg> in the stage by default (a figure may stack back SVG, canvas, front SVG).
    const roots = adapter.root ? [].concat(adapter.root) : [...stage.querySelectorAll("svg")];
    const inRoots = (el) => !!el && roots.some((root) => root === el || root.contains(el));
    const plate = stage.closest(".iso-plate") || stage.parentElement;
    const panel = adapter.panel === undefined ? document.querySelector("[data-edu-panel]") : adapter.panel;
    const partAttr = adapter.partAttr || content.partAttr || "data-piece";
    const parts = (content.parts || []).map((part) => (part.select ? part : { ...part, select: `[${partAttr}="${part.id}"]` }));
    const params = content.params || [];
    const steps = content.steps || [];
    const questions = content.questions || [];
    const partById = new Map(parts.map((part) => [part.id, part]));
    const paramById = new Map(params.map((param) => [param.id, param]));
    const state = {};
    const syncers = new Map();
    const refreshers = [];
    const cleanups = [];
    const timers = new Set();
    const created = [];
    const listen = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      cleanups.push(() => target.removeEventListener(type, fn, opts));
    };
    const later = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    };
    const cancel = (id) => { clearTimeout(id); timers.delete(id); };
    // The tooltip and status line come from eduPage(); a page built another way (React) gets them made here.
    const own = (selector, make) => {
      const found = plate.querySelector(selector);
      if (found) return found;
      const el = make();
      created.push(el);
      return el;
    };
    const tip = own("[data-edu-tip]", () => plate.appendChild(h("div", { class: "edu-tip", "data-edu-tip": "", role: "tooltip", hidden: true })));
    const statusBox = own("[data-edu-status]", () => { const el = h("div", { class: "edu-status", "data-edu-status": "", role: "status", "aria-live": "polite" }); stage.after(el); return el; });

    // ---------- values and templates ----------
    const normal = (raw) => {
      const out = {};
      for (const [key, value] of Object.entries(raw || {})) out[key] = value && typeof value === "object" ? value : { n: typeof value === "number" ? value : NaN, t: String(value) };
      return out;
    };
    const valuesNow = () => normal(adapter.values?.());
    const ratioText = (from, to) => {
      if (!from || !to || !Number.isFinite(from.n) || !Number.isFinite(to.n) || from.n === 0) return "—";
      const ratio = to.n / from.n;
      const round = Math.round(ratio);
      return `${Math.abs(ratio - round) < 0.005 ? round : trimNumber(ratio, 2)}배`;
    };
    // keep a number and its unit on one line: "1.80 W", "5 Ω"
    const glue = (out) => out.replace(/(\d) (?=[A-Za-zΩ%°µ])/g, "$1 ");
    const fill = (text, ctx = {}) => {
      if (!text) return "";
      const now = ctx.now || valuesNow();
      return glue(String(text).replace(/\{(?:(from|to|ratio)\.)?([A-Za-z_]\w*)\}/g, (match, scope, key) => {
        if (scope === "ratio") return ratioText(ctx.from?.[key], ctx.to?.[key]);
        if (key === "answer" && ctx.answer) return ctx.answer;
        const table = scope ? ctx[scope] : now;
        return table?.[key]?.t ?? match;
      }));
    };

    // ---------- tour policy: on at load (unless reduced motion), off for good once the reader acts ----------
    let autoplay = !!adapter.tour && content.autoplay !== false && !still.matches;
    let syncAutoplay = () => {};
    function takeOver() {
      if (autoplay) {
        autoplay = false;
        adapter.tour?.(false);
        syncAutoplay();
      }
      adapter.takeOver?.();
    }
    function setAutoplay(on) {
      autoplay = !!on && !still.matches;
      adapter.tour?.(autoplay);
      syncAutoplay();
    }

    // ---------- highlight ----------
    // Priority: hover > flash > pick (parts list) > guide (step or question).
    // DOM writes stay small: the root gets data-edu-focus, the lit part's elements data-edu-on and their
    // ancestors data-edu-path; CSS (edu.css) dims every sibling along that path. Nothing else is touched,
    // so a 1 MB drawing costs one style recalc, not hundreds of attribute writes.
    const dimMode = content.dim === "fade" ? "fade" : "tone";
    const keepSelector = ["[data-edu-keep]", ...(content.keep || [])].join(",");
    for (const root of roots) {
      for (const el of root.querySelectorAll(keepSelector)) {
        if (el.hasAttribute("data-edu-keep")) continue;
        el.setAttribute("data-edu-keep", "");
        cleanups.push(() => el.removeAttribute("data-edu-keep"));
      }
    }
    const layers = { hover: null, flash: null, pick: null, guide: null };
    let marked = [];
    let lastKey = "";
    const cache = new Map();
    const elementsOf = (ids) => {
      const set = new Set();
      for (const id of ids || []) {
        const part = partById.get(id);
        if (!part) continue;
        let list = cache.get(id);
        if (!list || list.some((el) => !el.isConnected)) {
          list = [];
          for (const root of roots) {
            if (root.matches?.(part.select)) list.push(root);
            list.push(...root.querySelectorAll(part.select));
          }
          cache.set(id, list);
        }
        for (const el of list) set.add(el);
      }
      return set;
    };
    function clearDim() {
      for (const el of marked) {
        el.removeAttribute("data-edu-on");
        el.removeAttribute("data-edu-path");
      }
      marked = [];
      for (const root of roots) root.removeAttribute("data-edu-focus");
    }
    function defaultHighlight(ids) {
      clearDim();
      const on = elementsOf(ids);
      if (!on.size) return;
      for (const el of on) {
        el.setAttribute("data-edu-on", "");
        marked.push(el);
      }
      for (const root of roots) {
        if (on.has(root)) continue; // the whole root is the part: nothing in it dims
        for (const el of on) {
          if (!root.contains(el)) continue;
          for (let node = el.parentElement; node && node !== root; node = node.parentElement) {
            if (node.hasAttribute("data-edu-path")) break;
            node.setAttribute("data-edu-path", "");
            marked.push(node);
          }
        }
        root.setAttribute("data-edu-focus", dimMode); // a root without the part dims all its children
      }
    }
    function applyFocus() {
      const ids = layers.hover || layers.flash || layers.pick || layers.guide || null;
      const key = (ids || []).join(",");
      if (key === lastKey) return;
      lastKey = key;
      if (adapter.highlight) adapter.highlight(ids && ids.length ? ids : null);
      else defaultHighlight(ids);
    }
    const reFocus = () => { lastKey = "\u0000"; applyFocus(); };
    let flashTimer = 0;
    let sequenceRun = 0;
    function flash(ids, ms = 1200) {
      sequenceRun++;
      cancel(flashTimer);
      layers.flash = ids && ids.length ? [].concat(ids) : null;
      applyFocus();
      if (layers.flash) flashTimer = later(() => { layers.flash = null; applyFocus(); }, ms);
    }
    function sequence(list, { each = 1100, loop = false } = {}) {
      const run = ++sequenceRun;
      let index = 0;
      const next = () => {
        if (run !== sequenceRun) return;
        if (index >= list.length) {
          if (!loop) { layers.flash = null; applyFocus(); return; }
          index = 0;
        }
        layers.flash = [].concat(list[index++]);
        applyFocus();
        flashTimer = later(next, each);
      };
      cancel(flashTimer);
      next();
      return () => { if (run === sequenceRun) { sequenceRun++; cancel(flashTimer); layers.flash = null; applyFocus(); } };
    }

    // ---------- tooltip ----------
    let tipPart = null;
    const anyPart = parts.map((part) => part.select).join(",");
    const partAtPoint = (x, y) => {
      if (!anyPart) return null;
      // walk the stack under the pointer (a front SVG or a canvas may sit over the part); delegate with closest().
      // adapter.probe: the drawing has pointer-events:none, so switch hit-testing on for this one lookup.
      if (adapter.probe) stage.setAttribute("data-edu-probe", "");
      const stack = document.elementsFromPoint(x, y);
      if (adapter.probe) stage.removeAttribute("data-edu-probe");
      for (const el of stack) {
        if (!inRoots(el)) continue;
        const match = el.closest(anyPart);
        if (!match || !inRoots(match)) continue;
        const part = parts.find((entry) => match.matches(entry.select));
        if (part) return part;
      }
      return null;
    };
    const fillTip = (part) => {
      tipPart = part;
      tip.replaceChildren(...[h("strong", { class: "edu-tip-name" }, part.name), h("span", { class: "edu-tip-say" }, fill(part.say)), part.more ? h("span", { class: "edu-tip-more" }, fill(part.more)) : null].filter(Boolean));
      tip.hidden = false;
    };
    const placeTip = (place) => {
      const box = plate.getBoundingClientRect();
      const width = tip.offsetWidth;
      const height = tip.offsetHeight;
      let x;
      let y;
      if (place.rect) {
        const r = place.rect;
        x = r.left + r.width / 2 - box.left - width / 2;
        y = r.top - box.top - height - 10;
        if (y < 8) y = r.bottom - box.top + 10;
      } else {
        x = place.x - box.left + 16;
        y = place.y - box.top + 18;
        if (x + width > box.width - 8) x = place.x - box.left - width - 16;
        if (y + height > box.height - 8) y = place.y - box.top - height - 14;
      }
      x = Math.max(8, Math.min(x, box.width - width - 8));
      y = Math.max(8, Math.min(y, box.height - height - 8));
      tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
    };
    const hideTip = () => {
      tipPart = null;
      tip.hidden = true;
    };
    const rectOf = (id) => {
      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      for (const el of elementsOf([id])) {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      }
      return left === Infinity ? null : { left, top, width: right - left, height: bottom - top, bottom };
    };
    const setHover = (part) => {
      layers.hover = part ? [part.id] : null;
      applyFocus();
    };
    const showFor = (part) => {
      setHover(part);
      fillTip(part);
      const rect = rectOf(part.id);
      if (rect) placeTip({ rect });
    };
    // Hover shows a tip; a touch tap shows it for a moment. A drag (moved > 8 px or held > 500 ms) is the
    // figure's own gesture and never pops a tip; nor does a mouse moving with a button down.
    let touchTimer = 0;
    let down = null;
    let pending = null;
    let moveFrame = 0;
    if (adapter.hoverTips !== false) {
      listen(stage, "pointerdown", (event) => { down = { x: event.clientX, y: event.clientY, t: performance.now(), moved: false }; });
      listen(stage, "pointermove", (event) => {
        if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 8) down.moved = true;
        if (event.pointerType === "touch") return;
        if (event.buttons) {
          if (tipPart) { setHover(null); hideTip(); }
          return;
        }
        pending = { x: event.clientX, y: event.clientY };
        if (moveFrame) return;
        moveFrame = requestAnimationFrame(() => {
          moveFrame = 0;
          if (!pending || !alive) return;
          const { x, y } = pending;
          const part = partAtPoint(x, y);
          setHover(part);
          if (!part) return hideTip();
          if (tipPart !== part) fillTip(part);
          placeTip({ x, y });
        });
      });
      cleanups.push(() => cancelAnimationFrame(moveFrame));
      listen(stage, "pointerleave", (event) => {
        if (event.pointerType === "touch") return;
        pending = null;
        setHover(null);
        hideTip();
      });
      listen(stage, "pointerup", (event) => {
        const tap = down && !down.moved && performance.now() - down.t < 500;
        down = null;
        if (event.pointerType !== "touch" || !tap) return;
        const part = partAtPoint(event.clientX, event.clientY);
        if (!part) return;
        setHover(part);
        fillTip(part);
        placeTip({ x: event.clientX, y: event.clientY });
        cancel(touchTimer);
        touchTimer = later(() => { setHover(null); hideTip(); }, 2600);
      });
      listen(stage, "pointercancel", () => { down = null; });
    }

    // ---------- params ----------
    const fmtParam = (param, value) => {
      if (param.type === "range") return `${trimNumber(value, param.digits)}${param.unit ? ` ${param.unit}` : ""}`;
      if (param.type === "toggle") return value ? param.on || "켬" : param.off || "끔";
      if (param.type === "action") return param.label;
      return (param.options.find((option) => option.value === value) || {}).label || String(value);
    };
    // An action control has no state: it runs adapter.action(id) (or adapter.set(id, true)) once.
    function runAction(id, user = false) {
      if (user) takeOver();
      if (adapter.action) adapter.action(id);
      else adapter.set(id, true);
      refresh();
    }
    // The figure changed a value itself (drag, keys): move the control and the text, never call adapter.set.
    function sync(id, value) {
      const param = paramById.get(id);
      if (!param || param.type === "action") return;
      if (param.type === "range") value = Math.min(param.max, Math.max(param.min, Number(value)));
      if (state[id] === value) return refresh();
      state[id] = value;
      syncers.get(id)?.(value);
      refresh();
    }
    function setParam(id, value, user = false) {
      const param = paramById.get(id);
      if (!param) return;
      if (param.type === "action") {
        if (value) runAction(id, user);
        return;
      }
      if (param.type === "range") value = Math.min(param.max, Math.max(param.min, Number(value)));
      if (param.type === "toggle") value = !!value;
      state[id] = value;
      syncers.get(id)?.(value);
      if (user) takeOver();
      adapter.set(id, value);
      refresh();
    }
    const switchControl = ({ id, label, help, get, flip, text }) => {
      const state = h("span", { class: "edu-switch-state" });
      const button = h("button", { class: "edu-switch", type: "button", role: "switch", id, "aria-checked": "false", onclick: flip }, h("span", { class: "edu-switch-track", "aria-hidden": "true" }, h("span", { class: "edu-switch-knob" })), h("span", { class: "edu-switch-label" }, label), state);
      const sync = () => {
        button.setAttribute("aria-checked", get() ? "true" : "false");
        state.textContent = text(get());
      };
      return { el: h("div", { class: "edu-param" }, button, help ? h("p", { class: "edu-help" }, help) : null), sync };
    };
    function paramControl(param) {
      const id = `edu-p-${param.id}`;
      if (param.type === "range") {
        const out = h("output", { class: "edu-param-value", for: id });
        const input = h("input", { class: "edu-range", type: "range", id, min: param.min, max: param.max, step: param.step, value: param.value, oninput: () => setParam(param.id, Number(input.value), true) });
        syncers.set(param.id, (value) => {
          if (Number(input.value) !== value) input.value = value;
          out.textContent = fmtParam(param, value);
          input.setAttribute("aria-valuetext", fmtParam(param, value));
          input.style.setProperty("--edu-fill", `${(((value - param.min) / (param.max - param.min)) * 100).toFixed(1)}%`);
        });
        return h("div", { class: "edu-param" },
          h("div", { class: "edu-param-head" }, h("label", { for: id }, param.label), out),
          input,
          h("div", { class: "edu-param-scale", "aria-hidden": "true" }, h("span", {}, fmtParam(param, param.min)), h("span", {}, fmtParam(param, param.max))),
          param.help ? h("p", { class: "edu-help" }, param.help) : null);
      }
      if (param.type === "action") {
        const button = h("button", { class: "edu-btn edu-action", type: "button", id, onclick: () => runAction(param.id, true) }, param.label);
        return h("div", { class: "edu-param" }, button, param.help ? h("p", { class: "edu-help" }, param.help) : null);
      }
      if (param.type === "toggle") {
        const control = switchControl({ id, label: param.label, help: param.help, get: () => state[param.id], flip: () => setParam(param.id, !state[param.id], true), text: (on) => fmtParam(param, on) });
        syncers.set(param.id, control.sync);
        return control.el;
      }
      const labelId = `${id}-label`;
      const buttons = param.options.map((option, index) => h("button", {
        class: "edu-seg", type: "button", role: "radio", "aria-checked": "false", tabindex: "-1",
        onclick: () => setParam(param.id, option.value, true),
        onkeydown: (event) => {
          const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
          if (!step) return;
          event.preventDefault();
          const next = param.options[(index + step + param.options.length) % param.options.length];
          setParam(param.id, next.value, true);
          buttons[param.options.indexOf(next)].focus();
        },
      }, option.label));
      syncers.set(param.id, (value) => buttons.forEach((button, index) => {
        const on = param.options[index].value === value;
        button.setAttribute("aria-checked", on ? "true" : "false");
        button.tabIndex = on ? 0 : -1;
      }));
      return h("div", { class: "edu-param" },
        h("div", { class: "edu-param-head" }, h("span", { id: labelId, class: "edu-param-label" }, param.label)),
        h("div", { class: "edu-segs", role: "radiogroup", "aria-labelledby": labelId }, buttons),
        param.help ? h("p", { class: "edu-help" }, param.help) : null);
    }

    // ---------- poses ----------
    let poseTimer = 0;
    function applyPose(pose) {
      if (!pose) return;
      takeOver();
      for (const [key, value] of Object.entries(pose)) if (paramById.has(key)) setParam(key, value);
      adapter.pose?.(pose);
      refresh();
    }

    // ---------- panel ----------
    const panes = {};
    const tabs = {};
    const order = panel ? [["params", params.length || adapter.tour], ["steps", steps.length], ["questions", questions.length], ["parts", parts.length]].filter(([, n]) => n).map(([name]) => name) : [];
    const tablist = h("div", { class: "edu-tabs", role: "tablist", "aria-label": ui.tabsLabel });
    let current = null;
    function selectTab(name, focus = false) {
      if (current === name) return;
      const leaving = current;
      current = name;
      for (const other of order) {
        const on = other === name;
        tabs[other].setAttribute("aria-selected", on ? "true" : "false");
        tabs[other].tabIndex = on ? 0 : -1;
        panes[other].hidden = !on;
      }
      if (focus) tabs[name].focus();
      if (leaving === "steps" || leaving === "questions") {
        layers.guide = null;
        applyFocus();
      }
      if (name === "steps" && leaving !== null) goStep(stepAt);
    }
    for (const name of order) {
      tabs[name] = h("button", { class: "edu-tab", type: "button", role: "tab", id: `edu-tab-${name}`, "aria-controls": `edu-pane-${name}`, "aria-selected": "false", tabindex: "-1", onclick: () => selectTab(name) }, ui.tabs[name]);
      tabs[name].addEventListener("keydown", (event) => {
        const index = order.indexOf(name);
        const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: order.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        selectTab(order[(next + order.length) % order.length], true);
      });
      tablist.append(tabs[name]);
      panes[name] = h("section", { class: "edu-pane", role: "tabpanel", id: `edu-pane-${name}`, "aria-labelledby": `edu-tab-${name}`, tabindex: "0", hidden: true });
    }

    // params pane
    if (panes.params) {
      const formulas = h("dl", { class: "edu-formulas" });
      const rows = (content.formulas || []).map((formula) => {
        const dd = h("dd", {});
        formulas.append(h("div", { class: "edu-formula" }, h("dt", {}, formula.label), dd));
        return () => { dd.textContent = fill(formula.text); };
      });
      const note = content.formulaNote ? h("p", { class: "edu-help" }) : null;
      refreshers.push(() => {
        rows.forEach((row) => row());
        if (note) note.textContent = fill(content.formulaNote);
      });
      let tour = null;
      if (adapter.tour) {
        tour = switchControl({ id: "edu-autoplay", label: ui.autoplay, help: ui.autoplayHelp, get: () => autoplay, flip: () => setAutoplay(!autoplay), text: (on) => (on ? "켬" : "끔") });
        syncAutoplay = tour.sync;
      }
      panes.params.append(
        content.paramsIntro ? h("p", { class: "edu-intro" }, content.paramsIntro) : null,
        h("div", { class: "edu-params" }, params.map(paramControl), tour ? tour.el : null),
        rows.length ? h("div", { class: "edu-block" }, h("h3", { class: "edu-block-title" }, content.formulasTitle || ui.formulas), formulas) : null,
        note,
        params.length ? h("div", { class: "edu-actions" }, h("button", { class: "edu-btn", type: "button", onclick: () => { takeOver(); for (const param of params) if (param.type !== "action") setParam(param.id, param.value); adapter.pose?.({ reset: true }); refresh(); } }, ui.reset)) : null,
      );
    }

    // steps pane
    let stepAt = 0;
    const stepBits = {};
    function goStep(index, focusTitle = false) {
      stepAt = Math.max(0, Math.min(steps.length - 1, index));
      const step = steps[stepAt];
      applyPose(step.pose);
      layers.guide = step.focus?.length ? step.focus : null;
      applyFocus();
      renderStep();
      if (focusTitle) stepBits.title.focus();
    }
    function renderStep() {
      if (!panes.steps) return;
      const step = steps[stepAt];
      stepBits.count.textContent = `${ui.step} ${stepAt + 1} / ${steps.length}`;
      stepBits.title.textContent = fill(step.title);
      stepBits.text.textContent = fill(step.text);
      stepBits.focus.replaceChildren(...(step.focus?.length ? [h("span", { class: "edu-chip-label" }, ui.stepFocus), ...step.focus.map((id) => h("span", { class: "edu-chip" }, partById.get(id)?.name || id))] : []));
      stepBits.dots.forEach((dot, index) => {
        if (index === stepAt) dot.setAttribute("aria-current", "step");
        else dot.removeAttribute("aria-current");
        if (index < stepAt) dot.dataset.done = "";
        else delete dot.dataset.done;
      });
      stepBits.prev.disabled = stepAt === 0;
      stepBits.next.disabled = stepAt === steps.length - 1;
    }
    if (panes.steps) {
      stepBits.count = h("p", { class: "edu-step-count" });
      stepBits.dots = steps.map((step, index) => h("button", { class: "edu-dot", type: "button", "aria-label": `${index + 1}${ui.step}: ${step.title}`, onclick: () => goStep(index) }));
      stepBits.title = h("h3", { class: "edu-step-title", tabindex: "-1" });
      stepBits.text = h("p", { class: "edu-step-text" });
      stepBits.focus = h("p", { class: "edu-chips" });
      stepBits.prev = h("button", { class: "edu-btn", type: "button", onclick: () => goStep(stepAt - 1, true) }, `← ${ui.prev}`);
      stepBits.next = h("button", { class: "edu-btn edu-btn-main", type: "button", onclick: () => goStep(stepAt + 1, true) }, `${ui.next} →`);
      panes.steps.append(
        h("div", { class: "edu-step-head" }, stepBits.count, h("div", { class: "edu-dots", role: "group", "aria-label": ui.stepPick }, stepBits.dots)),
        h("div", { class: "edu-step-body", "aria-live": "polite" }, stepBits.title, stepBits.text, stepBits.focus),
        h("div", { class: "edu-step-nav" }, stepBits.prev, stepBits.next),
      );
      refreshers.push(() => { stepBits.text.textContent = fill(steps[stepAt].text); });
    }

    // questions pane
    const questionDelay = (question) => (still.matches ? 250 : question.delay ?? content.questionDelay ?? 1400);
    if (panes.questions) {
      panes.questions.append(h("p", { class: "edu-intro" }, content.questionsIntro || ui.questionsHint));
      questions.forEach((question, qIndex) => {
        const qid = `edu-q-${qIndex}`;
        const result = h("div", { class: "edu-q-result", "aria-live": "polite" });
        const answer = question.choices.find((choice) => choice.correct).label;
        let chosen = -1;
        const run = () => {
          cancel(poseTimer);
          applyPose(question.from);
          layers.guide = question.focus?.length ? question.focus : null;
          applyFocus();
          const from = valuesNow();
          result.replaceChildren(h("p", { class: "edu-q-wait" }, ui.checking));
          poseTimer = later(() => {
            applyPose(question.to);
            const to = valuesNow();
            const right = question.choices[chosen].correct;
            result.replaceChildren(
              h("p", { class: "edu-q-verdict", "data-right": right ? "true" : "false" }, fill(right ? ui.correct : ui.wrong, { answer })),
              h("p", { class: "edu-q-explain" }, fill(question.explain, { from, to, answer })),
              h("div", { class: "edu-actions" }, h("button", { class: "edu-btn", type: "button", onclick: run }, ui.replay), h("button", { class: "edu-btn", type: "button", onclick: reset }, ui.retry)),
            );
          }, questionDelay(question));
        };
        const buttons = question.choices.map((choice, index) => h("button", {
          class: "edu-choice", type: "button",
          onclick: () => {
            if (chosen >= 0) return;
            chosen = index;
            buttons.forEach((button, at) => {
              button.setAttribute("aria-disabled", "true");
              if (question.choices[at].correct) button.dataset.state = "right";
              else if (at === index) button.dataset.state = "wrong";
            });
            buttons[index].setAttribute("aria-pressed", "true");
            run();
          },
        }, fill(choice.label)));
        function reset() {
          cancel(poseTimer);
          chosen = -1;
          result.replaceChildren();
          buttons.forEach((button) => {
            button.removeAttribute("aria-disabled");
            button.removeAttribute("aria-pressed");
            delete button.dataset.state;
          });
          buttons[0].focus();
        }
        panes.questions.append(h("div", { class: "edu-q" },
          h("p", { class: "edu-q-num" }, `${ui.question} ${qIndex + 1}`),
          h("p", { class: "edu-q-text", id: qid }, fill(question.q)),
          h("div", { class: "edu-choices", role: "group", "aria-labelledby": qid }, buttons),
          result));
      });
    }

    // parts pane
    let clearPick = () => {};
    if (panes.parts) {
      const items = parts.map((part) => {
        const say = h("span", { class: "edu-part-say" });
        const button = h("button", {
          class: "edu-part", type: "button", "aria-pressed": "false",
          onclick: () => {
            const same = layers.pick && layers.pick[0] === part.id;
            layers.pick = same ? null : [part.id];
            for (const item of items) item.button.setAttribute("aria-pressed", !same && item.part === part ? "true" : "false");
            applyFocus();
          },
          onpointerenter: () => showFor(part),
          onpointerleave: () => { setHover(null); hideTip(); },
          onfocus: () => showFor(part),
          onblur: () => { setHover(null); hideTip(); },
        }, h("span", { class: "edu-part-name" }, part.name), say);
        return { part, button, say };
      });
      clearPick = () => {
        layers.pick = null;
        for (const item of items) item.button.setAttribute("aria-pressed", "false");
        applyFocus();
      };
      refreshers.push(() => items.forEach((item) => { item.say.textContent = fill(item.part.say); }));
      panes.parts.append(h("p", { class: "edu-intro" }, content.partsIntro || ui.partsHint), h("ul", { class: "edu-parts" }, items.map((item) => h("li", {}, item.button))));
    }
    if (panel) panel.append(...(order.length ? [tablist] : []), ...order.map((name) => panes[name]));

    // Keys: the figure's own handlers come first. Escape reaches the layer only when the figure did not
    // consume it (preventDefault) and focus is not inside the stage; then it clears the pick and any flash.
    listen(document, "keydown", (event) => {
      if (event.key !== "Escape" || event.defaultPrevented || stage.contains(event.target)) return;
      if (!layers.pick && !layers.flash) return;
      sequenceRun++;
      cancel(flashTimer);
      layers.flash = null;
      clearPick();
      applyFocus();
    });

    // ---------- status line under the figure ----------
    let statusKey = "";
    function status(next) {
      const key = next ? `${next.level}|${fill(next.text)}|${next.action?.label || ""}` : "";
      if (key === statusKey) return;
      statusKey = key;
      if (!next) {
        statusBox.replaceChildren();
        statusBox.removeAttribute("data-level");
        return;
      }
      statusBox.dataset.level = next.level || "info";
      statusBox.replaceChildren(...[h("span", { class: "edu-status-dot", "aria-hidden": "true" }), h("span", { class: "edu-status-text" }, fill(next.text)), next.action ? h("button", { class: "edu-btn edu-status-action", type: "button", onclick: () => { takeOver(); next.action.run(); } }, next.action.label) : null].filter(Boolean));
    }

    // The card's caption and legend keys may hold {key} templates too: they follow the model like the panel.
    const figure = plate.closest("figure");
    const captionEl = figure?.querySelector(".iso-caption");
    if (captionEl && /\{\w+\}/.test(content.card?.caption || "")) refreshers.push(() => { const text = fill(content.card.caption); if (captionEl.textContent !== text) captionEl.textContent = text; });
    const keyEls = figure ? [...figure.querySelectorAll(".iso-key")] : [];
    (content.card?.keys || []).forEach((key, index) => {
      const el = keyEls[index];
      if (!el || !/\{\w+\}/.test(key.label || "")) return;
      const label = [...el.childNodes].find((node) => node.nodeType === 3);
      if (label) refreshers.push(() => { label.textContent = fill(key.label); });
    });

    function refresh() {
      for (const run of refreshers) run();
      if (tipPart) fillTip(tipPart);
    }

    let alive = true;
    function destroy() {
      if (!alive) return;
      alive = false;
      sequenceRun++;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      for (const undo of cleanups.splice(0)) undo();
      if (adapter.highlight) adapter.highlight(null);
      clearDim();
      hideTip();
      statusBox.replaceChildren();
      statusBox.removeAttribute("data-level");
      for (const el of created) el.remove();
      if (panel) panel.replaceChildren();
      adapter.tour?.(false);
      mounted.delete(stage);
    }

    const handle = {
      refresh,
      status,
      setParam: (id, value) => setParam(id, value),
      sync,
      action: (id) => runAction(id),
      param: (id) => state[id],
      focus: (ids) => { layers.guide = ids?.length ? ids : null; applyFocus(); },
      flash,
      sequence,
      hint: (text) => { const el = plate.querySelector('[data-corner="hint"]'); if (el && el.textContent !== text) el.textContent = text; },
      takeOver,
      autoplay: (on) => (on === undefined ? autoplay : setAutoplay(on)),
      values: valuesNow,
      fill,
      still: () => still.matches,
      destroy,
    };
    mounted.set(stage, handle);

    // first paint: defaults from the content, then the tour policy, then the first tab
    for (const param of params) {
      if (param.type === "action") continue;
      state[param.id] = param.value;
      syncers.get(param.id)?.(param.value);
      adapter.set(param.id, param.value, { initial: true });
    }
    adapter.tour?.(autoplay);
    syncAutoplay();
    if (order.length) selectTab(content.start && order.includes(content.start) ? content.start : order[0]);
    if (current === "steps") renderStep(); // shown without applying the pose, so the tour keeps playing
    refresh();
    reFocus();
    return handle;
  }

  return { mount, still };
})();

// Also reachable from other scripts (React pages, tests): window.EDU.
if (typeof window !== "undefined") window.EDU = EDU;
