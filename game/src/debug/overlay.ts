// Developer overlay: frame time, renderer numbers, memory, mission state.
import type { GameRenderer } from '../render/renderer';
import type { MissionState } from '../core/missionState';
import { pursuitStrength } from '../core/missionState';

export class DebugOverlay {
  visible = true;
  private frames = 0;
  private time = 0;
  private worst = 0;
  fps = 0;
  frameMs = 0;

  constructor(private readonly el: HTMLElement, private readonly renderer: GameRenderer) {}

  toggle(): void { this.visible = !this.visible; this.el.style.display = this.visible ? 'block' : 'none'; }

  frame(frameDt: number, simSteps: number, state: MissionState, extra: string[] = []): void {
    this.frames++; this.time += frameDt; this.worst = Math.max(this.worst, frameDt);
    if (this.time < 0.5) return;
    this.fps = this.frames / this.time; this.frameMs = (this.time / this.frames) * 1000;
    const s = this.renderer.stats();
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    if (this.visible) {
      this.el.textContent = [
        `PROTOCOL · milestone 0 · ${this.renderer.backend} · ${this.renderer.profileName} ${s.width}x${s.height} (scale ${this.renderer.scale.toFixed(2)})`,
        `fps ${this.fps.toFixed(0)} · frame ${this.frameMs.toFixed(1)} ms · worst ${(this.worst * 1000).toFixed(1)} ms · sim steps ${simSteps}`,
        `draw calls ${s.drawCalls} · triangles ${(s.triangles / 1000).toFixed(0)}k · js heap ${mem ? Math.round(mem.usedJSHeapSize / 1048576) : '?'} MB`,
        `security ${state.securityLevel} · stolen ${state.deviceStolen} · alarm ${state.alarmTriggered} · identified ${state.identified} · pursuit ${pursuitStrength(state)}`,
        ...extra,
      ].join('\n');
    }
    this.frames = 0; this.time = 0; this.worst = 0;
  }
}
