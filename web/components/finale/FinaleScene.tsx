'use client';
import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, ContactShadows, useGLTF } from '@react-three/drei';
import { Box3, Group, Shape, Vector3 } from 'three';
import { getAssetFlags } from '../../lib/assetFlags';
import { inspectGlb } from '../../lib/glb';
import { useReducedMotion } from '../../lib/useMedia';
import MascotPoster from './MascotPoster';
export const THREE_MARKER='CROPBILL_THREE_SCENE';
class Boundary extends Component<{ children: ReactNode; fallback: ReactNode },{ failed: boolean }> {
  state={ failed: false }; static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { console.warn('[finale] scene unavailable'); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Sprout({ reduced }: { reduced: boolean }) {
  const ref=useRef<Group>(null);
  const shape=useMemo(() => { const s=new Shape(); s.moveTo(0,0); s.quadraticCurveTo(-.42,.22,0,.64); s.quadraticCurveTo(.42,.22,0,0); return s; },[]);
  useFrame(({ clock }) => { if (!reduced && ref.current) ref.current.rotation.z=Math.sin(clock.elapsedTime*.8)*.06; });
  return <group ref={ref}>
    <mesh scale={[1,1.18,.95]}><sphereGeometry args={[.62,48,48]}/><meshStandardMaterial color="#c99a52" roughness={.55}/></mesh>
    {[-.2,.2].map(x => <group key={x} position={[x,.18,.56]}><mesh><sphereGeometry args={[.07,20,20]}/><meshStandardMaterial color="#1a1a17"/></mesh><mesh position={[.02,.025,.06]}><sphereGeometry args={[.022,12,12]}/><meshStandardMaterial color="#ffffff"/></mesh></group>)}
    <mesh position={[0,.82,0]}><cylinderGeometry args={[.035,.045,.35]}/><meshStandardMaterial color="#3fa34d"/></mesh>
    {[-1,1].map(side => <mesh key={side} position={[0,.94,0]} rotation={[.35,0,side*.65]}><extrudeGeometry args={[shape,{ depth: .02, bevelEnabled: true, bevelSize: .01, bevelThickness: .01, bevelSegments: 2, steps: 1 }]}/><meshStandardMaterial color={side < 0 ? '#3fa34d' : '#58b866'}/></mesh>)}
    {[-1,1].map(side => <mesh key={side} position={[side*.36,-.14,.58]} rotation={[.3,0,side*.6]}><capsuleGeometry args={[.05,.22,4,12]}/><meshStandardMaterial color="#b88a45"/></mesh>)}
    <group position={[0,-.12,.66]} rotation={[0,0,-.14]}><mesh><boxGeometry args={[.42,.56,.012]}/><meshStandardMaterial color="#f6f0dc"/></mesh>{[.16,.07,-.02,-.11].map(y => <mesh key={y} position={[0,y,.009]}><boxGeometry args={[.28,.018,.002]}/><meshStandardMaterial color="#9a8f73"/></mesh>)}<mesh position={[-.09,-.2,.01]}><boxGeometry args={[.1,.025,.002]}/><meshStandardMaterial color="#1f4d2b"/></mesh></group>
  </group>;
}
function GltfMascot() {
  const { scene }=useGLTF('/models/mascot.glb',false,false);
  const object=useMemo(() => { const copy=scene.clone(true),box=new Box3().setFromObject(copy),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3()),scale=1.6/Math.max(size.x,size.y,size.z,.001); copy.position.copy(center.multiplyScalar(-scale)); copy.scale.setScalar(scale); return copy; },[scene]);
  return <primitive object={object}/>;
}
export default function FinaleScene() {
  const reduced=useReducedMotion(),[glb,setGlb]=useState(false),[available,setAvailable]=useState<boolean | null>(null),[inView,setInView]=useState(true),ref=useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live=true; const canvas=document.createElement('canvas'),ctx=canvas.getContext('webgl2') || canvas.getContext('webgl'); setAvailable(!!ctx); ctx?.getExtension('WEBGL_lose_context')?.loseContext();
    getAssetFlags().then(async flags => { if (!flags.mascotGlb) return; try { const response=await fetch('/models/mascot.glb',{ cache: 'force-cache' }); if (response.ok && inspectGlb(await response.arrayBuffer()).ok && live) setGlb(true); else console.warn('[finale] optional model unavailable; using original sprout'); } catch { console.warn('[finale] optional model unavailable; using original sprout'); } });
    const observer=new IntersectionObserver(entries => setInView(entries[0].isIntersecting)); observer.observe(ref.current!); return () => { live=false; observer.disconnect(); };
  },[]);
  const mascot=glb ? <Boundary fallback={<Sprout reduced={reduced}/>}><Suspense fallback={<Sprout reduced={reduced}/>}><GltfMascot/></Suspense></Boundary> : <Sprout reduced={reduced}/>;
  const mode=reduced ? 'demand' : inView ? 'always' : 'never';
  return <div ref={ref} className="three-scene" data-scene={THREE_MARKER}>{available ? <Boundary fallback={<MascotPoster/>}><Canvas dpr={[1,1.5]} camera={{ position: [0,.4,4.2], fov: 35 }} gl={{ alpha: true, antialias: true }} frameloop={mode} data-frameloop={mode}><ambientLight intensity={.5} color="#fff3d6"/><directionalLight position={[3,4,2]} intensity={1.6} color="#ffe3a3"/><pointLight position={[-2.5,1,1.5]} intensity={8} color="#e9cd86"/><hemisphereLight args={['#e9cd86','#101c15',.4]}/>{reduced ? mascot : <Float speed={1.4} rotationIntensity={.25} floatIntensity={.6}>{mascot}</Float>}<Sparkles count={60} scale={[6,3,2]} size={2.5} speed={reduced ? 0 : .25} color="#e9cd86" opacity={.8}/><ContactShadows position={[0,-1.05,0]} opacity={.35} blur={2.4} far={2}/></Canvas></Boundary> : <MascotPoster/>}</div>;
}
