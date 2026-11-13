// Mission state is a pure function of the events so far (GDD section 6).
// No system writes to it directly: that is what makes branches testable and saves trivial.
import type { AlarmCause, GameEvent, Vec2 } from './events';

export type PursuitStrength = 'none' | 'light' | 'medium' | 'heavy';

export interface MissionState {
  /** 0 normal, 1 suspicion, 2 local search, 3 facility alert, 4 lockdown, 5 external pursuit */
  securityLevel: number;
  deviceStolen: boolean;
  alarmTriggered: boolean;
  alarmBeforeTheft: boolean;
  alarmCause: AlarmCause | null;
  identified: boolean;
  descriptionReported: boolean;
  witnesses: string[];
  takedowns: number;
  bodiesFound: number;
  cameraRecordedPlayer: boolean;
  lastKnownPosition: Vec2 | null;
  perimeterLeft: boolean;
  bikeSeen: boolean;
  carIdentified: boolean;
  lockdownReached: boolean;
  checkpoint: number;
}

export const initialMissionState: MissionState = {
  securityLevel: 0,
  deviceStolen: false,
  alarmTriggered: false,
  alarmBeforeTheft: false,
  alarmCause: null,
  identified: false,
  descriptionReported: false,
  witnesses: [],
  takedowns: 0,
  bodiesFound: 0,
  cameraRecordedPlayer: false,
  lastKnownPosition: null,
  perimeterLeft: false,
  bikeSeen: false,
  carIdentified: false,
  lockdownReached: false,
  checkpoint: 0,
};

const raise = (s: MissionState, level: number): MissionState =>
  level > s.securityLevel ? { ...s, securityLevel: level, lockdownReached: s.lockdownReached || level === 4 } : s;

export function reduce(s: MissionState, e: GameEvent): MissionState {
  switch (e.type) {
    case 'playerSeen': {
      if (e.certainty < 1) return raise({ ...s, lastKnownPosition: e.pos }, 1);
      const witnesses = s.witnesses.includes(e.by) ? s.witnesses : [...s.witnesses, e.by];
      // a second confirmed sighting during an alert escalates to lockdown
      const level = s.securityLevel >= 3 && s.identified ? 4 : 2;
      return raise({ ...s, identified: true, witnesses, lastKnownPosition: e.pos }, level);
    }
    case 'guardDown':
      // an unconscious witness can no longer report what he saw
      return { ...s, takedowns: s.takedowns + 1, witnesses: s.witnesses.filter((w) => w !== e.guard) };
    case 'bodyFound':
      return raise({ ...s, bodiesFound: s.bodiesFound + 1, lastKnownPosition: e.pos }, 2);
    case 'cameraRecorded':
      return { ...s, cameraRecordedPlayer: true };
    case 'reportCompleted': {
      const first = !s.alarmTriggered;
      const next: MissionState = {
        ...s,
        alarmTriggered: true,
        alarmBeforeTheft: first ? !s.deviceStolen : s.alarmBeforeTheft,
        alarmCause: first ? e.cause : s.alarmCause,
        descriptionReported: s.descriptionReported || e.cause === 'identified' || e.cause === 'camera',
        lastKnownPosition: e.pos,
      };
      return raise(next, 3);
    }
    case 'deviceTaken':
      // taking the device while the station is already on alert triggers lockdown
      return raise({ ...s, deviceStolen: true }, s.securityLevel >= 3 ? 4 : s.securityLevel);
    case 'perimeterLeft':
      return raise({ ...s, perimeterLeft: true }, s.securityLevel >= 3 ? 5 : s.securityLevel);
    case 'vehicleSeen':
      return e.vehicle === 'motorcycle' ? { ...s, bikeSeen: true } : { ...s, carIdentified: true };
    case 'checkpoint':
      return { ...s, checkpoint: e.id };
    default:
      return s;
  }
}

/** GDD section 6, "Pursuit strength rule". */
export function pursuitStrength(s: MissionState): PursuitStrength {
  if (!s.alarmTriggered) return 'none';
  if ((s.descriptionReported && s.bikeSeen) || s.lockdownReached) return 'heavy';
  if (s.descriptionReported || s.bikeSeen) return 'medium';
  return 'light';
}

export type Outcome = 'ghost' | 'shadow' | 'hunted';
export function outcome(s: MissionState): Outcome {
  if (!s.alarmTriggered) return 'ghost';
  return s.identified ? 'hunted' : 'shadow';
}

export const replay = (events: GameEvent[]): MissionState => events.reduce(reduce, initialMissionState);
