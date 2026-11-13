// WebGLRenderer path: EffectComposer post-processing.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export async function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  return { renderer, backend: 'webgl' };
}
export function createBloom(renderer, scene, camera, w, h, samples = 4) {
  const target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.7, 2.2));
  composer.addPass(new OutputPass());
  return () => composer.render();
}
