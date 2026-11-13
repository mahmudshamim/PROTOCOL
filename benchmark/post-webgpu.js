// WebGPURenderer path: TSL node post-processing.
import * as THREE from 'three';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export async function createRenderer(forceWebGL) {
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
  await renderer.init();
  return { renderer, backend: renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgpu-renderer-on-webgl2' };
}
export function createBloom(renderer, scene, camera) {
  const post = new THREE.PostProcessing(renderer);
  const color = pass(scene, camera).getTextureNode();
  post.outputNode = color.add(bloom(color, 0.45, 0.7, 2.2));
  return () => post.render();
}
