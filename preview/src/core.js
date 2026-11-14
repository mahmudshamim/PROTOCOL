// Shared engine pieces: renderer, scene, sky, assets, collision world, characters.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };
export const params = new URLSearchParams(location.search);
export const isTouch = params.has('touch') || matchMedia('(pointer: coarse)').matches;
// Desktop keeps full quality. Phones get the low profile unless ?q=high.
export const LOW = params.get('q') === 'low' || (isTouch && params.get('q') !== 'high');
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => t * t * (3 - 2 * t);
export const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
export const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ---------- renderer ----------
export const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = LOW ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.prepend(renderer.domElement);

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x7d6a72, 0.0055);
export const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1400);

let composer = null, bloomPass = null;
if (!LOW) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.7, 2.2);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}
export const setBloom = (s) => { if (bloomPass) bloomPass.strength = s; };
let shakeT = 0, shakeAmt = 0;
const shakeOff = new THREE.Vector3();
/** Short camera shake, e.g. a punch landing. */
export const shake = (amount = 0.08, time = 0.15) => { shakeAmt = Math.max(shakeAmt, amount); shakeT = Math.max(shakeT, time); };
export function render(dt = 0.016) {
  if (shakeT > 0) {
    shakeT -= dt; const a = shakeAmt * Math.max(0, shakeT) / 0.15;
    shakeOff.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a); camera.position.add(shakeOff);
  }
  composer ? composer.render() : renderer.render(scene, camera);
  if (shakeT > 0 || shakeAmt) { camera.position.sub(shakeOff); shakeOff.set(0, 0, 0); if (shakeT <= 0) shakeAmt = 0; }
}
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight);
});

// ---------- sun and time of day ----------
export const sun = new THREE.DirectionalLight(0xffa56b, 3.2);
sun.castShadow = true;
const SM = LOW ? 1024 : 2048;
sun.shadow.mapSize.set(SM, SM); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-0.72, 0.3, 0.45).normalize();
const DUSK = { sun: new THREE.Color(0xffa56b), fog: new THREE.Color(0x7d6a72) };
const NIGHT = { sun: new THREE.Color(0x8fa6ff), fog: new THREE.Color(0x0d0c13) };
/** 0 = dusk (facility), 1 = full night (pursuit). */
export function setTimeOfDay(n) {
  sun.color.lerpColors(DUSK.sun, NIGHT.sun, n); sun.intensity = lerp(3.2, 0.35, n);
  sun.castShadow = n < 0.7;
  scene.backgroundIntensity = lerp(0.55, 0.05, n); scene.environmentIntensity = lerp(0.75, 0.1, n);
  scene.fog.color.lerpColors(DUSK.fog, NIGHT.fog, n); scene.fog.density = lerp(0.0055, 0.0075, n);
}
export function setFocus(p) {
  sun.target.position.set(p.x, 0, p.z);
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 110);
}

// ---------- assets ----------
const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();
const shared = (m) => { m.userData.shared = true; return m; };
async function pbr(name, repeat, extra = {}) {
  const load = async (suffix, srgb) => {
    const t = await texLoader.loadAsync(`/assets/${name}_${suffix}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = LOW ? 2 : 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const [map, normalMap, roughnessMap] = await Promise.all([load('diff', true), load('nor_gl'), load('rough')]);
  return shared(new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, ...extra }));
}

export const A = {};
const PROPS = ['crate', 'barrel', 'generator', 'barrier', 'boulders', 'covered_car', 'searchlight'];
export async function loadAssets() {
  const [hdr, soldier, wall, floor, sand, ...models] = await Promise.all([
    new RGBELoader().loadAsync('/assets/sky.hdr'),
    gltf.loadAsync('/assets/Soldier.glb'),
    pbr('concrete_wall_008', 1), pbr('concrete_floor_02', 10), pbr('sand_01', 90, { color: 0xd9b48c }),
    ...PROPS.map((p) => gltf.loadAsync(`/assets/props/${p}.glb`)),
  ]);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = hdr; scene.environment = hdr;
  wall.envMapIntensity = 0.4; wall.userData.tile = 5;
  floor.envMapIntensity = 0.15; floor.color.set(0x8a8f96);
  soldier.scene.traverse((o) => { if (o.isMesh) o.userData.shared = true; });
  Object.assign(A, { soldier, wall, floor, sand, props: {} });
  PROPS.forEach((p, i) => {
    const s = models[i].scene;
    s.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.shared = true; shared(o.material); } });
    A.props[p] = s;
  });
  A.metal = shared(new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.9, roughness: 0.35 }));
  A.dark = shared(new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.4, roughness: 0.6 }));
  A.rock = shared(new THREE.MeshStandardMaterial({ color: 0x5a3d30, roughness: 1, flatShading: true }));
  A.asphalt = shared(new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 }));
  setTimeOfDay(0);
}

// ---------- collision world ----------
// Everything a stage builds lives in one World so it can be removed in one call.
export class World {
  constructor() { this.group = new THREE.Group(); scene.add(this.group); this.solids = []; this.blockers = []; }
  add(o) { this.group.add(o); return o; }
  mesh(geo, mat, x, y, z, cast = true) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; this.group.add(m); return m;
  }
  box(x0, z0, x1, z1, y0, y1, mat, { solid = true, sight = true, cast = true } = {}) {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    if (mat.userData.tile) { // scale UVs so tiled textures do not stretch
      const uv = geo.attributes.uv, k = mat.userData.tile, w = Math.max(x1 - x0, z1 - z0) / k, h = (y1 - y0) / k;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
    }
    const m = this.mesh(geo, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, cast);
    const b = { x0, x1, z0, z1 };
    if (solid) this.solids.push(b);
    if (solid && sight) this.blockers.push(b);
    return { mesh: m, box: b };
  }
  place(src, x, z, ry = 0, s = 1, y = 0) {
    const o = src.clone(); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); this.group.add(o); return o;
  }
  static segT(ax, az, bx, bz, b, p) {
    let t0 = 0, t1 = 1;
    for (const [o, d, mn, mx] of [[ax, bx - ax, b.x0 - p, b.x1 + p], [az, bz - az, b.z0 - p, b.z1 + p]]) {
      if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) return null; }
      else { let a = (mn - o) / d, c = (mx - o) / d; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return null; }
    }
    return t0;
  }
  firstHit(list, a, b, pad = 0) {
    let best = null;
    for (const bx of list) { const t = World.segT(a.x, a.z, b.x, b.z, bx, pad); if (t !== null && (best === null || t < best)) best = t; }
    return best;
  }
  sees(a, b) { return this.firstHit(this.blockers, a, b) === null; }
  walkable(a, b) { return this.firstHit(this.solids, a, b, 0.45) === null; }
  resolve(p, r = 0.4) {
    for (const b of this.solids) {
      const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r; }
      else {
        const o = [[p.x - b.x0, -1, 0], [b.x1 - p.x, 1, 0], [p.z - b.z0, 0, -1], [b.z1 - p.z, 0, 1]].sort((u, v) => u[0] - v[0])[0];
        p.x += o[1] * (o[0] + r); p.z += o[2] * (o[0] + r);
      }
    }
  }
  /** Next point to walk to: straight if clear, else the best hand-placed nav node. */
  steer(from, to, nav) {
    if (this.walkable(from, to)) return to;
    let best = to, score = Infinity;
    for (const n of nav) {
      if (from.distanceTo(n) < 0.8 || !this.walkable(from, n)) continue;
      const s = from.distanceTo(n) + n.distanceTo(to) + (this.walkable(n, to) ? 0 : 40);
      if (s < score) { score = s; best = n; }
    }
    return best;
  }
  dispose() {
    scene.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        if (m.userData.shared) continue;
        if (m.map?.isCanvasTexture) m.map.dispose();
        m.dispose();
      }
    });
  }
}

// ---------- characters ----------
export function human(parent, tint) {
  const model = SkeletonUtils.clone(A.soldier.scene); model.rotation.y = Math.PI;
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.frustumCulled = false;
    o.material = o.material.clone(); o.material.userData = {}; o.material.color.set(tint);
  });
  const root = new THREE.Group(); root.add(model); parent.add(root);
  const mixer = new THREE.AnimationMixer(model), acts = {};
  for (const c of A.soldier.animations) acts[c.name] = mixer.clipAction(c);
  acts.Idle.play();
  return { root, model, mixer, acts, cur: 'Idle', h: 0, speed: 0, bones: {} };
}
const bone = (e, n) => (e.bones[n] ??= e.model.getObjectByName('mixamorig' + n));
/** Start a punch on this character (alternates left and right). */
export function punch(e) { e.punchSide = e.punchSide === 'Right' ? 'Left' : 'Right'; e.punchT = 0; }
/** Start a hit reaction (body snaps back). */
export function flinch(e) { e.flinchT = 0; }
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _va = new THREE.Vector3();
const _f = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
/** Turn a bone (in world space) by k of the way so it points along dir. Mixamo bones point down their local +Y. */
function aimBone(b, dir, k) {
  if (!b) return;
  b.updateWorldMatrix(true, false);
  const qW = b.getWorldQuaternion(_qa);
  _qb.setFromUnitVectors(_va.set(0, 1, 0).applyQuaternion(qW).normalize(), dir);
  _qc.identity().slerp(_qb, k).multiply(qW);
  b.quaternion.copy(b.parent.getWorldQuaternion(_qb).invert().multiply(_qc));
}
/** Rotate a bone in world space about an axis. */
function turnBone(b, axis, angle) {
  if (!b) return;
  b.updateWorldMatrix(true, false);
  _qc.setFromAxisAngle(axis, angle).multiply(b.getWorldQuaternion(_qa));
  b.quaternion.copy(b.parent.getWorldQuaternion(_qb).invert().multiply(_qc));
}
/** Procedural poses layered on top of the animation clips. Call after mixer.update(). */
export function applyPose(e, dt) {
  const punching = e.punchT !== undefined && e.punchT < 0.3, flinching = e.flinchT !== undefined && e.flinchT < 0.35;
  if (!punching && !flinching) return;
  _f.set(Math.sin(e.h), 0, Math.cos(e.h)); _r.set(-_f.z, 0, _f.x); // forward and right in world space
  if (punching) {
    e.punchT += dt;
    const k = Math.sin(Math.PI * Math.min(1, e.punchT / 0.3)), side = e.punchSide, sign = side === 'Right' ? 1 : -1;
    turnBone(bone(e, 'Spine1'), UP, sign * 0.4 * k); // shoulder drives through
    _t.copy(_f).addScaledVector(_r, -sign * 0.15).add(_va.set(0, 0.08, 0)).normalize();
    aimBone(bone(e, side + 'Arm'), _t, k);
    aimBone(bone(e, side + 'ForeArm'), _t, k);
  }
  if (flinching) {
    e.flinchT += dt;
    const k = Math.sin(Math.PI * Math.min(1, e.flinchT / 0.35));
    turnBone(bone(e, 'Spine1'), _r, 0.4 * k); turnBone(bone(e, 'Head'), _r, 0.45 * k); // snap back
  }
}
export function anim(e, name) {
  if (e.cur === name) return;
  e.acts[name].reset().fadeIn(0.25).play(); e.acts[e.cur].fadeOut(0.25); e.cur = name;
}
export function face(e, dx, dz, dt, rate = 10) {
  const d = wrapAngle(Math.atan2(dx, dz) - e.h);
  e.h += d * Math.min(1, dt * rate); e.root.rotation.y = e.h;
}
/** Emissive material for lamps, screens and light bars (glows with bloom). */
export const glow = (color, intensity) => new THREE.MeshStandardMaterial({ color: 0, emissive: color, emissiveIntensity: intensity });
