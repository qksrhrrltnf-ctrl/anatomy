const DATA = __DATA__;
const follow = null;
const stage = document.querySelector(".td-stage");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const INDEX = (DATA.index * 180) / Math.PI;
const EDU_D = DATA.edu;
let angle = 0;
let target = 0;
let frame = 0;
let last = 0;
let visible = false;
// The idle tour runs only when edu-kit says so (adapter.tour) and never restarts by itself.
let touring = false;
let drawn = null;
let clock = 0;
let lift = 0;
let broken = 0;
let breaking = null;
let podHook;
const SPEED = 18;
// edu: an angle asked for by the panel, a step or a question; target walks there at most MAX_RATE °/s,
// then the usual easing follows, so even four turns read as a turn, never a jump.
let aim = null;
const MAX_RATE = 360;
// edu: the panel's auto-turn (°/s, + = clockwise on screen), eased in and out.
const spin = { x: 0, v: 0 };
let spinSpeed = 0;
let spinSign = 1;
let spinAim = 0;
let liftAim = 0;
let tapUntil = 0;
let pulseAge = -1;
let syncedAt = 0;
let edu = null;
const readingOf = (turn) => ((((INDEX + 90 - turn) / 3.6) % 100) + 100) % 100;
const readingAt = (turn) => Math.round(readingOf(turn)) % 100;
// The big wheel turns −θ × 8/32; its numeral under the window is (window − wheel angle) / 36.
const windowOf = (turn) => ((((EDU_D.window + turn * EDU_D.ratio) / 36) % 10) + 10) % 10;
const minus = (text) => text.replace("-", "−");
const describe = () => {
  const reading = readingAt(target);
  stage.setAttribute("aria-valuenow", String(reading));
  stage.setAttribute("aria-valuetext", `눈금 ${reading}${broken ? ", 포드가 떨어져 나갔습니다" : ""}`);
};
const hold = () => {
  touring = false;
};
let own = false;
const show = (value) => {
  const text = `눈금 ${readingAt(value)} · ${(((value % 360) + 360) % 360).toFixed(1)}°${broken ? " · 포드 분리" : ""}`;
  if (readout.textContent !== text) readout.textContent = text;
};
const podAt = () => {
  if (!breaking && podHook !== undefined) return podHook;
  if (!breaking) return broken ? breakAt(DATA.breakEnd) : null;
  const t = Math.min(DATA.breakEnd, breaking.time);
  return breakAt(breaking.reverse ? DATA.breakEnd - t : t);
};
let paint = () => {};
const controller = TURN.mount(stage, DATA.turn, {
  follow,
  // A tool (turn-check, drive "turn") has taken the dial: freeze everything else where it is.
  onHold: () => {
    touring = false;
    liftAim = lift;
    tapUntil = 0;
    aim = null;
    spinAim = 0;
    spin.x = spin.v = 0;
  },
  onFrame: (turned) => {
    const value = turned.values.dial;
    if (!own) {
      angle = target = drawn = value;
      aim = null;
      lift = turned.values.lift ?? lift;
      if ("pod" in turned.values) podHook = turned.values.pod;
      describe();
    }
    show(value);
    paint();
  },
});
const GLD = DATA.gl;
const LIGHT = (stage.closest("[data-theme]")?.getAttribute("data-theme") ?? "dark") !== "dark" ? 1 : 0;
const INK = `
uniform float uLight;
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 inkFor(vec3 seen,float cover){vec3 absorbed=1.-seen;float a=max(max(absorbed.r,max(absorbed.g,absorbed.b)),cover);return vec4(vec3(a)-absorbed,a);}
vec4 finish(vec4 ink,vec2 frag){ink.rgb=min(ink.rgb,vec3(ink.a));float n=(hash12(frag)-.5)/255.*smoothstep(0.,1.5/255.,ink.a);return clamp(ink+vec4(n),0.,1.);}
`;
const BACK = `${glslPose("Dial")}${INK}
uniform vec3 uLed;
uniform vec3 uLedDir;
uniform float uOn;
const float FACE_Z=${GLD.faceZ.toFixed(3)};
const float FACE_R=${GLD.faceR.toFixed(3)};
const float HUB_R=${GLD.hubR.toFixed(3)};
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  vec3 p=onFloor(vb,FACE_Z);
  vec3 q=toDial(p);
  float r=length(q.xy);
  float face=(1.-smoothstep(FACE_R-3.,FACE_R-1.,r))*smoothstep(HUB_R+.2,HUB_R+1.6,r);
  vec3 v=p-uLed;
  float d2=dot(v,v);
  float d=sqrt(d2);
  float lens=.3+.7*pow(max(0.,dot(v/d,uLedDir)),1.5);
  float lambert=max(0.,(uLed.z-FACE_Z+.6)/d);
  float grain=.84+.16*noise2(vec2(atan(q.y,q.x)*180.,r*.6));
  float e=420.*lens*lambert/(d2+10.)*grain*face;
  float lit=1.-exp(-e);
  vec3 tint=vec3(.40,.84,.60);
  vec4 light=inkFor(mix(vec3(1.),tint,.7*lit),0.);
  vec3 glow=vec3(.25,1.,.58)*lit*.55;
  vec4 dark=vec4(glow,max(glow.r,max(glow.g,glow.b)));
  gl_FragColor=finish(mix(dark,light,uLight)*uOn,gl_FragCoord.xy);
}`;
const FRONT = `${GLSL_TURN}${INK}
uniform vec2 uLedVb;
uniform float uLedR;
uniform float uLedFace;
uniform float uOn;
uniform vec4 uSpark[24];
uniform float uSparkHeat[24];
vec4 sparkInk(float heat,float along,float young){
  vec3 tail=mix(vec3(.78,.2,.04),vec3(1.,.55,.08),smoothstep(.35,.8,heat));
  vec3 head=mix(tail,vec3(1.,.74,.2),smoothstep(.55,.9,heat)*smoothstep(.5,1.,along));
  vec3 seen=mix(head,vec3(1.,.95,.82),young*smoothstep(.8,1.,along));
  float a=.88*smoothstep(0.,.3,along)*smoothstep(.12,.45,heat);
  vec4 light=vec4(seen*a,a);
  vec3 hot=mix(vec3(1.,.35,.05),vec3(1.,.9,.6),young*along)*(.4+.6*heat);
  vec4 dark=vec4(hot*a,a);
  return mix(dark,light,uLight);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=uView.x/uCanvas.x;
  float soft=.7*px;
  float d=length(vb-uLedVb);
  float body=1.-smoothstep(uLedR-.6*px,uLedR+.6*px,d);
  float core=1.-smoothstep(uLedR*.32,uLedR*.55+.5*px,d);
  float rim=smoothstep(uLedR*.55,uLedR,d);
  vec3 seen=mix(mix(vec3(.18,.70,.43),vec3(.11,.52,.31),rim),vec3(.90,1.,.94),core);
  vec4 lightLed=inkFor(seen,.92)*body;
  vec3 hot=mix(vec3(.2,1.,.55),vec3(.92,1.,.95),core)*body;
  vec4 darkLed=vec4(hot,body);
  vec4 led=mix(darkLed,lightLed,uLight)*smoothstep(.02,.3,uLedFace)*uOn;
  vec4 sparks=vec4(0.);
  float w=max(.35+.6*px,1.25*px);
  for(int i=0;i<24;i++){
    float heat=uSparkHeat[i];
    if(heat<=0.)continue;
    vec4 s=uSpark[i];
    vec2 a=s.zw;
    vec2 b=s.xy;
    vec2 ab=b-a;
    float l2=max(dot(ab,ab),1e-6);
    float t=clamp(dot(vb-a,ab)/l2,0.,1.);
    float dist=length(vb-a-ab*t);
    float cover=1.-smoothstep(w*.5-.5*px,w*.5+.5*px,dist);
    if(cover<=0.)continue;
    sparks=over(sparkInk(heat,t,step(.65,heat))*cover,sparks);
  }
  vec4 ink=over(sparks,led)*(1.-coverOf(vb,soft));
  gl_FragColor=finish(ink,gl_FragCoord.xy);
}`;
const canvasOf = (name) => stage.querySelector(`[data-canvas="${name}"]`);
const view = [GLD.W, GLD.H];
const backLayer = glLayer({ canvas: canvasOf("back"), fragment: BACK, view, camera: GLD.camera, uniforms: ["uLed", "uLedDir", "uOn", "uDialX", "uDialY", "uDialZ", "uDialT"], fixed: { uLight: LIGHT } });
const frontLayer = backLayer ? glLayer({ canvas: canvasOf("front"), fragment: FRONT, view, camera: GLD.camera, uniforms: ["uLedVb", "uLedR", "uLedFace", "uOn", "uSpark", "uSparkHeat", "uCoverEdge", "uCoverCount"], fixed: { uLight: LIGHT } }) : null;
const roomy = frontLayer ? frontLayer.gl.getParameter(frontLayer.gl.MAX_FRAGMENT_UNIFORM_VECTORS) >= 128 : false;
if (backLayer && frontLayer && roomy) stage.setAttribute("data-gl", "");
const SPARKS = 24;
const sparkData = new Float32Array(SPARKS * 4);
const sparkHeat = new Float32Array(SPARKS);
const sparks = [];
let first = { x: 0, v: 0 };
let glClock = 0;
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ignite = () => {
  const at = controller.anchor("dial", GLD.socket).world;
  const spin = ((angle - (drawn ?? angle)) * Math.PI) / 180;
  void spin;
  for (let i = 0; i < SPARKS; i++) {
    const a = random() * Math.PI * 2;
    const tilt = 0.35 + random() * 0.9;
    const speed = 16 + random() * 22;
    sparks[i] = { p: at.slice(), v: [Math.cos(a) * Math.sin(tilt) * speed, Math.sin(a) * Math.sin(tilt) * speed, Math.cos(tilt) * speed], age: -random() * 0.08, life: 0.3 + random() * 0.45 };
  }
};
const stepSparks = (dt) => {
  let live = false;
  for (let i = 0; i < SPARKS; i++) {
    const s = sparks[i];
    sparkHeat[i] = 0;
    if (!s) continue;
    s.age += dt;
    if (s.age < 0) {
      live = true;
      continue;
    }
    if (s.age > s.life) {
      sparks[i] = null;
      continue;
    }
    s.v[2] -= 98 * dt;
    for (let c = 0; c < 3; c++) s.p[c] += s.v[c] * dt;
    if (s.p[2] < GLD.faceZ) {
      sparks[i] = null;
      continue;
    }
    live = true;
  }
  return live;
};
const writeSparks = () => {
  const w = controller.cams().world;
  const project = (p) => [w.ox + w.m[0] * p[0] + w.m[1] * p[1] + w.m[2] * p[2], w.oy + w.m[3] * p[0] + w.m[4] * p[1] + w.m[5] * p[2]];
  for (let i = 0; i < SPARKS; i++) {
    const s = sparks[i];
    if (!s || s.age < 0) {
      sparkHeat[i] = 0;
      continue;
    }
    const head = project(s.p);
    const tail = project([s.p[0] - s.v[0] * 0.05, s.p[1] - s.v[1] * 0.05, s.p[2] - s.v[2] * 0.05]);
    sparkData.set([head[0], head[1], tail[0], tail[1]], 4 * i);
    sparkHeat[i] = 1 - s.age / s.life;
  }
};
paint = () => {
  if (!stage.hasAttribute("data-gl")) return;
  const led = controller.anchor(GLD.led.group, GLD.led.at, GLD.led.normal);
  const world = controller.cams().world;
  const facing = led.direction[0] * world.V[0] + led.direction[1] * world.V[1] + led.direction[2] * world.V[2];
  // edu: a solved combination flashes the LED once: smooth attack, exponential fall (webgl.md "Nothing pops").
  const on = first.x * (1 + 0.9 * (pulseAge >= 0 ? burst(pulseAge, 0.08, 0.45) : 0));
  backLayer.draw({ uLed: led.world, uLedDir: led.direction, uOn: on, ...TURN.poseUniforms(controller, "dial", "uDial") }, glClock);
  writeSparks();
  const live = sparks.some(Boolean);
  const cover = TURN.cover(controller, live ? [[GLD.led.part], ["hand.pod.socket"]] : [GLD.led.part]);
  frontLayer.draw({ uLedVb: led.screen, uLedR: 0.52 * world.k, uLedFace: facing, uOn: on, uSpark: sparkData, uSparkHeat: sparkHeat, uCoverEdge: cover.uCoverEdge, uCoverCount: cover.uCoverCount }, glClock);
  const u = first.x;
  const alpha = 0.92;
  stage.style.setProperty("--td-fallback", String(Math.max(0, (1 - u) / (1 - u * alpha + 1e-6))));
};
const draw = () => {
  own = true;
  controller.set({ dial: angle, lift, pod: podAt() });
  own = false;
  drawn = angle;
};

// ---------- the combination game (edu) ----------
// Level 1: three numbers, clockwise → counter-clockwise → clockwise, judged by the rules of a real
// combination lock (the drawing has no wheel pack). Level 2: a dial number and a window numeral, which
// needs the right number of turns: the 4:1 gear pair remembers how far the dial has gone.
const game = { on: false, level: 1, code: [30, 70, 10], step: 0, goal: { R: 50, W: 7 }, from: 0, lo: 0, hi: 0, moved: 0, last: 0 };
const NEED = [1, -1, 1];
const WORD = { 1: "시계 방향", "-1": "반시계 방향" };
let gameSeed = 11;
const roll = () => (gameSeed = (gameSeed * 16807) % 2147483647) / 2147483647;
function newCode() {
  const code = [];
  while (code.length < 3) {
    const n = Math.floor(roll() * 20) * 5;
    if (code.every((c) => Math.min(Math.abs(c - n), 100 - Math.abs(c - n)) >= 15) && Math.abs(n - readingAt(target)) >= 10) code.push(n);
  }
  game.code = code;
}
// A (dial number, window numeral) pair whose numeral sits square in the window: frac < 0.08.
function newGoal() {
  for (let tries = 0; tries < 400; tries++) {
    const R = Math.floor(roll() * 20) * 5;
    const n = Math.floor(roll() * 4) - 1;
    const turn = INDEX + 90 - 3.6 * R + 360 * n;
    const w = windowOf(turn);
    const off = Math.abs(w - Math.round(w));
    if (off < 0.08 && Math.abs(turn - target) > 300) {
      game.goal = { R, W: Math.round(w) % 10 };
      return;
    }
  }
  game.goal = { R: 50, W: 7 };
}
function segment() {
  game.from = game.lo = game.hi = target;
  game.moved = 0;
}
function gameSay(level, text, action) {
  edu?.status({ level, text, action });
}
function instruct(lead = "") {
  if (game.level === 2) {
    gameSay("info", `${lead}목표: 눈금 ${game.goal.R}, 창 숫자 ${game.goal.W}. 두 숫자를 함께 맞추십시오. 몇 바퀴를 돌려야 할까요?`, { label: "세 번호 놀이로", run: () => startGame(1) });
    return;
  }
  const [a, b, c] = game.code;
  const text = [`번호 ${a} → ${b} → ${c}. 먼저 시계 방향으로 돌려 ${a}에 멈추십시오.`, `좋습니다. 이제 반시계 방향으로 돌려 ${b}에 멈추십시오.`, `좋습니다. 마지막으로 시계 방향으로 돌려 ${c}에 멈추십시오.`][game.step];
  gameSay(game.step ? "ok" : "info", lead + text, { label: "새 번호", run: () => { newCode(); game.step = 0; segment(); instruct(); } });
}
function startGame(level) {
  game.level = level;
  edu?.sync("game", level === 2 ? "window" : "three");
  game.step = 0;
  if (level === 1) newCode();
  else newGoal();
  segment();
  instruct();
}
function celebrate() {
  pulseAge = still.matches ? -1 : 0;
  tapUntil = performance.now() + (still.matches ? 0 : 900);
  run();
}
function judge() {
  const up = game.hi - game.from > 1.8;
  const down = game.from - game.lo > 1.8;
  const dir = up && down ? 0 : up ? 1 : -1;
  const R = readingAt(target);
  segment();
  if (game.level === 2) {
    const w = windowOf(target);
    if (R === game.goal.R && Math.abs(w - game.goal.W) < 0.3) {
      celebrate();
      gameSay("ok", "맞습니다! 같은 눈금이라도 몇 바퀴 돌렸는지에 따라 창 숫자가 다릅니다. 큰 톱니바퀴가 회전을 기억합니다.", { label: "처음부터 다시", run: () => startGame(1) });
    } else instruct(`지금 눈금 ${R} · 창 ${w.toFixed(1)}. `);
    return;
  }
  const need = NEED[game.step];
  if (dir !== need) {
    game.step = 0;
    gameSay("warn", `방향이 반대입니다. ${WORD[need]}으로 돌려야 했습니다. 처음부터 다시 하십시오: 시계 방향으로 ${game.code[0]}.`, { label: "새 번호", run: () => { newCode(); segment(); instruct(); } });
    return;
  }
  if (R !== game.code[game.step]) {
    gameSay("info", `지금 눈금 ${R}입니다. 같은 방향으로 계속 돌려 ${game.code[game.step]}에 멈추십시오.`);
    return;
  }
  game.step++;
  if (game.step === 3) {
    celebrate();
    gameSay("ok", "열렸습니다! 세 번호를 정해진 방향으로 맞추었습니다.", { label: "창 숫자 도전", run: () => startGame(2) });
    game.step = 0;
    return;
  }
  instruct();
}
// Called every frame while the game is on: follow the dial, judge it once it has rested for 0.6 s.
function watch(now) {
  if (!game.on || touring || spin.x || spinAim) return false;
  if (target !== game.last) {
    game.last = target;
    game.lo = Math.min(game.lo, target);
    game.hi = Math.max(game.hi, target);
    game.moved = now;
  }
  const pending = game.hi - game.lo > 1.8;
  if (pending && !drag && aim === null && angle === target && now - game.moved > 600) {
    judge();
    return false;
  }
  return pending;
}

function syncPanel(now, force) {
  if (!edu || (!force && now - syncedAt < 250)) return;
  syncedAt = now;
  edu.sync("theta", Math.round(target * 10) / 10);
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (calm) touring = false;
  let moved = false;
  if (touring) {
    target += SPEED * dt;
    clock += dt;
    syncPanel(now, false);
  } else {
    const spinning = settle(spin, spinAim, dt, 0.3, calm);
    if (spin.x) target += spin.x * dt;
    if (spinning || spin.x) syncPanel(now, false);
    if (aim !== null) {
      const step = MAX_RATE * dt;
      const gap = aim - target;
      if (calm || Math.abs(gap) <= step) {
        target = aim;
        aim = null;
      } else target += Math.sign(gap) * step;
    }
  }
  angle = calm ? target : angle + (target - angle) * (1 - Math.exp(-dt / 0.12));
  if (Math.abs(target - angle) < 1e-3) angle = target;
  const want = touring ? tapAt(clock) : now < tapUntil ? 1 : liftAim;
  let nextLift = calm ? want : lift + (want - lift) * (1 - Math.exp(-dt / 0.15));
  if (Math.abs(want - nextLift) < 1e-4) nextLift = want;
  if (Math.abs(nextLift - lift) > 1e-5) moved = true;
  lift = nextLift;
  glClock += dt;
  const before = first.x;
  const lighting = stage.hasAttribute("data-gl") && settle(first, 1, dt, 0.35, calm);
  if (first.x !== before) moved = true;
  const sparking = stage.hasAttribute("data-gl") && stepSparks(calm ? 1 : dt);
  if (lighting || sparking) moved = true;
  if (pulseAge >= 0) {
    pulseAge += dt;
    moved = true;
    if (pulseAge > 2) pulseAge = -1;
  }
  if (breaking) {
    if (!breaking.reverse && breaking.time === 0 && !calm) ignite();
    breaking.time += calm ? DATA.breakEnd : dt;
    moved = true;
    if (breaking.time >= DATA.breakEnd) {
      broken = breaking.reverse ? 0 : 1;
      breaking = null;
      describe();
      edu?.refresh();
    }
  }
  if (moved || drawn === null || Math.abs(angle - drawn) > 1e-4) draw();
  const waiting = watch(now);
  const settled = !touring && angle === target && aim === null && spin.x === 0 && spinAim === 0 && !breaking && !lighting && !sparking && lift === want && now >= tapUntil && pulseAge < 0 && !waiting;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};
new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  },
  { rootMargin: "120px 0px" },
).observe(stage);

// The reader turns the dial: stop the tour, any auto-turn and any pending panel angle.
function grab() {
  edu?.takeOver();
  hold();
  aim = null;
  if (spinAim || spin.x) {
    spinAim = 0;
    spin.x = spin.v = 0;
    spinSpeed = 0;
    edu?.sync("speed", 0);
  }
}
function toggleBreak() {
  podHook = undefined;
  if (breaking) breaking = { reverse: !breaking.reverse, time: DATA.breakEnd - breaking.time };
  else breaking = { reverse: Boolean(broken), time: 0 };
  run();
}
const podGoing = () => (breaking ? !breaking.reverse : Boolean(broken));

let drag = null;
stage.addEventListener("pointerdown", (event) => {
  if (event.button > 0) return;
  grab();
  drag = { from: controller.angleAt(event.clientX, event.clientY, 17.2, "dial"), base: target, id: event.pointerId, captured: false };
});
stage.addEventListener("pointermove", (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  const now = controller.angleAt(event.clientX, event.clientY, 17.2, "dial");
  const delta = now - drag.from;
  if (!drag.captured && Math.abs(delta) > 1.5) {
    drag.captured = true;
    stage.setPointerCapture(event.pointerId);
    stage.setAttribute("data-drag", "");
  }
  if (!drag.captured) return;
  target = drag.base + delta;
  describe();
  syncPanel(performance.now(), false);
  run();
});
const release = (event) => {
  if (!drag || event.pointerId !== drag.id) return;
  drag = null;
  stage.removeAttribute("data-drag");
  try {
    stage.releasePointerCapture(event.pointerId);
  } catch {}
  syncPanel(performance.now(), true);
  run();
};
stage.addEventListener("pointerup", release);
stage.addEventListener("pointercancel", release);
stage.addEventListener("keydown", (event) => {
  if (event.key === "b" || event.key === "B") {
    event.preventDefault();
    edu?.takeOver();
    toggleBreak();
    edu?.sync("pod", podGoing());
    return;
  }
  const step = event.shiftKey ? 36 : 3.6;
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.round(target / 3.6) * 3.6 - step;
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.round(target / 3.6) * 3.6 + step;
  if (event.key === "Home") next = INDEX + 90 - 360 * Math.round((INDEX + 90 - target) / 360);
  if (next === null) return;
  event.preventDefault();
  grab();
  target = next;
  describe();
  syncPanel(performance.now(), true);
  run();
});

edu = EDU.mount({
  stage,
  probe: true,
  set(id, value) {
    if (id === "theta") {
      aim = value;
      spinAim = spinSpeed = 0;
      spin.x = spin.v = 0;
      edu?.sync("speed", 0);
    } else if (id === "speed" || id === "dir") {
      if (id === "speed") spinSpeed = value;
      else spinSign = value === "ccw" ? -1 : 1;
      spinAim = spinSpeed * spinSign;
      if (spinAim) aim = null;
      if (spinAim && game.on) edu?.setParam("game", "off");
    } else if (id === "lift") liftAim = value ? 1 : 0;
    else if (id === "pod") {
      if (Boolean(value) !== podGoing()) toggleBreak();
    } else if (id === "game") {
      game.on = value !== "off";
      if (game.on) {
        if (spinAim) {
          spinAim = spinSpeed = 0;
          edu?.sync("speed", 0);
        }
        startGame(value === "window" ? 2 : 1);
      } else edu?.status(null);
    }
    describe();
    run();
  },
  tour(on) {
    touring = on && !still.matches;
    if (touring) aim = null;
    run();
  },
  values() {
    const th = aim ?? target;
    const speed = Math.abs(spinAim);
    const R = readingAt(th);
    const wheel = -th * EDU_D.ratio;
    const L = liftAim;
    return {
      theta: { n: th, t: minus(`${th.toFixed(1)}°`) },
      R: { n: R, t: String(R) },
      turns: { n: th / 360, t: minus((th / 360).toFixed(2)) },
      wheel: { n: wheel, t: minus(`${wheel.toFixed(1)}°`) },
      win: { n: windowOf(th), t: windowOf(th).toFixed(1) },
      speed: { n: speed, t: `${speed}°/s` },
      T: speed ? { n: 360 / speed, t: `${(360 / speed).toFixed(1)} s` } : { n: 0, t: "—" },
      perSec: { n: speed / 3.6, t: `${(speed / 3.6).toFixed(1)}칸` },
      way: !speed ? "정지" : spinAim < 0 ? "반시계 방향" : "시계 방향",
      mcp: { n: -22 * L, t: minus(`${(-22 * L).toFixed(0)}°`) },
      pip: { n: -14 * L, t: minus(`${(-14 * L).toFixed(0)}°`) },
      dip: { n: -9 * L, t: minus(`${(-9 * L).toFixed(0)}°`) },
      pod: podGoing() ? "떨어짐" : "붙어 있음",
    };
  },
});
if (still.matches) touring = false;
draw();
describe();
