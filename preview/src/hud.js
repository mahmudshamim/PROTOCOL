// HUD, waypoint marker, fades, pause and end screens.
import { THREE, camera, isTouch } from './core.js';
import { input } from './input.js';

const $ = (id) => document.getElementById(id);
const v = new THREE.Vector3();
let noteT = 0, marker = null, markerLabel = '', foe = null;
const pops = [];
const toScreen = (p) => { v.copy(p).project(camera); return v.z > 1 ? null : [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight]; };

export const hud = {
  show(on) { $('hud').style.display = on ? 'block' : 'none'; },
  objective(t) { $('objText').textContent = t; },
  security(text, color) { $('sec').style.display = text ? 'block' : 'none'; $('secText').textContent = text; $('secText').style.color = color; },
  secLabel(t) { $('secLabel').textContent = t; },
  bar(value, color) {
    $('detect').style.display = value === null ? 'none' : 'block';
    if (value !== null) { $('bar').style.width = value * 100 + '%'; $('bar').style.background = color; }
  },
  note(t, d = 4.5) { $('note').textContent = t; noteT = d; },
  /** p = { key, text, action } or null */
  prompt(p) {
    $('prompt').innerHTML = p ? (isTouch ? p.text : `<kbd>${p.key}</kbd>${p.text}`) : '';
    input.highlight(p?.action ?? null);
  },
  flags(html) { $('flags').innerHTML = html; },
  marker(pos, label = '') { marker = pos; markerLabel = label; },
  health(n) {
    $('health').style.display = n === null ? 'none' : 'flex';
    if (n === null) return;
    const v = Math.max(0, Math.round(n));
    $('hpFill').style.width = v + '%'; $('hpFill').style.background = v > 50 ? '#7cff9a' : v > 25 ? '#ffd84a' : '#ff3b30';
    $('hpNum').textContent = v;
  },
  /** Floating number at a world position, e.g. damage. */
  pop(pos, text, color) {
    const el = document.createElement('div'); el.className = 'pop'; el.textContent = text; el.style.color = color;
    $('pops').appendChild(el); pops.push({ el, pos: pos.clone(), t: 0 });
  },
  /** Health bar above a guard, or null to hide. */
  foe(info) { foe = info; },
  flash() {
    const f = $('flash'); f.style.transition = 'none'; f.style.opacity = 0.5;
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.transition = 'opacity .7s'; f.style.opacity = 0; }));
  },
  fade(on) { return new Promise((r) => { $('fade').style.opacity = on ? 1 : 0; setTimeout(r, 480); }); },
  bars(on) { $('bars').classList.toggle('off', !on); },
  caption(t) { $('caption').textContent = t; },
  pause(on) { $('pause').style.display = on ? 'flex' : 'none'; },
  end(title, html, buttons) {
    $('end').style.display = 'flex'; $('endTitle').textContent = title; $('endText').innerHTML = html;
    const box = $('endBtns'); box.innerHTML = '';
    for (const b of buttons) {
      const el = document.createElement('div'); el.className = 'endbtn';
      el.innerHTML = isTouch ? b.label : `${b.label} <kbd>${b.key}</kbd>`;
      el.addEventListener('click', b.run); box.appendChild(el);
    }
  },
  hideEnd() { $('end').style.display = 'none'; },
  update(dt, from) {
    noteT -= dt; if (noteT <= 0) $('note').textContent = '';
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt; const s = toScreen(p.pos);
      if (p.t > 1.1 || !s) { p.el.remove(); pops.splice(i, 1); continue; }
      p.el.style.left = s[0] + 'px'; p.el.style.top = s[1] - p.t * 50 + 'px'; p.el.style.opacity = 1 - p.t / 1.1;
    }
    const fb = $('foe'), fs = foe && toScreen(foe.pos);
    fb.style.display = fs ? 'block' : 'none';
    if (fs) { fb.style.left = fs[0] + 'px'; fb.style.top = fs[1] + 'px'; $('foeFill').style.width = Math.max(0, foe.frac * 100) + '%'; }
    const m = $('marker');
    if (!marker) { m.style.display = 'none'; return; }
    m.style.display = 'block';
    v.copy(marker).project(camera);
    let x = v.x, y = v.y;
    if (v.z > 1) { x = -x; y = -y; }
    const s = Math.max(Math.abs(x) / 0.9, Math.abs(y) / 0.82);
    if (v.z > 1 || s > 1) { x /= Math.max(s, 1e-3); y /= Math.max(s, 1e-3); }
    m.style.left = ((x + 1) / 2) * innerWidth + 'px'; m.style.top = ((1 - y) / 2) * innerHeight + 'px';
    $('markerText').textContent = `${markerLabel} ${Math.round(from.distanceTo(marker))} m`;
  },
};
