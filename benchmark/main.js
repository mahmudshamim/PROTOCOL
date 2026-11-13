// PROTOCOL visual benchmark (plan Step 3). One scene, three render paths:
//   npm run dev          -> WebGLRenderer
//   npm run dev:webgpu   -> WebGPURenderer (add ?force=webgl for its WebGL 2 backend)
// URL params: q=high|low, bench=1 (measure and save to results/), force=webgl
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createRenderer, createBloom } from '#post';

const params = new URLSearchParams(location.search);
const GPU_BUILD = import.meta.env.MODE === 'webgpu';
const FORCE_GL = params.get('force') === 'webgl';
const QUALITY = params.get('q') === 'low' ? 'low' : 'high';
const Q = { high: { w: 1920, h: 1080, shadow: 2048, bloom: true, aniso: 8 }, low: { w: 1280, h: 720, shadow: 1024, bloom: false, aniso: 2 } }[QUALITY];
const NO_MSAA = params.get('msaa') === '0'; // WebGL path only: drop 4x MSAA on the post-processing target
const PATH = !GPU_BUILD ? 'webgl' : FORCE_GL ? 'webgpu-forced-webgl2' : 'webgpu';
const panel = document.getElementById('panel');
const t0 = performance.now();

// ---------- renderer ----------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, Q.w / Q.h, 0.1, 900);
const { renderer, backend } = await createRenderer(FORCE_GL);
renderer.setPixelRatio(1);
renderer.setSize(Q.w, Q.h, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.info.autoReset = false;
document.body.prepend(renderer.domElement);

const renderFrame = Q.bloom ? createBloom(renderer, scene, camera, Q.w, Q.h, NO_MSAA ? 0 : 4) : () => renderer.render(scene, camera);

// ---------- assets ----------
const tex = new THREE.TextureLoader();
async function pbr(name, repeat, extra = {}) {
  const load = async (suffix, srgb) => {
    const t = await tex.loadAsync(`/assets/${name}_${suffix}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = Q.aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const [map, normalMap, roughnessMap] = await Promise.all([load('diff', true), load('nor_gl'), load('rough')]);
  return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, ...extra });
}
const gltf = new GLTFLoader();
const MODELS = ['concrete_road_barrier_02', 'Barrel_01', 'old_military_crate', 'portable_generator', 'namaqualand_boulders_01', 'covered_car', 'portable_searchlight'];
const [hdr, soldier, matWall, matSand, ...loaded] = await Promise.all([
  new RGBELoader().loadAsync('/assets/sky.hdr'),
  gltf.loadAsync('/assets/Soldier.glb'),
  pbr('concrete_wall_008', 1, { envMapIntensity: 0.4 }),
  pbr('sand_01', 90, { color: 0xd9b48c }),
  ...MODELS.map((m) => gltf.loadAsync(`/models/${m}/${m}.gltf`)),
]);
const model = Object.fromEntries(MODELS.map((m, i) => [m, loaded[i].scene]));
for (const m of Object.values(model)) m.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (o.material[k]) o.material[k].anisotropy = Q.aniso; } });

hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.background = hdr; scene.environment = hdr;
scene.backgroundIntensity = 0.55; scene.environmentIntensity = 0.75;
scene.fog = new THREE.FogExp2(0x7d6a72, 0.0055);

// ---------- scene: facility front slice ----------
const sun = new THREE.DirectionalLight(0xffa56b, 3.2);
sun.castShadow = true; sun.shadow.mapSize.set(Q.shadow, Q.shadow); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 220 });
sun.position.set(-79, 33, 50); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);

const matMetal = new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.9, roughness: 0.35 });
const matDark = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.4, roughness: 0.6 });
function box(x0, z0, x1, z1, y0, y1, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); m.castShadow = cast; m.receiveShadow = true; scene.add(m);
  if (mat === matWall) { const uv = m.geometry.attributes.uv, w = Math.max(x1 - x0, z1 - z0) / 5, h = (y1 - y0) / 5; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h); }
  return m;
}
function place(name, x, z, ry = 0, s = 1) { const o = model[name].clone(); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s); scene.add(o); return o; }

const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), matSand); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const road = new THREE.Mesh(new THREE.PlaneGeometry(116, 41), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.85 })); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 7.5); road.receiveShadow = true; scene.add(road);

// building x[-20,20] z[-45,-15]
box(-20, -15.6, -2, -15, 0, 8, matWall); box(2, -15.6, 20, -15, 0, 8, matWall); box(-2, -15.6, 2, -15, 3.2, 8, matWall);
box(-20.6, -45, -20, -15, 0, 8, matWall); box(20, -45, 20.6, -15, 0, 8, matWall); box(-20, -45, 20, -44.4, 0, 8, matWall);
box(-21, -46, 21, -14, 8, 8.5, matDark);
box(-20, -14.95, 20, -14.9, 7.2, 7.35, new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff5a3c, emissiveIntensity: 2.2 }), false);
// device glow in the doorway (bloom test)
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshStandardMaterial({ color: 0x0a2a40, emissive: 0x38b6ff, emissiveIntensity: 6 })); core.position.set(0, 1.5, -19); scene.add(core);
const coreLight = new THREE.PointLight(0x38b6ff, 40, 18, 2); coreLight.position.copy(core.position); scene.add(coreLight);

// fence
const fc = document.createElement('canvas'); fc.width = fc.height = 64; const fx = fc.getContext('2d'); fx.strokeStyle = '#9aa0a6'; fx.lineWidth = 3;
fx.beginPath(); fx.moveTo(0, 0); fx.lineTo(64, 64); fx.moveTo(64, 0); fx.lineTo(0, 64); fx.stroke();
for (const [x0, x1] of [[-60, -5], [5, 60]]) {
  const t = new THREE.CanvasTexture(fc); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set((x1 - x0) * 2, 6);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 3), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.5 }));
  f.position.set((x0 + x1) / 2, 1.5, 30); f.castShadow = true; scene.add(f);
  for (let x = x0; x <= x1; x += 5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), matMetal); p.position.set(x, 1.6, 30); scene.add(p); }
}
// containers (placeholder boxes)
[[-34, 14, 0x7a2e22], [-22, 2, 0x24445c], [26, 12, 0x3d4a2e], [38, -2, 0x5c4a24], [-40, -6, 0x2b2b30], [30, -20, 0x7a2e22]].forEach(([x, z, c], i) => {
  const [w, d] = i % 2 ? [2.5, 6.2] : [6.2, 2.5];
  box(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 0, 2.7, new THREE.MeshStandardMaterial({ color: c, metalness: 0.6, roughness: 0.55 }));
});
// Poly Haven props (real PBR assets)
for (let i = 0; i < 6; i++) place('concrete_road_barrier_02', -12 + i * 2.2 + (i > 2 ? 11 : 0), 27, 0);
[[-6, 4], [-5.2, 4.3], [-5.6, 3.4], [12, -8], [12.8, -8.2], [-17, -12], [-16.2, -12.4], [22, 6]].forEach(([x, z], i) => place('Barrel_01', x, z, i));
[[8, 2], [8.2, 3.3], [-14, 8], [-13, 9.2], [17, -11], [-26, -10]].forEach(([x, z], i) => place('old_military_crate', x, z, i * 0.7));
place('portable_generator', 5, -12, 0.4); place('portable_generator', -30, 18, 2);
place('covered_car', -8, 12, 0.3); place('covered_car', 18, 16, -1.2);
place('portable_searchlight', -3.5, 24, 2.6); place('portable_searchlight', 3.5, 24, 0.5);
[[-18, 44, 1.4], [22, 48, 1], [-40, 40, 2], [48, 38, 1.6], [-70, 8, 2.4], [70, -10, 2]].forEach(([x, z, s], i) => place('namaqualand_boulders_01', x, z, i * 1.3, s));
// lamps
for (const [x, z] of [[-9, 22], [9, -9], [-30, 6], [34, 6]]) {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8), matMetal); pole.position.set(x, 4, z); pole.castShadow = true; scene.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.5), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffd9a0, emissiveIntensity: 3 })); head.position.set(x, 8, z); scene.add(head);
  const s = new THREE.SpotLight(0xffd0a0, 260, 34, 0.75, 0.7, 1.6); s.position.set(x, 8, z); s.target.position.set(x, 0, z); scene.add(s, s.target);
}
// motorcycle (placeholder shape)
const bike = new THREE.Group(); bike.position.set(-3, 0, 20); bike.rotation.y = 0.6; scene.add(bike);
{
  const add = (g, m, x, y, z, rx = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; bike.add(o); };
  const tyre = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 });
  add(new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, -0.75, 0.44, 0); add(new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, 0.75, 0.44, 0);
  add(new THREE.BoxGeometry(1.0, 0.34, 0.3), matMetal, 0, 0.72, 0);
  add(new THREE.BoxGeometry(0.62, 0.24, 0.36), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.9, roughness: 0.18 }), -0.2, 0.98, 0);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.8), matMetal, -0.62, 0.82, 0, 0, -0.45);
  add(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xfff2d0, emissiveIntensity: 4 }), -0.8, 0.98, 0);
}
// characters: 6 skinned, animated (placeholder model, production-like load)
const humans = [[0, 18, 0x3a3a44, 0], [-8, 25, 0xc4cfe0, 1.2], [6, -11, 0xc4cfe0, 2.2], [-20, 8, 0xc4cfe0, 3.1], [24, 2, 0xc4cfe0, 4], [10, 10, 0xc4cfe0, 5]].map(([x, z, tint, phase], i) => {
  const m = SkeletonUtils.clone(soldier.scene);
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); o.material.color.set(tint); o.frustumCulled = false; } });
  const root = new THREE.Group(); root.add(m); scene.add(root);
  const mixer = new THREE.AnimationMixer(m); mixer.clipAction(soldier.animations.find((c) => c.name === (i ? 'Walk' : 'Idle'))).play(); mixer.update(phase);
  return { root, mixer, x, z, phase, walk: i > 0 };
});

// ---------- frame ----------
let simT = 0;
function advance(dt) {
  simT += dt;
  for (const h of humans) {
    h.mixer.update(dt);
    if (h.walk) { const a = simT * 0.35 + h.phase; h.root.position.set(h.x + Math.cos(a) * 3, 0, h.z + Math.sin(a) * 3); h.root.rotation.y = -a + Math.PI; } // model faces -Z
    else { h.root.position.set(h.x, 0, h.z); h.root.rotation.y = 0; }
  }
  const a = simT * 0.12 + 0.35;
  camera.position.set(Math.sin(a) * 15, 2.4 + Math.sin(simT * 0.2) * 0.6, 14 + Math.cos(a) * 15);
  camera.lookAt(0, 1.6, 0);
  core.rotation.y = simT;
}
const info = () => { const r = renderer.info.render; return { calls: r.drawCalls ?? r.calls, triangles: r.triangles }; };
function draw() { renderer.info.reset(); renderFrame(); }

function textureMemoryMB() {
  const seen = new Set(); let bytes = 0;
  scene.traverse((o) => { const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of mats) for (const k in m) { const t = m[k]; if (t && t.isTexture && !seen.has(t.uuid) && t.image) { seen.add(t.uuid); bytes += (t.image.width || 0) * (t.image.height || 0) * 4 * 1.33; } } });
  bytes += Q.shadow * Q.shadow * 4; // sun shadow map
  return { textures: seen.size, mb: Math.round(bytes / 1048576) };
}

const loadMs = Math.round(performance.now() - t0);
const raf = () => new Promise((r) => requestAnimationFrame(r));
const links = `<a href="http://localhost:5201/?q=${QUALITY}">webgl</a> · <a href="http://localhost:5202/?q=${QUALITY}">webgpu</a> · <a href="http://localhost:5202/?force=webgl&q=${QUALITY}">webgpu→webgl2</a> · <a href="?q=${QUALITY === 'high' ? 'low' : 'high'}${FORCE_GL ? '&force=webgl' : ''}">quality: ${QUALITY}</a>`;

if (params.get('bench')) {
  for (let i = 0; i < 90; i++) { advance(1 / 60); draw(); await raf(); }
  let cpu = 0; for (let i = 0; i < 120; i++) { advance(1 / 60); const t = performance.now(); draw(); cpu += performance.now() - t; await raf(); }
  const stats = info();
  // GPU-inclusive frame time: draw, then block until the GPU has finished that frame.
  const device = renderer.backend?.device, gl = device ? null : (renderer.backend?.gl ?? renderer.getContext()), px = new Uint8Array(4);
  const gpuDone = async () => { if (device) await device.queue.onSubmittedWorkDone(); else gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
  const times = [];
  for (let i = 0; i < 150; i++) { advance(1 / 60); const t = performance.now(); draw(); await gpuDone(); times.push(performance.now() - t); await raf(); }
  times.sort((x, y) => x - y);
  const frameMs = times.reduce((x, y) => x + y, 0) / times.length, p95 = times[Math.floor(times.length * 0.95)];
  simT = 14; advance(0); draw();
  const image = renderer.domElement.toDataURL('image/jpeg', 0.9);
  const result = { name: `${PATH}-${QUALITY}${NO_MSAA ? '-nomsaa' : ''}`, path: PATH, backend, quality: QUALITY, resolution: `${Q.w}x${Q.h}`, bloom: Q.bloom, shadowMap: Q.shadow, loadMs, cpuMsPerFrame: +(cpu / 120).toFixed(2), drawCalls: stats.calls, triangles: stats.triangles, frameMs: +frameMs.toFixed(2), frameMsP95: +p95.toFixed(2), fps: +(1000 / frameMs).toFixed(1), jsHeapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, textureEstimate: textureMemoryMB(), userAgent: navigator.userAgent, image };
  await fetch('/__result', { method: 'POST', body: JSON.stringify(result) });
  panel.textContent = 'benchmark saved: ' + result.name;
} else {
  let last = performance.now(), acc = 0, n = 0, fps = 0;
  renderer.setAnimationLoop(() => {
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now;
    advance(dt); draw(); acc += dt; n++;
    if (acc > 0.5) { fps = n / acc; acc = 0; n = 0; const s = info(), m = textureMemoryMB();
      panel.innerHTML = `PROTOCOL benchmark · ${backend} · ${QUALITY} ${Q.w}x${Q.h}\nfps ${fps.toFixed(0)} (display-capped) · draw calls ${s.calls} · triangles ${(s.triangles / 1000).toFixed(0)}k\ntextures ~${m.mb} MB · js heap ${performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : '?'} MB · load ${loadMs} ms\n${links}`; }
  });
}
