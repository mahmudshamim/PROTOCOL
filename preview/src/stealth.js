// Guards, security cameras, perception and alarms (GDD sections 4 and 5).
// Used by the facility and the container yard.
import { THREE, human, anim, face, clamp, glow, A } from './core.js';
import { M } from './state.js';
import { audio } from './audio.js';
import { hud } from './hud.js';

const RANGE = 26, HALF = THREE.MathUtils.degToRad(60);
const CAM_RANGE = 18, CAM_HALF = THREE.MathUtils.degToRad(26);
const coneGeo = new THREE.CircleGeometry(RANGE * 0.6, 28, Math.PI / 2 - HALF, HALF * 2);
const camConeGeo = new THREE.CircleGeometry(CAM_RANGE, 20, Math.PI / 2 - CAM_HALF, CAM_HALF * 2);
const angleTo = (from, h, to) => Math.abs(Math.atan2(Math.sin(Math.atan2(to.x - from.x, to.z - from.z) - h), Math.cos(Math.atan2(to.x - from.x, to.z - from.z) - h)));
const coneMat = () => new THREE.MeshBasicMaterial({ color: 0x7cff9a, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide });
const stateColor = (aw, chase) => (chase ? 0xff3b30 : aw >= 0.6 ? 0xff8a3c : aw >= 0.25 ? 0xffd84a : 0x7cff9a);

/**
 * opts: { player, nav, isLit, guards: [{ wps, tint, unarmed, inactive, face, control }], cameras: [...],
 *         onCapture(text), onAlarm(pos) }
 */
export function createStealth(world, opts) {
  const { player, nav, isLit } = opts;
  const v2 = new THREE.Vector3();

  const guards = opts.guards.map((d, i) => {
    const g = human(world.group, d.tint ?? 0xc4cfe0);
    g.root.position.set(d.wps[0][0], 0, d.wps[0][1]);
    Object.assign(g, {
      id: i, def: d, wps: d.wps.map(([x, z]) => new THREE.Vector3(x, 0, z)), wi: d.wps.length > 1 ? 1 : 0,
      mode: 'patrol', aw: 0, last: new THREE.Vector3(), wait: 0, lost: 0, radio: null, down: false, found: false,
      pause: 0, fireT: 1, active: !d.inactive, unarmed: !!d.unarmed,
    });
    g.cone = new THREE.Mesh(coneGeo, coneMat()); g.cone.userData.shared = true;
    g.cone.rotation.x = Math.PI / 2; g.cone.position.y = 0.06; g.root.add(g.cone);
    g.flash = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), glow(0xffd27a, 8)); g.flash.position.set(0.2, 1.35, 0.6); g.flash.visible = false; g.root.add(g.flash);
    g.root.visible = g.active;
    if (d.face !== undefined) { g.h = d.face; g.root.rotation.y = d.face; }
    return g;
  });
  const control = guards.find((g) => g.def.control) ?? null;

  const cams = (opts.cameras ?? []).map((c) => {
    const head = new THREE.Group(); head.position.set(c.x, c.y ?? 4.5, c.z); world.add(head);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.55), A.dark); body.castShadow = true; head.add(body);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), glow(0xff2a1a, 3)); lens.position.z = 0.29; head.add(lens);
    if (c.pole) world.mesh(new THREE.CylinderGeometry(0.06, 0.08, c.y ?? 4.5), A.metal, c.x, (c.y ?? 4.5) / 2, c.z);
    const cone = new THREE.Mesh(camConeGeo, coneMat()); cone.userData.shared = true; cone.rotation.x = Math.PI / 2;
    const pivot = new THREE.Group(); pivot.add(cone); pivot.position.set(c.x, 0.07, c.z); world.add(pivot);
    return { ...c, head, lens, pivot, cone, aw: 0, t: Math.random() * 10, yawNow: c.yaw, tripped: false, timer: null };
  });

  function raiseAlarm(pos, cause, described) {
    if (described) M.described = true;
    if (M.alarm) return;
    M.alarm = true; M.alarmCause = cause; M.alarmBeforeTheft = !M.stolen;
    for (const g of guards) if (g.active && !g.down && g.mode !== 'chase') { g.mode = 'investigate'; g.last.copy(pos); g.wait = 0; }
    audio.siren(true);
    opts.onAlarm?.(pos);
  }

  function walkTo(g, target, speed, dt) {
    const p = g.root.position, dx = target.x - p.x, dz = target.z - p.z, d = Math.hypot(dx, dz);
    if (d > 0.05) { const s = Math.min(d, speed * dt); p.x += (dx / d) * s; p.z += (dz / d) * s; world.resolve(p); face(g, dx, dz, dt, 8); }
    anim(g, d < 0.1 ? 'Idle' : speed > 3 ? 'Run' : 'Walk');
    return d;
  }

  function startRadio(g, cause, text, described) {
    if (M.alarm || g.radio !== null) { if (M.alarm && described) M.described = true; return; }
    g.radio = 2.5; g.cause = cause; g.described = described; hud.note(text);
  }

  function updateGuard(g, dt) {
    if (!g.active || g.down) return;
    const gp = g.root.position, pp = player.root.position;
    const d = gp.distanceTo(pp), ang = angleTo(gp, g.h, pp);
    const vis = d < RANGE && ang < HALF && world.sees(gp, pp);
    const moving = player.speed > 0.2;
    if (vis) {
      const motion = player.speed > 4 ? 1.7 : player.sneak ? (moving ? 0.5 : 0.3) : moving ? 1 : 0.7;
      let gain = 1.15 * (1 - d / RANGE) * (isLit(pp) ? 1 : 0.35) * motion * (ang < HALF / 2 ? 1 : 0.5);
      if (d < 3.5) gain = Math.max(gain, 2.5);
      g.aw += gain * dt; g.last.copy(pp);
    } else if (g.mode !== 'chase') g.aw -= 0.18 * dt;
    if (player.speed > 4 && d < 11 && g.aw < 0.75) { g.aw += (world.sees(gp, pp) ? 0.7 : 0.35) * dt; g.last.copy(pp); } // footsteps
    g.aw = clamp(g.aw, 0, 1);

    for (const b of guards) { // a downed colleague
      if (!b.down || b.found) continue;
      const bp = b.root.position;
      if (gp.distanceTo(bp) < 15 && angleTo(gp, g.h, bp) < HALF && world.sees(gp, bp)) {
        b.found = true; M.bodyFound = true; g.last.copy(bp); g.mode = 'investigate'; g.wait = 0;
        startRadio(g, 'A guard found an unconscious colleague.', 'A GUARD FOUND A BODY — HE IS REACHING FOR HIS RADIO', false);
      }
    }

    if (g.aw >= 1 && g.mode !== 'chase') {
      g.mode = 'chase'; g.lost = 0; M.identified = true; audio.ping(880, 0.25, 0.1);
      startRadio(g, 'A guard identified you.', g.unarmed ? 'A WORKER SAW YOU — HE IS CALLING SECURITY' : 'IDENTIFIED — HE IS CALLING IT IN. STOP HIM OR RUN.', true);
    } else if (g.mode === 'patrol' || g.mode === 'suspicious') {
      if (g.aw >= 0.6) { g.mode = 'investigate'; g.wait = 0; } else g.mode = g.aw >= 0.25 ? 'suspicious' : 'patrol';
    }
    if (g.radio !== null) { g.radio -= dt; if (g.radio <= 0) { g.radio = null; raiseAlarm(g.last, g.cause, g.described); } }

    if (g.mode === 'patrol') {
      const wp = g.wps[g.wi];
      if (g.pause > 0) { g.pause -= dt; anim(g, 'Idle'); }
      else if (gp.distanceTo(wp) < 0.8) {
        if (g.wps.length > 1) { g.wi = (g.wi + 1) % g.wps.length; g.pause = 1.5; }
        else { anim(g, 'Idle'); if (g.def.face !== undefined) { g.h += Math.atan2(Math.sin(g.def.face - g.h), Math.cos(g.def.face - g.h)) * Math.min(1, dt * 3); g.root.rotation.y = g.h; } }
      } else walkTo(g, world.steer(gp, wp, nav), 1.45, dt);
    } else if (g.mode === 'suspicious') {
      anim(g, 'Idle'); face(g, g.last.x - gp.x, g.last.z - gp.z, dt, 3);
    } else if (g.mode === 'investigate') {
      if (gp.distanceTo(g.last) > 1.4) walkTo(g, world.steer(gp, g.last, nav), M.alarm ? 4.3 : 2.1, dt);
      else { anim(g, 'Idle'); g.wait += dt; g.h += dt * 1.1; g.root.rotation.y = g.h; if (g.wait > (M.alarm ? 7 : 4)) { g.mode = 'patrol'; g.aw = Math.min(g.aw, 0.2); } }
    } else if (g.mode === 'chase') {
      if (g.unarmed) { // workers keep their distance and keep pointing you out
        anim(g, 'Idle'); face(g, pp.x - gp.x, pp.z - gp.z, dt, 4);
        if (!vis) { g.lost += dt; if (g.lost > 6) { g.mode = 'patrol'; g.aw = 0.3; } } else g.lost = 0;
      } else {
        walkTo(g, world.steer(gp, vis ? pp : g.last, nav), 4.7, dt);
        if (vis && d < 1.3) return opts.onCapture('Security got their hands on you.');
        if (vis && d > 2 && d < 20) { // armed: they fire
          g.fireT -= dt;
          if (g.fireT <= 0) {
            g.fireT = 1.2 + Math.random() * 0.7; g.flash.visible = true; setTimeout(() => (g.flash.visible = false), 60);
            audio.burst(0.15, 0.22, 2200);
            const hit = 0.22 + (isLit(pp) ? 0.15 : 0) + (d < 8 ? 0.15 : 0) - (player.speed > 4 ? 0.1 : 0);
            if (Math.random() < hit) {
              M.health--; hud.flash(); hud.health(M.health); audio.burst(0.25, 0.3, 500);
              if (M.health <= 0) return opts.onCapture('You were shot down before you could get clear.');
            }
          }
        }
        if (!vis && gp.distanceTo(g.last) < 1.6) { g.lost += dt; if (g.lost > 5) { g.mode = 'investigate'; g.wait = 0; g.aw = 0.5; hud.note('THEY LOST YOU — SEARCHING'); } }
        else if (vis) g.lost = 0;
      }
    }
    g.cone.material.color.setHex(stateColor(g.aw, g.mode === 'chase'));
    g.cone.material.opacity = g.mode === 'chase' ? 0.24 : g.aw >= 0.25 ? 0.16 : 0.09;
  }

  function updateCam(c, dt) {
    c.t += dt;
    c.yawNow = c.yaw + Math.sin((c.t / (c.period ?? 7)) * Math.PI * 2) * (c.sweep ?? 0.6);
    c.head.rotation.y = c.yawNow; c.pivot.rotation.y = c.yawNow;
    const pp = player.root.position; v2.set(c.x, 0, c.z);
    const d = v2.distanceTo(pp);
    const vis = d < CAM_RANGE && angleTo(v2, c.yawNow, pp) < CAM_HALF && world.sees(v2, pp);
    if (vis) c.aw += 1.3 * (1 - d / CAM_RANGE) * (isLit(pp) ? 1 : 0.45) * (player.speed > 4 ? 1.5 : player.sneak ? 0.6 : 1) * dt;
    else c.aw -= 0.3 * dt;
    c.aw = clamp(c.aw, 0, 1);
    if (c.aw >= 1 && !c.tripped) {
      c.tripped = true; M.cameraRec = true; audio.ping(1200, 0.2, 0.08);
      if (M.alarm) M.described = true;
      else if (control && !control.down) { c.timer = 3; hud.note('CAMERA SPOTTED YOU — THE CONTROL ROOM IS CALLING IT IN'); }
      else hud.note('A CAMERA RECORDED YOU — NOBODY IS WATCHING THE FEED');
    }
    if (c.aw <= 0) c.tripped = false;
    if (c.timer !== null) {
      if (control?.down) { c.timer = null; hud.note('CONTROL ROOM IS DOWN — THE CALL NEVER WENT OUT'); }
      else if ((c.timer -= dt) <= 0) { c.timer = null; raiseAlarm(pp, 'A camera caught you on the feed.', true); }
    }
    c.cone.material.color.setHex(stateColor(c.aw, c.tripped)); c.cone.material.opacity = c.tripped ? 0.22 : 0.08 + c.aw * 0.1;
    c.lens.material.emissiveIntensity = c.tripped ? 6 : 2 + Math.sin(c.t * 4);
  }

  const canTakedown = (g) => g.active && !g.down && g.mode !== 'chase';
  function nearest(maxD, pred = canTakedown) {
    let best = null, bd = maxD;
    for (const g of guards) { const d = g.root.position.distanceTo(player.root.position); if (d < bd && pred(g)) { bd = d; best = g; } }
    return best;
  }

  return {
    guards, cams, raiseAlarm,
    update(dt) {
      for (const g of guards) { updateGuard(g, dt); }
      for (const c of cams) updateCam(c, dt);
    },
    animate(dt) { for (const g of guards) if (g.active && !g.down) g.mixer.update(dt); },
    nearest,
    takedown() {
      const g = nearest(1.9); if (!g) return false;
      g.down = true; g.radio = null; g.mixer.stopAllAction(); g.model.rotation.x = -Math.PI / 2; g.model.position.y = 0.25; g.cone.visible = false;
      M.takedowns++; audio.ping(90, 0.35, 0.2);
      hud.note(g.def.control ? 'CONTROL ROOM DOWN — NOBODY IS WATCHING THE CAMERAS' : 'GUARD DOWN — HIS RADIO CALL NEVER WENT OUT');
      return true;
    },
    /** A distraction or loud sound: guards in range go and look. */
    noise(pos, radius) {
      for (const g of guards) {
        if (!g.active || g.down || g.mode === 'chase') continue;
        const d = g.root.position.distanceTo(pos);
        if (d < radius && (d < radius * 0.5 || world.sees(g.root.position, pos))) { g.mode = 'investigate'; g.last.copy(pos); g.wait = 0; g.aw = Math.max(g.aw, 0.62); }
      }
    },
    maxAwareness() {
      let m = 0;
      for (const g of guards) if (g.active && !g.down) m = Math.max(m, g.mode === 'chase' ? 1 : g.aw);
      for (const c of cams) m = Math.max(m, c.aw * 0.99);
      return m;
    },
    level() {
      if (M.alarm) return M.lockdown ? 4 : 3;
      if (M.identified || M.bodyFound) return 2;
      return this.maxAwareness() >= 0.25 ? 1 : 0;
    },
    activate(g, pos) { g.active = true; g.root.visible = true; g.root.position.copy(pos); g.mode = 'investigate'; g.last.copy(pos); },
  };
}

const LEVELS = [['0 · NORMAL', '#7cff9a'], ['1 · SUSPICION', '#ffd84a'], ['2 · LOCAL SEARCH', '#ff8a3c'], ['3 · FACILITY ALERT', '#ff3b30'], ['4 · LOCKDOWN', '#ff3b30']];
export function stealthHud(stealth) {
  const lvl = stealth.level(), aw = stealth.maxAwareness();
  hud.security(...LEVELS[lvl]);
  hud.bar(aw, aw >= 1 ? '#ff3b30' : aw >= 0.6 ? '#ff8a3c' : aw >= 0.25 ? '#ffd84a' : '#7cff9a');
}
