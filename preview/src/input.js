// Keyboard + mouse on desktop, virtual joystick + buttons on touch screens.
// Game code asks for named actions, never raw keys.
import { isTouch, renderer } from './core.js';

const KEYS = {
  sprint: ['ShiftLeft', 'ShiftRight'], sneak: ['KeyC'], interact: ['KeyE'], takedown: ['KeyF'], throw: ['KeyG'],
  brake: ['Space'], pause: ['Escape', 'KeyP'], retry: ['KeyR'], confirm: ['Enter', 'Space'],
};
const held = new Set(), pressed = new Set(), tHeld = new Set(), tPressed = new Set();
let lookX = 0, lookY = 0, dragging = false;
const stick = { id: null, ox: 0, oy: 0, x: 0, y: 0 }, look = { id: null, x: 0, y: 0 };
const $ = (id) => document.getElementById(id);
const canvas = renderer.domElement;

addEventListener('keydown', (e) => {
  if (!e.repeat) pressed.add(e.code);
  held.add(e.code);
  if (e.code === 'Space' || e.code === 'Tab') e.preventDefault();
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => held.clear());
canvas.addEventListener('mousedown', () => (dragging = true));
addEventListener('mouseup', () => (dragging = false));
addEventListener('mousemove', (e) => {
  if (isTouch || (!dragging && document.pointerLockElement !== canvas)) return;
  lookX += e.movementX; lookY += e.movementY;
});

// ---------- touch ----------
const layer = $('touch'), stickEl = $('stick'), knob = $('knob'), btns = $('btns');
const STICK_R = 55;
function stickHome() { stickEl.style.left = ''; stickEl.style.top = ''; stickEl.classList.remove('live'); knob.style.transform = ''; }
if (isTouch) {
  document.body.classList.add('touch');
  layer.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tbtn')) return;
    if (e.clientX < innerWidth * 0.45 && stick.id === null) {
      stick.id = e.pointerId; stick.ox = e.clientX; stick.oy = e.clientY;
      stickEl.style.left = e.clientX - 60 + 'px'; stickEl.style.top = e.clientY - 60 + 'px'; stickEl.classList.add('live');
    } else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
  });
  layer.addEventListener('pointermove', (e) => {
    if (e.pointerId === stick.id) {
      const dx = e.clientX - stick.ox, dy = e.clientY - stick.oy, m = Math.hypot(dx, dy), k = m > STICK_R ? STICK_R / m : 1;
      stick.x = (dx * k) / STICK_R; stick.y = (-dy * k) / STICK_R;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    } else if (e.pointerId === look.id) {
      lookX += (e.clientX - look.x) * 1.7; lookY += (e.clientY - look.y) * 1.7; look.x = e.clientX; look.y = e.clientY;
    }
  });
  const end = (e) => {
    if (e.pointerId === stick.id) { stick.id = null; stick.x = stick.y = 0; stickHome(); }
    if (e.pointerId === look.id) look.id = null;
  };
  layer.addEventListener('pointerup', end); layer.addEventListener('pointercancel', end);
  bindButton($('tpause'), 'pause');
}
function bindButton(el, action) {
  el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); tHeld.add(action); tPressed.add(action); el.classList.add('down'); });
  const up = () => { tHeld.delete(action); el.classList.remove('down'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
}

export const input = {
  held: (a) => tHeld.has(a) || (KEYS[a]?.some((k) => held.has(k)) ?? false),
  pressed: (a) => tPressed.has(a) || (KEYS[a]?.some((k) => pressed.has(k)) ?? false),
  /** x right, y forward, each -1..1 */
  move() {
    const k = (a, b) => (a.some((c) => held.has(c)) ? 1 : 0) - (b.some((c) => held.has(c)) ? 1 : 0);
    let x = k(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']) + stick.x, y = k(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']) + stick.y;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    return { x, y };
  },
  consumeLook() { const r = { x: lookX, y: lookY }; lookX = lookY = 0; return r; },
  endFrame() { pressed.clear(); tPressed.clear(); },
  lock() { if (!isTouch) try { canvas.requestPointerLock?.()?.catch?.(() => {}); } catch { /* needs a user gesture */ } },
  unlock() { if (document.pointerLockElement) document.exitPointerLock?.(); },
  /** Touch buttons for the current context: [{ a: 'interact', label: 'ACT' }] */
  setButtons(list) {
    btns.innerHTML = ''; tHeld.clear();
    for (const b of list) {
      const el = document.createElement('div'); el.className = 'tbtn'; el.dataset.a = b.a; el.textContent = b.label;
      bindButton(el, b.a); btns.appendChild(el);
    }
  },
  highlight(action) { for (const el of btns.children) el.classList.toggle('hot', el.dataset.a === action); },
  showTouch(on) { layer.style.display = isTouch && on ? 'block' : 'none'; if (!on) { stick.id = look.id = null; stick.x = stick.y = 0; stickHome(); } },
};
