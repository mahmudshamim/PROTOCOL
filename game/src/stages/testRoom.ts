// Milestone 0 test stage: proves the asset pipeline, lighting, shadows and
// post-processing work end to end. Not part of the game.
import * as THREE from 'three/webgpu';
import type { AssetManager } from '../assets/assetManager';
import type { Profile } from '../render/renderer';

export interface Stage {
  id: string;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update(dt: number, time: number): void;
  applyProfile(profile: Profile): void;
}

export async function buildTestRoom(assets: AssetManager, profile: Profile): Promise<Stage> {
  assets.beginStage('test-room');
  const aniso = profile.anisotropy;
  const [sky, floorMat, wallMat, crate, barrel, generator] = await Promise.all([
    assets.environment('/assets/sky/dusk.hdr'),
    assets.pbr('/assets/textures/concrete_floor_02', { repeat: 6, anisotropy: aniso }),
    assets.pbr('/assets/textures/concrete_wall_008', { repeat: 3, anisotropy: aniso }),
    assets.model('/assets/props/crate.glb', aniso),
    assets.model('/assets/props/barrel.glb', aniso),
    assets.model('/assets/props/generator.glb', aniso),
  ]);

  const scene = new THREE.Scene();
  scene.background = sky; scene.environment = sky;
  scene.backgroundIntensity = 0.55; scene.environmentIntensity = 0.6;
  scene.fog = new THREE.FogExp2(0x7d6a72, 0.006);
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 600);
  camera.position.set(7, 3.2, 11); camera.lookAt(0, 1, 0);

  const sun = new THREE.DirectionalLight(0xffa56b, 3.2);
  sun.position.set(-18, 9, 12); sun.castShadow = true;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  scene.add(sun);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  wallMat.envMapIntensity = 0.4;
  for (const [x, z, w, d] of [[0, -8, 16, 0.5], [-8, 0, 0.5, 16], [8, -3, 0.5, 10]] as const) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 4, d), wallMat);
    wall.position.set(x, 2, z); wall.castShadow = wall.receiveShadow = true; scene.add(wall);
  }

  const place = (src: THREE.Object3D, x: number, z: number, ry = 0) => { const o = src.clone(); o.position.set(x, 0, z); o.rotation.y = ry; scene.add(o); };
  [[-3, -2, 0.2], [-2.4, -3.2, 1.1], [3, 1, 2.2], [4.2, 0.4, 0.6], [-5, 3, 1.8], [1, -5, 0]].forEach(([x, z, r]) => place(crate, x, z, r));
  [[5.5, -5], [6.2, -5.4], [5.8, -4.3], [-6, -6], [-5.2, -6.3]].forEach(([x, z], i) => place(barrel, x, z, i));
  place(generator, -1.5, 2.5, 0.5);

  // device stand-in: an emissive core, to exercise bloom
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), new THREE.MeshStandardMaterial({ color: 0x0a2a40, emissive: 0x38b6ff, emissiveIntensity: 6 }));
  core.position.set(0, 1.4, -4); scene.add(core);
  const glow = new THREE.PointLight(0x38b6ff, 30, 14, 2); glow.position.copy(core.position); scene.add(glow);
  const tube = new THREE.Mesh(new THREE.BoxGeometry(4, 0.08, 0.2), new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveIntensity: 2 }));
  tube.position.set(0, 3.9, -7.6); scene.add(tube);

  const applyProfile = (p: Profile) => {
    sun.shadow.mapSize.set(p.shadowMap, p.shadowMap);
    sun.shadow.map?.dispose(); sun.shadow.map = null;
  };
  applyProfile(profile);

  return { id: 'test-room', scene, camera, applyProfile, update: (_dt, time) => { core.rotation.y = time; core.position.y = 1.4 + Math.sin(time * 1.5) * 0.05; } };
}
