// Placeholder vehicle models and an arcade driving model shared by every vehicle.
import { THREE, A, LOW, clamp, wrapAngle, glow } from './core.js';

const tyre = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.9 }); tyre.userData.shared = true;
const glass = new THREE.MeshStandardMaterial({ color: 0x07090c, metalness: 1, roughness: 0.06 }); glass.userData.shared = true;
const chrome = new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: 1, roughness: 0.2 }); chrome.userData.shared = true;

function part(parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const paint = (color, gloss = 0.25) => (LOW
  ? new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: gloss })
  : new THREE.MeshPhysicalMaterial({ color, metalness: 0.65, roughness: gloss, clearcoat: 1, clearcoatRoughness: 0.08 }));

/** Four wheels; front ones steer. Returns spin groups. */
function wheels(body, w, z, r, width = 0.28) {
  const spin = [], steer = [];
  for (const [x, zz, front] of [[w, z, true], [-w, z, true], [w, -z, false], [-w, -z, false]]) {
    const s = new THREE.Group(); s.position.set(x, r, zz); body.add(s);
    const sp = new THREE.Group(); s.add(sp);
    part(sp, new THREE.CylinderGeometry(r, r, width, 18), tyre, 0, 0, 0, 0, 0, Math.PI / 2);
    part(sp, new THREE.CylinderGeometry(r * 0.62, r * 0.62, width + 0.02, 10), chrome, 0, 0, 0, 0, 0, Math.PI / 2);
    spin.push(sp); if (front) steer.push(s);
  }
  return { spin, steer, r };
}

export function buildBike() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const inner = new THREE.Group(); inner.rotation.y = Math.PI / 2; body.add(inner); // model was built facing -x
  const fw = part(inner, new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, -0.75, 0.44, 0);
  const rw = part(inner, new THREE.TorusGeometry(0.33, 0.11, 10, 24), tyre, 0.75, 0.44, 0);
  part(inner, new THREE.BoxGeometry(1.0, 0.34, 0.3), A.metal, 0, 0.72, 0);
  part(inner, new THREE.BoxGeometry(0.62, 0.24, 0.36), new THREE.MeshStandardMaterial({ color: 0x0b0b0d, metalness: 0.9, roughness: 0.18 }), -0.2, 0.98, 0);
  part(inner, new THREE.BoxGeometry(0.6, 0.1, 0.28), A.dark, 0.35, 0.95, 0);
  part(inner, new THREE.CylinderGeometry(0.03, 0.03, 0.8), A.metal, -0.62, 0.82, 0, 0, 0, -0.45);
  part(inner, new THREE.CylinderGeometry(0.02, 0.02, 0.6), A.metal, -0.5, 1.16, 0, Math.PI / 2);
  part(inner, new THREE.SphereGeometry(0.09, 12, 8), glow(0xfff2d0, 4), -0.8, 0.98, 0);
  part(inner, new THREE.BoxGeometry(0.1, 0.06, 0.2), glow(0xff1a10, 3), 0.68, 0.9, 0);
  return { root, body, wheelSpin: [fw, rw], spinAxis: 'z', r: 0.44, steer: [] };
}

export function buildCar(color = 0x8a0f12) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const p = paint(color);
  part(body, new THREE.BoxGeometry(1.96, 0.46, 4.4), p, 0, 0.56, 0);
  part(body, new THREE.BoxGeometry(1.9, 0.22, 1.2), p, 0, 0.5, 1.95, -0.16);
  part(body, new THREE.BoxGeometry(1.5, 0.42, 1.9), glass, 0, 0.98, -0.25);
  part(body, new THREE.BoxGeometry(1.56, 0.06, 1.5), p, 0, 1.2, -0.35);
  part(body, new THREE.BoxGeometry(1.8, 0.05, 0.36), A.dark, 0, 1.02, -2.08);
  for (const x of [-0.7, 0.7]) part(body, new THREE.BoxGeometry(0.06, 0.25, 0.1), A.dark, x, 0.88, -2.05);
  for (const x of [-1, 1]) part(body, new THREE.BoxGeometry(0.04, 0.2, 0.9), A.dark, x * 0.99, 0.55, -0.5);
  for (const x of [-0.68, 0.68]) part(body, new THREE.BoxGeometry(0.42, 0.08, 0.06), glow(0xfff2d0, 5), x, 0.66, 2.21);
  const tail = glow(0xff1a10, 3);
  part(body, new THREE.BoxGeometry(1.7, 0.06, 0.04), tail, 0, 0.74, -2.21);
  const w = wheels(body, 0.92, 1.42, 0.36, 0.3);
  return { root, body, wheelSpin: w.spin, spinAxis: 'x', r: w.r, steer: w.steer, tail };
}

export function buildPolice(suv = false) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const navy = new THREE.MeshStandardMaterial({ color: 0x14192a, metalness: 0.5, roughness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xe8eaee, metalness: 0.4, roughness: 0.35 });
  const [w, h, l, ch, cl] = suv ? [2.0, 0.8, 4.8, 0.72, 2.8] : [1.9, 0.6, 4.6, 0.55, 2.3];
  part(body, new THREE.BoxGeometry(w, h, l), navy, 0, 0.35 + h / 2, 0);
  part(body, new THREE.BoxGeometry(w - 0.02, 0.2, l * 0.5), white, 0, 0.35 + h * 0.62, 0);
  part(body, new THREE.BoxGeometry(w - 0.2, ch, cl), white, 0, 0.35 + h + ch / 2, -0.2);
  part(body, new THREE.BoxGeometry(w - 0.18, ch * 0.75, cl * 0.98), glass, 0, 0.35 + h + ch * 0.45, -0.2);
  const red = glow(0xff1a1a, 4), blue = glow(0x2a5cff, 4);
  const top = 0.35 + h + ch + 0.08;
  part(body, new THREE.BoxGeometry(0.55, 0.12, 0.3), red, -0.3, top, -0.2);
  part(body, new THREE.BoxGeometry(0.55, 0.12, 0.3), blue, 0.3, top, -0.2);
  for (const x of [-0.65, 0.65]) part(body, new THREE.BoxGeometry(0.35, 0.1, 0.06), glow(0xfff2d0, 4), x, 0.35 + h * 0.6, l / 2 + 0.01);
  part(body, new THREE.BoxGeometry(w - 0.3, 0.07, 0.04), glow(0xff1a10, 2.5), 0, 0.35 + h * 0.7, -l / 2 - 0.01);
  const wh = wheels(body, w / 2 - 0.05, l / 2 - 0.9, suv ? 0.42 : 0.36, 0.3);
  return { root, body, wheelSpin: wh.spin, spinAxis: 'x', r: wh.r, steer: wh.steer, red, blue };
}

export function buildPickup() {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const grey = new THREE.MeshStandardMaterial({ color: 0x4a4d50, metalness: 0.5, roughness: 0.5 });
  part(body, new THREE.BoxGeometry(2.0, 0.7, 5.2), grey, 0, 0.75, 0);
  part(body, new THREE.BoxGeometry(1.9, 0.7, 2.0), grey, 0, 1.45, 0.9);
  part(body, new THREE.BoxGeometry(1.88, 0.5, 1.95), glass, 0, 1.5, 0.92);
  part(body, new THREE.BoxGeometry(1.9, 0.08, 2.4), A.dark, 0, 1.12, -1.3);
  for (const x of [-0.65, 0.65]) part(body, new THREE.BoxGeometry(0.35, 0.12, 0.06), glow(0xfff2d0, 4), x, 0.9, 2.61);
  part(body, new THREE.BoxGeometry(1.0, 0.1, 0.25), glow(0xffa31a, 3), 0, 1.86, 0.9);
  const wh = wheels(body, 0.95, 1.7, 0.42, 0.32);
  return { root, body, wheelSpin: wh.spin, spinAxis: 'x', r: wh.r, steer: wh.steer };
}

export function buildHeli() {
  const root = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d22, metalness: 0.6, roughness: 0.4 });
  part(root, new THREE.CapsuleGeometry(1.1, 2.4, 6, 12), dark, 0, 0, 0, Math.PI / 2);
  part(root, new THREE.SphereGeometry(1.0, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 0.1, 1.3, Math.PI / 2);
  part(root, new THREE.CylinderGeometry(0.18, 0.32, 4.2, 8), dark, 0, 0.35, -3.6, Math.PI / 2);
  part(root, new THREE.BoxGeometry(0.1, 1.2, 0.6), dark, 0, 0.9, -5.6);
  for (const x of [-0.8, 0.8]) part(root, new THREE.BoxGeometry(0.08, 0.08, 3.2), A.metal, x, -1.35, 0);
  const rotor = new THREE.Group(); rotor.position.y = 1.35; root.add(rotor);
  part(rotor, new THREE.BoxGeometry(10, 0.05, 0.3), A.dark, 0, 0, 0);
  part(rotor, new THREE.BoxGeometry(0.3, 0.05, 10), A.dark, 0, 0, 0);
  const beacon = glow(0xff2020, 6); part(root, new THREE.SphereGeometry(0.1, 8, 6), beacon, 0, -1.2, 0.6);
  return { root, rotor, beacon };
}

/** Arcade driving model: speed along a heading, with grip pulling the travel direction toward it. */
export class Vehicle {
  constructor(mesh, p = {}) {
    this.mesh = mesh; this.pos = mesh.root.position;
    Object.assign(this, { maxSpeed: 40, accel: 12, brake: 26, reverse: 8, turn: 1.6, grip: 6, drag: 0.06, radius: 1.2, mass: 1 }, p);
    this.h = Math.PI; this.vh = Math.PI; this.speed = 0; this.steer = 0; this.slip = 0;
  }
  forward(out) { return out.set(Math.sin(this.h), 0, Math.cos(this.h)); }
  place(x, z, h, speed = 0) { this.pos.set(x, 0, z); this.h = this.vh = h; this.speed = speed; this.mesh.root.rotation.y = h; }
  update(dt, throttle, steerIn, { handbrake = false, grip = 1, drag = 0, maxSpeed = this.maxSpeed } = {}) {
    this.steer += (steerIn - this.steer) * Math.min(1, dt * 7);
    if (throttle > 0.05) {
      if (this.speed < -0.5) this.speed += this.brake * throttle * dt;
      else this.speed += this.accel * throttle * Math.max(0, 1 - this.speed / maxSpeed) * dt;
    } else if (throttle < -0.05) {
      if (this.speed > 0.5) this.speed -= this.brake * -throttle * dt;
      else this.speed = Math.max(-this.reverse, this.speed - this.accel * 0.6 * -throttle * dt);
    }
    if (this.speed > maxSpeed) this.speed -= (this.speed - maxSpeed) * Math.min(1, dt * 2);
    if (handbrake) this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), this.brake * 0.4 * dt);
    this.speed -= this.speed * (this.drag + drag) * dt;
    if (Math.abs(throttle) < 0.05 && Math.abs(this.speed) < 0.4) this.speed = 0;
    const sp = Math.abs(this.speed), dir = Math.sign(this.speed) || 1;
    const rate = this.steer * this.turn * Math.min(1, sp / 6) / (1 + (sp / this.maxSpeed) * 0.8) * (handbrake ? 1.6 : 1);
    this.h = wrapAngle(this.h - rate * dir * dt);
    const g = this.grip * grip * (handbrake ? 0.22 : 1);
    this.vh = wrapAngle(this.vh + wrapAngle(this.h - this.vh) * Math.min(1, g * dt));
    this.slip = Math.abs(wrapAngle(this.h - this.vh));
    this.pos.x += Math.sin(this.vh) * this.speed * dt; this.pos.z += Math.cos(this.vh) * this.speed * dt;
    this.mesh.root.rotation.y = this.h;
    const spin = (this.speed * dt) / this.mesh.r;
    for (const w of this.mesh.wheelSpin) w.rotation[this.mesh.spinAxis] += this.mesh.spinAxis === 'z' ? -spin : spin;
    for (const s of this.mesh.steer) s.rotation.y = -this.steer * 0.45;
  }
  /** Steer toward a point; returns { throttle, steer } for update(). */
  aim(target, speedTarget) {
    const want = Math.atan2(target.x - this.pos.x, target.z - this.pos.z), diff = wrapAngle(want - this.h);
    return { steer: clamp(-diff * 2.4, -1, 1), throttle: this.speed < speedTarget ? 1 : -0.4 };
  }
}

/** Push two vehicles apart; returns the closing speed of the hit, or 0. */
export function collide(a, b) {
  const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz), min = a.radius + b.radius;
  if (d >= min || d < 1e-4) return 0;
  const nx = dx / d, nz = dz / d, push = (min - d) / 2;
  a.pos.x -= nx * push; a.pos.z -= nz * push; b.pos.x += nx * push; b.pos.z += nz * push;
  const va = a.speed * (Math.sin(a.vh) * nx + Math.cos(a.vh) * nz), vb = b.speed * (Math.sin(b.vh) * nx + Math.cos(b.vh) * nz);
  const closing = va - vb;
  if (closing <= 0.5) return 0;
  const fa = Math.sin(a.vh) * nx + Math.cos(a.vh) * nz; // a's travel direction along the a→b normal
  if (fa < -0.5) { a.speed += closing * 0.35; b.speed -= closing * 0.6; } // b ran into a from behind
  else if (fa > 0.5) { a.speed -= closing * 0.6; b.speed += closing * 0.35; } // a ran into b from behind
  else { a.speed *= 0.93; b.speed *= 0.93; } // side swipe
  return closing;
}
