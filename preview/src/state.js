// Mission state for the whole night, plus checkpoints (GDD sections 6 and 9).

const fresh = () => ({
  alarm: false, alarmBeforeTheft: false, alarmCause: '',
  identified: false, described: false, bodyFound: false, cameraRec: false, lockdown: false,
  takedowns: 0, stolen: false, health: 3, throws: 3,
  bikeSeen: false, crashes: 0, damage: 0,
  startTime: performance.now(),
});

export const M = fresh();
export const resetMission = () => Object.assign(M, fresh());

let checkpoint = null;
export function saveCheckpoint(stage) { checkpoint = { stage, m: structuredClone(M) }; }
export function loadCheckpoint() {
  const start = M.startTime;
  Object.assign(M, structuredClone(checkpoint.m));
  M.startTime = start; M.health = 3;
  return checkpoint.stage;
}

/** GDD section 6, pursuit strength rule. */
export function pursuitStrength() {
  if (!M.alarm) return 'none';
  if ((M.described && M.bikeSeen) || M.lockdown) return 'heavy';
  if (M.described || M.bikeSeen) return 'medium';
  return 'light';
}

export function outcome() {
  const base = !M.alarm ? 'GHOST' : M.identified ? 'HUNTED' : 'SHADOW';
  return { base, wreck: M.damage >= 60 };
}
