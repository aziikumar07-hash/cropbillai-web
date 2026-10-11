'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import MascotPoster from './MascotPoster';
const Scene=dynamic(() => import('./FinaleScene'),{ ssr: false, loading: () => <MascotPoster/> });
export default function Finale() {
  const ref=useRef<HTMLElement>(null),[loaded,setLoaded]=useState(false);
  useEffect(() => { const observer=new IntersectionObserver(entries => { if (entries[0].isIntersecting) { setLoaded(true); observer.disconnect(); } },{ rootMargin: '600px 0px' }); observer.observe(ref.current!); return () => observer.disconnect(); },[]);
  return <section id="finale" ref={ref} data-finale-loaded={loaded ? '' : undefined} aria-labelledby="finale-title"><img className="finale-bg" src="/images/finale-bg.webp" alt="" loading="lazy"/><div className="finale-copy"><p className="eyebrow">SMALL HELPER. BIGGER PICTURE.</p><h2 id="finale-title">Rooting for<br/><span className="serif">your next season.</span></h2><p>A small helper for the season’s paperwork.<br/>A little more time for what matters.</p><a className="button button-gold" href="#waitlist">Let’s grow together <span>↗</span></a><p className="finale-footnote">GROW MORE. GUESS LESS.</p></div><div className="finale-canvas" role="img" aria-label="A friendly sprout character holding a paper bill">{loaded ? <Scene/> : <MascotPoster/>}</div><span className="finale-orbit" aria-hidden="true"/></section>;
}
