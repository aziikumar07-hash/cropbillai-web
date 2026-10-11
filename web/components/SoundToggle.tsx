'use client';
import { useEffect, useRef, useState } from 'react';
import { getAssetFlags } from '../lib/assetFlags';
export default function SoundToggle() {
  const [state,setState]=useState<'unavailable' | 'off' | 'on'>('unavailable'),audio=useRef<HTMLAudioElement | null>(null),raf=useRef(0),on=useRef(false);
  useEffect(() => {
    let live=true;
    const restore=() => { if (live && audio.current === null) void toggle(true); };
    getAssetFlags().then(flags => {
      if (!live || !flags.ambientAudio) return;
      setState('off');
      try { if (localStorage.getItem('cropbill:ambient') === 'on') { window.addEventListener('pointerdown',restore,{ once:true }); window.addEventListener('keydown',restore,{ once:true }); } } catch {}
    });
    // A saved ON preference is restored only after a gesture, never autoplay.
    const visibility=() => { if (document.hidden) audio.current?.pause(); else if (on.current) void audio.current?.play().catch(() => { on.current=false; setState('off'); }); };
    document.addEventListener('visibilitychange',visibility);
    return () => { live=false; cancelAnimationFrame(raf.current); audio.current?.pause(); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('pointerdown',restore); window.removeEventListener('keydown',restore); };
  },[]);
  function store(value: string) { try { localStorage.setItem('cropbill:ambient',value); } catch {} }
  function fade(target: number,done?: () => void) {
    cancelAnimationFrame(raf.current); const element=audio.current!,start=performance.now(),volume=element.volume,duration=target ? 800 : 500;
    const tick=(time: number) => { const progress=Math.min(1,(time-start)/duration); element.volume=Math.max(0,Math.min(1,volume+(target-volume)*progress)); if (progress < 1) raf.current=requestAnimationFrame(tick); else done?.(); }; raf.current=requestAnimationFrame(tick);
  }
  async function toggle(force=false) {
    if (state === 'unavailable' && !force) return;
    if (on.current) { on.current=false; setState('off'); store('off'); fade(0,() => audio.current?.pause()); return; }
    if (!audio.current) { const a=new Audio('/audio/ambient.mp3'); a.loop=true; a.volume=0; audio.current=a; a.addEventListener('error',() => { on.current=false; setState('unavailable'); store('off'); }); }
    on.current=true; setState('on'); store('on');
    try { await audio.current.play(); if (on.current) fade(.25); } catch (e) { on.current=false; setState(e instanceof DOMException && e.name === 'NotAllowedError' ? 'off' : 'unavailable'); store('off'); }
  }
  return <button className="sound-toggle" type="button" onClick={() => void toggle()} aria-pressed={state === 'on'} aria-disabled={state === 'unavailable' || undefined}><span aria-hidden="true">{state === 'on' ? '♫' : '♪'}</span><span>{state === 'unavailable' ? 'Sound unavailable' : 'Ambient sound'}</span></button>;
}
