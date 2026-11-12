import { create } from 'zustand';

export type Phase = 'menu' | 'cinematic' | 'lab' | 'escape' | 'bike' | 'paused' | 'complete';
type GameState = { phase: Phase; alarm: boolean; deviceTaken: boolean; introTime: number; setPhase: (phase: Phase) => void; setAlarm: (alarm: boolean) => void; takeDevice: () => void; setIntroTime: (time: number) => void; reset: () => void };
export const useGameStore = create<GameState>((set) => ({
  phase: 'menu', alarm: false, deviceTaken: false, introTime: 0,
  setPhase: (phase) => set({ phase }), setAlarm: (alarm) => set({ alarm }), takeDevice: () => set({ deviceTaken: true, alarm: true }), setIntroTime: (introTime) => set({ introTime }),
  reset: () => set({ phase: 'menu', alarm: false, deviceTaken: false, introTime: 0 }),
}));
