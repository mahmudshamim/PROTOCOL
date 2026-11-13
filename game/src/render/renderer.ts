// Wraps WebGPURenderer: backend detection, quality profiles, fixed internal
// resolution with dynamic scaling, and the post-processing chain.
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export type ProfileName = 'high' | 'low';
export interface Profile { height: number; shadowMap: number; bloom: boolean; anisotropy: number }

// Budgets from docs/03-benchmark-report.md.
export const PROFILES: Record<ProfileName, Profile> = {
  high: { height: 1080, shadowMap: 2048, bloom: true, anisotropy: 8 },
  low: { height: 720, shadowMap: 1024, bloom: false, anisotropy: 2 },
};

const MIN_SCALE = 0.6;

export class GameRenderer {
  profileName: ProfileName = 'high';
  /** Dynamic resolution factor applied on top of the profile height. */
  scale = 1;
  dynamicResolution = true;
  private post: THREE.PostProcessing | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private slowFrames = 0;
  private fastFrames = 0;

  private constructor(readonly renderer: THREE.WebGPURenderer, readonly backend: 'webgpu' | 'webgl2') {}

  static async create(parent: HTMLElement, forceWebGL = false): Promise<GameRenderer> {
    const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
    await renderer.init();
    const isGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
    renderer.setPixelRatio(1); // resolution is controlled by the profile, not the display
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.info.autoReset = false;
    parent.prepend(renderer.domElement);
    const gr = new GameRenderer(renderer, isGPU ? 'webgpu' : 'webgl2');
    addEventListener('resize', () => gr.resize());
    gr.resize();
    return gr;
  }

  get profile(): Profile { return PROFILES[this.profileName]; }
  get canvas(): HTMLCanvasElement { return this.renderer.domElement; }

  setProfile(name: ProfileName): void {
    this.profileName = name; this.scale = 1;
    this.resize(); this.buildPost();
  }

  /** The scene and camera to draw. Call again when a stage changes either. */
  setView(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.scene = scene; this.camera = camera;
    this.resize(); this.buildPost();
  }

  private buildPost(): void {
    this.post = null;
    if (!this.scene || !this.camera || !this.profile.bloom) return;
    const post = new THREE.PostProcessing(this.renderer);
    const color = pass(this.scene, this.camera).getTextureNode();
    post.outputNode = color.add(bloom(color, 0.45, 0.7, 2.2));
    this.post = post;
  }

  resize(): void {
    const aspect = innerWidth / Math.max(1, innerHeight);
    const h = Math.round(Math.min(this.profile.height, innerHeight * devicePixelRatio) * this.scale);
    this.renderer.setSize(Math.round(h * aspect), h, false); // CSS stretches the canvas to the window
    if (this.camera) { this.camera.aspect = aspect; this.camera.updateProjectionMatrix(); }
  }

  /** Lower internal resolution when frames run long; raise it again when there is room. */
  adapt(frameMs: number): void {
    if (!this.dynamicResolution) return;
    if (frameMs > 19) { this.slowFrames++; this.fastFrames = 0; } else if (frameMs < 17.5) { this.fastFrames++; this.slowFrames = 0; }
    if (this.slowFrames > 30 && this.scale > MIN_SCALE) { this.scale = Math.max(MIN_SCALE, this.scale - 0.1); this.slowFrames = 0; this.resize(); }
    else if (this.fastFrames > 240 && this.scale < 1) { this.scale = Math.min(1, this.scale + 0.05); this.fastFrames = 0; this.resize(); }
  }

  render(): void {
    if (!this.scene || !this.camera) return;
    this.renderer.info.reset();
    if (this.post) this.post.render(); else this.renderer.render(this.scene, this.camera);
  }

  /** Resolves when the GPU has finished the frames submitted so far (performance checks only). */
  async gpuIdle(): Promise<void> {
    const b = this.renderer.backend as { device?: GPUDevice; gl?: WebGL2RenderingContext };
    if (b.device) await b.device.queue.onSubmittedWorkDone();
    else if (b.gl) b.gl.readPixels(0, 0, 1, 1, b.gl.RGBA, b.gl.UNSIGNED_BYTE, new Uint8Array(4));
  }

  stats(): { drawCalls: number; triangles: number; width: number; height: number } {
    const r = this.renderer.info.render as { drawCalls?: number; calls?: number; triangles: number };
    const size = this.renderer.getSize(new THREE.Vector2());
    return { drawCalls: r.drawCalls ?? r.calls ?? 0, triangles: r.triangles, width: size.x, height: size.y };
  }
}
