// Input is read as named actions, never as raw keys, so remapping and touch
// controls can be added later without touching game code.

export type Action = 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'sneak' | 'interact' | 'takedown' | 'pause' | 'up' | 'down';

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  sneak: ['KeyC'],
  interact: ['KeyE'],
  takedown: ['KeyF'],
  pause: ['Escape'],
  up: ['Space'],
  down: ['KeyQ'],
};

export class Input {
  private held = new Set<string>();
  private pressed = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private dragging = false;
  bindings: Record<Action, string[]> = structuredClone(DEFAULT_BINDINGS);

  constructor(private readonly target: HTMLElement) {
    addEventListener('keydown', (e) => { if (!e.repeat) this.pressed.add(e.code); this.held.add(e.code); });
    addEventListener('keyup', (e) => this.held.delete(e.code));
    addEventListener('blur', () => this.held.clear());
    target.addEventListener('mousedown', () => (this.dragging = true));
    addEventListener('mouseup', () => (this.dragging = false));
    addEventListener('mousemove', (e) => {
      if (!this.dragging && document.pointerLockElement !== this.target) return;
      this.lookX += e.movementX; this.lookY += e.movementY;
    });
  }

  isDown(action: Action): boolean { return this.bindings[action].some((k) => this.held.has(k)); }
  /** True once per key press. */
  wasPressed(action: Action): boolean { return this.bindings[action].some((k) => this.pressed.has(k)); }
  keyPressed(code: string): boolean { return this.pressed.has(code); }
  axis(negative: Action, positive: Action): number { return (this.isDown(positive) ? 1 : 0) - (this.isDown(negative) ? 1 : 0); }

  /** Mouse movement since the last call, in pixels. */
  consumeLook(): { x: number; y: number } {
    const r = { x: this.lookX, y: this.lookY };
    this.lookX = this.lookY = 0;
    return r;
  }

  /** Call at the end of each rendered frame. */
  endFrame(): void { this.pressed.clear(); }
}
