import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../state/gameStore';
import { ExperimentalDevice } from './ExperimentalDevice';
import { CinematicScene } from '../cinematic/CinematicScene';

function Facility() {
  const alarm = useGameStore(s => s.alarm);
  const light = useMemo(() => new THREE.PointLight('#ff1628', 0, 20), []);
  useFrame(({ clock }) => { light.intensity = alarm ? 10 + Math.sin(clock.elapsedTime * 7) * 5 : 0; });
  return <group position={[0, 0, -5]}>
    {/* Build the shell as separate walls so the center doorway is a real opening. */}
    <Box args={[18, .3, 14]} position={[0, .05, 0]}><meshStandardMaterial color="#353b3c" roughness={.8} /></Box>
    {[-8.8, 8.8].map(x => <Box key={x} args={[.4, 8, 14]} position={[x, 4, 0]}><meshStandardMaterial color="#343b3f" metalness={.42} roughness={.58} /></Box>)}
    <Box args={[18, 8, .4]} position={[0, 4, -7]}><meshStandardMaterial color="#262e32" metalness={.42} roughness={.6} /></Box>
    {[-5.75, 5.75].map(x => <Box key={x} args={[6.5, 8, .4]} position={[x, 4, 7]}><meshStandardMaterial color="#343b3f" metalness={.42} roughness={.58} /></Box>)}
    <Box args={[5, 4.2, .4]} position={[0, 5.9, 7]}><meshStandardMaterial color="#30373b" metalness={.5} roughness={.5} /></Box>
    <Box args={[18.2, .22, 14.2]} position={[0, 8.1, 0]}><meshStandardMaterial color="#3a4245" metalness={0.8} /></Box>
    {[-7.5, 7.5].map(x => <group key={x} position={[x, 3.7, 7.25]}><Box args={[.35, .25, .2]}><meshStandardMaterial color="#ff2535" emissive="#ff1020" emissiveIntensity={alarm ? 5 : .3} /></Box></group>)}
    <primitive object={light} position={[0, 5, 5]} />
    <pointLight position={[0, 5.2, 0]} color="#c8ebff" intensity={85} distance={24} decay={1} />
    <pointLight position={[-5, 6.5, 0]} color="#d7efff" intensity={35} distance={16} decay={1} />
    <pointLight position={[5, 6.5, 0]} color="#d7efff" intensity={35} distance={16} decay={1} />
    {[-1, 1].map((x, i) => <group key={i} position={[x * 5, 0, -5]}><Box args={[.12, 5, .12]} position={[0, 2.5, 0]}><meshStandardMaterial color="#737f82" metalness={.8} /></Box><Box args={[1.6, .12, .12]} position={[0, 4.7, 0]}><meshStandardMaterial color="#667277" /></Box></group>)}
    <Box args={[4, .15, 2]} position={[0, .25, 0]}><meshStandardMaterial color="#111619" /></Box>
  </group>;
}

function Desert() {
  const dunes = useMemo(() => Array.from({ length: 34 }, (_, i) => ({ x: (i % 9 - 4) * 10 + Math.random() * 2, z: -30 - Math.floor(i / 9) * 17, scale: .7 + Math.random() * 1.3 })), []);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.12, -25]}><planeGeometry args={[240, 180]} /><meshStandardMaterial color="#6f5137" roughness={1} /></mesh>
    {dunes.map((d, i) => <mesh key={i} position={[d.x, -.05, d.z]} scale={[d.scale * 8, d.scale * 1.5, d.scale * 6]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#755639' : '#846344'} roughness={1} /></mesh>)}
    <Box args={[4, .2, 28]} position={[0, -.02, 14]}><meshStandardMaterial color="#262729" roughness={.9} /></Box>
    {[-1.5, 1.5].map(x => <Box key={x} args={[.08, .02, 28]} position={[x, .1, 14]}><meshStandardMaterial color="#cab781" emissive="#5a4825" emissiveIntensity={.25} /></Box>)}
    <Sparkles count={100} scale={[45, 12, 55]} position={[0, 3, -14]} size={2} speed={.12} color="#e8b678" opacity={.24} />
  </group>;
}

function Bike() {
  const phase = useGameStore(s => s.phase);
  return phase === 'bike' ? <group position={[0, .58, 2]} rotation={[0, 0, -.04]}>
    {[[-.48, .3, -.72], [.48, .3, -.72]].map(([x, y, z], i) => <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[.3, .09, 10, 18]} /><meshStandardMaterial color="#0a0c0e" /></mesh>)}
    <Box args={[.35, .34, .72]} position={[0, .6, 0]} rotation={[.1, 0, 0]}><meshStandardMaterial color="#b21c23" metalness={.6} roughness={.35} /></Box>
    <Box args={[.16, .28, .24]} position={[0, .94, -.32]}><meshStandardMaterial color="#161b1c" metalness={.7} /></Box>
    <pointLight position={[0, .55, -.5]} color="#edf9ff" intensity={2} distance={8} />
  </group> : null;
}

export function World() {
  const alarm = useGameStore(s => s.alarm);
  const phase = useGameStore(s => s.phase);
  if (phase === 'cinematic') return <CinematicScene/>;
  return <>
    <color attach="background" args={['#171c21']} /><fog attach="fog" args={['#171c21', 28, 100]} />
    <ambientLight intensity={.9} /><directionalLight position={[-7, 15, 8]} intensity={2.4} color="#ffd1a1" castShadow shadow-mapSize={[1024, 1024]} />
    <hemisphereLight args={['#a6c3d8', '#62452b', .8]} />
    <Desert /><Facility />{!useGameStore.getState().deviceTaken && <ExperimentalDevice position={[1.15, 1.55, -4.4]}/>}<Bike />
    <mesh position={[0, 2.4, -17]}><cylinderGeometry args={[.08, .08, 4, 8]} /><meshStandardMaterial color="#30393b" /></mesh>
    <pointLight position={[0, 4, -17]} color={alarm ? '#ff1224' : '#19a6ce'} intensity={alarm ? 6 : 1.5} distance={14} />
  </>;
}
