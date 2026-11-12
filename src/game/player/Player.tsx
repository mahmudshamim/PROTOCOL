import { useGameStore } from '../state/gameStore';
export function Player() {
  const phase = useGameStore(s => s.phase);
  if (phase !== 'lab' && phase !== 'escape') return null;
  return <mesh position={[0, 1, 1]}><sphereGeometry args={[.4, 16, 12]}/><meshStandardMaterial color="#d7c49f"/></mesh>;
}
