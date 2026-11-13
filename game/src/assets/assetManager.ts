// Loads and caches assets per stage, and frees them when the stage is left.
// Only one stage is held in memory at a time (8 GB target machine).
import * as THREE from 'three/webgpu';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export interface PbrOptions { repeat?: number; anisotropy?: number }

export class AssetManager {
  private gltf = new GLTFLoader();
  private textures = new THREE.TextureLoader();
  private hdr = new RGBELoader();
  private cache = new Map<string, Promise<unknown>>();
  private owned = new Map<string, Set<{ dispose(): void }>>();
  private stage = 'boot';
  bytesLoaded = 0;

  constructor(renderer: THREE.WebGPURenderer) {
    // KTX2 transcoder files are served from /basis (copied from three/examples/jsm/libs/basis)
    const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);
    this.gltf.setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
  }

  /** Assets loaded from now on belong to this stage. */
  beginStage(id: string): void { this.stage = id; }

  private once<T>(url: string, load: () => Promise<T>): Promise<T> {
    let p = this.cache.get(url) as Promise<T> | undefined;
    if (!p) { p = load(); this.cache.set(url, p); this.track(url); }
    return p;
  }

  private track(url: string): void {
    fetch(url, { method: 'HEAD' }).then((r) => { this.bytesLoaded += Number(r.headers.get('content-length') ?? 0); }).catch(() => {});
  }

  private own(item: { dispose(): void }): void {
    const set = this.owned.get(this.stage) ?? new Set();
    this.owned.set(this.stage, set); set.add(item);
  }

  /** A model. Returns a fresh clone each call; geometry and materials are shared. */
  async model(url: string, anisotropy = 4): Promise<THREE.Object3D> {
    const gltf = await this.once<GLTF>(url, async () => {
      const g = await this.gltf.loadAsync(url);
      g.scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = mesh.receiveShadow = true;
        this.own(mesh.geometry);
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          this.own(m);
          for (const v of Object.values(m)) if (v instanceof THREE.Texture) { v.anisotropy = anisotropy; this.own(v); }
        }
      });
      return g;
    });
    return gltf.scene.clone();
  }

  async texture(url: string, srgb: boolean, { repeat = 1, anisotropy = 4 }: PbrOptions = {}): Promise<THREE.Texture> {
    return this.once(url + (srgb ? '#srgb' : '') + '#' + repeat, async () => {
      const t = await this.textures.loadAsync(url);
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = anisotropy;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      this.own(t);
      return t;
    });
  }

  /** A PBR material from <base>_diff.jpg, <base>_nor_gl.jpg, <base>_rough.jpg. */
  async pbr(base: string, options: PbrOptions = {}): Promise<THREE.MeshStandardMaterial> {
    const [map, normalMap, roughnessMap] = await Promise.all([
      this.texture(`${base}_diff.jpg`, true, options), this.texture(`${base}_nor_gl.jpg`, false, options), this.texture(`${base}_rough.jpg`, false, options),
    ]);
    const m = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap });
    this.own(m);
    return m;
  }

  async environment(url: string): Promise<THREE.Texture> {
    return this.once(url, async () => {
      const t = await this.hdr.loadAsync(url);
      t.mapping = THREE.EquirectangularReflectionMapping;
      this.own(t);
      return t;
    });
  }

  /** Free everything a stage loaded. */
  disposeStage(id: string): void {
    for (const item of this.owned.get(id) ?? []) item.dispose();
    this.owned.delete(id);
    this.cache.clear();
  }
}
