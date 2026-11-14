// Stage 3: container yard at night. Find the client's car in container HLX-7 without being stopped.
import { THREE, A, World, camera, clamp, lerp, glow, setTimeOfDay, setFocus } from '../core.js';
import { M, saveCheckpoint, pursuitStrength } from '../state.js';
import { audio } from '../audio.js';
import { hud } from '../hud.js';
import { input } from '../input.js';
import { createStealth, stealthHud } from '../stealth.js';
import { createOnFoot } from '../onfoot.js';
import { buildBike, buildCar } from '../vehicles.js';

const COLORS = [0x7a2e22, 0x24445c, 0x3d4a2e, 0x5c4a24, 0x8a5a1c, 0x2b4a4a, 0x4a2b3d];

function containerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 64);
  for (let x = 0; x < 128; x += 8) { g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x, 0, 3, 64); }
  g.fillStyle = 'rgba(60,30,10,0.35)'; for (let i = 0; i < 40; i++) g.fillRect(Math.random() * 128, 56 + Math.random() * 8, 4, 2);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function create(ctx) {
  setTimeOfDay(0.85);
  const W = new World();
  const ground = W.mesh(new THREE.PlaneGeometry(900, 900), A.sand, 0, 0, 0, false); ground.rotation.x = -Math.PI / 2;
  const pad = W.mesh(new THREE.PlaneGeometry(130, 110), A.asphalt, 0, 0.02, 0, false); pad.rotation.x = -Math.PI / 2;
  const road = W.mesh(new THREE.PlaneGeometry(10, 120), A.asphalt, 0, 0.02, 112, false); road.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i * 0.52, d = 300 + (i % 3) * 60; W.mesh(new THREE.CylinderGeometry(30, 50, 30 + (i % 4) * 10, 7), A.rock, Math.sin(a) * d, 14, Math.cos(a) * d, false); }

  // fence, two gates
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x8a8f96, metalness: 0.8, roughness: 0.5, transparent: true, opacity: 0.35 });
  for (const [x0, z0, x1, z1] of [[-62, 52, -6, 52], [6, 52, 62, 52], [-62, -52, -6, -52], [6, -52, 62, -52], [-62, -52, -62, 52], [62, -52, 62, 52]]) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    W.mesh(new THREE.PlaneGeometry(len, 3), fenceMat, (x0 + x1) / 2, 1.5, (z0 + z1) / 2, false).rotation.y = Math.atan2(z0 - z1, x1 - x0);
    W.solids.push({ x0: Math.min(x0, x1) - 0.15, x1: Math.max(x0, x1) + 0.15, z0: Math.min(z0, z1) - 0.15, z1: Math.max(z0, z1) + 0.15 });
  }

  // containers: rows of stacks with lanes between
  const tex = containerTexture();
  const mats = COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, map: tex, metalness: 0.55, roughness: 0.6 }));
  let k = 0;
  const TARGET = { x: 40, z: -34 };
  for (let row = -38; row <= 34; row += 12) {
    for (let col = -48; col <= 48; col += 7.5) {
      k++;
      if (Math.abs(col) < 6 || (row > -6 && row < 6)) continue; // centre lanes
      if ((k * 7) % 11 === 0) continue; // gaps
      if (Math.abs(col - TARGET.x) < 4 && Math.abs(row - TARGET.z) < 9) continue;
      const h = 1 + ((k * 5) % 3);
      for (let s = 0; s < h; s++) W.box(col - 1.25, row - 3.05, col + 1.25, row + 3.05, s * 2.6, s * 2.6 + 2.58, mats[(k + s) % mats.length], { solid: s === 0, sight: s === 0 });
    }
  }
  // the target container: doors open, lit inside, the car waiting
  const tc = TARGET;
  W.box(tc.x - 1.25, tc.z - 3.05, tc.x + 1.25, tc.z - 2.9, 0, 2.6, mats[1]);
  W.box(tc.x + 1.1, tc.z - 3.05, tc.x + 1.25, tc.z + 3.05, 0, 2.6, mats[1]);
  W.box(tc.x - 1.25, tc.z - 3.05, tc.x - 1.1, tc.z + 3.05, 0, 2.6, mats[1]);
  W.box(tc.x - 1.25, tc.z - 3.05, tc.x + 1.25, tc.z + 3.05, 2.45, 2.6, mats[1], { solid: false });
  for (const s of [-1, 1]) W.mesh(new THREE.BoxGeometry(0.06, 2.5, 1.2), mats[1], tc.x + s * 1.75, 1.25, tc.z + 3.6).rotation.y = s * 1.2;
  const car = buildCar(0x8a0f12); car.root.position.set(tc.x, 0, tc.z - 0.2); car.root.scale.setScalar(0.92); W.add(car.root);
  const inner = new THREE.PointLight(0xffc27a, 18, 9, 2); inner.position.set(tc.x, 2.2, tc.z); W.add(inner);
  W.mesh(new THREE.BoxGeometry(1.6, 0.05, 0.05), glow(0xffc27a, 4), tc.x, 2.4, tc.z + 2.8, false);
  const DOOR = new THREE.Vector3(tc.x, 0, tc.z + 4);

  // warehouse, office, crane
  W.box(-60, -50, -34, -47, 0, 10, A.wall); W.box(-60, -50, -57, -30, 0, 10, A.wall); W.box(-37, -50, -34, -42, 0, 10, A.wall);
  W.box(-60, -33, -46, -30, 0, 10, A.wall); W.box(-61, -51, -33, -29, 10, 10.6, A.dark, { solid: false });
  W.box(36, 40, 48, 48, 0, 3.4, A.wall);
  W.mesh(new THREE.BoxGeometry(3, 0.8, 0.05), glow(0xbfe0ff, 1.5), 42, 2, 39.97, false);
  for (const x of [-20, 20]) for (const z of [-4.5, 4.5]) W.box(x - 0.6, z - 0.6, x + 0.6, z + 0.6, 0, 16, A.metal);
  W.box(-21, -5.2, 21, -3.8, 16, 17.2, new THREE.MeshStandardMaterial({ color: 0xd8a420, metalness: 0.6, roughness: 0.5 }), { solid: false });
  W.box(-21, 3.8, 21, 5.2, 16, 17.2, new THREE.MeshStandardMaterial({ color: 0xd8a420, metalness: 0.6, roughness: 0.5 }), { solid: false });
  [[-8, 16], [8.5, -18], [24, 22], [-30, -18]].forEach(([x, z], i) => { W.place(A.props.barrel, x, z, i); W.place(A.props.barrel, x + 0.7, z + 0.2, i + 1); W.solids.push({ x0: x - 0.4, x1: x + 1.1, z0: z - 0.4, z1: z + 0.6 }); });
  [[-3, 28], [14, -26], [-16, 10]].forEach(([x, z], i) => { W.place(A.props.crate, x, z, i, 1.3); W.solids.push({ x0: x - 0.8, x1: x + 0.8, z0: z - 0.5, z1: z + 0.5 }); });
  W.place(A.props.generator, 33, 38, 1);

  // flood light towers
  const towers = [[-28, 22], [26, -18], [0, 44]];
  for (const [x, z] of towers) {
    W.mesh(new THREE.CylinderGeometry(0.2, 0.3, 14), A.metal, x, 7, z);
    W.mesh(new THREE.BoxGeometry(2.4, 0.9, 0.3), glow(0xf4f8ff, 4), x, 14, z, false);
    const s = new THREE.SpotLight(0xe8f0ff, 900, 46, 0.9, 0.55, 1.5); s.position.set(x, 14, z); s.target.position.set(x, 0, z + 0.1); W.add(s); W.add(s.target);
    W.solids.push({ x0: x - 0.3, x1: x + 0.3, z0: z - 0.3, z1: z + 0.3 });
  }
  const isLit = (p) => towers.some(([x, z]) => Math.hypot(p.x - x, p.z - z) < 17) || p.distanceTo(DOOR) < 5;

  // the bike, parked outside the south gate
  const bike = buildBike(); bike.root.position.set(6.5, 0, 61); bike.root.rotation.y = Math.PI * 0.9; W.add(bike.root);

  const foot = createOnFoot(W, new THREE.Vector3(0, 0, 58), 0);
  const player = foot.player;
  const NAV = [[0, 45], [0, 0], [0, -45], [-45, 0], [45, 0], [-45, 40], [45, 40], [-45, -40], [45, -40], [30, -28], [44, -28], [44, -24], [20, 0], [-20, 0], [0, 20], [0, -20]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const strength = pursuitStrength();
  const stealth = createStealth(W, {
    player, nav: NAV, isLit,
    guards: [
      { wps: [[-45, 40], [45, 40]] },
      { wps: [[0, -40], [0, 30]] },
      { wps: [[44, 0], [44, -24], [30, -28]] },
      { wps: [[-20, 0], [20, 0]], tint: 0xff8a1e, unarmed: true },
      { wps: [[0, 50]], tint: 0x2a3550, inactive: true },
      { wps: [[0, 50]], tint: 0x2a3550, inactive: true },
    ],
    cameras: [{ x: -20, z: 5.5, y: 9, yaw: 0.5, sweep: 0.8, period: 9 }, { x: 20, z: -5.5, y: 9, yaw: Math.PI - 0.5, sweep: 0.8, period: 9 }],
    onCapture: (why) => ctx.fail('CAPTURED', `${why} The device went into an evidence bag.`),
    onAlarm: () => hud.note('YARD SECURITY CALLED IT IN'),
  });

  let phase = 'play', t = 0, policeTimer = strength === 'medium' || strength === 'heavy' ? 75 : null;
  const tmp = new THREE.Vector3();

  function interact() {
    if (player.root.position.distanceTo(DOOR) < 3) { phase = 'enter'; t = 0; hud.bars(true); hud.show(false); input.showTouch(false); audio.ping(180, 1.2, 0.1); }
  }

  function play(dt) {
    foot.update(dt);
    if (input.pressed('interact')) interact();
    if (input.pressed('takedown') || (input.held('takedown') && stealth.attackPrompt()?.text.startsWith('FIGHT'))) stealth.attack();
    if (input.pressed('throw')) { const at = foot.throwStone(); if (at) setTimeout(() => stealth.noise(at, 12), 350); }
    if (phase !== 'play') return;
    stealth.update(dt);
    if (policeTimer !== null) {
      policeTimer -= dt;
      if (policeTimer <= 0) {
        policeTimer = null; hud.note('POLICE AT THE GATE');
        stealth.activate(stealth.guards[4], new THREE.Vector3(-3, 0, 50)); stealth.activate(stealth.guards[5], new THREE.Vector3(3, 0, 50));
        for (const g of stealth.guards.slice(4)) g.last.set(player.root.position.x, 0, player.root.position.z);
        audio.siren(true);
      }
    }
    foot.cam(dt);
    stealthHud(stealth);
    const p = player.root.position;
    let pr = null;
    if (p.distanceTo(DOOR) < 3) pr = { key: 'E', text: 'TAKE THE CAR', action: 'interact' };
    else pr = stealth.attackPrompt();
    hud.prompt(pr);
    hud.flags(`${isLit(p) ? 'VISIBILITY · LIT' : 'VISIBILITY · SHADOW'}<br>${player.sneak ? 'MOVEMENT · SNEAK' : player.speed > 4 ? 'MOVEMENT · SPRINT (LOUD)' : 'MOVEMENT · WALK'}<br>STONES · ${M.throws}${policeTimer !== null ? `<br>POLICE IN · ${Math.ceil(policeTimer)} s` : ''}`);
  }

  function enterCar(dt) {
    t += dt;
    const a = 0.6 + t * 0.5;
    camera.position.set(tc.x + Math.sin(a) * 6, 1.6 + t * 0.2, tc.z + 1 + Math.cos(a) * 6); camera.lookAt(tmp.set(tc.x, 0.8, tc.z));
    player.root.visible = t < 1;
    if (t > 1) { car.tail.emissiveIntensity = 6; audio.engine(0.3 + Math.sin(t * 8) * 0.1, 1); }
    if (t > 3) { phase = 'done'; ctx.next('pursuit'); }
  }

  return {
    world: W,
    get focus() { return player.root.position; },
    enter() {
      saveCheckpoint('yard');
      hud.show(true); hud.bars(false); hud.health(M.health); hud.secLabel('SECURITY');
      input.setButtons([{ a: 'interact', label: 'ACT' }, { a: 'takedown', label: 'FIGHT' }, { a: 'sprint', label: 'RUN' }, { a: 'sneak', label: 'SNEAK' }, { a: 'throw', label: 'THROW' }]); input.showTouch(true);
      hud.objective('Find container HLX-7 in the north-east row. The car is inside.');
      hud.marker(new THREE.Vector3(tc.x, 1.5, tc.z + 3), 'HLX-7');
      hud.note(policeTimer !== null ? 'SABLE: POLICE ARE ON THEIR WAY TO THE YARD. MOVE.' : 'SABLE: QUIET YARD. KEEP IT THAT WAY.');
      foot.cam(0, true);
    },
    update(dt) { if (phase === 'play') play(dt); else if (phase === 'enter') enterCar(dt); },
    animate(dt) { player.mixer.update(dt); stealth.animate(dt); setFocus(player.root.position); },
    dispose() { audio.siren(false); audio.engine(0, 0); W.dispose(); },
    debug: () => ({ level: stealth.level(), modes: stealth.guards.map((g) => (g.down ? 'down' : g.active ? g.mode : 'off')), cams: stealth.cams.map((c) => Math.round(c.aw * 100)) }),
  };
}
