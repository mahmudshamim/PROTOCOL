import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { World } from '../game/world/World';
import { Player } from '../game/player/Player';
import { Overlay } from '../game/ui/Overlay';
import { useGameStore } from '../game/state/gameStore';

export default function App() {
  const phase = useGameStore(s => s.phase);
  return <main className="gameShell"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 4.2, 9], fov: 58 }} gl={{ antialias: true, powerPreference: 'high-performance' }}><Suspense fallback={null}><World/><Player/></Suspense></Canvas><div className={`vignette ${phase === 'menu' ? 'menuVignette':''}`}/><div className="scanlines"/><Overlay/></main>;
}
