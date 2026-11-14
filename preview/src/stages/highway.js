// Stage 2: motorcycle escape along the desert highway to the container yard.
import { THREE, World, camera, clamp, lerp, params, setTimeOfDay, setFocus, human } from '../core.js';
import { M, saveCheckpoint } from '../state.js';
import { audio } from '../audio.js';
import { hud } from '../hud.js';
import { input } from '../input.js';
import { Road } from '../road.js';
import { buildBike, buildPickup, Vehicle, collide } from '../vehicles.js';

const GOAL = 2400;

export async function create(ctx) {
  setTimeOfDay(0.5);
  const W = new World();
  const road = new Road(W, {
    width: 9, lanes: 2, seed: 3,
    features: {
      rocks: [[420, -2], [610, 2.4], [980, -1.5], [1330, 1.8], [1720, -2.6], [2050, 0.5]],
      drifts: [[300, 40, 1, 6], [760, 50, -1.5, 7], [1180, 40, 0.5, 9], [1560, 60, 2, 6], [1900, 45, -1, 8]],
      gates: [[1450, -2.2]],
    },
  });
  const bikeMesh = buildBike(); W.add(bikeMesh.root);
  const bike = new Vehicle(bikeMesh, { maxSpeed: 44, accel: 13, brake: 26, turn: 2.3, grip: 7, drag: 0.05, radius: 0.8 });
  bike.place(road.cx(-5), -5, road.heading(-5), 12);
  const rider = human(bikeMesh.body, 0x3a3a44); rider.root.position.set(0, 0.32, -0.05); rider.model.rotation.x = 0.35;
  const lamp = new THREE.SpotLight(0xfff2d8, 220, 70, 0.42, 0.5, 1.4); lamp.position.set(0, 1.1, 0.6); bikeMesh.body.add(lamp);
  lamp.target.position.set(0, 0, 18); bikeMesh.body.add(lamp.target);

  const chase = M.bikeSeen;
  const pickups = chase ? [0, 1].map((i) => {
    const m = buildPickup(); W.add(m.root);
    const v = new Vehicle(m, { maxSpeed: 42, accel: 11, turn: 1.7, grip: 6, radius: 1.5 });
    v.place(road.cx(70 + i * 25) + (i ? 2 : -2), 70 + i * 25, road.heading(70), 0); v.active = false; v.wait = 4 + i * 2.5;
    return v;
  }) : [];

  let phase = 'ride', crashT = 0, t = 0;
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), fwd = new THREE.Vector3();

  function crash(why) {
    if (phase !== 'ride') return;
    phase = 'crashed'; crashT = 2; M.crashes++; bike.speed = 0;
    audio.burst(0.5, 0.35, 700);
    if (M.crashes >= 3) { phase = 'over'; return ctx.fail('WIPED OUT', `${why} Third crash. The station's pickups were on you before you could stand.`); }
    hud.note(`${why.toUpperCase()} — ${3 - M.crashes} LEFT`);
  }

  function ride(dt) {
    const d = -bike.pos.z, mv = input.move();
    let throttle = mv.y, steer = mv.x;
    if (params.has('drive')) { // autopilot for testing
      let laneT = 0;
      for (const [rd, rl] of road.f.rocks) if (rd - d > -3 && rd - d < 60) laneT = rl < 0 ? 2.6 : -2.6;
      for (const [gd, gl] of road.f.gates) if (gd - d > -3 && gd - d < 80) laneT = gl;
      const a = bike.aim(road.point(d + 22, laneT), 30); throttle = a.throttle; steer = a.steer;
    }
    const lat = road.lateral(bike.pos), off = Math.abs(lat) > road.half + 0.4, drift = road.inDrift(bike.pos);
    bike.update(dt, throttle, steer, { handbrake: input.held('brake'), grip: drift ? 0.3 : off ? 0.55 : 1, drag: off ? 0.5 : 0 });
    for (const o of road.obstacles) {
      const dx = bike.pos.x - o.x, dz = bike.pos.z - o.z, dist = Math.hypot(dx, dz);
      if (dist < o.r + bike.radius) {
        if (Math.abs(bike.speed) > 9) return crash(o.kind === 'rock' ? 'Hit a rock' : 'Hit the barrier');
        bike.pos.x = o.x + (dx / dist) * (o.r + bike.radius); bike.pos.z = o.z + (dz / dist) * (o.r + bike.radius); bike.speed *= 0.3;
      }
    }
    for (const p of pickups) {
      if (!p.active) { if ((p.wait -= dt) <= 0) { p.active = true; p.place(road.cx(-(d - 80)) + (p === pickups[0] ? -2 : 2), -(d - 80), road.heading(-(d - 80)), bike.speed); hud.note('STATION PICKUPS BEHIND YOU'); } continue; }
      const pd = -p.pos.z, ahead = pd > d;
      const target = pd < d - 15 ? road.point(Math.min(d + 6, pd + 30), road.lateral(bike.pos)) : bike.pos;
      const a = p.aim(target, ahead ? bike.speed * 0.6 : clamp(bike.speed + 6, 18, 46));
      p.update(dt, a.throttle, a.steer);
      if (pd < d - 260) { p.active = false; p.wait = 1e9; p.mesh.root.visible = false; }
      if (collide(bike, p) > 5) crash('Rammed by a pickup');
    }
    // lean into turns
    bikeMesh.body.rotation.z = lerp(bikeMesh.body.rotation.z, bike.steer * clamp(bike.speed / 20, 0, 1) * 0.45, Math.min(1, dt * 8));
    if (d >= GOAL) { phase = 'arrive'; t = 0; }
  }

  function chaseCam(dt, snap) {
    bike.forward(fwd);
    const back = 5.5 + bike.speed * 0.05;
    camPos.set(bike.pos.x - fwd.x * back, 2.1 + bike.speed * 0.012, bike.pos.z - fwd.z * back);
    camera.position.lerp(camPos, snap ? 1 : Math.min(1, dt * 6));
    look.set(bike.pos.x + fwd.x * 6, 1.2, bike.pos.z + fwd.z * 6); camera.lookAt(look);
    camera.fov = lerp(camera.fov, 58 + bike.speed * 0.3, Math.min(1, dt * 3)); camera.updateProjectionMatrix();
  }

  return {
    world: W,
    get focus() { return bike.pos; },
    enter() {
      saveCheckpoint('highway');
      hud.show(true); hud.bars(false); hud.marker(null); hud.health(null); hud.bar(null); hud.prompt(null);
      hud.secLabel('SPEED');
      input.setButtons([{ a: 'brake', label: 'BRAKE' }]); input.showTouch(true);
      hud.note(chase ? 'THEY SAW THE BIKE LEAVE. EXPECT COMPANY.' : 'SABLE: CONTAINER YARD, TWO AND A HALF KLICKS. STAY ON THE ROAD.');
      road.update(bike.pos); chaseCam(0, true);
    },
    update(dt) {
      t += dt;
      if (phase === 'ride') ride(dt);
      else if (phase === 'crashed') {
        crashT -= dt; bikeMesh.body.rotation.z = lerp(bikeMesh.body.rotation.z, 1.35, Math.min(1, dt * 10));
        if (crashT <= 0) { const z = bike.pos.z; bike.place(road.cx(z), z, road.heading(z), 6); bikeMesh.body.rotation.z = 0; phase = 'ride'; }
      } else if (phase === 'arrive') {
        bike.update(dt, -1, 0); if (t > 1.2) { phase = 'done'; ctx.next('yard'); }
      }
      road.update(bike.pos);
      chaseCam(dt);
      const d = -bike.pos.z;
      hud.objective(`Reach the container yard · ${Math.max(0, (GOAL - d) / 1000).toFixed(1)} km`);
      hud.security(`${Math.round(Math.abs(bike.speed) * 3.6)} KM/H`, '#e8e8e8');
      hud.flags(`CRASHES · ${M.crashes} / 3<br>${road.inDrift(bike.pos) ? 'SAND ON THE ROAD' : Math.abs(road.lateral(bike.pos)) > road.half + 0.4 ? 'OFF ROAD' : 'ON ROAD'}`);
      audio.engine(clamp(Math.abs(bike.speed) / 44, 0, 1), phase === 'over' ? 0 : 1);
    },
    animate(dt) { rider.mixer.update(dt); setFocus(bike.pos); },
    dispose() { audio.engine(0, 0); camera.fov = 55; camera.updateProjectionMatrix(); hud.secLabel('SECURITY'); W.dispose(); },
  };
}
