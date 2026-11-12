import { useMemo } from 'react';
import { Cylinder, Float, Line } from '@react-three/drei';
import * as THREE from 'three';

/** Hand-sized copper, steel and plasma-core device used in the heist. */
export function ExperimentalDevice({ position = [0, 1.55, -4.4] }: { position?: [number, number, number] }) {
  const arcs = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const points = Array.from({ length: 7 }, (_, n) => {
      const a = (n / 6) * Math.PI * 2 + i * 1.2;
      const r = .19 + (n % 2) * .035;
      return new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 1.45 + i) * .12, Math.sin(a) * r);
    });
    return points;
  }), []);
  return <Float speed={1.8} rotationIntensity={.08} floatIntensity={.13}>
    <group position={position}>
      <Cylinder args={[.43, .43, .13, 12]} position={[0, .39, 0]}><meshStandardMaterial color="#aeb7b8" metalness={.92} roughness={.22}/></Cylinder>
      <Cylinder args={[.43, .43, .13, 12]} position={[0, -.39, 0]}><meshStandardMaterial color="#737c7e" metalness={.95} roughness={.25}/></Cylinder>
      <Cylinder args={[.34, .34, .55, 12]}><meshPhysicalMaterial color="#72dfff" metalness={.18} roughness={.1} transparent opacity={.25} transmission={.65} thickness={.2}/></Cylinder>
      {[-1, 1].map(side => <group key={side} position={[0, side * .27, 0]}>
        {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[0, i * .025, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.39, .025, 6, 24]}/><meshStandardMaterial color="#b66d39" metalness={.88} roughness={.3} emissive="#612b13" emissiveIntensity={.25}/></mesh>)}
      </group>)}
      {[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + Math.PI / 4; return <Cylinder key={i} args={[.025, .025, .67, 6]} position={[Math.cos(a) * .35, 0, Math.sin(a) * .35]}><meshStandardMaterial color="#bbc5c6" metalness={.94} roughness={.2}/></Cylinder>; })}
      <mesh><sphereGeometry args={[.235, 22, 18]}/><meshBasicMaterial color="#b4edff"/></mesh>
      <mesh><sphereGeometry args={[.29, 20, 16]}/><meshBasicMaterial color="#148dff" transparent opacity={.22} blending={THREE.AdditiveBlending}/></mesh>
      {arcs.map((points, i) => <Line key={i} points={points} color={i % 2 ? '#62e8ff' : '#a995ff'} lineWidth={1.8} transparent opacity={.9}/>) }
      <pointLight color="#42bfff" intensity={3.4} distance={5}/>
    </group>
  </Float>;
}
