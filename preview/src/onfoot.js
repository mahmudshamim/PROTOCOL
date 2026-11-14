// Third-person player on foot: movement, camera, distraction throw.
import { THREE, human, anim, face, clamp, camera, glow } from './core.js';
import { input } from './input.js';
import { M } from './state.js';
import { audio } from './audio.js';
import { hud } from './hud.js';

export function createOnFoot(world, start, yaw) {
  const player = human(world.group, 0x3a3a44);
  player.root.position.copy(start); player.sneak = false;
  player.h = yaw + Math.PI; player.root.rotation.y = player.h;
  const S = { yaw, pitch: 0.32 };
  const target = new THREE.Vector3(), dir = new THREE.Vector3(), want = new THREE.Vector3();
  const puff = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.35, 24), glow(0xffd27a, 2)); puff.rotation.x = -Math.PI / 2; puff.visible = false; world.add(puff);
  let puffT = 0;

  return {
    player, S,
    update(dt) {
      const look = input.consumeLook();
      S.yaw -= look.x * 0.0026; S.pitch = clamp(S.pitch + look.y * 0.002, 0.04, 1.15);
      if (input.pressed('sneak')) player.sneak = !player.sneak;
      const mv = input.move();
      const fx = -Math.sin(S.yaw), fz = -Math.cos(S.yaw);
      let mx = fx * mv.y - fz * mv.x, mz = fz * mv.y + fx * mv.x;
      const m = Math.hypot(mx, mz);
      const sprint = input.held('sprint') && m > 0.1;
      if (sprint) player.sneak = false;
      const speed = m < 0.1 ? 0 : (sprint ? 5.6 : player.sneak ? 1.35 : 2.7) * Math.min(1, m * 1.3);
      player.speed = speed;
      if (speed > 0) {
        mx /= m; mz /= m; const p = player.root.position;
        p.x += mx * speed * dt; p.z += mz * speed * dt; world.resolve(p); face(player, mx, mz, dt, 12);
      }
      anim(player, speed === 0 ? 'Idle' : sprint ? 'Run' : 'Walk');
      player.acts.Walk.timeScale = player.sneak ? 0.55 : 1;
      if (puffT > 0) { puffT -= dt; puff.scale.setScalar(1 + (1 - puffT) * 6); puff.material.emissiveIntensity = puffT * 3; if (puffT <= 0) puff.visible = false; }
    },
    /** Throw a stone 9 m ahead. Returns the landing point, or null if none left. */
    throwStone() {
      if (M.throws <= 0) { hud.note('NOTHING LEFT TO THROW'); return null; }
      M.throws--;
      const p = player.root.position, end = new THREE.Vector3(p.x - Math.sin(S.yaw) * 9, 0, p.z - Math.cos(S.yaw) * 9);
      const t = world.firstHit(world.blockers, p, end, 0.3);
      if (t !== null) end.lerpVectors(p, end, Math.max(0, t - 0.05));
      puff.position.set(end.x, 0.05, end.z); puff.visible = true; puffT = 1;
      audio.ping(320, 0.12, 0.12); setTimeout(() => audio.burst(0.12, 0.18, 900), 350);
      return end;
    },
    cam(dt, snap = false, ceiling = Infinity) {
      const p = player.root.position; target.set(p.x, 1.55, p.z);
      let dist = 5.2;
      dir.set(Math.sin(S.yaw) * Math.cos(S.pitch), Math.sin(S.pitch), Math.cos(S.yaw) * Math.cos(S.pitch));
      want.copy(target).addScaledVector(dir, dist);
      const t = world.firstHit(world.blockers, target, want, 0.3); if (t !== null) dist = Math.max(0.8, t * dist - 0.2);
      want.copy(target).addScaledVector(dir, dist); want.y = Math.min(want.y, ceiling);
      camera.position.lerp(want, snap ? 1 : Math.min(1, dt * 14)); camera.lookAt(target);
    },
  };
}
