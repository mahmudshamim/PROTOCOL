// Civilian traffic on the highway: same-direction cars you overtake, oncoming cars in the other lane.
import { THREE, rng } from './core.js';
import { buildCar } from './vehicles.js';

const COLORS = [0xb8bcc2, 0x2a3f5c, 0x5c1d1d, 0x1d1d20, 0xd8d4c8, 0x3d4a3a, 0x6b5a3e];

export function createTraffic(world, road, { count = 8, lane = 2.3, seed = 5, sameSpeed = [14, 20], oncomingSpeed = [18, 26] } = {}) {
  const R = rng(seed), cars = [];
  for (let i = 0; i < count; i++) {
    const m = buildCar(COLORS[i % COLORS.length]); world.add(m.root);
    m.root.scale.set(1.02, 1.12, 1.05);
    cars.push({ m, d: 0, lat: 0, dir: 1, speed: 0, pos: m.root.position, radius: 1.35 });
  }
  function respawn(c, fromD, first) {
    c.dir = R() < 0.55 ? -1 : 1;
    c.lat = c.dir > 0 ? lane : -lane;
    c.speed = c.dir > 0 ? sameSpeed[0] + R() * (sameSpeed[1] - sameSpeed[0]) : oncomingSpeed[0] + R() * (oncomingSpeed[1] - oncomingSpeed[0]);
    c.d = Math.max(fromD, 0) + (first ? 80 + R() * 600 : 380 + R() * 260);
  }
  return {
    cars,
    reset(d) { cars.forEach((c) => respawn(c, d, true)); },
    update(dt, playerD) {
      for (const c of cars) {
        c.d += c.dir * c.speed * dt;
        if (c.d < Math.max(playerD - 90, 0) || c.d > playerD + 700) respawn(c, playerD, false);
        const p = road.point(c.d, c.lat); c.pos.set(p.x, 0, p.z);
        c.m.root.rotation.y = road.heading(-c.d) + (c.dir > 0 ? 0 : Math.PI);
        for (const w of c.m.wheelSpin) w.rotation.x += (c.speed * dt) / c.m.r;
      }
    },
    /** The car the point p (radius r) is touching, or null. */
    hit(p, r) { // box test in each car's own frame (cars are long and narrow)
      return cars.find((c) => {
        const a = c.m.root.rotation.y, dx = p.x - c.pos.x, dz = p.z - c.pos.z;
        const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
        return Math.abs(lx) < 1.0 + r * 0.8 && Math.abs(lz) < 2.25 + r * 0.8;
      }) ?? null;
    },
  };
}
