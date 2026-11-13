// Fixed-step simulation, free-running render. The simulation always advances in equal
// steps so stealth and physics behave the same at 30 fps and at 120 fps.

export const SIM_STEP = 1 / 60;
const MAX_STEPS = 5; // after a long stall, drop time instead of spiralling

export interface StepResult { steps: number; accumulator: number; alpha: number }

/** Pure: how many fixed steps to run for this frame, and what is left over. */
export function consume(accumulator: number, frameDt: number, step = SIM_STEP, maxSteps = MAX_STEPS): StepResult {
  let acc = accumulator + Math.max(0, frameDt);
  let steps = Math.floor(acc / step + 1e-9);
  if (steps > maxSteps) { steps = maxSteps; acc = steps * step; }
  acc = Math.max(0, acc - steps * step);
  return { steps, accumulator: acc, alpha: acc / step };
}

export class FixedLoop {
  private accumulator = 0;
  private last = 0;
  private running = false;
  simSteps = 0;

  constructor(
    private readonly update: (dt: number) => void,
    /** alpha: 0..1 position between the last two simulation steps, for interpolation */
    private readonly render: (alpha: number, frameDt: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      const frameDt = Math.min((now - this.last) / 1000, 0.25);
      this.last = now;
      const r = consume(this.accumulator, frameDt);
      this.accumulator = r.accumulator;
      for (let i = 0; i < r.steps; i++) this.update(SIM_STEP);
      this.simSteps += r.steps;
      this.render(r.alpha, frameDt);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  stop(): void { this.running = false; }
}
