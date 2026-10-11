'use client';
import { useEffect, useRef } from 'react';
import { useFinePointer, useReducedMotion } from '../lib/useMedia';
export default function CustomCursor() {
  const fine=useFinePointer(),reduced=useReducedMotion(),ref=useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fine || reduced) return;
    const el=ref.current!,ring=el.querySelector<HTMLElement>('.cursor-ring')!,dot=el.querySelector<HTMLElement>('.cursor-dot')!; let x=0,y=0,tx=0,ty=0,raf=0;
    document.documentElement.classList.add('has-custom-cursor');
    const tick=() => { raf=0; x+=(tx-x)*.2; y+=(ty-y)*.2; ring.style.transform=`translate3d(${x}px,${y}px,0)`; dot.style.transform=`translate3d(${tx}px,${ty}px,0)`; if (Math.abs(x-tx)+Math.abs(y-ty) > .5) raf=requestAnimationFrame(tick); };
    const move=(e: PointerEvent) => { tx=e.clientX; ty=e.clientY; const target=e.target as Element; el.classList.toggle('is-grow',!!target.closest('a,button,label')); el.classList.toggle('is-hidden',!!target.closest('input,textarea,select,[contenteditable]')); if (!raf) raf=requestAnimationFrame(tick); };
    const leave=() => el.classList.add('is-hidden');
    window.addEventListener('pointermove',move); document.addEventListener('pointerleave',leave); window.addEventListener('blur',leave);
    return () => { cancelAnimationFrame(raf); document.documentElement.classList.remove('has-custom-cursor'); window.removeEventListener('pointermove',move); document.removeEventListener('pointerleave',leave); window.removeEventListener('blur',leave); };
  },[fine,reduced]);
  return fine && !reduced ? <div ref={ref} className="cursor is-hidden" data-testid="custom-cursor" aria-hidden="true"><span className="cursor-ring"/><span className="cursor-dot"/></div> : null;
}
