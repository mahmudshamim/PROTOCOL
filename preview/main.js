// PROTOCOL — preview slice. Throwaway demo of mood + stealth loop, not production code.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = (id) => document.getElementById(id);
const shot = new URLSearchParams(location.search).get('shot'); // debug: skip menu for screenshots
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x7d6a72, 0.0055);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 900);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.7, 2.2);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

// ---------- assets ----------
const texLoader = new THREE.TextureLoader();
async function pbr(name, repeat, extra = {}) {
  const load = async (suffix, srgb) => {
    const t = await texLoader.loadAsync(`/assets/${name}_${suffix}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const [map, normalMap, roughnessMap] = await Promise.all([load('diff', true), load('nor_gl'), load('rough')]);
  return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, ...extra });
}
const [hdr, soldier, matWall, matFloor, matSand] = await Promise.all([
  new RGBELoader().loadAsync('/assets/sky.hdr'),
  new GLTFLoader().loadAsync('/assets/Soldier.glb'),
  pbr('concrete_wall_008', 1), pbr('concrete_floor_02', 10), pbr('sand_01', 90, { color: 0xd9b48c }),
]);
hdr.mapping = THREE.EquirectangularReflectionMapping;
matWall.envMapIntensity = 0.4; matFloor.envMapIntensity = 0.15; matFloor.color.set(0x8a8f96);
scene.background = hdr; scene.environment = hdr;
scene.backgroundIntensity = 0.55; scene.environmentIntensity = 0.75;

// ---------- lights ----------
const sun = new THREE.DirectionalLight(0xffa56b, 3.2);
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-0.72, 0.3, 0.45).normalize();

// ---------- world ----------
const solids = [];   // block movement
const blockers = []; // block sight
const matMetal = new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.9, roughness: 0.35 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.4, roughness: 0.6 });

function box(x0, z0, x1, z1, y0, y1, mat, { solid = true, sight = true, cast = true } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = cast; m.receiveShadow = true; scene.add(m);
  // scale UVs so concrete does not stretch
  if (mat === matWall) {
    const uv = m.geometry.attributes.uv, w = Math.max(x1 - x0, z1 - z0) / 5, h = (y1 - y0) / 5;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
  }
  const b = { x0, x1, z0, z1 };
  if (solid) solids.push(b);
  if (solid && sight) blockers.push(b);
  return { mesh: m, box: b };
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), matSand);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
// asphalt apron + road to gate
const matRoad = new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 });
for (const [x0, z0, x1, z1] of [[-5, 28, 5, 140], [-58, -13, 58, 28]]) {
  const r = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), matRoad);
  r.rotation.x = -Math.PI / 2; r.position.set((x0 + x1) / 2, 0.02, (z0 + z1) / 2); r.receiveShadow = true; scene.add(r);
}
// distant mesas
const matRock = new THREE.MeshStandardMaterial({ color: 0x5a3d30, roughness: 1, flatShading: true });
for (let i = 0; i < 14; i++) {
  const a = i * 0.47 + 0.3, d = 260 + (i % 4) * 45;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(22 + (i % 3) * 14, 40 + (i % 5) * 12, 26 + (i % 4) * 14, 7), matRock);
  m.position.set(Math.sin(a) * d, 12, Math.cos(a) * d - 60); m.rotation.y = i; scene.add(m);
}

// facility building: x[-20,20] z[-45,-15], wall height 8
const T = 0.6, H = 8;
box(-20, -15 - T, -2, -15, 0, H, matWall); box(2, -15 - T, 20, -15, 0, H, matWall);          // front, door gap
box(-2, -15 - T, 2, -15, 3.2, H, matWall, { solid: false });
box(-20, -45, 20, -45 + T, 0, H, matWall);                                                   // back
box(-20 - T, -45, -20, -15, 0, H, matWall);                                                  // west
box(20, -45, 20 + T, -38, 0, H, matWall); box(20, -34, 20 + T, -15, 0, H, matWall);          // east, side door
box(20, -38, 20 + T, -34, 3.2, H, matWall, { solid: false });
box(-20, -30 - T / 2, 8, -30 + T / 2, 0, H, matWall); box(12, -30 - T / 2, 20, -30 + T / 2, 0, H, matWall); // lab partition
box(8, -30 - T / 2, 12, -30 + T / 2, 3.2, H, matWall, { solid: false });
box(-21, -46, 21, -14, H, H + 0.5, matDark, { solid: false });                                // roof
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), matFloor);
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.03, -30); floor.receiveShadow = true; scene.add(floor);
// roof-edge light strip + sign
const stripMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff5a3c, emissiveIntensity: 2.2 });
box(-20, -14.95, 20, -14.9, 7.2, 7.35, stripMat, { solid: false, cast: false });
// front door (locks on alarm-before-theft)
const doorMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, metalness: 0.8, roughness: 0.4, emissive: 0xff2010, emissiveIntensity: 0 });
const door = new THREE.Mesh(new THREE.BoxGeometry(4, 3.2, 0.3), doorMat);
door.position.set(0, 1.6, -15.3); door.visible = false; scene.add(door);
const doorBox = { x0: -2, x1: 2, z0: -15.6, z1: -15 };
// interior lights
const hall = new THREE.PointLight(0xffe2c0, 45, 30, 2); hall.position.set(0, 6.5, -22); scene.add(hall);
const lab = new THREE.PointLight(0x9fd8ff, 14, 26, 2); lab.position.set(4, 6.5, -38); scene.add(lab);
const tubeMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveIntensity: 1.6 });
for (const [x, z] of [[-10, -22], [10, -22], [-10, -38], [10, -38]]) box(x - 2, z - 0.15, x + 2, z + 0.15, 7.7, 7.8, tubeMat, { solid: false, cast: false });
// lab benches / server racks
for (const x of [-16, -12, 14]) box(x, -44, x + 2.4, -41.5, 0, 2.4, matMetal);
box(-6, -32.5, 4, -31.2, 0, 1, matDark);

// perimeter fence: x[-60,60] z[-60,30]; gate gap x[-5,5] at z=30; hole in west fence z[-5,-1]
const fc = document.createElement('canvas'); fc.width = fc.height = 64;
const fx = fc.getContext('2d'); fx.strokeStyle = '#9aa0a6'; fx.lineWidth = 3;
fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(64, 64); fx.moveTo(64, 0); fx.lineTo(0, 64); fx.stroke();
function fence(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const t = new THREE.CanvasTexture(fc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len * 2, 6);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 3), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.5 }));
  m.position.set((x0 + x1) / 2, 1.5, (z0 + z1) / 2); m.rotation.y = Math.atan2(z0 - z1, x1 - x0); m.castShadow = true; scene.add(m);
  for (let d = 0; d <= len; d += 5) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), matMetal);
    p.position.set(lerp(x0, x1, d / len), 1.6, lerp(z0, z1, d / len)); scene.add(p);
  }
  solids.push({ x0: Math.min(x0, x1) - 0.15, x1: Math.max(x0, x1) + 0.15, z0: Math.min(z0, z1) - 0.15, z1: Math.max(z0, z1) + 0.15 });
}
fence(-60, 30, -5, 30); fence(5, 30, 60, 30); fence(60, 30, 60, -60); fence(60, -60, -60, -60);
fence(-60, -60, -60, -5); fence(-60, -1, -60, 30);
// gate booth
box(7, 24, 10.5, 28, 0, 3, matWall);

// cover: containers and crates
const colors = [0x7a2e22, 0x24445c, 0x3d4a2e, 0x5c4a24, 0x2b2b30];
[[-34, 14, 0], [-22, 2, 1], [-40, -6, 0], [26, 12, 1], [38, -2, 0], [30, -20, 1], [-30, -26, 0], [-48, 20, 1], [14, 18, 0], [46, 16, 1], [-12, 12, 1]].forEach(([x, z, r], i) => {
  const [w, d] = r ? [2.5, 6.2] : [6.2, 2.5];
  box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0, 2.7, new THREE.MeshStandardMaterial({ color: colors[i % 5], metalness: 0.6, roughness: 0.55 }));
});
[[-8, 2], [9, -4], [-16, -8], [18, 4], [-52, -10], [-45, 4], [0, 14]].forEach(([x, z]) => box(x - 0.8, z - 0.8, x + 0.8, z + 0.8, 0, 1.3, matDark));

// lamps (lit zones)
const lamps = [];
const lampMat = new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffd9a0, emissiveIntensity: 3 });
for (const [x, z] of [[-9, 22], [9, -9], [-30, 6], [34, 6]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8), matMetal); pole.position.set(x, 4, z); pole.castShadow = true; scene.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.5), lampMat.clone()); head.position.set(x, 8, z); scene.add(head);
  const s = new THREE.SpotLight(0xffd0a0, 260, 34, 0.75, 0.7, 1.6); s.position.set(x, 8, z); s.target.position.set(x, 0, z); scene.add(s, s.target);
  lamps.push({ x, z, s, head });
  solids.push({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15 });
}
const isLit = (p) => (p.x > -20 && p.x < 20 && p.z > -45 && p.z < -15) || lamps.some((l) => Math.hypot(p.x - l.x, p.z - l.z) < 13);

// the device
const DEVICE = new THREE.Vector3(-8, 0, -38);
const device = new THREE.Group(); device.position.copy(DEVICE); scene.add(device);
const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.1, 24), matMetal); ped.position.y = 0.55; ped.castShadow = true; device.add(ped);
solids.push({ x0: -8.5, x1: -7.5, z0: -38.5, z1: -37.5 });
const core = new THREE.Group(); core.position.y = 1.55; device.add(core);
const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a2a40, emissive: 0x38b6ff, emissiveIntensity: 5 });
core.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), coreMat));
const rings = [0, 1, 2].map((i) => {
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.035, 0.012, 8, 40), new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 1, roughness: 0.2 }));
  core.add(r); return r;
});
const coreLight = new THREE.PointLight(0x38b6ff, 30, 16, 2); core.add(coreLight);

// motorcycle (placeholder shape)
const BIKE = new THREE.Vector3(-70, 0, -3);
const bike = new THREE.Group(); bike.position.copy(BIKE); scene.add(bike);
{
  const add = (g, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; bike.add(o); return o; };
  const tyre = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 });
  add(new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, -0.75, 0.44, 0);
  add(new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, 0.75, 0.44, 0);
  add(new THREE.BoxGeometry(1.0, 0.34, 0.3), matMetal, 0, 0.72, 0);
  add(new THREE.BoxGeometry(0.62, 0.24, 0.36), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.9, roughness: 0.18 }), -0.2, 0.98, 0);
  add(new THREE.BoxGeometry(0.6, 0.1, 0.28), matDark, 0.35, 0.95, 0);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.8), matMetal, -0.62, 0.82, 0, 0, -0.45);
  add(new THREE.CylinderGeometry(0.02, 0.02, 0.6), matMetal, -0.5, 1.16, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xfff2d0, emissiveIntensity: 4 }), -0.8, 0.98, 0);
  add(new THREE.BoxGeometry(0.1, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff1a10, emissiveIntensity: 3 }), 0.68, 0.9, 0);
}

// ---------- geometry helpers ----------
function segT(ax, az, bx, bz, b, p = 0) {
  let t0 = 0, t1 = 1;
  for (const [o, d, mn, mx] of [[ax, bx - ax, b.x0 - p, b.x1 + p], [az, bz - az, b.z0 - p, b.z1 + p]]) {
    if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) return null; }
    else { let a = (mn - o) / d, c = (mx - o) / d; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return null; }
  }
  return t0;
}
function firstHit(list, a, b, pad = 0) { let best = null; for (const bx of list) { const t = segT(a.x, a.z, b.x, b.z, bx, pad); if (t !== null && (best === null || t < best)) best = t; } return best; }
const sees = (a, b) => firstHit(blockers, a, b) === null;
const walkable = (a, b) => firstHit(solids, a, b, 0.45) === null;
function resolve(p, r = 0.4) {
  for (const b of solids) {
    const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r; }
    else { const o = [[p.x - b.x0, -1, 0], [b.x1 - p.x, 1, 0], [p.z - b.z0, 0, -1], [b.z1 - p.z, 0, 1]].sort((u, v) => u[0] - v[0])[0]; p.x += o[1] * (o[0] + r); p.z += o[2] * (o[0] + r); }
  }
}
const NAV = [[0, 33], [0, 24], [0, -12], [0, -18], [10, -27], [10, -33], [24, -36], [17, -36], [-24, -11], [24, -11], [-24, -49], [24, -49], [-64, -3], [-56, -3], [-42, 0], [42, 0], [0, 6], [-20, 20], [20, 20], [0, -24], [-8, -34]].map(([x, z]) => new THREE.Vector3(x, 0, z));
function steer(from, to) {
  if (walkable(from, to)) return to;
  let best = to, score = Infinity;
  for (const n of NAV) {
    if (from.distanceTo(n) < 0.8 || !walkable(from, n)) continue;
    const s = from.distanceTo(n) + n.distanceTo(to) + (walkable(n, to) ? 0 : 40);
    if (s < score) { score = s; best = n; }
  }
  return best;
}

// ---------- characters ----------
function human(tint, x, z) {
  const model = SkeletonUtils.clone(soldier.scene); model.rotation.y = Math.PI;
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); o.material.color.set(tint); o.frustumCulled = false; } });
  const root = new THREE.Group(); root.add(model); root.position.set(x, 0, z); scene.add(root);
  const mixer = new THREE.AnimationMixer(model), acts = {};
  for (const c of soldier.animations) acts[c.name] = mixer.clipAction(c);
  acts.Idle.play();
  return { root, model, mixer, acts, cur: 'Idle', h: 0 };
}
function anim(e, name) { if (e.cur === name) return; e.acts[name].reset().fadeIn(0.25).play(); e.acts[e.cur].fadeOut(0.25); e.cur = name; }
function face(e, dx, dz, dt, rate = 10) {
  const want = Math.atan2(dx, dz); let d = want - e.h; d = Math.atan2(Math.sin(d), Math.cos(d));
  e.h += d * Math.min(1, dt * rate); e.root.rotation.y = e.h;
}
function walkTo(e, target, speed, dt) {
  const p = e.root.position, dx = target.x - p.x, dz = target.z - p.z, d = Math.hypot(dx, dz);
  if (d > 0.05) { const s = Math.min(d, speed * dt); p.x += (dx / d) * s; p.z += (dz / d) * s; resolve(p); face(e, dx, dz, dt, 8); }
  anim(e, d < 0.1 ? 'Idle' : speed > 3 ? 'Run' : 'Walk');
  return d;
}

const START = new THREE.Vector3(0, 0, 56);
const player = human(0x3a3a44, START.x, START.z); player.h = Math.PI; player.root.rotation.y = Math.PI;
const carried = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), coreMat); carried.position.set(0, 1.25, -0.22); carried.visible = false; player.root.add(carried);
const carriedLight = new THREE.PointLight(0x38b6ff, 0, 7, 2); carriedLight.position.copy(carried.position); player.root.add(carriedLight);

const RANGE = 26, HALF = THREE.MathUtils.degToRad(60);
const coneGeo = new THREE.CircleGeometry(RANGE * 0.6, 28, Math.PI / 2 - HALF, HALF * 2);
const guards = [
  [[-8, 25], [8, 25]],
  [[-30, 9], [30, 9], [30, -6], [-30, -6]],
  [[-7, -11], [7, -11]],
  [[-2, -33], [16, -33], [16, -42], [-2, -42]],
  [[-52, -22], [-52, 16]],
].map((wps, i) => {
  const g = human(0xc4cfe0, wps[0][0], wps[0][1]);
  Object.assign(g, { wps: wps.map(([x, z]) => new THREE.Vector3(x, 0, z)), wi: 1, mode: 'patrol', aw: 0, last: new THREE.Vector3(), wait: 0, lost: 0, radio: null, down: false, found: false, id: i, pause: 0 });
  g.cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x7cff9a, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide }));
  g.cone.rotation.x = Math.PI / 2; g.cone.position.y = 0.06; g.root.add(g.cone);
  return g;
});

// ---------- state ----------
const S = { phase: 'menu', t: 0, stolen: false, alarm: false, alarmBeforeTheft: false, identified: false, bodyFound: false, combat: false, missingTimer: null, sneak: false, yaw: 0, pitch: 0.32, note: '', noteT: 0, alarmCause: '' };
const keys = {};
function note(text) { S.note = text; S.noteT = 4.5; }

function raiseAlarm(pos, cause) {
  if (S.alarm) return;
  S.alarm = true; S.alarmCause = cause; S.alarmBeforeTheft = !S.stolen;
  if (!S.stolen) { door.visible = true; doorMat.emissiveIntensity = 1.5; solids.push(doorBox); blockers.push(doorBox); note('ALARM — MAIN DOOR LOCKED. FIND ANOTHER WAY IN.'); }
  else note('ALARM — FACILITY ALERT');
  for (const g of guards) if (!g.down && g.mode !== 'chase') { g.mode = 'investigate'; g.last.copy(pos); g.wait = 0; }
  audio.siren(true);
}

// ---------- audio (generated, no files) ----------
const audio = {
  ctx: null, sirenGain: null,
  start() {
    if (this.ctx) return;
    const c = (this.ctx = new AudioContext());
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380;
    const g = c.createGain(); g.gain.value = 0.09; n.connect(f).connect(g).connect(c.destination); n.start();
    const lfo = c.createOscillator(); lfo.frequency.value = 0.13; const lg = c.createGain(); lg.gain.value = 160; lfo.connect(lg).connect(f.frequency); lfo.start();
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 520;
    const sl = c.createOscillator(); sl.frequency.value = 0.9; const sg = c.createGain(); sg.gain.value = 170; sl.connect(sg).connect(o.frequency); sl.start();
    const sf = c.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 1400;
    this.sirenGain = c.createGain(); this.sirenGain.gain.value = 0; o.connect(sf).connect(this.sirenGain).connect(c.destination); o.start();
  },
  siren(on) { if (this.sirenGain) this.sirenGain.gain.linearRampToValueAtTime(on ? 0.035 : 0, this.ctx.currentTime + 0.6); },
  ping(freq, dur = 0.5, vol = 0.08) {
    if (!this.ctx) return; const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(vol, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  },
};

// ---------- input ----------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyC' && S.phase === 'play') S.sneak = !S.sneak;
  if (e.code === 'KeyR' && S.phase === 'over') location.reload();
  if ((e.code === 'Space' || e.code === 'Enter') && S.phase === 'intro') beginPlay();
  if (e.code === 'KeyE' && S.phase === 'play') interact();
  if (e.code === 'KeyF' && S.phase === 'play') takedown();
});
addEventListener('keyup', (e) => (keys[e.code] = false));
let drag = false;
renderer.domElement.addEventListener('mousedown', () => { drag = true; if (S.phase === 'play') renderer.domElement.requestPointerLock?.(); });
addEventListener('mouseup', () => (drag = false));
addEventListener('mousemove', (e) => {
  if (S.phase !== 'play' || !(drag || document.pointerLockElement)) return;
  S.yaw -= e.movementX * 0.0026; S.pitch = clamp(S.pitch + e.movementY * 0.002, 0.04, 1.15);
});
$('title').addEventListener('click', () => { audio.start(); $('title').style.display = 'none'; S.phase = 'intro'; S.t = 0; $('bars').classList.remove('off'); });

function beginPlay() {
  S.phase = 'play'; $('bars').classList.add('off'); $('caption').textContent = ''; $('hud').style.display = 'block';
  if (!shot) renderer.domElement.requestPointerLock?.();
  followCam(0, true);
}

function nearestGuard(maxD, pred) {
  let best = null, bd = maxD;
  for (const g of guards) { const d = g.root.position.distanceTo(player.root.position); if (d < bd && pred(g)) { bd = d; best = g; } }
  return best;
}
const canTakedown = (g) => !g.down && g.mode !== 'chase';
function takedown() {
  const g = nearestGuard(1.9, canTakedown); if (!g) return;
  g.down = true; g.radio = null; g.mixer.stopAllAction(); g.model.rotation.x = -Math.PI / 2; g.model.position.y = 0.25; g.cone.visible = false;
  S.combat = true; audio.ping(90, 0.35, 0.2); note('GUARD DOWN — HIS RADIO CALL NEVER WENT OUT');
}
function interact() {
  const p = player.root.position;
  if (!S.stolen && p.distanceTo(DEVICE) < 2.4) { S.phase = 'theft'; S.t = 0; $('bars').classList.remove('off'); $('hud').style.display = 'none'; audio.ping(220, 2.5, 0.12); audio.ping(330, 2.5, 0.08); }
  else if (S.stolen && p.distanceTo(BIKE) < 2.8) { S.phase = 'ending'; S.t = 0; $('bars').classList.remove('off'); $('hud').style.display = 'none'; audio.siren(false); document.exitPointerLock?.(); }
}

// ---------- guard brain ----------
function updateGuard(g, dt) {
  if (g.down) return;
  const gp = g.root.position, pp = player.root.position;
  const dx = pp.x - gp.x, dz = pp.z - gp.z, d = Math.hypot(dx, dz);
  let ang = Math.atan2(dx, dz) - g.h; ang = Math.abs(Math.atan2(Math.sin(ang), Math.cos(ang)));
  const vis = d < RANGE && ang < HALF && sees(gp, pp);
  const moving = player.speed > 0.2;
  if (vis) {
    const motion = player.speed > 4 ? 1.7 : S.sneak ? (moving ? 0.5 : 0.3) : moving ? 1 : 0.7;
    let gain = 1.5 * (1 - d / RANGE) * (isLit(pp) ? 1 : 0.4) * motion * (ang < HALF / 2 ? 1 : 0.5);
    if (d < 3.5) gain = Math.max(gain, 2.5);
    g.aw += gain * dt; g.last.copy(pp);
  } else if (g.mode !== 'chase') g.aw -= 0.18 * dt;
  if (player.speed > 4 && d < 11 && g.aw < 0.75) { g.aw += (sees(gp, pp) ? 0.7 : 0.35) * dt; g.last.copy(pp); } // footstep noise
  g.aw = clamp(g.aw, 0, 1);

  // discovering a downed colleague
  for (const b of guards) {
    if (!b.down || b.found) continue;
    const bx = b.root.position.x - gp.x, bz = b.root.position.z - gp.z;
    let a = Math.atan2(bx, bz) - g.h; a = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)));
    if (Math.hypot(bx, bz) < 15 && a < HALF && sees(gp, b.root.position)) {
      b.found = true; S.bodyFound = true; g.last.copy(b.root.position); g.mode = 'investigate'; g.wait = 0;
      if (!S.alarm && g.radio === null) { g.radio = 2.5; g.cause = 'A guard found an unconscious colleague.'; note('A GUARD FOUND A BODY — HE IS REACHING FOR HIS RADIO'); }
    }
  }

  if (g.aw >= 1 && g.mode !== 'chase') {
    g.mode = 'chase'; g.lost = 0; S.identified = true; audio.ping(880, 0.25, 0.1);
    if (!S.alarm && g.radio === null) { g.radio = 2.5; g.cause = 'A guard identified you.'; note('IDENTIFIED — HE IS CALLING IT IN. STOP HIM OR RUN.'); }
  } else if (g.mode === 'patrol' || g.mode === 'suspicious') {
    if (g.aw >= 0.6) { g.mode = 'investigate'; g.wait = 0; }
    else g.mode = g.aw >= 0.25 ? 'suspicious' : 'patrol';
  }
  if (g.radio !== null) { g.radio -= dt; if (g.radio <= 0) { g.radio = null; raiseAlarm(g.last, g.cause); } }

  if (g.mode === 'patrol') {
    if (g.pause > 0) { g.pause -= dt; anim(g, 'Idle'); }
    else if (walkTo(g, steer(gp, g.wps[g.wi]), 1.45, dt) < 0.6 && gp.distanceTo(g.wps[g.wi]) < 0.8) { g.wi = (g.wi + 1) % g.wps.length; g.pause = 1.5; }
  } else if (g.mode === 'suspicious') {
    anim(g, 'Idle'); face(g, g.last.x - gp.x, g.last.z - gp.z, dt, 3);
  } else if (g.mode === 'investigate') {
    if (gp.distanceTo(g.last) > 1.4) walkTo(g, steer(gp, g.last), S.alarm ? 4.3 : 2.1, dt);
    else { anim(g, 'Idle'); g.wait += dt; g.h += dt * 1.1; g.root.rotation.y = g.h; if (g.wait > (S.alarm ? 7 : 4)) { g.mode = 'patrol'; g.aw = Math.min(g.aw, 0.2); } }
  } else if (g.mode === 'chase') {
    const target = vis ? pp : g.last;
    walkTo(g, steer(gp, target), 4.7, dt);
    if (vis && d < 1.3) return gameOver('CAPTURED', 'Security took you down inside the perimeter. The device never left the building.');
    if (!vis && gp.distanceTo(g.last) < 1.6) { g.lost += dt; if (g.lost > 5) { g.mode = 'investigate'; g.wait = 0; g.aw = 0.5; note('THEY LOST YOU — SEARCHING'); } } else if (vis) g.lost = 0;
  }
  const c = g.mode === 'chase' ? 0xff3b30 : g.aw >= 0.6 ? 0xff8a3c : g.aw >= 0.25 ? 0xffd84a : 0x7cff9a;
  g.cone.material.color.setHex(c); g.cone.material.opacity = g.mode === 'chase' ? 0.24 : g.aw >= 0.25 ? 0.16 : 0.09;
}

function gameOver(title, text) {
  S.phase = 'over'; document.exitPointerLock?.(); audio.siren(false);
  $('hud').style.display = 'none'; $('end').style.display = 'flex'; $('endTitle').textContent = title; $('endText').innerHTML = text;
}

// ---------- player ----------
const camTarget = new THREE.Vector3();
function updatePlayer(dt) {
  const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw);
  const ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  const iz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  let mx = fx * iz - fz * ix, mz = fz * iz + fx * ix; const m = Math.hypot(mx, mz);
  const sprint = (keys.ShiftLeft || keys.ShiftRight) && m > 0;
  if (sprint) S.sneak = false;
  const speed = m === 0 ? 0 : sprint ? 5.6 : S.sneak ? 1.35 : 2.7;
  player.speed = speed;
  if (m > 0) {
    mx /= m; mz /= m; const p = player.root.position;
    p.x += mx * speed * dt; p.z += mz * speed * dt; resolve(p); face(player, mx, mz, dt, 12);
  }
  anim(player, speed === 0 ? 'Idle' : sprint ? 'Run' : 'Walk');
  player.acts.Walk.timeScale = S.sneak ? 0.55 : 1;
}
function followCam(dt, snap) {
  const p = player.root.position; camTarget.set(p.x, 1.55, p.z);
  let dist = 5.2; const dir = new THREE.Vector3(Math.sin(S.yaw) * Math.cos(S.pitch), Math.sin(S.pitch), Math.cos(S.yaw) * Math.cos(S.pitch));
  const end = camTarget.clone().addScaledVector(dir, dist);
  const t = firstHit(blockers, camTarget, end, 0.3); if (t !== null) dist = Math.max(0.8, t * dist - 0.2);
  const inside = isLit(p) && p.z < -15 && p.z > -45 && Math.abs(p.x) < 20;
  const want = camTarget.clone().addScaledVector(dir, dist); if (inside) want.y = Math.min(want.y, 7.2);
  camera.position.lerp(want, snap ? 1 : Math.min(1, dt * 14)); camera.lookAt(camTarget);
}

// ---------- hud ----------
function hud() {
  const p = player.root.position, maxAw = Math.max(0, ...guards.filter((g) => !g.down).map((g) => (g.mode === 'chase' ? 1 : g.aw)));
  const lvl = S.alarm ? 3 : S.identified || S.bodyFound ? 2 : maxAw >= 0.25 ? 1 : 0;
  $('secText').textContent = ['0 · NORMAL', '1 · SUSPICION', '2 · LOCAL SEARCH', '3 · FACILITY ALERT'][lvl];
  $('secText').style.color = ['#7cff9a', '#ffd84a', '#ff8a3c', '#ff3b30'][lvl];
  $('bar').style.width = maxAw * 100 + '%'; $('bar').style.background = maxAw >= 1 ? '#ff3b30' : maxAw >= 0.6 ? '#ff8a3c' : maxAw >= 0.25 ? '#ffd84a' : '#7cff9a';
  $('objText').textContent = S.stolen ? 'Get out. Reach the motorcycle beyond the west fence.' : S.alarm ? 'Main door is sealed. Reach the lab through the east side door.' : 'Get inside the facility and steal the device from the lab.';
  let pr = '';
  if (!S.stolen && p.distanceTo(DEVICE) < 2.4) pr = '<kbd>E</kbd>TAKE THE DEVICE';
  else if (S.stolen && p.distanceTo(BIKE) < 2.8) pr = '<kbd>E</kbd>RIDE';
  else if (nearestGuard(1.9, canTakedown)) pr = '<kbd>F</kbd>TAKEDOWN';
  $('prompt').innerHTML = pr;
  $('note').textContent = S.noteT > 0 ? S.note : '';
  $('flags').innerHTML = `${isLit(p) ? 'VISIBILITY · LIT' : 'VISIBILITY · SHADOW'}<br>${S.sneak ? 'MOVEMENT · SNEAK' : player.speed > 4 ? 'MOVEMENT · SPRINT (LOUD)' : 'MOVEMENT · WALK'}<br>DEVICE · ${S.stolen ? 'CARRIED' : 'IN LAB'}`;
}

// ---------- cinematics ----------
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
const ease = (t) => t * t * (3 - 2 * t);
function intro(t) {
  const caps = [[0.5, 'NEVADA TEST RANGE · 19:42'], [3.6, 'ONE DEVICE. FIVE GUARDS.'], [6.6, 'NO ONE HAS TO KNOW YOU WERE HERE.']];
  let c = ''; for (const [at, text] of caps) if (t > at && t < at + 2.6) c = text; $('caption').textContent = c;
  if (t < 5) { const k = ease(t / 5); camera.position.set(lerp(95, 30, k), lerp(46, 16, k), lerp(70, 62, k)); camera.lookAt(tmpA.set(0, 4, -25)); }
  else if (t < 9) { const k = ease((t - 5) / 4); camera.position.set(lerp(-6, 2.2, k), lerp(3.2, 1.7, k), lerp(46, 52.4, k)); camera.lookAt(tmpA.set(0, lerp(4, 1.5, k), lerp(-25, 56, k))); }
  else beginPlay();
}
function theft(t, dt) {
  const k = clamp(t / 3.2, 0, 1), a = 2.2 + k * 1.6;
  camera.position.set(DEVICE.x + Math.sin(a) * lerp(2.6, 1.3, k), lerp(1.9, 1.6, k), DEVICE.z + Math.cos(a) * lerp(2.6, 1.3, k)); camera.lookAt(tmpA.set(DEVICE.x, 1.5, DEVICE.z));
  player.root.position.set(DEVICE.x + 0.95, 0, DEVICE.z + 0.2); face(player, -1, -0.2, dt, 6); anim(player, 'Idle');
  coreMat.emissiveIntensity = 5 + Math.sin(k * Math.PI) * 14; coreLight.intensity = 14 + Math.sin(k * Math.PI) * 60; bloom.strength = 0.45 + Math.sin(k * Math.PI) * 0.7;
  core.position.y = 1.55 + k * 0.12; rings.forEach((r, i) => (r.scale.setScalar(1 + k * (0.6 + i * 0.3))));
  if (t > 3.2) {
    S.stolen = true; core.visible = false; carried.visible = true; carriedLight.intensity = 5; coreMat.emissiveIntensity = 5; bloom.strength = 0.45;
    S.phase = 'play'; $('bars').classList.add('off'); $('hud').style.display = 'block'; S.yaw = Math.PI / 2;
    if (!S.alarm && !guards[3].down) { S.missingTimer = 35; note('DEVICE SECURED — THE LAB GUARD WILL NOTICE THE EMPTY PEDESTAL SOON'); }
    else if (!S.alarm) note('DEVICE SECURED — NOBODY LEFT TO NOTICE. WALK OUT.');
  }
}
function ending(t, dt) {
  const v = Math.min(26, t * 9);
  bike.position.x -= v * dt; player.root.position.set(bike.position.x + 0.15, 0.28, BIKE.z); player.h = -Math.PI / 2; player.root.rotation.y = player.h; anim(player, 'Idle');
  camera.position.set(BIKE.x - 9, 1.1, BIKE.z + 7); camera.lookAt(tmpB.set(bike.position.x, 1, BIKE.z));
  if (t > 4.2) {
    const [title, text] = !S.alarm
      ? ['GHOST', 'Nobody saw you and nobody knows the device is gone.<br><br><b>Next stage:</b> empty highway. Police response is delayed until the morning shift.']
      : !S.identified
        ? ['SHADOW', `The alarm is ringing, but they never saw your face. ${S.alarmCause}<br><br><b>Next stage:</b> patrol cars sweep the highway, looking for anyone at all.`]
        : ['HUNTED', `They know who took it. ${S.alarmCause}${S.alarmBeforeTheft ? ' The alarm went off before the theft, so the main door sealed and you came in the hard way.' : ''}<br><br><b>Next stage:</b> your description and the motorcycle are on every radio. Heavy pursuit and a helicopter.`];
    gameOver(title, text + `<br><br><small style="opacity:.6">Takedowns: ${guards.filter((g) => g.down).length} · Alarm: ${S.alarm ? 'yes' : 'no'} · Identified: ${S.identified ? 'yes' : 'no'}</small>`);
  }
}

// ---------- loop ----------
if (shot) { $('title').style.display = 'none'; beginPlay(); if (shot === '2') { player.root.position.set(-4, 0, -36); S.yaw = 1.2; } if (shot === '3') { player.root.position.set(-6, 0, 16); S.yaw = 0.5; } followCam(0, true);
  if (shot === '4') { player.root.position.set(-7, 0, -37.6); interact(); }
  if (shot === '5') { S.stolen = true; player.root.position.set(-69, 0, -1.5); interact(); }
  const sim = (n) => { for (let i = 0; i < n && S.phase === 'play'; i++) { updatePlayer(1 / 30); for (const g of guards) { updateGuard(g, 1 / 30); if (S.phase !== 'play') break; } if (S.missingTimer !== null && !S.alarm && (S.missingTimer -= 1 / 30) <= 0) raiseAlarm(DEVICE, 'The lab guard noticed the empty pedestal.'); } };
  if (shot === '6') { player.root.position.set(0, 0, 29); sim(900); }
  if (shot === '7') { player.root.position.set(-7, 0, -37.6); takedown(); theft(3.3, 0.01); sim(1200); followCam(0, true); hud(); console.log('STATE7', JSON.stringify({ alarm: S.alarm, cause: S.alarmCause, modes: guards.map((g) => (g.down ? 'down' : g.mode)), id: S.identified, body: S.bodyFound })); }
  if (shot === '6') console.log('STATE6', S.phase, S.alarm, S.identified, $('endTitle').textContent);
}
$('load').style.display = 'none';
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime; S.t += dt; S.noteT -= dt;
  if (S.phase === 'menu') { camera.position.set(Math.sin(time * 0.05) * 90, 30, 80 + Math.cos(time * 0.05) * 20); camera.lookAt(0, 4, -25); }
  else if (S.phase === 'intro') intro(S.t);
  else if (S.phase === 'play') {
    updatePlayer(dt); for (const g of guards) { updateGuard(g, dt); if (S.phase !== 'play') break; }
    if (S.missingTimer !== null && !S.alarm) { if (guards[3].down) S.missingTimer = null; else if ((S.missingTimer -= dt) <= 0) raiseAlarm(DEVICE, 'The lab guard noticed the empty pedestal.'); }
    followCam(dt); hud();
  } else if (S.phase === 'theft') theft(S.t, dt * 0.35);
  else if (S.phase === 'ending') ending(S.t, dt);

  const slow = S.phase === 'theft' ? 0.35 : 1;
  player.mixer.update(dt * slow); for (const g of guards) if (!g.down) g.mixer.update(dt * slow);
  rings.forEach((r, i) => { r.rotation.x = time * (0.7 + i * 0.4); r.rotation.y = time * (0.5 + i * 0.3); });
  if (S.alarm) { const p = 0.5 + 0.5 * Math.sin(time * 6); for (const l of lamps) { l.s.color.setRGB(1, 0.12 + 0.2 * (1 - p), 0.08); l.head.material.emissive.setRGB(1, 0.1, 0.05); l.head.material.emissiveIntensity = 1 + p * 4; } hall.color.setRGB(1, 0.25, 0.2); hall.intensity = 50 + p * 70; stripMat.emissiveIntensity = 1 + p * 4; }
  const f = S.phase === 'ending' ? bike.position : player.root.position;
  sun.target.position.set(f.x, 0, f.z); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 110);
  composer.render();
});
