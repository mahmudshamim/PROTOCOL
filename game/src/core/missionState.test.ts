import { describe, expect, it } from 'vitest';
import type { GameEvent } from './events';
import { EventBus } from './events';
import { initialMissionState, outcome, pursuitStrength, reduce, replay } from './missionState';

const at = { x: 0, z: 0 };
const leave: GameEvent[] = [{ type: 'perimeterLeft' }];

describe('mission branches (GDD section 3)', () => {
  it('ghost: never seen, device taken, walks out', () => {
    const s = replay([{ type: 'guardDown', guard: 'lab' }, { type: 'deviceTaken' }, ...leave]);
    expect(s.securityLevel).toBe(0);
    expect(s.alarmTriggered).toBe(false);
    expect(pursuitStrength(s)).toBe('none');
    expect(outcome(s)).toBe('ghost');
  });

  it('glimpsed: suspicion only, no alarm', () => {
    const s = replay([{ type: 'playerSeen', by: 'g1', certainty: 0.4, pos: at }]);
    expect(s.securityLevel).toBe(1);
    expect(s.identified).toBe(false);
  });

  it('identified but radio call stopped: local search, no alarm, no witness left', () => {
    const s = replay([
      { type: 'playerSeen', by: 'g1', certainty: 1, pos: at },
      { type: 'guardDown', guard: 'g1' },
    ]);
    expect(s.securityLevel).toBe(2);
    expect(s.alarmTriggered).toBe(false);
    expect(s.witnesses).toEqual([]);
    expect(pursuitStrength(s)).toBe('none');
  });

  it('alarm before theft: alert, then lockdown when the device is taken', () => {
    const s = replay([
      { type: 'playerSeen', by: 'g1', certainty: 1, pos: at },
      { type: 'reportCompleted', by: 'g1', cause: 'identified', pos: at },
      { type: 'deviceTaken' },
    ]);
    expect(s.alarmBeforeTheft).toBe(true);
    expect(s.securityLevel).toBe(4);
    expect(s.descriptionReported).toBe(true);
  });

  it('delayed discovery: clean theft, empty cradle noticed, no description', () => {
    const s = replay([
      { type: 'deviceTaken' },
      { type: 'reportCompleted', by: 'lab', cause: 'emptyCradle', pos: at },
      ...leave,
    ]);
    expect(s.alarmBeforeTheft).toBe(false);
    expect(s.descriptionReported).toBe(false);
    expect(s.securityLevel).toBe(5);
    expect(pursuitStrength(s)).toBe('light');
    expect(outcome(s)).toBe('shadow');
  });

  it('body found raises a local search and can lead to an alarm without a description', () => {
    const s = replay([
      { type: 'guardDown', guard: 'g2' },
      { type: 'bodyFound', by: 'g3', pos: at },
      { type: 'reportCompleted', by: 'g3', cause: 'bodyFound', pos: at },
    ]);
    expect(s.bodiesFound).toBe(1);
    expect(s.securityLevel).toBe(3);
    expect(s.descriptionReported).toBe(false);
  });
});

describe('pursuit strength (GDD section 6)', () => {
  const alarm: GameEvent = { type: 'reportCompleted', by: 'g1', cause: 'emptyCradle', pos: at };
  const described: GameEvent = { type: 'reportCompleted', by: 'g1', cause: 'identified', pos: at };
  const bike: GameEvent = { type: 'vehicleSeen', vehicle: 'motorcycle' };

  it('medium: alarm and either a description or the bike seen', () => {
    expect(pursuitStrength(replay([alarm, bike]))).toBe('medium');
    expect(pursuitStrength(replay([described]))).toBe('medium');
  });

  it('heavy: description and bike seen, or lockdown was reached', () => {
    expect(pursuitStrength(replay([described, bike]))).toBe('heavy');
    expect(pursuitStrength(replay([alarm, { type: 'deviceTaken' }]))).toBe('heavy');
  });

  it('hunted outcome needs an identification', () => {
    expect(outcome(replay([{ type: 'playerSeen', by: 'g1', certainty: 1, pos: at }, described]))).toBe('hunted');
  });
});

describe('reducer and bus', () => {
  it('never mutates the previous state', () => {
    const before = structuredClone(initialMissionState);
    reduce(initialMissionState, { type: 'playerSeen', by: 'g1', certainty: 1, pos: at });
    expect(initialMissionState).toEqual(before);
  });

  it('security level never falls through the reducer', () => {
    const s = replay([{ type: 'bodyFound', by: 'g1', pos: at }, { type: 'playerSeen', by: 'g2', certainty: 0.3, pos: at }]);
    expect(s.securityLevel).toBe(2);
  });

  it('bus delivers typed events and supports unsubscribe', () => {
    const bus = new EventBus();
    const seen: string[] = [];
    const off = bus.on('guardDown', (e) => seen.push(e.guard));
    let all = 0;
    bus.onAny(() => all++);
    bus.emit({ type: 'guardDown', guard: 'a' });
    off();
    bus.emit({ type: 'guardDown', guard: 'b' });
    expect(seen).toEqual(['a']);
    expect(all).toBe(2);
  });
});
