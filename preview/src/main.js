// PROTOCOL preview: boot, stage flow, menu, pause, endings.
import { THREE, params, render, loadAssets, isTouch, LOW } from './core.js';
import { M, resetMission, saveCheckpoint, loadCheckpoint, outcome } from './state.js';
import { audio } from './audio.js';
import { input } from './input.js';
import { hud } from './hud.js';
import * as facility from './stages/facility.js';
import * as highway from './stages/highway.js';
import * as yard from './stages/yard.js';
import * as pursuit from './stages/pursuit.js';

const STAGES = { facility, highway, yard, pursuit };
const $ = (id) => document.getElementById(id);
let stage = null, phase = 'boot', switching = false, t = 0;

const ctx = {
  next: (id) => goto(id),
  /** Build a stage in the background without leaving the current one. */
  preload: (id, opts) => STAGES[id].create(ctx, opts),
  /** Switch to a preloaded stage on the same frame: no fade, the old stage stays in the scene. */
  swap(next) { stage = next; next.enter(); },
  fail(title, text) {
    if (phase === 'over') return;
    phase = 'over'; input.unlock(); input.showTouch(false); hud.show(false); audio.siren(false); audio.engine(0, 0);
    hud.end(title, text, [{ label: 'RETRY CHECKPOINT', key: 'R', run: retry }, { label: 'RESTART', key: 'ENTER', run: () => location.reload() }]);
  },
  win() {
    phase = 'over'; input.unlock(); input.showTouch(false); hud.show(false); audio.siren(false);
    const o = outcome(), secs = Math.round((performance.now() - M.startTime) / 1000);
    const text = {
      GHOST: 'Nobody saw you and nobody knows LATTICE is gone. By the time the morning shift opens the lab, you are three states away.',
      SHADOW: `The alarm went out, but nobody saw your face. ${M.alarmCause} Somewhere a report says "unknown intruder".`,
      HUNTED: `They know your face. ${M.alarmCause} Sable's last message: "Disappear. Don't call this number again."`,
    }[o.base];
    const wreck = o.wreck ? '<br><br>The car dies a mile past the turn-off. You walk the rest of the way, the device warm in your jacket.' : '';
    const stats = `<br><br><small style="opacity:.6">Time ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')} · Takedowns ${M.takedowns} · Alarm ${M.alarm ? 'yes' : 'no'} · Identified ${M.identified ? 'yes' : 'no'} · Bike crashes ${M.crashes} · Car damage ${Math.round(M.damage)}%</small>`;
    hud.end(o.wreck ? `${o.base} · WRECK` : o.base, text + wreck + stats, [{ label: 'PLAY AGAIN', key: 'ENTER', run: () => location.reload() }]);
  },
};

async function goto(id, { checkpoint = false } = {}) {
  if (switching) return;
  if (params.has('log')) console.log('GOTO-START ' + id);
  switching = true;
  input.showTouch(false); hud.show(false);
  await hud.fade(true);
  stage?.dispose();
  stage = await STAGES[id].create(ctx);
  hud.hideEnd();
  stage.enter();
  phase = 'play'; switching = false;
  if (params.has('log')) console.log('GOTO ' + id);
  await hud.fade(false);
  if (params.has('log')) console.log('FADED ' + id);
  if (!checkpoint) input.lock();
}

function retry() {
  if (switching) return;
  hud.hideEnd();
  goto(loadCheckpoint(), { checkpoint: true });
}

function startGame() {
  if (phase !== 'menu') return;
  audio.start();
  if (isTouch) goFullscreen(false);
  $('title').style.display = 'none'; phase = 'intro'; t = 0; hud.bars(true);
}

// ---------- full screen (hides the browser's address bar) ----------
const root = document.documentElement;
const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
if (standalone) document.body.classList.add('standalone');
function goFullscreen(explain = true) {
  if (document.fullscreenElement || document.webkitFullscreenElement || standalone) return;
  if (canFullscreen) {
    const p = (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' });
    p?.then?.(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } else if (explain) $('iosHint').style.display = 'flex'; // iPhone Safari has no full-screen API for pages
}
const syncFs = () => document.body.classList.toggle('fs', !!(document.fullscreenElement || document.webkitFullscreenElement));
document.addEventListener('fullscreenchange', syncFs); document.addEventListener('webkitfullscreenchange', syncFs);
$('tfull').addEventListener('pointerdown', (e) => e.stopPropagation());
$('tfull').addEventListener('pointerup', (e) => { e.stopPropagation(); goFullscreen(); });
$('pauseFull').addEventListener('click', () => goFullscreen());
$('iosHint').addEventListener('click', () => ($('iosHint').style.display = 'none'));
if (params.has('ioshint')) $('iosHint').style.display = 'flex'; // test: show the iPhone hint

// ---------- boot ----------
await loadAssets();
if (params.has('alarm')) { M.alarm = true; M.alarmCause = 'A guard identified you.'; M.alarmBeforeTheft = !params.has('stolen'); }
if (params.has('id')) { M.identified = true; M.described = true; }
if (params.has('bike')) M.bikeSeen = true;
if (params.has('stolen')) M.stolen = true;
const jump = params.get('stage');
stage = await (STAGES[jump] ?? facility).create(ctx);
saveCheckpoint(jump ?? 'facility');
$('load').style.display = 'none';
if (jump) { $('title').style.display = 'none'; stage.enter(); phase = 'play'; }
else phase = 'menu';
$('title').addEventListener('click', startGame);
// no page zoom or text selection from fast taps on phones
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
$('touch').addEventListener('touchstart', (e) => { if (e.touches.length > 1 || e.target.closest('.tbtn')) e.preventDefault(); }, { passive: false });
let lastTouch = 0;
document.addEventListener('touchend', (e) => { const now = performance.now(); if (now - lastTouch < 350) e.preventDefault(); lastTouch = now; }, { passive: false });
$('pauseBtn').addEventListener('click', () => togglePause(false));
if (LOW) $('tag').textContent += ' · LOW QUALITY (PHONE)';

function togglePause(on) {
  if (on && phase === 'play') { phase = 'pause'; hud.pause(true); input.unlock(); input.showTouch(false); }
  else if (!on && phase === 'pause') { phase = 'play'; hud.pause(false); input.showTouch(true); input.lock(); }
}

// headless testing: ?sim=seconds advances the simulation before the first frame
const sim = Number(params.get('sim') ?? 0);
for (let i = 0; i < sim * 30 && phase === 'play'; i++) { if (i % 15 === 0) await new Promise((r) => setTimeout(r, 0)); stage.update(1 / 30, i / 30); stage.animate(1 / 30, i / 30); }
if (params.has('log')) console.log('STATE ' + JSON.stringify({ phase, M, end: $('endTitle').textContent, cam: stage.focus, dbg: stage.debug?.() }));

const clock = new THREE.Clock();
renderer_loop();
function renderer_loop() {
  requestAnimationFrame(renderer_loop);
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
  if (phase === 'menu') { stage.menu?.(time); if (input.pressed('confirm')) startGame(); }
  else if (phase === 'intro') {
    t += dt;
    if (stage.intro(t) || input.pressed('confirm') || input.pressed('interact')) { stage.enter(); phase = 'play'; input.lock(); }
  } else if (phase === 'play' && !switching) {
    if (input.pressed('pause')) togglePause(true);
    else stage.update(dt, time);
  } else if (phase === 'pause') { if (input.pressed('pause') || input.pressed('confirm')) togglePause(false); }
  else if (phase === 'over') {
    if (input.pressed('retry') && $('endBtns').textContent.includes('RETRY')) retry();
    else if (input.pressed('confirm')) location.reload();
  }
  if (phase !== 'pause') stage.animate(dt, time);
  hud.update(dt, stage.focus);
  render(dt);
  input.endFrame();
}
