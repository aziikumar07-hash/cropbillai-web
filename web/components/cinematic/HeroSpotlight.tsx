'use client';
import { useEffect, useRef } from 'react';
import { DomWriter } from '../../lib/cinematic/domWriter';
export default function HeroSpotlight() {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bg=ref.current!,layer=bg.parentElement!,day=bg.querySelector<HTMLElement>('.hero-day')!,fine=matchMedia('(pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),writer=new DomWriter();
    let raf=0,x=0,y=0,tx=0,ty=0,loaded=false;
    const tick=() => { raf=0; x+=(tx-x)*.18; y+=(ty-y)*.18; writer.style(day,'--mx',Math.round(x)+'px'); writer.style(day,'--my',Math.round(y)+'px'); if (Math.abs(x-tx)+Math.abs(y-ty) > .5) raf=requestAnimationFrame(tick); };
    const move=(e: PointerEvent) => { if (!fine.matches || reduced.matches || !['mouse','pen'].includes(e.pointerType)) return; if (!loaded) { loaded=true; writer.style(day,'background-image','url(/hero/day.webp)'); } bg.classList.add('is-lit'); tx=e.clientX; ty=e.clientY; if (!raf) raf=requestAnimationFrame(tick); };
    const leave=() => { bg.classList.remove('is-lit'); cancelAnimationFrame(raf); raf=0; };
    layer.addEventListener('pointermove',move); layer.addEventListener('pointerleave',leave); document.addEventListener('visibilitychange',leave); reduced.addEventListener('change',leave);
    return () => { leave(); layer.removeEventListener('pointermove',move); layer.removeEventListener('pointerleave',leave); document.removeEventListener('visibilitychange',leave); reduced.removeEventListener('change',leave); writer.reset(); };
  },[]);
  return <div className="hero-bg" ref={ref} aria-hidden="true"><img className="hero-night" src="/hero/night.webp" alt="" width="1280" height="720" fetchPriority="high"/><div className="hero-day"/><div className="hero-scrim"/></div>;
}
