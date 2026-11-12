import { useRef } from 'react';
import { Box, Cylinder } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TacticalCharacter } from '../player/TacticalCharacter';
import { ExperimentalDevice } from '../world/ExperimentalDevice';
import { useGameStore } from '../state/gameStore';

function EscapeCar() {
  return <group position={[3.2, 0, .4]}>
    <Box args={[2.05, .52, 4.35]} position={[0, .72, 0]}><meshStandardMaterial color="#28627b" emissive="#08202b" emissiveIntensity={.45} metalness={.72} roughness={.24}/></Box>
    <Box args={[1.83, .36, 1.05]} position={[0, 1.04, -1.45]}><meshStandardMaterial color="#34738a" emissive="#0b2830" emissiveIntensity={.32} metalness={.66} roughness={.28}/></Box>
    <Box args={[1.52, .7, 1.7]} position={[0, 1.23, .12]}><meshStandardMaterial color="#24424b" metalness={.62} roughness={.2}/></Box>
    <Box args={[1.42, .48, .06]} position={[0, 1.25, -.78]}><meshStandardMaterial color="#07151c" metalness={.25} roughness={.14}/></Box>
    <Box args={[1.42, .45, .06]} position={[0, 1.26, .99]}><meshStandardMaterial color="#101c20" metalness={.32} roughness={.22}/></Box>
    <Box args={[2.22, .1, .4]} position={[0, 1.15, 2.14]}><meshStandardMaterial color="#0e161a" metalness={.62}/></Box>
    {[[-1, -.2], [1, -.2], [-1, 1.45], [1, 1.45]].map(([x, z], i) => <group key={i} position={[x, .47, z]} rotation={[0, 0, Math.PI/2]}>
      <mesh><torusGeometry args={[.42, .14, 10, 20]}/><meshStandardMaterial color="#080b0c" roughness={.84}/></mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[.23, .23, .11, 12]}/><meshStandardMaterial color="#77858a" metalness={.9} roughness={.25}/></mesh>
    </group>)}
    {[-.69, .69].map(x => <group key={x} position={[x, .82, -2.19]}><Box args={[.42, .14, .025]}><meshBasicMaterial color="#dff6ff"/></Box><pointLight color="#b8e9ff" intensity={1.5} distance={4}/></group>)}
    {[-.7, .7].map(x => <Box key={x} args={[.43, .13, .025]} position={[x, .82, 2.19]}><meshBasicMaterial color="#fc3327"/></Box>)}
  </group>;
}

function SearchHelicopter({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rotor = useRef<THREE.Group>(null!); const tailRotor = useRef<THREE.Group>(null!);
  useFrame((_, delta) => { if (rotor.current) rotor.current.rotation.y += delta * 13; if (tailRotor.current) tailRotor.current.rotation.z += delta * 16; });
  return <group position={position} scale={scale}>
    <Box args={[.72, .54, 1.7]}><meshStandardMaterial color="#151d20" metalness={.58} roughness={.48}/></Box>
    <mesh position={[0, .04, -.98]} rotation={[Math.PI/2, 0, 0]}><coneGeometry args={[.32, .75, 8]}/><meshStandardMaterial color="#182124"/></mesh>
    <Box args={[.08, .1, 1.45]} position={[0, .28, .05]}><meshStandardMaterial color="#313a3b" metalness={.6}/></Box>
    <group ref={rotor} position={[0, .37, 0]}>{[0, Math.PI/2].map(a => <Box key={a} args={[.14, .025, 4.4]} rotation={[0, a, 0]}><meshStandardMaterial color="#111719"/></Box>)}</group>
    <group ref={tailRotor} position={[0, .05, -1.34]}>{[0, Math.PI/2].map(a => <Box key={a} args={[.055, .05, .75]} rotation={[0, 0, a]}><meshStandardMaterial color="#202728"/></Box>)}</group>
    <mesh position={[0, -.48, .2]} rotation={[Math.PI,0,0]}><coneGeometry args={[.24, 1.2, 6]}/><meshBasicMaterial color="#ffb33c" transparent opacity={.13}/></mesh>
    <pointLight position={[0, -.3, .2]} color="#ffc766" intensity={2} distance={7}/>
  </group>;
}

function DistantFacility({ alarm }: { alarm: boolean }) {
  return <group position={[0, 0, -25]}>
    <Box args={[17, 5, 8]} position={[0, 2.5, 0]}><meshStandardMaterial color="#30383a" metalness={.4} roughness={.72}/></Box>
    <Box args={[8, 7, 9]} position={[0, 3.5, -4.5]}><meshStandardMaterial color="#394043" metalness={.35}/></Box>
    {[-6, -3, 0, 3, 6].map(x => <Box key={x} args={[.36, .18, .16]} position={[x, 4.4, 4.08]}><meshStandardMaterial color="#ff3032" emissive="#ff1d22" emissiveIntensity={alarm ? 6 : .6}/></Box>)}
    <pointLight position={[0, 5, 4]} color="#ff222a" intensity={alarm ? 16 : 1} distance={15}/>
    <Cylinder args={[.08, .08, 7, 8]} position={[0, 8, -1]}><meshStandardMaterial color="#252c2d"/></Cylinder>
    <pointLight position={[0, 11.5, -1]} color="#ff2926" intensity={alarm ? 7 : .2} distance={18}/>
  </group>;
}

export function CinematicScene() {
  const { camera } = useThree(); const t = useGameStore(s => s.introTime); const alarm = t > 9;
  useFrame((_, delta) => {
    const pos = t < 5 ? new THREE.Vector3(0, 4.1, 9.5) : t < 10 ? new THREE.Vector3(-2.5, 3.1, 6.5) : t < 17 ? new THREE.Vector3(0, 5.8, 12) : t < 23 ? new THREE.Vector3(0, 3.1, 8.5) : new THREE.Vector3(5.4, 3.7, 10.5);
    const aim = t < 5 ? new THREE.Vector3(0, 1.7, -3) : t < 10 ? new THREE.Vector3(-3.15, 1.45, .1) : t < 17 ? new THREE.Vector3(0, 5, -23) : t < 23 ? new THREE.Vector3(0, 1.6, -.4) : new THREE.Vector3(2.8, .8, 0);
    camera.position.lerp(pos, 1 - Math.exp(-delta * 1.5)); camera.lookAt(aim);
  });
  return <>
    <color attach="background" args={['#dc9163']}/><fog attach="fog" args={['#d89068', 48, 125]}/>
    <ambientLight intensity={.82}/><hemisphereLight args={['#ffcfa5', '#514335', 1.15]}/>
    <directionalLight position={[-14, 17, -28]} intensity={3.1} color="#ffcf9a" castShadow shadow-mapSize={[1024,1024]}/>
    <pointLight position={[0, 8, 7]} color="#ffd0a0" intensity={34} distance={38} decay={1}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.2,-25]}><planeGeometry args={[250,200]}/><meshStandardMaterial color="#98704d" roughness={1}/></mesh>
    <mesh position={[-10, 13, -62]}><sphereGeometry args={[9,20,16]}/><meshBasicMaterial color="#ffcc83"/></mesh>
    {[-34,-23,-12,5,16,29].map((z,i) => <mesh key={i} position={[(i%2?1:-1)*(17+(i%3)*4), 3+(i%3)*1.4, z]} scale={[13,7+(i%2)*3,9]}><coneGeometry args={[1,1,7]}/><meshStandardMaterial color={i%2?'#55473c':'#68513e'} roughness={1}/></mesh>)}
    <DistantFacility alarm={alarm}/>
    <SearchHelicopter position={[-9, 7, -13]} scale={1.1}/><SearchHelicopter position={[8, 5.5, -20]} scale={.68}/>
    <group position={[-3.35,0,0]}><TacticalCharacter/><ExperimentalDevice position={[.5,1.23,-.35]}/></group>
    <EscapeCar/>
    {Array.from({length:18},(_,i)=><group key={i} position={[(i%2?1:-1)*(6+(i%5)*3),0,-8-Math.floor(i/2)*4]}>
      <Cylinder args={[.04,.13,.5+(i%3)*.18,5]} position={[0,.27,0]}><meshStandardMaterial color="#403c31"/></Cylinder>
      <Cylinder args={[.18,.12,.17,5]} position={[0,.62+(i%3)*.06,0]}><meshStandardMaterial color="#5b684c"/></Cylinder>
    </group>)}
  </>;
}
