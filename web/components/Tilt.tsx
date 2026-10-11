'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { DomWriter } from '../lib/cinematic/domWriter';
export default function Tilt({ children, max=6, requireActive=false }: { children: ReactNode; max?: number; requireActive?: boolean }) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el=ref.current!,writer=new DomWriter(); let raf=0;
    const move=(e: PointerEvent) => { if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches || (requireActive && el.firstElementChild?.getAttribute('data-active') !== 'true')) return; cancelAnimationFrame(raf); raf=requestAnimationFrame(() => { const r=el.getBoundingClientRect(); writer.style(el,'--tilt-x',((.5-(e.clientY-r.top)/r.height)*max).toFixed(1)+'deg'); writer.style(el,'--tilt-y',(((e.clientX-r.left)/r.width-.5)*max).toFixed(1)+'deg'); }); };
    const leave=() => { cancelAnimationFrame(raf); writer.style(el,'--tilt-x','0deg'); writer.style(el,'--tilt-y','0deg'); };
    el.addEventListener('pointermove',move); el.addEventListener('pointerleave',leave); return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove',move); el.removeEventListener('pointerleave',leave); writer.reset(); };
  },[max,requireActive]);
  return <div className="tilt" ref={ref}>{children}</div>;
}
