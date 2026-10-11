'use client';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
export default function Reveal({ children, className='' }: { children: ReactNode; className?: string }) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el=ref.current!;
    document.documentElement.classList.add('reveal-ready');
    const observer=new IntersectionObserver(entries => { if (entries[0].isIntersecting) { el.classList.add('is-visible'); observer.disconnect(); } },{ threshold: .08 }); observer.observe(el); return () => observer.disconnect();
  },[]);
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}
