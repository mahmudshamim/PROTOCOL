import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** Stylized adventurer character built from lightweight Three.js geometry. */
export function TacticalCharacter({ walking = false, running = false }: { walking?: boolean; running?: boolean }) {
  const body = useRef<THREE.Group>(null!);
  const leftLeg = useRef<THREE.Group>(null!); const rightLeg = useRef<THREE.Group>(null!);
  const leftShin = useRef<THREE.Group>(null!); const rightShin = useRef<THREE.Group>(null!);
  const leftArm = useRef<THREE.Group>(null!); const rightArm = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const moving = walking || running;
    const frequency = running ? 10 : 6.8;
    const amplitude = moving ? (running ? .55 : .3) : 0;
    const step = Math.sin(clock.elapsedTime * frequency) * amplitude;
    if (leftLeg.current) leftLeg.current.rotation.x = step;
    if (rightLeg.current) rightLeg.current.rotation.x = -step;
    if (leftArm.current) leftArm.current.rotation.x = -step * .75 - (moving ? .08 : 0);
    if (rightArm.current) rightArm.current.rotation.x = step * .75 - (moving ? .08 : 0);
    if (leftShin.current) leftShin.current.rotation.x = moving ? Math.max(0, -step) * .72 : 0;
    if (rightShin.current) rightShin.current.rotation.x = moving ? Math.max(0, step) * .72 : 0;
    if (body.current) {
      body.current.position.y = moving ? Math.abs(Math.sin(clock.elapsedTime * frequency)) * (running ? .075 : .035) : 0;
      body.current.rotation.z = moving ? Math.sin(clock.elapsedTime * frequency) * .035 : 0;
    }
  });
  const shirt = '#d5c6a3'; const pants = '#343a30'; const leather = '#705035'; const skin = '#c99774'; const hair = '#211e1c';
  return <group>
    <group ref={body}>
      {/* Short travel tunic, belt, and small pack */}
      <mesh position={[0, 1.32, 0]}><cylinderGeometry args={[.32, .39, .72, 8]}/><meshStandardMaterial color={shirt} roughness={.92}/></mesh>
      <mesh position={[0, .97, 0]}><torusGeometry args={[.33, .055, 6, 12]}/><meshStandardMaterial color={leather} roughness={.72}/></mesh>
      <mesh position={[0, .98, -.355]}><boxGeometry args={[.12, .1, .035]}/><meshStandardMaterial color="#b28a4e" metalness={.55}/></mesh>
      <mesh position={[-.25, 1.05, .03]}><boxGeometry args={[.16, .24, .16]}/><meshStandardMaterial color="#77593a" roughness={.9}/></mesh>
      <mesh position={[.21, 1.08, .04]}><boxGeometry args={[.14, .2, .14]}/><meshStandardMaterial color="#80613e" roughness={.9}/></mesh>
      <mesh position={[0, 1.72, 0]}><cylinderGeometry args={[.09, .1, .14, 8]}/><meshStandardMaterial color={skin}/></mesh>
      {/* Oversized expressive head, hair cap and swept spikes */}
      <mesh position={[0, 1.99, 0]}><sphereGeometry args={[.255, 16, 12]}/><meshStandardMaterial color={skin} roughness={.84}/></mesh>
      <mesh position={[0, 2.12, .025]} scale={[1.08, .72, 1.03]}><sphereGeometry args={[.24, 12, 9]}/><meshStandardMaterial color={hair} roughness={.8}/></mesh>
      {[-.16, -.08, 0, .09, .17].map((x, i) => <mesh key={x} position={[x, 2.3 + (i % 2) * .025, .025]} rotation={[.12, 0, (i - 2) * -.18]}><coneGeometry args={[.105, .29 + (i % 2) * .09, 5]}/><meshStandardMaterial color={hair} roughness={.82}/></mesh>)}
      {/* Face points toward local -Z */}
      <mesh position={[-.085, 2.01, -.215]}><sphereGeometry args={[.026, 8, 6]}/><meshStandardMaterial color="#25211f"/></mesh>
      <mesh position={[.085, 2.01, -.215]}><sphereGeometry args={[.026, 8, 6]}/><meshStandardMaterial color="#25211f"/></mesh>
      <mesh position={[0, 1.94, -.24]}><coneGeometry args={[.035, .09, 5]}/><meshStandardMaterial color="#b47f61"/></mesh>
      <mesh position={[0, 1.81, -.18]}><boxGeometry args={[.23, .12, .05]}/><meshStandardMaterial color="#3d322b"/></mesh>
    </group>
    {/* Short sleeves and swinging arms, pivoted at the shoulders */}
    <group ref={leftArm} position={[-.35, 1.59, 0]}>
      <mesh position={[-.09, -.13, 0]} rotation={[0, 0, -.12]}><capsuleGeometry args={[.115, .2, 4, 8]}/><meshStandardMaterial color={shirt}/></mesh>
      <mesh position={[-.13, -.43, -.005]}><capsuleGeometry args={[.075, .32, 4, 8]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[-.13, -.66, -.015]}><sphereGeometry args={[.085, 9, 7]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[-.09, -.19, -.01]}><torusGeometry args={[.112, .018, 5, 10]}/><meshStandardMaterial color="#8e7859"/></mesh>
    </group>
    <group ref={rightArm} position={[.35, 1.59, 0]}>
      <mesh position={[.09, -.13, 0]} rotation={[0, 0, .12]}><capsuleGeometry args={[.115, .2, 4, 8]}/><meshStandardMaterial color={shirt}/></mesh>
      <mesh position={[.13, -.43, -.005]}><capsuleGeometry args={[.075, .32, 4, 8]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[.13, -.66, -.015]}><sphereGeometry args={[.085, 9, 7]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[.09, -.19, -.01]}><torusGeometry args={[.112, .018, 5, 10]}/><meshStandardMaterial color="#8e7859"/></mesh>
    </group>
    {/* Trouser legs bend at hips and knees; boots move with the lower legs */}
    <group ref={leftLeg} position={[-.16, .91, 0]}>
      <mesh position={[0, -.23, 0]}><capsuleGeometry args={[.145, .32, 4, 8]}/><meshStandardMaterial color={pants}/></mesh>
      <group ref={leftShin} position={[0, -.43, 0]}>
        <mesh position={[0, -.2, 0]}><capsuleGeometry args={[.12, .31, 4, 8]}/><meshStandardMaterial color={pants}/></mesh>
        <mesh position={[0, -.47, -.065]}><boxGeometry args={[.22, .24, .33]}/><meshStandardMaterial color={leather} roughness={.8}/></mesh>
        <mesh position={[0, -.58, -.12]}><boxGeometry args={[.24, .13, .4]}/><meshStandardMaterial color="#3d3025" roughness={.85}/></mesh>
      </group>
    </group>
    <group ref={rightLeg} position={[.16, .91, 0]}>
      <mesh position={[0, -.23, 0]}><capsuleGeometry args={[.145, .32, 4, 8]}/><meshStandardMaterial color={pants}/></mesh>
      <group ref={rightShin} position={[0, -.43, 0]}>
        <mesh position={[0, -.2, 0]}><capsuleGeometry args={[.12, .31, 4, 8]}/><meshStandardMaterial color={pants}/></mesh>
        <mesh position={[0, -.47, -.065]}><boxGeometry args={[.22, .24, .33]}/><meshStandardMaterial color={leather} roughness={.8}/></mesh>
        <mesh position={[0, -.58, -.12]}><boxGeometry args={[.24, .13, .4]}/><meshStandardMaterial color="#3d3025" roughness={.85}/></mesh>
      </group>
    </group>
  </group>;
}
