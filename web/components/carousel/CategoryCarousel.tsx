'use client';
import { useEffect, useRef } from 'react';
import { categories } from '../../lib/content';
import { cardTransform } from '../../lib/math';
import { DomWriter } from '../../lib/cinematic/domWriter';
import { progressFromRect } from '../../lib/cinematic/timeline';
import Tilt from '../Tilt';
export default function CategoryCarousel() {
  const ref=useRef<HTMLElement>(null);
  useEffect(() => {
    const root=ref.current!,stage=root.querySelector<HTMLElement>('.carousel-stage')!,track=root.querySelector<HTMLElement>('.carousel-track')!,items=Array.from(root.querySelectorAll<HTMLElement>('.carousel-item')),cards=Array.from(root.querySelectorAll<HTMLElement>('.glass-card')),counter=root.querySelector<HTMLElement>('.carousel-counter')!,announcer=root.querySelector<HTMLElement>('[role=status]')!,reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let writer=new DomWriter(),active=0,pending: number | null=null,raf=0,timer=0;
    function setActive(index: number) {
      active=index; writer.attr(root,'data-active-index',String(index)); writer.text(counter,`${String(index+1).padStart(2,'0')} / 10`);
      cards.forEach((card,i) => { writer.attr(card,'tabindex',i === index ? '0' : '-1'); writer.attr(card,'data-active',String(i === index)); writer.attr(card,'aria-current',i === index ? 'true' : null); });
      if (pending === index) pending=null;
    }
    function render() {
      raf=0;
      if (reduced.matches) { const center=track.scrollLeft+track.clientWidth/2; let best=0,dist=Infinity; items.forEach((item,i) => { const d=Math.abs(item.offsetLeft+item.offsetWidth/2-center); if (d < dist) { dist=d; best=i; } }); setActive(best); return; }
      const rect=root.getBoundingClientRect(); if (rect.bottom < 0 || rect.top > innerHeight) return;
      const position=progressFromRect(rect.top,root.offsetHeight,stage.offsetHeight)*9,spacing=Math.max(220,Math.min(360,stage.clientWidth*.24));
      items.forEach((el,i) => { const c=cardTransform(i-position,spacing); writer.style(el,'transform',c.transform); writer.style(el,'opacity',c.opacity); writer.style(el,'filter',c.filter); writer.style(el,'z-index',c.z); }); setActive(Math.round(position));
    }
    const update=() => { if (!raf) raf=requestAnimationFrame(render); };
    function go(target: number,focus=false) {
      target=Math.max(0,Math.min(9,target));
      if (focus) cards[target].focus({ preventScroll: true });
      if (reduced.matches) { track.scrollTo({ left: items[target].offsetLeft-(track.clientWidth-items[target].offsetWidth)/2, behavior: 'instant' }); setActive(target); }
      else { pending=target; clearTimeout(timer); timer=window.setTimeout(() => { pending=null; },1200); window.scrollTo({ top: root.getBoundingClientRect().top+scrollY+target/9*(root.offsetHeight-stage.offsetHeight), behavior: 'smooth' }); }
      writer.text(announcer,`Card ${target+1} of 10: ${categories[target]}`);
    }
    const prev=() => go((pending ?? active)-1),next=() => go((pending ?? active)+1);
    const key=(e: KeyboardEvent) => { const target={ ArrowRight: (pending ?? active)+1, ArrowLeft: (pending ?? active)-1, Home: 0, End: 9 }[e.key]; if (target !== undefined) { e.preventDefault(); go(target,true); } };
    const mode=() => { writer.reset(); writer=new DomWriter(); update(); };
    root.querySelector('[data-prev]')!.addEventListener('click',prev); root.querySelector('[data-next]')!.addEventListener('click',next); track.addEventListener('keydown',key); track.addEventListener('scroll',update,{ passive: true }); window.addEventListener('scroll',update,{ passive: true }); window.addEventListener('resize',update); reduced.addEventListener('change',mode); update();
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); writer.reset(); root.querySelector('[data-prev]')!.removeEventListener('click',prev); root.querySelector('[data-next]')!.removeEventListener('click',next); track.removeEventListener('keydown',key); track.removeEventListener('scroll',update); window.removeEventListener('scroll',update); window.removeEventListener('resize',update); reduced.removeEventListener('change',mode); };
  },[]);
  return <section id="categories" ref={ref} data-active-index="0" aria-labelledby="categories-title" aria-roledescription="carousel"><div className="carousel-stage"><img className="carousel-bg" src="/images/carousel-bg.webp" alt="" loading="lazy"/><div className="carousel-heading"><p className="eyebrow">02 — A PLACE FOR EVERYTHING</p><h2>Every cost,<br/><span className="serif">in its place.</span></h2><p>From the first seed to the final harvest.<br/>Your season, organised without the effort.</p></div><ul className="carousel-track" role="list">{categories.map((name,i) => <li className="carousel-item" key={name}><Tilt requireActive><div className="glass-card" role="group" aria-roledescription="slide" aria-label={`${i+1} of 10: ${name}`} tabIndex={i === 0 ? 0 : -1} data-active={i === 0 ? 'true' : 'false'} aria-current={i === 0 ? 'true' : undefined}><div className="glass-top"><span>YOUR SEASON / {String(i+1).padStart(2,'0')}</span><span>↗</span></div><svg viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d={i < 8 ? 'M40 65V30m0 15C18 46 14 27 15 18c18-1 25 10 25 27Zm0-8C60 38 67 20 65 12c-18 0-25 10-25 25Z' : 'M15 20h50v45H15zm0 15h50M30 20v45M50 20v45'} stroke="currentColor" strokeWidth="2"/></svg><p className="eyebrow">{i < 8 ? 'THE LITTLE COSTS THAT ADD UP' : 'YOUR CROP. YOUR SEASON.'}</p><h3>{name}</h3><p>{i < 8 ? 'One bill. Filed where it belongs.' : 'Every bill, in one clear picture.'}</p><div className="glass-bottom"><span>{i === 0 ? 'Sample: ₹4,100 · Wheat · Rabi' : i === 1 ? 'Sample: ₹2,680 · Wheat · Rabi' : i < 8 ? 'Illustrative category' : 'Sample folder · 6 bills'}</span><span>✦</span></div></div></Tilt></li>)}</ul><div className="carousel-controls"><button data-prev aria-label="Previous category">←</button><span className="carousel-counter">01 / 10</span><button data-next aria-label="Next category">→</button></div><p role="status" className="sr-only"/></div></section>;
}
