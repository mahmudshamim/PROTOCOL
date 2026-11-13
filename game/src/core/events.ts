// Typed events are the only way game systems talk to each other.
// Simulation code emits them; mission state is derived from them; presentation listens.

export interface Vec2 { x: number; z: number }

export type AlarmCause = 'identified' | 'bodyFound' | 'camera' | 'emptyCradle';
export type Vehicle = 'motorcycle' | 'car';

export type GameEvent =
  | { type: 'noise'; pos: Vec2; radius: number; source: 'footstep' | 'takedown' | 'struggle' | 'thrown' | 'gunshot' }
  /** A guard or camera saw the player. certainty 1 means identified. */
  | { type: 'playerSeen'; by: string; certainty: number; pos: Vec2 }
  | { type: 'guardDown'; guard: string }
  | { type: 'bodyFound'; by: string; pos: Vec2 }
  /** A radio report or confirmed camera alert reached the control room. */
  | { type: 'reportCompleted'; by: string; cause: AlarmCause; pos: Vec2 }
  | { type: 'cameraRecorded'; camera: string }
  | { type: 'deviceTaken' }
  | { type: 'perimeterLeft' }
  | { type: 'vehicleSeen'; vehicle: Vehicle }
  | { type: 'pursuersLost' }
  | { type: 'checkpoint'; id: number };

export type EventType = GameEvent['type'];
type Handler<T extends EventType> = (event: Extract<GameEvent, { type: T }>) => void;

export class EventBus {
  private handlers = new Map<EventType, Set<(e: GameEvent) => void>>();
  private any = new Set<(e: GameEvent) => void>();

  on<T extends EventType>(type: T, handler: Handler<T>): () => void {
    const set = this.handlers.get(type) ?? new Set();
    this.handlers.set(type, set);
    set.add(handler as (e: GameEvent) => void);
    return () => set.delete(handler as (e: GameEvent) => void);
  }

  /** Listen to every event (mission state, debug log, save system). */
  onAny(handler: (e: GameEvent) => void): () => void {
    this.any.add(handler);
    return () => this.any.delete(handler);
  }

  emit(event: GameEvent): void {
    for (const h of this.any) h(event);
    const set = this.handlers.get(event.type);
    if (set) for (const h of set) h(event);
  }
}
