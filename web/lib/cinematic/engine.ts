import { clamp, smooth, filmProgress, exitProgress, framePosition, chapterAt, chapterOpacity, chapterAnchor, progressFromRect, wordReveal, fmtOpacity, fmtPx, fmtRadius } from './timeline';
import { DomWriter } from './domWriter';
import { createLoader, buildRequests, parseKey, frameKey } from './loader';
import { frameUrl, pickVariant } from './manifest';
import type { Manifest } from './manifest';
import { cinematicBus } from './bus';

export class CinematicUnavailableError extends Error {}
export class CinematicEngine {
  root: HTMLElement; stage: HTMLElement; canvas: HTMLCanvasElement; context: CanvasRenderingContext2D;
  writer = new DomWriter(); manifest: Manifest; reduced = matchMedia('(prefers-reduced-motion: reduce)');
  loader: ReturnType<typeof createLoader<HTMLImageElement>>;
  target = 0; displayed = 0; raf = 0; last = 0; inView = true; motion = false; destroyed = false;
  queueMode: 'initial' | 'full' = 'initial'; firstTimer = 0; variant: 'mobile' | 'desktop' = 'desktop'; renderKey = '';
  dimensions = ''; programmaticFocus = false; chapterEls: HTMLElement[]; cleanup: (() => void)[] = [];
  scrollRaf = 0;
  saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  constructor(root: HTMLElement, manifest: Manifest) {
    this.root = root; this.manifest = manifest;
    this.stage = this.el('.stage'); this.canvas = root.querySelector('canvas')!;
    const ctx = this.canvas.getContext('2d'); if (!ctx) throw new CinematicUnavailableError(); this.context = ctx;
    this.chapterEls = Array.from(root.querySelectorAll<HTMLElement>('.chapter'));
    this.loader = createLoader({
      createImage: () => new Image(), url: key => { const [s,f] = parseKey(key); return frameUrl(this.manifest,this.variant,s,f); },
      canLoad: () => this.motion && !document.hidden && this.inView,
      current: () => framePosition(filmProgress(this.displayed),this.manifest.scenes.map(s => s.frames)),
      onLoaded: () => { this.renderKey = ''; this.wake(); },
      setTimeout: (fn,ms) => window.setTimeout(fn,ms), clearTimeout: id => window.clearTimeout(id),
    }, { concurrency: this.saveData ? 3 : 5, cacheSize: pickVariant(innerWidth,devicePixelRatio || 1,this.saveData,manifest.variants) === 'mobile' ? 60 : 44, retryDelayMs: 1500 });
  }
  el(selector: string) { return this.root.querySelector<HTMLElement>(selector)!; }
  start() { this.reduced.addEventListener('change',this.modeChange); if (!this.reduced.matches) this.enterMotion(); }
  modeChange = () => this.reduced.matches ? this.leaveMotion() : this.enterMotion();
  listen(target: EventTarget, event: string, fn: EventListener) {
    target.addEventListener(event,fn,{ passive: event === 'scroll' }); this.cleanup.push(() => target.removeEventListener(event,fn));
  }
  enterMotion() {
    if (this.motion || this.destroyed) return;
    this.motion = true;
    this.listen(window,'scroll',this.updateTarget); this.listen(window,'resize',this.resize);
    this.listen(document,'visibilitychange',this.visibility); this.listen(window,'pageshow',this.restore);
    const cancelNavigation=() => { cancelAnimationFrame(this.scrollRaf); this.scrollRaf=0; };
    this.listen(window,'wheel',cancelNavigation); this.listen(window,'touchstart',cancelNavigation); this.listen(window,'keydown',cancelNavigation);
    this.listen(this.el('.hero-layer'),'focusin',() => { if (!this.programmaticFocus && this.displayed > .06) window.scrollTo({ top: this.root.getBoundingClientRect().top+scrollY, behavior: 'instant' }); });
    this.chapterEls.forEach((el,i) => this.listen(el,'focusin',() => { if (!this.programmaticFocus && chapterOpacity(i,this.displayed,this.manifest.beats) < .5) this.scrollToChapter(i,false,'instant'); }));
    this.dimensions = ''; this.resize(); this.updateTarget(); this.displayed = this.target;
    this.queueMode = this.target > 0 ? 'full' : 'initial';
    if (this.queueMode === 'initial') this.scheduleFirstFrame();
    this.visuals(this.displayed); cinematicBus.register(this);
  }
  scheduleFirstFrame() {
    clearTimeout(this.firstTimer);
    const schedule = () => { this.firstTimer = window.setTimeout(() => { this.firstTimer = 0; if (this.motion && this.queueMode === 'initial') this.loader.setRequests([frameKey(0,0)]); },300); };
    if (document.readyState === 'complete') schedule(); else this.listen(window,'load',schedule);
  }
  leaveMotion() {
    this.motion = false; this.cleanup.splice(0).forEach(fn => fn()); cancelAnimationFrame(this.raf); this.raf=0; this.last=0;
    clearTimeout(this.firstTimer); cancelAnimationFrame(this.scrollRaf); this.scrollRaf=0; this.firstTimer=0; this.queueMode='initial'; this.loader.reset(); this.writer.reset(); this.renderKey='';
    this.context.clearRect(0,0,this.canvas.width,this.canvas.height); cinematicBus.unregister(this);
  }
  destroy() { if (this.destroyed) return; this.leaveMotion(); this.destroyed=true; this.reduced.removeEventListener('change',this.modeChange); this.loader.destroy(); }
  updateTarget = () => {
    if (!this.motion) return;
    const rect = this.root.getBoundingClientRect(); this.inView = rect.bottom > 0 && rect.top < innerHeight;
    this.target = progressFromRect(rect.top,this.root.offsetHeight,this.stage.offsetHeight);
    if (this.target > 0 && this.queueMode === 'initial') { clearTimeout(this.firstTimer); this.queueMode='full'; }
    this.writer.attr(this.root,'data-target',this.target.toFixed(3)); this.writer.attr(this.root,'data-settled',String(this.target === this.displayed));
    this.loader.pump(); this.wake();
  };
  resize = () => {
    if (!this.motion) return;
    const w=this.stage.clientWidth,h=this.stage.clientHeight,dpr=Math.min(devicePixelRatio || 1,1.25);
    const next = pickVariant(w,devicePixelRatio || 1,this.saveData,this.manifest.variants);
    if (next !== this.variant) { this.variant=next; this.loader.reset(); if (this.queueMode === 'initial') this.scheduleFirstFrame(); }
    this.writer.attr(this.root,'data-variant',this.variant);
    const key=`${w}:${h}:${dpr}`;
    if (key !== this.dimensions) { this.dimensions=key; this.canvas.width=Math.round(w*dpr); this.canvas.height=Math.round(h*dpr); this.renderKey=''; }
    this.updateTarget();
  };
  visibility = () => { if (document.hidden) { cancelAnimationFrame(this.raf); this.raf=0; this.last=0; } else { this.updateTarget(); this.loader.pump(); } };
  restore = () => { this.updateTarget(); this.displayed=this.target; this.visuals(this.displayed); };
  wake() { if (!this.raf && !document.hidden && this.motion) this.raf=requestAnimationFrame(this.tick); }
  tick = (time: number) => {
    this.raf=0; if (!this.motion || document.hidden) return;
    const dt=Math.min(64,time-(this.last || time-16)); this.last=time;
    this.displayed+=(this.target-this.displayed)*(1-Math.exp(-dt/75));
    if (Math.abs(this.target-this.displayed) < .00015) this.displayed=this.target;
    this.visuals(this.displayed); this.writer.attr(this.root,'data-settled',String(this.target === this.displayed));
    if (this.target !== this.displayed) this.wake(); else this.last=0;
  };
  visuals(p: number) {
    const intro=clamp(p/.12),open=smooth(intro),exit=exitProgress(p), radius=Math.hypot(this.stage.clientWidth*.5,this.stage.clientHeight*.65)*open;
    const style=(selector: string,prop: string,value: string) => this.writer.style(this.el(selector),prop,value);
    this.writer.toggle(this.stage,'exiting',exit > 0);
    style('.film','clip-path',intro >= 1 ? 'none' : `circle(${fmtRadius(radius)} at 50% 65%)`);
    style('.film','transform',`translateY(${(-exit*4).toFixed(3)}vh) scale(${(1-exit*.24).toFixed(4)})`);
    style('.film','border-radius',fmtPx(exit*34)); style('.film','box-shadow',exit ? `0 25px 80px rgba(51,70,35,${fmtOpacity(exit*.22)})` : 'none');
    const mask=intro >= 1 ? 'none' : `radial-gradient(circle at 50% 65%,transparent ${fmtRadius(Math.max(0,radius-2))},#000 ${fmtRadius(radius)})`;
    style('.hero-bg','mask-image',mask); style('.hero-bg','-webkit-mask-image',mask); style('.hero-bg','opacity',intro >= 1 ? '0' : '1');
    style('.hero-layer','background-color',intro === 0 ? '#000' : 'transparent'); style('.hero-layer','pointer-events',intro > .8 ? 'none' : 'auto');
    style('.hero-content','opacity',fmtOpacity(1-smooth((intro-.15)/.7))); style('.hero-content','transform',`translateY(${fmtPx(-open*65)}) scale(${(1+open*.025).toFixed(4)})`);
    style('.hero-bottom','opacity',fmtOpacity(1-smooth(intro/.7))); style('.site-header','opacity',fmtOpacity(1-smooth((p-.06)/.08)));
    style('.portal-label','opacity',fmtOpacity(Math.sin(intro*Math.PI)*.8*(p < .12 ? 1 : 0))); style('.portal-label','letter-spacing',fmtPx(3+open*8));
    const chrome=smooth((p-.1)/.04)*(1-exit);
    for (const selector of ['.story-top','.story-bottom']) style(selector,'opacity',fmtOpacity(chrome));
    style('.film-caption','opacity',fmtOpacity(chrome*.7)); style('.story-shade','opacity',fmtOpacity(chrome*.65));
    const f=filmProgress(p),pos=framePosition(f,this.manifest.scenes.map(s => s.frames)),chapter=chapterAt(f,this.manifest.beats);
    style('.story-progress','--progress',f.toFixed(4)); this.writer.text(this.el('.chapter-count'),`0${chapter.active+1} — 04`); this.writer.attr(this.root,'data-chapter',String(chapter.active));
    this.chapterEls.forEach((el,i) => {
      const opacity=chapterOpacity(i,p,this.manifest.beats); this.writer.style(el,'opacity',fmtOpacity(opacity)); this.writer.toggle(el,'is-active',opacity > .1);
      this.writer.style(el,'transform',`translateY(${fmtPx((1-smooth((chapter.local-.08)/.16))*24-exit*30)})`);
      el.querySelectorAll<HTMLElement>('.word-mask > span').forEach((word,n) => {
        const reveal=i === chapter.active ? wordReveal(chapter.local,n) : 0;
        this.writer.style(word,'transform',`translateY(${((1-reveal)*105).toFixed(1)}%)`); this.writer.style(word,'opacity',fmtOpacity(reveal));
      });
    });
    if (this.queueMode === 'full') this.loader.setRequests(buildRequests(pos,this.manifest.scenes.map(s => s.frames)));
    const img=this.loader.nearest(pos.scene,pos.index),prev=pos.scene > 0 && pos.local < .12 ? this.loader.nearest(pos.scene-1,this.manifest.scenes[pos.scene-1].frames-1) : undefined;
    const key=`${pos.scene}:${pos.index}:${pos.transition.toFixed(3)}:${img?.src}:${prev?.src}`;
    if (key !== this.renderKey) {
      if (prev) { this.cover(prev,1+pos.transition*.22); if (img) this.cover(img,1+(1-pos.transition)*.08,Math.max(1,Math.hypot(this.canvas.width,this.canvas.height)*pos.transition)); }
      else if (img) this.cover(img);
      this.renderKey=key;
      if (img && img === this.loader.get(frameKey(pos.scene,pos.index))) this.writer.attr(this.canvas,'data-drawn',`${pos.scene}:${pos.index}`);
    }
  }
  cover(img: HTMLImageElement, scale=1, clip=0) {
    const ctx=this.context,w=this.canvas.width,h=this.canvas.height; ctx.save();
    if (clip) { ctx.beginPath(); ctx.arc(w/2,h/2,clip,0,Math.PI*2); ctx.clip(); }
    const ratio=Math.max(w/img.naturalWidth,h/img.naturalHeight)*scale,iw=img.naturalWidth*ratio,ih=img.naturalHeight*ratio;
    ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih); ctx.restore();
  }
  scrollToChapter(i: number, focus: boolean, behavior: ScrollBehavior='smooth') {
    if (focus) { this.programmaticFocus=true; try { this.chapterEls[i].focus({ preventScroll: true }); } finally { this.programmaticFocus=false; } }
    const y=this.root.getBoundingClientRect().top+scrollY+chapterAnchor(i,this.manifest.beats)*Math.max(1,this.root.offsetHeight-this.stage.offsetHeight);
    cancelAnimationFrame(this.scrollRaf);
    if (behavior !== 'smooth') { window.scrollTo({ top:y,behavior }); return; }
    // Only this explicit chapter navigation is animated. No wheel interception,
    // scroll replacement or double easing of the user's normal page scrolling.
    const from=scrollY,start=performance.now();
    const step=(time: number) => { const t=clamp((time-start)/650); window.scrollTo({ top:from+(y-from)*smooth(t),behavior:'instant' }); this.scrollRaf=t < 1 ? requestAnimationFrame(step) : 0; };
    this.scrollRaf=requestAnimationFrame(step);
  }
}
