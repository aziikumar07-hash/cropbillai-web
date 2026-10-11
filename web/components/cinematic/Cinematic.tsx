'use client';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Brand } from '../Brand';
import { chapters } from '../../lib/content';
import { parseManifest } from '../../lib/cinematic/manifest';
import { CinematicEngine, CinematicUnavailableError } from '../../lib/cinematic/engine';
import HeroSpotlight from './HeroSpotlight';
import ChapterLink from './ChapterLink';
export default function Cinematic() {
  const ref=useRef<HTMLElement>(null),[unavailable,setUnavailable]=useState(false);
  useEffect(() => {
    let engine: CinematicEngine | undefined,live=true;
    fetch('/cinematic/manifest.json',{ cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('manifest unavailable'); return r.json(); }).then(raw => {
      if (!live) return;
      try { engine=new CinematicEngine(ref.current!,parseManifest(raw)); engine.start(); }
      catch (e) { if (e instanceof CinematicUnavailableError) setUnavailable(true); else { engine?.destroy(); setTimeout(() => { throw e; },0); } }
    }).catch(e => { if (live) { console.warn('[cinematic] using readable static story',e); setUnavailable(true); } });
    return () => { live=false; engine?.destroy(); };
  },[]);
  return <section id="story" className="cinematic" ref={ref} aria-label="The CropBillAI story" data-chapter="0" data-variant="" data-target="0.000" data-settled="false" data-cinematic={unavailable ? 'unavailable' : undefined}>
    <div className="stage"><div className="film"><canvas aria-hidden="true" data-drawn=""/></div>
      <div className="hero-layer"><HeroSpotlight/><header className="site-header"><Brand/><nav aria-label="Main"><ChapterLink>The story</ChapterLink><a href="#dashboard">The preview</a></nav><a className="nav-cta" href="#waitlist">Get early access <span>↗</span></a></header>
        <div className="hero-content"><p className="eyebrow"><span className="live-dot"/> A NEW SEASON OF CLARITY</p><h1>Grow more.<br/><span className="serif">Guess less.</span></h1><p className="hero-sub">Your farm has a story.<br/>Let the numbers tell it.</p><p className="hero-detail">CropBillAI is an app we’re building for small farmers. Photograph a farm bill, and it’s filed under the right crop and season — so you can see the profit on every crop.</p><a className="button button-gold" href="#waitlist">Join the waitlist <span>↗</span></a><p className="hero-note">PRE-LAUNCH · MADE FOR INDIAN FARMERS</p></div>
        <div className="hero-bottom"><ChapterLink className="scroll-cue"><span className="scroll-line"/>Scroll to see what grows <span>↓</span></ChapterLink><span className="fine-only">MOVE YOUR CURSOR TO BRING IN THE DAY</span><span className="hero-coordinate">ROOTED IN THE REAL WORLD</span></div>
      </div>
      <div className="story-shade" aria-hidden="true"/><div className="story-top" aria-hidden="true"><span>CROP TO CLARITY</span><span>A SIMPLER WAY FORWARD</span></div>
      <ol className="chapters" aria-label="Story chapters">{chapters.map((chapter,i) => <li key={chapter.label}><article id={`chapter-${i+1}`} className="chapter" tabIndex={-1} aria-labelledby={`chapter-${i+1}-title`} style={{ '--still': `url(/images/still-${i}.webp)` } as CSSProperties}><p className="eyebrow">0{i+1} / {chapter.label}</p><h2 id={`chapter-${i+1}-title`}><span className="sr-only">{chapter.title}</span><span aria-hidden="true">{chapter.title.split(' ').map((word,n) => <span className="word-mask" key={n}><span>{word}</span>{' '}</span>)}</span></h2><p>{chapter.body}</p>{i === 3 && <a className="button button-gold" href="#dashboard">See the sample dashboard ↗</a>}</article></li>)}</ol>
      <div className="portal-label" aria-hidden="true">A CLEARER PERSPECTIVE</div><p className="film-caption">Creative visualisation · not live farm data</p><div className="story-bottom" aria-hidden="true"><span className="chapter-count">01 — 04</span><div className="story-progress"><i/></div><span>SCROLL TO EXPLORE ↓</span></div>
    </div>
  </section>;
}
