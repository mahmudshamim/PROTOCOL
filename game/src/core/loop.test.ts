import { describe, expect, it } from 'vitest';
import { SIM_STEP, consume } from './loop';

describe('fixed step', () => {
  it('runs one step per 60 Hz frame', () => {
    const r = consume(0, 1 / 60);
    expect(r.steps).toBe(1);
    expect(r.accumulator).toBeCloseTo(0, 6);
  });

  it('runs two steps for a 30 Hz frame and none for a very short one', () => {
    expect(consume(0, 1 / 30).steps).toBe(2);
    const short = consume(0, 1 / 240);
    expect(short.steps).toBe(0);
    expect(short.alpha).toBeCloseTo(0.25, 3);
  });

  it('carries the remainder so no simulated time is lost', () => {
    let acc = 0, steps = 0;
    for (let i = 0; i < 144; i++) { const r = consume(acc, 1 / 144); acc = r.accumulator; steps += r.steps; }
    expect(steps).toBe(60);
  });

  it('caps steps after a stall', () => {
    const r = consume(0, 2);
    expect(r.steps).toBe(5);
    expect(r.accumulator).toBeLessThan(SIM_STEP);
  });
});
