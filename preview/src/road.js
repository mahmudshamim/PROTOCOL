// Endless desert highway, streamed in 200 m chunks ahead of the player.
// The road runs toward -z; "d" is distance along it (d = -z).
import { THREE, A, World, rng, glow, LOW } from './core.js';

const CHUNK = 200;

function roadTexture(lanes) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#1f1f22'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 2600; i++) { const v = 20 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(Math.random() * 256, Math.random() * 512, 2, 2); }
  g.fillStyle = '#d8d6cc'; g.fillRect(8, 0, 4, 512); g.fillRect(244, 0, 4, 512);
  if (lanes === 2) { g.fillStyle = '#e0c060'; for (let y = 0; y < 512; y += 512) g.fillRect(125, y, 5, 190); }
  else {
    g.fillStyle = '#e0c060'; g.fillRect(121, 0, 4, 512); g.fillRect(131, 0, 4, 512);
    g.fillStyle = '#d8d6cc'; for (const x of [64, 190]) g.fillRect(x, 0, 4, 190);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = LOW ? 2 : 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Road {
  /**
   * features: { rocks: [[d, lat]], drifts: [[d, len, lat, width]], underpasses: [d], canyons: [[d0, d1]],
   *             exits: [d], gates: [[d, gapLat]] }
   */
  constructor(world, { width = 9, lanes = 2, features = {}, seed = 7, startAt0 = false } = {}) {
    Object.assign(this, { world, width, half: width / 2, lanes, f: features, seed, startAt0 });
    this.mat = new THREE.MeshStandardMaterial({ map: roadTexture(lanes), roughness: 0.85, metalness: 0 });
    this.chunks = new Map(); this.obstacles = []; this.exitState = new Map();
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), A.sand);
    sand.rotation.x = -Math.PI / 2; sand.position.y = startAt0 ? -0.03 : 0; sand.receiveShadow = true; sand.userData.shared = false; world.add(sand);
    sand.geometry.attributes.uv.array.forEach((_, i, a) => { a[i] *= 1200 / 900; });
    this.sand = sand;
    this.mesas = [];
    for (let i = 0; i < 16; i++) {
      const m = world.mesh(new THREE.CylinderGeometry(22 + (i % 3) * 14, 40 + (i % 5) * 12, 26 + (i % 4) * 14, 7), A.rock, 0, 12, 0, false);
      m.rotation.y = i; this.mesas.push({ m, a: i * 0.39, r: 330 + (i % 4) * 50 });
    }
    this.reflectorMat = glow(0xffb050, 1.6);
    this.driftMat = A.sand.clone(); Object.assign(this.driftMat, { transparent: true, opacity: 0.55, depthWrite: false }); this.driftMat.userData = {};
  }
  cx(z) { const d = -z; return 30 * Math.sin(d / 260) + 14 * Math.sin(d / 97 + 1.3); }
  heading(z) { const d = -z; return Math.atan2((30 / 260) * Math.cos(d / 260) + (14 / 97) * Math.cos(d / 97 + 1.3), -1); }
  lateral(p) { return p.x - this.cx(p.z); }
  point(d, lat = 0) { return new THREE.Vector3(this.cx(-d) + lat, 0, -d); }
  inZone(d) {
    for (const u of this.f.underpasses ?? []) if (d > u - 9 && d < u + 9) return 'underpass';
    for (const [a, b] of this.f.canyons ?? []) if (d > a && d < b) return 'canyon';
    return null;
  }
  inDrift(p) {
    const d = -p.z, lat = this.lateral(p);
    return (this.f.drifts ?? []).some(([dd, len, l, w]) => d > dd && d < dd + len && Math.abs(lat - l) < w / 2);
  }
  /** Keep chunks around d loaded; re-centre the sand and the distant mesas. */
  update(focus) {
    const d = -focus.z, first = Math.floor((d - 150) / CHUNK), last = Math.floor((d + 520) / CHUNK);
    for (let i = first; i <= last; i++) if (!this.chunks.has(i) && !(this.startAt0 && i < 0)) this.chunks.set(i, this.build(i));
    for (const [i, c] of this.chunks) if (i < first - 1 || i > last + 1) { this.drop(c); this.chunks.delete(i); }
    this.sand.position.set(Math.round(focus.x / 100) * 100, this.sand.position.y, Math.round(focus.z / 100) * 100);
    for (const { m, a, r } of this.mesas) m.position.set(focus.x + Math.sin(a) * r, 12, focus.z + Math.cos(a) * r);
  }
  drop(c) {
    this.world.group.remove(c.group);
    c.group.traverse((o) => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); });
    this.obstacles = this.obstacles.filter((o) => !c.obstacles.includes(o));
  }
  build(i) {
    const d0 = i * CHUNK, d1 = d0 + CHUNK, group = new THREE.Group(), obstacles = [], R = rng(this.seed * 1000 + i + 5000);
    this.world.add(group);
    const mesh = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; group.add(m); return m; };
    // road surface
    const step = 5, n = CHUNK / step, pos = [], uv = [], idx = [];
    for (let k = 0; k <= n; k++) {
      const d = d0 + k * step, c = this.cx(-d);
      pos.push(c - this.half, 0.03, -d, c + this.half, 0.03, -d); uv.push(0, d / 12, 1, d / 12);
      if (k < n) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const road = new THREE.Mesh(geo, this.mat); road.receiveShadow = true; group.add(road);
    // reflector posts, one instanced draw per chunk
    const refl = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), this.reflectorMat, (CHUNK / 25) * 2);
    const m4 = new THREE.Matrix4(); let r = 0;
    for (let d = d0; d < d1; d += 25) for (const s of [-1, 1]) { m4.makeTranslation(this.cx(-d) + s * (this.half + 0.7), 0.45, -d); refl.setMatrixAt(r++, m4); }
    group.add(refl);
    // utility poles and rocks
    for (let d = d0; d < d1; d += 50) {
      const x = this.cx(-d) + this.half + 5;
      mesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 6), A.dark, x, 4.5, -d);
      mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), A.dark, x, 8.4, -d, false);
    }
    for (let k = 0; k < 4; k++) {
      const d = d0 + R() * CHUNK, side = R() < 0.5 ? -1 : 1, off = this.half + 14 + R() * 50;
      const o = A.props.boulders.clone(); o.position.set(this.cx(-d) + side * off, 0, -d); o.rotation.y = R() * 6; o.scale.setScalar(0.6 + R() * 1.4); group.add(o);
    }
    // features inside this chunk
    const inC = (d) => d >= d0 && d < d1;
    for (const [d, lat] of this.f.rocks ?? []) if (inC(d)) {
      const p = this.point(d, lat); const o = A.props.boulders.clone(); o.position.copy(p); o.scale.setScalar(0.45); o.rotation.y = d; group.add(o);
      obstacles.push({ x: p.x, z: p.z, r: 1.5, kind: 'rock' });
    }
    for (const [d, len, lat, w] of this.f.drifts ?? []) if (inC(d)) {
      for (let k = 0; k < len; k += 6) {
        const p = this.point(d + k + 3, lat);
        const s = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 28), this.driftMat); s.userData.shared = false;
        s.rotation.x = -Math.PI / 2; s.position.set(p.x, 0.045, p.z); s.scale.set(1, 1.6, 1); s.receiveShadow = true; group.add(s);
      }
    }
    for (const [d, gap] of this.f.gates ?? []) if (inC(d)) {
      const c = this.cx(-d), h = this.heading(-d);
      for (let lat = -this.half - 1; lat <= this.half + 1; lat += 1.6) {
        if (Math.abs(lat - gap) < 2.2) continue;
        const o = A.props.barrier.clone(); o.position.set(c + lat, 0, -d); o.rotation.y = h + Math.PI / 2; group.add(o);
        obstacles.push({ x: c + lat, z: -d, r: 0.9, kind: 'barrier' });
      }
      mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), glow(0xff3020, 6), c + gap - 2.4, 1.2, -d, false);
      mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), glow(0xff3020, 6), c + gap + 2.4, 1.2, -d, false);
    }
    for (const u of this.f.underpasses ?? []) if (inC(u)) {
      const c = this.cx(-u), w = this.width + 12;
      mesh(new THREE.BoxGeometry(w, 1.2, 14), A.wall, c, 6.4, -u);
      mesh(new THREE.BoxGeometry(w, 0.15, 0.4), glow(0xffb050, 2), c, 5.7, -u + 7, false);
      for (const s of [-1, 1]) {
        mesh(new THREE.BoxGeometry(1.2, 6, 12), A.wall, c + s * (this.half + 2.2), 3, -u);
        for (let k = -5; k <= 5; k += 2.5) obstacles.push({ x: c + s * (this.half + 2.2), z: -u + k, r: 1.1, kind: 'pillar' });
      }
    }
    for (const [a, b] of this.f.canyons ?? []) {
      for (let d = Math.max(a, d0); d < Math.min(b, d1); d += 10) {
        const c = this.cx(-d - 5), h = this.heading(-d - 5);
        for (const s of [-1, 1]) {
          const hgt = 18 + R() * 16, wall = mesh(new THREE.BoxGeometry(8, hgt, 11), A.rock, c + s * (this.half + 7), hgt / 2, -d - 5);
          wall.rotation.y = h;
        }
      }
    }
    for (const d of this.f.exits ?? []) if (inC(d)) {
      const c = this.cx(-d), h = this.heading(-d);
      const ramp = mesh(new THREE.PlaneGeometry(7, 60), this.mat, c + this.half + 14, 0.035, -d - 22, false);
      ramp.rotation.set(-Math.PI / 2, 0, h - Math.PI - 0.55);
      for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(1.4, 0.9, 0.12), glow(0xffa31a, 3), c + this.half + 1.2, 1.4, -d + 18 - k * 8, false).rotation.y = h;
      const bar = mesh(new THREE.BoxGeometry(8, 0.25, 0.25), glow(0xff2020, 5), c + this.half + 5, 1.1, -d - 2, false); bar.rotation.y = h + 0.55;
      this.exitState.set(d, { bar });
    }
    return { group, obstacles: (this.obstacles.push(...obstacles), obstacles) };
  }
  /** The exit whose mouth contains p, or null. */
  exitAt(p) {
    const d = -p.z, lat = this.lateral(p);
    for (const e of this.f.exits ?? []) if (d > e - 6 && d < e + 22 && lat > this.half + 1 && lat < this.half + 16) return e;
    return null;
  }
}
