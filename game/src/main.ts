// PROTOCOL — boot. Milestone 0: foundation only, no gameplay.
import { EventBus, type GameEvent } from './core/events';
import { FixedLoop } from './core/loop';
import { initialMissionState, reduce, type MissionState } from './core/missionState';
import { AssetManager } from './assets/assetManager';
import { DebugOverlay } from './debug/overlay';
import { Input } from './input/input';
import { GameRenderer, PROFILES } from './render/renderer';
import { buildTestRoom } from './stages/testRoom';

const params = new URLSearchParams(location.search);
const t0 = performance.now();

const gr = await GameRenderer.create(document.body, params.get('force') === 'webgl');
if (params.get('q') === 'low') gr.profileName = 'low';
const assets = new AssetManager(gr.renderer);
const input = new Input(gr.canvas);
const overlay = new DebugOverlay(document.getElementById('debug')!, gr);

// mission state is derived from events, nothing else writes it
const bus = new EventBus();
let state: MissionState = initialMissionState;
const log: GameEvent[] = [];
bus.onAny((e) => { state = reduce(state, e); log.push(e); });

const stage = await buildTestRoom(assets, gr.profile);
gr.setView(stage.scene, stage.camera);
document.getElementById('boot')!.remove();
const loadMs = Math.round(performance.now() - t0);

// debug free camera
let yaw = Math.atan2(7, 11), pitch = -0.18, simTime = 0;
const cam = stage.camera;
// number keys fire sample events so the reducer can be watched live
const at = { x: 0, z: 0 };
const SAMPLE: Record<string, GameEvent> = {
  Digit1: { type: 'playerSeen', by: 'g1', certainty: 0.4, pos: at },
  Digit2: { type: 'playerSeen', by: 'g1', certainty: 1, pos: at },
  Digit3: { type: 'reportCompleted', by: 'g1', cause: 'identified', pos: at },
  Digit4: { type: 'deviceTaken' },
  Digit5: { type: 'perimeterLeft' },
  Digit6: { type: 'vehicleSeen', vehicle: 'motorcycle' },
};

function update(dt: number): void {
  simTime += dt;
  const look = input.consumeLook();
  yaw -= look.x * 0.0026; pitch = Math.max(-1.3, Math.min(1.3, pitch - look.y * 0.0022));
  const speed = (input.isDown('sprint') ? 12 : 4) * dt;
  const f = input.axis('back', 'forward'), r = input.axis('left', 'right'), u = input.axis('down', 'up');
  cam.position.x += (-Math.sin(yaw) * f + Math.cos(yaw) * r) * speed;
  cam.position.z += (-Math.cos(yaw) * f - Math.sin(yaw) * r) * speed;
  cam.position.y = Math.max(0.3, cam.position.y + u * speed);
  cam.rotation.set(pitch, yaw, 0, 'YXZ');
  stage.update(dt, simTime);
}

const loop = new FixedLoop(update, (_alpha, frameDt) => {
  for (const [code, event] of Object.entries(SAMPLE)) if (input.keyPressed(code)) bus.emit(event);
  if (input.keyPressed('Digit0')) { state = initialMissionState; log.length = 0; }
  if (input.keyPressed('F1')) overlay.toggle();
  if (input.keyPressed('F2')) { gr.setProfile(gr.profileName === 'high' ? 'low' : 'high'); stage.applyProfile(gr.profile); }
  gr.render();
  gr.adapt(frameDt * 1000);
  overlay.frame(frameDt, loop.simSteps, state, [
    `assets ${(assets.bytesLoaded / 1048576).toFixed(1)} MB · load ${loadMs} ms · events ${log.length}`,
    'WASD move · drag to look · Space/Q up/down · Shift fast · F1 overlay · F2 profile · 1-6 sample events · 0 reset',
  ]);
  input.endFrame();
});

if (params.get('perf')) {
  // performance check: GPU-inclusive frame time, printed to the console as one JSON line
  gr.dynamicResolution = false;
  const raf = () => new Promise<number>((r) => requestAnimationFrame(r));
  for (let i = 0; i < 120; i++) { update(1 / 60); gr.render(); await raf(); }
  const times: number[] = [];
  for (let i = 0; i < 150; i++) { update(1 / 60); const t = performance.now(); gr.render(); await gr.gpuIdle(); times.push(performance.now() - t); await raf(); }
  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  console.log('PERF ' + JSON.stringify({ backend: gr.backend, profile: gr.profileName, ...gr.stats(), frameMs: +mean.toFixed(2), p95: +times[Math.floor(times.length * 0.95)].toFixed(2), fps: +(1000 / mean).toFixed(1), heapMB: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null, assetsMB: +(assets.bytesLoaded / 1048576).toFixed(1), profileHeight: PROFILES[gr.profileName].height }));
} else loop.start();
