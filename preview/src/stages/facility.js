// Stage 1: Halden Research Station. Infiltrate, steal LATTICE, reach the motorcycle.
import { THREE, A, World, camera, clamp, lerp, ease, glow, setBloom, setTimeOfDay, setFocus, params } from '../core.js';
import { M, saveCheckpoint } from '../state.js';
import { audio } from '../audio.js';
import { hud } from '../hud.js';
import { input } from '../input.js';
import { createStealth, stealthHud } from '../stealth.js';
import { createOnFoot } from '../onfoot.js';
import { applyPose } from '../core.js';
import { buildBike } from '../vehicles.js';

export async function create(ctx) {
  setTimeOfDay(0);
  const W = new World();
  const T = 0.6, H = 8;

  // ground, roads, mesas
  const ground = W.mesh(new THREE.PlaneGeometry(900, 900), A.sand, 0, 0, 0, false); ground.rotation.x = -Math.PI / 2;
  for (const [x0, z0, x1, z1] of [[-5, 28, 5, 140], [-58, -13, 58, 28]]) {
    const r = W.mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), A.asphalt, (x0 + x1) / 2, 0.02, (z0 + z1) / 2, false); r.rotation.x = -Math.PI / 2;
  }
  for (let i = 0; i < 14; i++) {
    const a = i * 0.47 + 0.3, d = 260 + (i % 4) * 45;
    W.mesh(new THREE.CylinderGeometry(22 + (i % 3) * 14, 40 + (i % 5) * 12, 26 + (i % 4) * 14, 7), A.rock, Math.sin(a) * d, 12, Math.cos(a) * d - 60, false).rotation.y = i;
  }

  // building x[-20,20] z[-45,-15]
  W.box(-20, -15 - T, -2, -15, 0, H, A.wall); W.box(2, -15 - T, 20, -15, 0, H, A.wall);
  W.box(-2, -15 - T, 2, -15, 3.2, H, A.wall, { solid: false });
  W.box(-20, -45, 20, -45 + T, 0, H, A.wall);
  W.box(-20 - T, -45, -20, -15, 0, H, A.wall);
  W.box(20, -45, 20 + T, -38, 0, H, A.wall); W.box(20, -34, 20 + T, -15, 0, H, A.wall);
  W.box(20, -38, 20 + T, -34, 3.2, H, A.wall, { solid: false });
  W.box(-20, -30 - T / 2, 8, -30 + T / 2, 0, H, A.wall); W.box(12, -30 - T / 2, 20, -30 + T / 2, 0, H, A.wall);
  W.box(8, -30 - T / 2, 12, -30 + T / 2, 3.2, H, A.wall, { solid: false });
  // control room in the north-east corner of the hall, door facing west
  W.box(12, -29.7, 12.5, -25, 0, H, A.wall); W.box(12, -22, 12.5, -15.6, 0, H, A.wall);
  W.box(12, -25, 12.5, -22, 3.2, H, A.wall, { solid: false });
  W.box(17.5, -29, 19.6, -26.5, 0, 1, A.dark);
  for (const z of [-28.6, -27.7, -26.8]) W.mesh(new THREE.BoxGeometry(0.06, 0.55, 0.8), glow(0x6fb8ff, 1.6), 19.4, 1.45, z, false);
  W.box(-21, -46, 21, -14, H, H + 0.5, A.dark, { solid: false });
  const floor = W.mesh(new THREE.PlaneGeometry(40, 30), A.floor, 0, 0.03, -30, false); floor.rotation.x = -Math.PI / 2;
  const stripMat = glow(0xff5a3c, 2.2);
  W.box(-20, -14.95, 20, -14.9, 7.2, 7.35, stripMat, { solid: false, cast: false });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.8, roughness: 0.4, emissive: 0xff2010, emissiveIntensity: 0 });
  const door = W.mesh(new THREE.BoxGeometry(4, 3.2, 0.3), doorMat, 0, 1.6, -15.3); door.visible = false;
  const doorBox = { x0: -2, x1: 2, z0: -15.6, z1: -15 };
  const hall = new THREE.PointLight(0xffe2c0, 45, 30, 2); hall.position.set(0, 6.5, -22); W.add(hall);
  const lab = new THREE.PointLight(0x9fd8ff, 14, 26, 2); lab.position.set(4, 6.5, -38); W.add(lab);
  const tube = glow(0xffffff, 1.6);
  for (const [x, z] of [[-10, -22], [6, -22], [-10, -38], [10, -38]]) W.box(x - 2, z - 0.15, x + 2, z + 0.15, 7.7, 7.8, tube, { solid: false, cast: false });
  for (const x of [-16, -12, 14]) W.box(x, -44, x + 2.4, -41.5, 0, 2.4, A.metal);
  W.box(-6, -32.5, 4, -31.2, 0, 1, A.dark);

  // perimeter fence with a gate gap (south) and a cut (west)
  const fc = document.createElement('canvas'); fc.width = fc.height = 64;
  const fx = fc.getContext('2d'); fx.strokeStyle = '#9aa0a6'; fx.lineWidth = 3;
  fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(64, 64); fx.moveTo(64, 0); fx.lineTo(0, 64); fx.stroke();
  function fence(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const t = new THREE.CanvasTexture(fc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len * 2, 6);
    const m = W.mesh(new THREE.PlaneGeometry(len, 3), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.5 }), (x0 + x1) / 2, 1.5, (z0 + z1) / 2);
    m.rotation.y = Math.atan2(z0 - z1, x1 - x0);
    for (let d = 0; d <= len; d += 5) W.mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), A.metal, lerp(x0, x1, d / len), 1.6, lerp(z0, z1, d / len), false);
    W.solids.push({ x0: Math.min(x0, x1) - 0.15, x1: Math.max(x0, x1) + 0.15, z0: Math.min(z0, z1) - 0.15, z1: Math.max(z0, z1) + 0.15 });
  }
  fence(-60, 30, -5, 30); fence(5, 30, 60, 30); fence(60, 30, 60, -60); fence(60, -60, -60, -60);
  fence(-60, -60, -60, -7); fence(-60, 1, -60, 30); // 8 m cut in the west fence
  W.box(7, 24, 10.5, 28, 0, 3, A.wall);

  // cover: containers, crates, real props
  const colors = [0x7a2e22, 0x24445c, 0x3d4a2e, 0x5c4a24, 0x2b2b30];
  [[-34, 14, 0], [-22, 2, 1], [-40, -6, 0], [26, 12, 1], [38, -2, 0], [30, -20, 1], [-30, -26, 0], [-48, 20, 1], [14, 18, 0], [46, 16, 1], [-12, 12, 1], [-7, 4, 1], [7, 2, 1]].forEach(([x, z, r], i) => {
    const [w, d] = r ? [2.5, 6.2] : [6.2, 2.5];
    W.box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0, 2.7, new THREE.MeshStandardMaterial({ color: colors[i % 5], metalness: 0.6, roughness: 0.55 }));
  });
  [[-8, 2], [9, -4], [-16, -8], [18, 4], [-52, -10], [-45, 4], [0, 14]].forEach(([x, z], i) => {
    W.place(A.props.crate, x - 0.4, z, i * 0.7, 1.2); W.place(A.props.crate, x + 0.5, z + 0.3, i, 1.2);
    W.solids.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.6, z1: z + 0.8 }); W.blockers.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.6, z1: z + 0.8 });
  });
  [[-6, 6], [-5.3, 6.4], [12, -9], [12.7, -9.3], [22, 6], [-26, -12]].forEach(([x, z], i) => { W.place(A.props.barrel, x, z, i); W.solids.push({ x0: x - 0.35, x1: x + 0.35, z0: z - 0.35, z1: z + 0.35 }); });
  W.place(A.props.generator, 5, -12.5, 0.4); W.solids.push({ x0: 4.4, x1: 5.6, z0: -13, z1: -12 });
  W.place(A.props.covered_car, -18, 20, 0.3); W.solids.push({ x0: -19.2, x1: -16.8, z0: 17.8, z1: 22.2 }); W.blockers.push({ x0: -19.2, x1: -16.8, z0: 18.5, z1: 21.5 });
  W.place(A.props.searchlight, -4, 26, 2.6); W.place(A.props.searchlight, 4, 26, 0.5);
  for (const x of [-4, 4]) { W.place(A.props.barrier, x, 36, 0); W.solids.push({ x0: x - 1, x1: x + 1, z0: 35.7, z1: 36.3 }); } // gap in the middle
  [[-90, 40, 1.4], [70, 60, 1], [-120, -40, 2], [110, -30, 1.6]].forEach(([x, z, s], i) => W.place(A.props.boulders, x, z, i, s));

  // lamps: lit zones
  const lamps = [];
  for (const [x, z] of [[-24, 20], [16, -5], [-30, 6], [34, 6]]) {
    W.mesh(new THREE.CylinderGeometry(0.1, 0.14, 8), A.metal, x, 4, z);
    const head = W.mesh(new THREE.BoxGeometry(1.2, 0.15, 0.5), glow(0xffd9a0, 3), x, 8, z, false);
    const s = new THREE.SpotLight(0xffd0a0, 260, 34, 0.75, 0.7, 1.6); s.position.set(x, 8, z); s.target.position.set(x, 0, z); W.add(s); W.add(s.target);
    lamps.push({ x, z, s, head }); W.solids.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15 });
  }
  const isLit = (p) => (p.x > -20 && p.x < 20 && p.z > -45 && p.z < -15) || lamps.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < 13);

  // the device
  const DEVICE = new THREE.Vector3(-8, 0, -38);
  const device = new THREE.Group(); device.position.copy(DEVICE); W.add(device);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.1, 24), A.metal); ped.position.y = 0.55; ped.castShadow = true; device.add(ped);
  W.solids.push({ x0: -8.5, x1: -7.5, z0: -38.5, z1: -37.5 });
  const core = new THREE.Group(); core.position.y = 1.55; device.add(core);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a2a40, emissive: 0x38b6ff, emissiveIntensity: 5 });
  core.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), coreMat));
  const rings = [0, 1, 2].map((i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.035, 0.012, 8, 40), new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 1, roughness: 0.2 })); core.add(r); return r; });
  const coreLight = new THREE.PointLight(0x38b6ff, 30, 16, 2); core.add(coreLight);

  // motorcycle beyond the west fence
  const BIKE = new THREE.Vector3(-70, 0, -3);
  const bike = buildBike(); bike.root.position.copy(BIKE); bike.root.rotation.y = -Math.PI / 2; W.add(bike.root);

  // player and guards
  const afterTheft = M.stolen;
  const at = params.get('at')?.split(',').map(Number); // test: start somewhere else
  const foot = createOnFoot(W, at ? new THREE.Vector3(at[0], 0, at[1]) : afterTheft ? new THREE.Vector3(-6.8, 0, -37.6) : new THREE.Vector3(0, 0, 56), afterTheft ? -Math.PI / 2 : 0);
  const player = foot.player;
  const carried = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), coreMat); carried.position.set(0, 1.25, -0.22); carried.visible = false; player.root.add(carried);
  const carriedLight = new THREE.PointLight(0x38b6ff, 0, 7, 2); carriedLight.position.copy(carried.position); player.root.add(carriedLight);
  const NAV = [[0, 33], [0, 24], [0, -12], [0, -18], [10, -27], [10, -33], [24, -36], [17, -36], [-24, -11], [24, -11], [-24, -49], [24, -49], [-64, -3], [-56, -3], [-60, -3], [-42, 0], [42, 0], [0, 6], [-20, 20], [20, 20], [0, -24], [-8, -34], [10, -23.5], [15, -23.5]].map(([x, z]) => new THREE.Vector3(x, 0, z));

  const stealth = createStealth(W, {
    player, nav: NAV, isLit,
    guards: [
      { wps: [[40, 20], [40, -20]] }, // east yard, away from the gate
      { wps: [[-30, 9], [30, 9], [30, -6], [-30, -6]] },
      { wps: [[-16, -10], [16, -10]] }, // front of the building: long route leaves gaps at the door
      { wps: [[-2, -33], [16, -33], [16, -42], [-2, -42]] },
      { wps: [[-52, -22], [-52, 16]] },
      { wps: [[16, -27.5]], face: Math.PI / 2, control: true },
      { wps: [[3, 27]], face: Math.PI / 2, scan: 1.3, scanPeriod: 12 }, // gate post: looks out at the road, then into the yard
    ],
    cameras: [
      { x: 11, z: 26, y: 4.2, yaw: Math.PI / 2, sweep: 0.4, period: 9, pole: true }, // watches the east yard, not the gate
      { x: -19.5, z: -14.4, y: 6, yaw: 0.35, sweep: 0.6 },
      { x: 2.6, z: -14.4, y: 4.3, yaw: -0.1, sweep: 0.5 },
      { x: -19.2, z: -44, y: 6, yaw: 0.75, sweep: 0.45 },
    ],
    onCapture: (why) => ctx.fail('CAPTURED', `${why} The device never left the station.`),
    onAlarm: () => {
      if (!M.stolen) { sealDoor(); hud.note('ALARM — MAIN DOOR LOCKED. FIND ANOTHER WAY IN.'); }
      else hud.note('ALARM — FACILITY ALERT');
    },
  });
  const LAB_GUARD = stealth.guards[3];
  let doorSealed = false;
  function sealDoor() { if (doorSealed) return; doorSealed = true; door.visible = true; doorMat.emissiveIntensity = 1.5; W.solids.push(doorBox); W.blockers.push(doorBox); }
  if (M.alarm) { audio.siren(true); if (M.alarmBeforeTheft) sealDoor(); for (const g of stealth.guards) { g.mode = 'investigate'; g.last.copy(player.root.position); } }
  if (afterTheft) { core.visible = false; carried.visible = true; carriedLight.intensity = 5; }

  let phase = 'play', t = 0, missingTimer = null, forceT = 0;
  const DOOR_OUT = new THREE.Vector3(0, 0, -14.2), SIDE_DOOR = new THREE.Vector3(21.5, 1.5, -36), FENCE_CUT = new THREE.Vector3(-60, 1.5, -3);
  function forceDoor() { // pry the sealed main door open: works, but loud
    doorSealed = false; door.visible = false;
    W.solids.splice(W.solids.indexOf(doorBox), 1); W.blockers.splice(W.blockers.indexOf(doorBox), 1);
    audio.burst(0.6, 0.35, 500); stealth.noise(DOOR_OUT, 18); hud.note('DOOR FORCED — THAT WAS LOUD. MOVE.');
  }

  const buttons = () => input.setButtons([{ a: 'interact', label: 'ACT' }, { a: 'takedown', label: 'FIGHT' }, { a: 'sprint', label: 'RUN' }, { a: 'sneak', label: 'SNEAK' }, { a: 'throw', label: 'THROW' }]);

  function objective() {
    hud.objective(M.stolen ? 'Get out. Reach the motorcycle beyond the west fence.' : doorSealed ? 'Main door is sealed. Use the east side door, or force the main door (loud).' : 'Get inside and steal the device from the lab. Walk in through the gate, or use the cut in the west fence.');
    const pp = player.root.position, outside = pp.z > 30 || pp.x < -60;
    if (M.stolen) hud.marker(BIKE.clone().setY(1), 'BIKE');
    else if (doorSealed) hud.marker(SIDE_DOOR, 'SIDE DOOR');
    else if (outside) hud.marker(FENCE_CUT, 'FENCE CUT');
    else hud.marker(null);
  }

  function interact() {
    const p = player.root.position;
    if (!M.stolen && p.distanceTo(DEVICE) < 2.4) { phase = 'theft'; t = 0; hud.bars(true); hud.show(false); input.showTouch(false); audio.ping(220, 2.5, 0.12); audio.ping(330, 2.5, 0.08); }
    else if (M.stolen && p.distanceTo(BIKE) < 2.8) { phase = 'mount'; t = 0; hud.bars(true); hud.show(false); input.showTouch(false); audio.siren(false); M.bikeSeen = M.alarm; }
  }

  function playUpdate(dt) {
    foot.update(dt);
    if (input.pressed('interact')) interact();
    if (input.pressed('takedown') || (input.held('takedown') && stealth.attackPrompt()?.text.startsWith('FIGHT')) || (params.has('autofight') && stealth.attackPrompt()?.text.startsWith('FIGHT'))) stealth.attack();
    if (input.pressed('throw')) { const at = foot.throwStone(); if (at) setTimeout(() => stealth.noise(at, 12), 350); }
    if (phase !== 'play') return;
    const atDoor = doorSealed && !M.stolen && player.root.position.distanceTo(DOOR_OUT) < 2.6;
    if (atDoor && input.held('interact')) { forceT += dt; if (forceT >= 2.5) { forceT = 0; forceDoor(); } }
    else forceT = Math.max(0, forceT - dt * 2);
    stealth.update(dt);
    if (missingTimer !== null && !M.alarm) {
      if (LAB_GUARD.down) missingTimer = null;
      else if ((missingTimer -= dt) <= 0) stealth.raiseAlarm(DEVICE, 'The lab guard noticed the empty pedestal.', false);
    }
    const inside = Math.abs(player.root.position.x) < 20 && player.root.position.z < -15 && player.root.position.z > -45;
    foot.cam(dt, false, inside ? 7.2 : Infinity);
    // hud
    const p = player.root.position;
    stealthHud(stealth); hud.foe(stealth.foeBar());
    let pr = null;
    if (!M.stolen && p.distanceTo(DEVICE) < 2.4) pr = { key: 'E', text: 'TAKE THE DEVICE', action: 'interact' };
    else if (M.stolen && p.distanceTo(BIKE) < 2.8) pr = { key: 'E', text: 'RIDE', action: 'interact' };
    else if (stealth.attackPrompt()?.text === 'FIGHT') pr = stealth.attackPrompt();
    else if (doorSealed && !M.stolen && p.distanceTo(DOOR_OUT) < 2.6) pr = { key: 'HOLD E', text: forceT > 0 ? `FORCING THE DOOR · ${Math.round((forceT / 2.5) * 100)}%` : 'FORCE THE DOOR (LOUD)', action: 'interact' };
    else if (!M.stolen && p.distanceTo(BIKE) < 3.5) pr = { key: '—', text: 'GETAWAY BIKE · STEAL THE DEVICE FIRST', action: null };
    else pr = stealth.attackPrompt();
    hud.prompt(pr);
    hud.flags(`${isLit(p) ? 'VISIBILITY · LIT' : 'VISIBILITY · SHADOW'}<br>${player.sneak ? 'MOVEMENT · SNEAK' : player.speed > 4 ? 'MOVEMENT · SPRINT (LOUD)' : 'MOVEMENT · WALK'}<br>STONES · ${M.throws}`);
    objective();
  }

  const tmp = new THREE.Vector3();
  function theft(dt) {
    t += dt * 0.35;
    const k = clamp(t / 3.2, 0, 1), a = 2.2 + k * 1.6;
    camera.position.set(DEVICE.x + Math.sin(a) * lerp(2.6, 1.3, k), lerp(1.9, 1.6, k), DEVICE.z + Math.cos(a) * lerp(2.6, 1.3, k)); camera.lookAt(tmp.set(DEVICE.x, 1.5, DEVICE.z));
    player.root.position.set(DEVICE.x + 0.95, 0, DEVICE.z + 0.2); player.h = -Math.PI / 2 - 0.2; player.root.rotation.y = player.h;
    coreMat.emissiveIntensity = 5 + Math.sin(k * Math.PI) * 14; coreLight.intensity = 14 + Math.sin(k * Math.PI) * 60; setBloom(0.45 + Math.sin(k * Math.PI) * 0.7);
    core.position.y = 1.55 + k * 0.12; rings.forEach((r, i) => r.scale.setScalar(1 + k * (0.6 + i * 0.3)));
    if (t > 3.2) {
      M.stolen = true; core.visible = false; carried.visible = true; carriedLight.intensity = 5; coreMat.emissiveIntensity = 5; setBloom(0.45);
      if (M.alarm) M.lockdown = true;
      phase = 'play'; hud.bars(false); hud.show(true); input.showTouch(true); foot.S.yaw = Math.PI / 2;
      if (!M.alarm && !LAB_GUARD.down) { missingTimer = 35; hud.note('DEVICE SECURED — THE LAB GUARD WILL NOTICE THE EMPTY PEDESTAL SOON'); }
      else if (!M.alarm) hud.note('DEVICE SECURED — NOBODY LEFT TO NOTICE. WALK OUT.');
      else hud.note('DEVICE SECURED — LOCKDOWN. GET TO THE BIKE.');
      saveCheckpoint('facility');
    }
  }

  function mount(dt) {
    t += dt;
    const v = Math.min(26, t * 9);
    bike.root.position.x -= v * dt;
    player.root.position.set(bike.root.position.x + 0.15, 0.28, BIKE.z); player.h = -Math.PI / 2; player.root.rotation.y = player.h;
    camera.position.set(BIKE.x - 9, 1.1, BIKE.z + 7); camera.lookAt(tmp.set(bike.root.position.x, 1, BIKE.z));
    audio.engine(Math.min(1, v / 26), 1);
    if (t > 3) { phase = 'done'; ctx.next('highway'); }
  }

  function intro(time) {
    const caps = [[0.5, 'HALDEN RESEARCH STATION · 19:42'], [3.6, 'ONE DEVICE. SEVEN GUARDS.'], [6.6, 'NO ONE HAS TO KNOW YOU WERE HERE.']];
    let c = ''; for (const [at, text] of caps) if (time > at && time < at + 2.6) c = text; hud.caption(c);
    if (time < 5) { const k = ease(time / 5); camera.position.set(lerp(95, 30, k), lerp(46, 16, k), lerp(70, 62, k)); camera.lookAt(tmp.set(0, 4, -25)); }
    else if (time < 9) { const k = ease((time - 5) / 4); camera.position.set(lerp(-6, 2.2, k), lerp(3.2, 1.7, k), lerp(46, 52.4, k)); camera.lookAt(tmp.set(0, lerp(4, 1.5, k), lerp(-25, 56, k))); }
    else return true;
    return false;
  }

  return {
    world: W,
    get focus() { return phase === 'mount' ? bike.root.position : player.root.position; },
    enter() { if (!M.stolen && !M.alarm) hud.note('SABLE: ONE GUARD ON THE GATE. WAIT TILL HE LOOKS AWAY, OR TAKE HIM FROM BEHIND. THE WEST FENCE IS CUT TOO.', 7); phase = 'play'; hud.caption(''); hud.secLabel('SECURITY'); hud.bars(false); hud.show(true); hud.health(M.health); buttons(); input.showTouch(true); foot.cam(0, true); objective(); },
    menu(time) { camera.position.set(Math.sin(time * 0.05) * 90, 30, 80 + Math.cos(time * 0.05) * 20); camera.lookAt(0, 4, -25); },
    intro,
    update(dt) {
      if (phase === 'play') playUpdate(dt);
      else if (phase === 'theft') theft(dt);
      else if (phase === 'mount') mount(dt);
    },
    animate(dt, time) {
      const slow = phase === 'theft' ? 0.35 : 1;
      player.mixer.update(dt * slow); applyPose(player, dt * slow); stealth.animate(dt * slow);
      rings.forEach((r, i) => { r.rotation.x = time * (0.7 + i * 0.4); r.rotation.y = time * (0.5 + i * 0.3); });
      if (M.alarm) {
        const p = 0.5 + 0.5 * Math.sin(time * 6);
        for (const l of lamps) { l.s.color.setRGB(1, 0.12 + 0.2 * (1 - p), 0.08); l.head.material.emissive.setRGB(1, 0.1, 0.05); l.head.material.emissiveIntensity = 1 + p * 4; }
        hall.color.setRGB(1, 0.25, 0.2); hall.intensity = 50 + p * 70; stripMat.emissiveIntensity = 1 + p * 4;
      }
      setFocus(this.focus);
    },
    dispose() { audio.siren(false); audio.engine(0, 0); W.dispose(); },
    debug: () => ({ level: stealth.level(), modes: stealth.guards.map((g) => (g.down ? 'down' : g.mode)), cams: stealth.cams.map((c) => Math.round(c.aw * 100)) }),
  };
}
