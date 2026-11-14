// Stage 4: the sports car, the police pursuit, and the final escape.
import { THREE, A, World, camera, clamp, lerp, params, setTimeOfDay, setFocus } from '../core.js';
import { M, saveCheckpoint, pursuitStrength } from '../state.js';
import { audio } from '../audio.js';
import { hud } from '../hud.js';
import { input } from '../input.js';
import { Road } from '../road.js';
import { buildCar, buildPolice, buildHeli, Vehicle, collide } from '../vehicles.js';

const EXITS = Array.from({ length: 10 }, (_, i) => 3000 + i * 700);
const SETUP = {
  none: { start: [], cap: 0, blocks: [], heli: false },
  light: { start: ['car', 'car'], cap: 2, blocks: [], heli: false },
  medium: { start: ['car', 'car', 'suv', 'car'], cap: 4, blocks: [1500], heli: false },
  heavy: { start: ['car', 'suv', 'car', 'suv', 'car'], cap: 5, blocks: [1500, 2500], heli: true },
};

export async function create(ctx) {
  setTimeOfDay(1);
  const W = new World();
  const strength = params.get('pursuit') ?? pursuitStrength();
  const cfg = SETUP[strength];
  const road = new Road(W, {
    width: 14, lanes: 4, seed: 11,
    features: { underpasses: [1200, 2700, 4050, 5600], canyons: [[1900, 2200], [3300, 3550], [4700, 4900]], exits: EXITS },
  });

  const carMesh = buildCar(0x8a0f12); W.add(carMesh.root);
  const car = new Vehicle(carMesh, { maxSpeed: 54, accel: 15, brake: 30, turn: 1.9, grip: 6.5, drag: 0.04, radius: 1.3 });
  car.place(road.cx(-10), -10, road.heading(-10), 14);
  const head = new THREE.SpotLight(0xfff2d8, 320, 90, 0.5, 0.45, 1.3); head.position.set(0, 0.8, 2.3); carMesh.body.add(head);
  head.target.position.set(0, 0, 25); carMesh.body.add(head.target);

  // police pool
  const police = [];
  function spawn(type, d, lat) {
    const m = buildPolice(type === 'suv'); W.add(m.root);
    const v = new Vehicle(m, { maxSpeed: type === 'suv' ? 43 : 47, accel: type === 'suv' ? 16 : 18, turn: 1.8, grip: 6, radius: type === 'suv' ? 1.5 : 1.35 });
    v.place(road.cx(-d) + lat, -d, road.heading(-d), Math.max(14, car.speed + 6));
    v.suv = type === 'suv'; v.active = true; police.push(v); return v;
  }
  cfg.start.forEach((type, i) => spawn(type, -70 - i * 28, (i % 2 ? 1 : -1) * 3));
  // a parked patrol that joins in if you speed past it
  const parked = spawn('car', 760, road.half + 4); parked.active = false; parked.speed = 0; parked.h = parked.vh = road.heading(-760) + 0.6; parked.mesh.root.rotation.y = parked.h;

  // roadblocks
  for (const d of cfg.blocks) {
    const gap = (d % 3 - 1) * 4, h = road.heading(-d), c = road.cx(-d);
    for (let lat = -road.half - 1; lat <= road.half + 1; lat += 4.6) {
      if (Math.abs(lat - gap) < 3.2) continue;
      const m = buildPolice(false); m.root.position.set(c + lat, 0, -d); m.root.rotation.y = h + Math.PI / 2; W.add(m.root);
      road.obstacles.push({ x: c + lat - 1.4, z: -d, r: 1.2, kind: 'block' }, { x: c + lat + 1.4, z: -d, r: 1.2, kind: 'block' }, { x: c + lat, z: -d, r: 1.2, kind: 'block' });
      m.red.emissiveIntensity = 5; m.blue.emissiveIntensity = 5;
    }
  }

  // helicopter
  const heli = cfg.heli ? buildHeli() : null;
  const spot = new THREE.SpotLight(0xe8f0ff, 0, 160, 0.14, 0.5, 2); W.add(spot); W.add(spot.target);
  if (heli) { W.add(heli.root); heli.root.position.set(car.pos.x, 38, car.pos.z + 60); }
  let heliLost = 0;
  const redL = new THREE.PointLight(0xff2020, 0, 22, 2), blueL = new THREE.PointLight(0x2050ff, 0, 22, 2); W.add(redL); W.add(blueL);

  let heat = strength === 'none' ? 0 : 1, phase = 'drive', t = 0, boxT = 0, lostOnce = false, reinforceT = 20;
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), fwd = new THREE.Vector3();

  function hitDamage(amount) {
    M.damage = Math.min(100, M.damage + amount); hud.flash(); audio.burst(0.3, 0.3, 600);
    if (M.damage >= 100) { phase = 'over'; ctx.fail('WRECKED', 'The car folded around you. The police pulled you and the device out of the wreck.'); }
  }

  function drive(dt) {
    const d = -car.pos.z, mv = input.move(), zone = road.inZone(d);
    let throttle = mv.y, steer = mv.x;
    if (params.has('drive')) { // test autopilot: keep to the road, swerve round police ahead
      let laneT = 0;
      for (const p of police) { const g = -p.pos.z - d; if (p.active && g > -2 && g < 35) laneT = road.lateral(p.pos) > 0 ? -4.5 : 4.5; }
      for (const b of cfg.blocks) if (b - d > 0 && b - d < 90) laneT = (b % 3 - 1) * 4;
      const nx = EXITS.find((e) => e > d - 5); if (heat === 0 && nx - d < 45) laneT = road.half + 7;
      const a = car.aim(road.point(d + 26, laneT), 50); throttle = a.throttle; steer = a.steer;
    }
    const lat = road.lateral(car.pos), off = Math.abs(lat) > road.half + 0.5;
    car.update(dt, throttle, steer, {
      handbrake: input.held('brake'), grip: off ? 0.6 : 1, drag: off ? 0.45 : 0,
      maxSpeed: car.maxSpeed * (M.damage > 50 ? 0.8 : 1),
    });
    car.turn = M.damage > 80 ? 1.4 : 1.9;
    if (zone === 'canyon' && Math.abs(lat) > road.half + 2.4) {
      car.pos.x = road.cx(car.pos.z) + Math.sign(lat) * (road.half + 2.4); car.speed *= 0.7; if (car.speed > 12) hitDamage(3);
    }
    for (const o of road.obstacles) {
      const dx = car.pos.x - o.x, dz = car.pos.z - o.z, dist = Math.hypot(dx, dz);
      if (dist < o.r + car.radius) {
        if (Math.abs(car.speed) > 8) hitDamage(Math.min(35, Math.abs(car.speed) * 0.7));
        car.pos.x = o.x + (dx / dist) * (o.r + car.radius); car.pos.z = o.z + (dz / dist) * (o.r + car.radius); car.speed *= -0.25;
        if (phase !== 'drive') return;
        break;
      }
    }

    // parked patrol notices a speeding car
    if (!parked.active && car.pos.distanceTo(parked.pos) < 40 && car.speed > 30) {
      parked.active = true; heat = Math.max(heat, 0.6); hud.note('A PATROL CAR CLOCKED YOU');
    }

    // police
    let near = Infinity, nearest = null, boxing = 0, spotted = false;
    for (const p of police) {
      if (!p.active) continue;
      const pd = -p.pos.z, gap = d - pd;
      let target, want;
      const dist0 = p.pos.distanceTo(car.pos);
      if (dist0 < (zone ? 15 : 70)) p.lost = 0; else p.lost = (p.lost ?? 0) + dt;
      p.chasing = heat > 0 && p.lost < 2;
      if (p.chasing) {
        if (gap > 12) { target = road.point(Math.min(d + 5, pd + 35), lat); want = clamp(car.speed + 9, 26, 60); }
        else if (gap < -20) { target = road.point(pd + 30, road.lateral(p.pos)); want = Math.max(car.speed * 0.9, 20); }
        else { target = car.pos; want = p.hitCd > 0 ? car.speed - 4 : car.speed + 5; }
      } else { target = road.point(pd + 30, road.lateral(p.pos) * 0.9); want = heat > 0 ? 24 : 18; }
      const a = p.aim(target, want);
      const poff = Math.abs(road.lateral(p.pos)) > road.half + 0.5;
      p.update(dt, a.throttle, a.steer, { grip: poff ? 0.6 : 1, drag: poff ? 0.3 : 0, maxSpeed: p.chasing && gap > 150 ? 58 : p.maxSpeed });
      p.hitCd = Math.max(0, (p.hitCd ?? 0) - dt);
      const closing = collide(car, p);
      if (closing > 3 && p.hitCd <= 0) { p.hitCd = 1.2; hitDamage(Math.min(18, closing * (p.suv ? 0.9 : 0.6))); }
      const dist = p.pos.distanceTo(car.pos);
      if (dist < near) { near = dist; nearest = p; }
      if (p.chasing && p.lost === 0) spotted = true;
      if (dist < 9) boxing++;
      if (gap > (heat > 0 ? 450 : 220) || gap < -300) { p.active = false; p.mesh.root.visible = false; }
    }
    for (let i = 0; i < police.length; i++) for (let j = i + 1; j < police.length; j++) if (police[i].active && police[j].active) collide(police[i], police[j]);

    // helicopter
    let heliTrack = false;
    if (heli) {
      if (zone) heliLost = 7;
      heliLost = Math.max(0, heliLost - dt);
      heliTrack = heliLost <= 0 && heat > 0;
      const want = heliTrack ? car.pos : road.point(d + 40 + Math.sin(t * 0.7) * 30, Math.sin(t * 0.4) * 25);
      heli.root.position.x = lerp(heli.root.position.x, want.x, Math.min(1, dt * 0.7));
      heli.root.position.z = lerp(heli.root.position.z, want.z + (heliTrack ? -10 : 0), Math.min(1, dt * 0.7));
      heli.root.rotation.y = road.heading(car.pos.z); heli.rotor.rotation.y += dt * 30;
      spot.position.copy(heli.root.position).y -= 1.5;
      spot.target.position.set(want.x, 0, want.z); spot.intensity = heat > 0 ? (heliTrack ? 22000 : 12000) : 0;
      if (heat > 0 && !heliTrack && heliLost > 0 && zone) hud.note('THE HELICOPTER LOST YOU', 1.5);
    }

    const seen = heliTrack || spotted || (heat === 0 && near < 40);
    const before = heat;
    heat = clamp(heat + (seen ? 0.7 : -0.085) * dt, 0, 1);
    if (before > 0 && heat === 0) { lostOnce = true; hud.note('YOU LOST THEM. TAKE THE NEXT EXIT.', 6); audio.sirenLevel(0); }
    if (heat > 0) {
      reinforceT -= dt;
      if (reinforceT <= 0 && cfg.cap > 0 && police.filter((p) => p.active).length < cfg.cap + (lostOnce ? 0 : 1)) {
        reinforceT = 22; spawn(Math.random() < 0.3 ? 'suv' : 'car', d - 150, (Math.random() - 0.5) * 6); hud.note('MORE UNITS BEHIND YOU', 2.5);
      }
    }

    // boxed in
    if (heat > 0 && Math.abs(car.speed) < 3 && boxing >= 2) { boxT += dt; if (boxT > 4) { if (params.has('log')) console.log('BOXED ' + JSON.stringify({ car: [car.pos.x, car.pos.z, car.speed, road.lateral(car.pos)], police: police.filter((p) => p.active).map((p) => [Math.round(-p.pos.z), Math.round(road.lateral(p.pos) * 10) / 10, Math.round(p.speed)]) })); phase = 'over'; return ctx.fail('BOXED IN', 'Two cruisers pinned the car. Doors open, hands up. The device is evidence now.'); } }
    else boxT = Math.max(0, boxT - dt);

    // exits
    for (const [, e] of road.exitState) { e.bar.visible = heat > 0; }
    const ex = road.exitAt(car.pos);
    if (ex !== null) {
      if (heat <= 0) { phase = 'exit'; t = 0; hud.note('OFF THE HIGHWAY. LIGHTS OFF.', 3); }
      else { car.pos.x = road.cx(car.pos.z) + road.half + 0.8; car.speed *= 0.6; hud.note('THEY ARE STILL ON YOU — THE EXIT IS NO GOOD', 2); }
    }

    // lights and sound
    const flash = Math.floor(t * 8) % 2 === 0;
    for (const p of police) { p.mesh.red.emissiveIntensity = flash ? 7 : 0.4; p.mesh.blue.emissiveIntensity = flash ? 0.4 : 7; }
    if (nearest && near < 60) {
      redL.position.copy(nearest.pos).y = 2.2; blueL.position.copy(nearest.pos).y = 2.2;
      redL.intensity = flash ? 40 : 0; blueL.intensity = flash ? 0 : 40;
    } else redL.intensity = blueL.intensity = 0;
    audio.sirenLevel(heat > 0 ? clamp(1 - near / 160, 0.15, 1) : 0);
    return { near };
  }

  function chaseCam(dt, snap) {
    car.forward(fwd);
    const back = 7 + car.speed * 0.06;
    camPos.set(car.pos.x - fwd.x * back, 2.6 + car.speed * 0.015, car.pos.z - fwd.z * back);
    camera.position.lerp(camPos, snap ? 1 : Math.min(1, dt * 5));
    look.set(car.pos.x + fwd.x * 8, 1.1, car.pos.z + fwd.z * 8); camera.lookAt(look);
    camera.fov = lerp(camera.fov, 58 + car.speed * 0.32, Math.min(1, dt * 3)); camera.updateProjectionMatrix();
  }

  return {
    world: W,
    get focus() { return car.pos; },
    enter() {
      saveCheckpoint('pursuit');
      hud.show(true); hud.bars(false); hud.marker(null); hud.health(null); hud.foe(null); hud.prompt(null); hud.secLabel('HEAT');
      input.setButtons([{ a: 'brake', label: 'DRIFT' }]); input.showTouch(true);
      hud.note({ none: 'SABLE: NOBODY KNOWS ABOUT THE CAR. DRIVE CLEAN.', light: 'SABLE: PATROLS ARE SWEEPING THE HIGHWAY. LOSE THEM.', medium: 'SABLE: THEY HAVE YOUR DESCRIPTION. ROADBLOCK AHEAD.', heavy: 'SABLE: EVERYTHING THEY HAVE, INCLUDING A HELICOPTER. USE THE UNDERPASSES.' }[strength], 6);
      road.update(car.pos); chaseCam(0, true);
    },
    update(dt) {
      t += dt;
      if (phase === 'drive') drive(dt);
      else if (phase === 'exit') {
        car.update(dt, -0.4, -0.5); carMesh.tail.emissiveIntensity = 6;
        if (t > 2.2) { phase = 'done'; audio.engine(0, 0); ctx.win(); }
      }
      road.update(car.pos);
      chaseCam(dt);
      const d = -car.pos.z, next = EXITS.find((e) => e > d + 10);
      hud.objective(heat > 0 ? 'Lose the police. Exits only open when nobody is on you.' : `Take the next exit · ${Math.round(next - d)} m`);
      hud.security(heat > 0 ? `${Math.round(heat * 100)}%` : 'CLEAR', heat > 0.6 ? '#ff3b30' : heat > 0 ? '#ff8a3c' : '#7cff9a');
      hud.bar(heat, heat > 0.6 ? '#ff3b30' : '#ff8a3c');
      hud.flags(`${Math.round(Math.abs(car.speed) * 3.6)} KM/H<br>DAMAGE · ${Math.round(M.damage)}%<br>${road.inZone(d) === 'underpass' ? 'UNDERPASS — OUT OF SIGHT' : road.inZone(d) === 'canyon' ? 'CANYON — OUT OF SIGHT FROM ABOVE' : `UNITS · ${police.filter((p) => p.active).length}`}`);
      audio.engine(clamp(Math.abs(car.speed) / 54, 0, 1), phase === 'over' ? 0 : 1);
    },
    animate(dt) { setFocus(car.pos); },
    debug: () => ({ heat: Math.round(heat * 100), phase, units: police.filter((p) => p.active).length, lostOnce }),
    dispose() { audio.engine(0, 0); audio.sirenLevel(0); camera.fov = 55; camera.updateProjectionMatrix(); hud.secLabel('SECURITY'); W.dispose(); },
  };
}
