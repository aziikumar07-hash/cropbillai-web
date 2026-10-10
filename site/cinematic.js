(() => {
  'use strict';
  const story = document.querySelector('.cinematic');
  const stage = story.querySelector('.story-stage');
  const film = story.querySelector('.film-window');
  const canvas = document.getElementById('farm-canvas');
  const context = canvas.getContext('2d');
  const hero = story.querySelector('.hero');
  const heroContent = story.querySelector('.hero-content');
  const chapters = [...story.querySelectorAll('.chapter')];
  const nav = document.querySelector('.nav');
  const portal = story.querySelector('.portal-label');
  const shade = story.querySelector('.story-shade');
  const filmCaption = story.querySelector('.film-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (x,a=0,b=1) => Math.max(a,Math.min(b,x));
  const smooth = x => { x=clamp(x); return x*x*(3-2*x); };
  const cache = new Map(), pending = new Set(), failed = new Set();
  const sceneFrames = 90;
  let target=0, displayed=0, raf=0, last=0, inView=true, renderKey='';
  let requests=[];
  // Mask individual words while retaining the semantic heading and serif spans.
  chapters.forEach(chapter => {
    const heading = chapter.querySelector('h2');
    const walker = document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment=document.createDocumentFragment();
      node.textContent.split(/(\s+)/).filter(Boolean).forEach(text => {
        if (/^\s+$/.test(text)) fragment.append(document.createTextNode(text));
        else {
          const mask=document.createElement('span'), word=document.createElement('span');
          mask.className='word-mask'; word.textContent=text; mask.append(word); fragment.append(mask);
        }
      });
      node.replaceWith(fragment);
    });
  });
  function cover(image,scale=1,alpha=1,clip=0) {
    context.save();
    if(clip>0){context.beginPath();context.arc(canvas.width/2,canvas.height/2,clip,0,Math.PI*2);context.clip();}
    context.globalAlpha=alpha;
    const ratio=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight)*scale;
    const w=image.naturalWidth*ratio,h=image.naturalHeight*ratio;
    context.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
    context.restore();
  }
  function nearest(scene,index) {
    const exact=cache.get(`${scene}:${index}`);
    if(exact)return exact;
    let found=null,distance=Infinity;
    for(const [key,image] of cache){const [s,f]=key.split(':').map(Number);if(s===scene&&Math.abs(f-index)<distance){found=image;distance=Math.abs(f-index);}}
    return found;
  }
  function queue(scene,index){
    for(const delta of [0,1,-1,2,-2,3,-3,5,-5,8,-8]){
      const f=clamp(index+delta,0,89),key=`${scene}:${f}`;
      if(!requests.includes(key))requests.push(key);
    }
  }
  function pump(){
    if(document.hidden || reduced.matches || !inView)return;
    while(pending.size<5&&requests.length){
      const key=requests.shift();
      if(cache.has(key)||pending.has(key)||failed.has(key))continue;
      pending.add(key);
      const [s,f]=key.split(':').map(Number),image=new Image();
      image.onload=()=>{
        pending.delete(key);cache.set(key,image);
        while(cache.size>44){const victim=[...cache.keys()].find(k=>!requests.includes(k)&&k!==key);cache.delete(victim||cache.keys().next().value);}
        renderKey=''; wake();pump();
      };
      image.onerror=()=>{pending.delete(key);failed.add(key);pump();};
      image.src=`assets/cinematic/${s}/${String(f).padStart(3,'0')}.webp`;
    }
  }
  function visuals(p){
    if(reduced.matches){
      chapters.forEach(c=>{c.inert=false;c.removeAttribute('aria-hidden');});
      hero.inert=false;hero.removeAttribute('aria-hidden');hero.style.visibility='visible';nav.inert=false;nav.style.opacity='1';nav.classList.remove('is-film');return;
    }
    const intro=clamp(p/.12),open=smooth(intro);
    const radius=Math.hypot(stage.clientWidth*.5,stage.clientHeight*.65)*open;
    const exit=smooth((p-.91)/.09);
    stage.classList.toggle('exiting',exit>0);
    film.style.clipPath=intro>=1?'none':`circle(${radius}px at 50% 65%)`;
    film.style.transform=`translateY(${-exit*4}vh) scale(${1-exit*.24})`;
    film.style.borderRadius=`${exit*34}px`;
    film.style.boxShadow=exit?`0 25px 80px rgba(51,70,35,${exit*.22})`:'none';
    // The opening is physically cut away by the same circle as the footage.
    hero.style.background=intro>0?'transparent':'#000';
    const openingBackground=hero.querySelector('.hero-image');
    openingBackground.style.background='#000';
    const mask=`radial-gradient(circle at 50% 65%,transparent ${Math.max(0,radius-2)}px,#000 ${radius}px)`;
    openingBackground.style.maskImage=mask;
    openingBackground.style.webkitMaskImage=mask;
    hero.style.opacity='1';
    heroContent.style.opacity=String(1-smooth((intro-.15)/.7));
    hero.querySelector('.hero-bottom').style.opacity=String(1-smooth(intro/.7));
    hero.style.visibility=intro>=1?'hidden':'visible';
    heroContent.style.transform=`translateY(${-open*65}px) scale(${1+open*.025})`;
    heroContent.style.letterSpacing=`${open*.5}px`;
    hero.inert=intro>.8;hero.setAttribute('aria-hidden',String(intro>.8));
    hero.style.pointerEvents=intro>.8?'none':'auto';
    portal.style.opacity=String(Math.sin(intro*Math.PI)*.8*(p<.12?1:0));
    portal.style.letterSpacing=`${3+open*8}px`;
    const navOpacity=1-smooth((p-.06)/.08);
    nav.style.opacity=String(navOpacity);
    nav.inert=navOpacity<.05;
    nav.classList.toggle('is-film',p>0&&p<.15);
    const filmProgress=clamp((p-.12)/.75)*4;
    let scene=Math.min(3,Math.floor(filmProgress)),local=clamp(filmProgress-scene);
    if(p>=.87){scene=3;local=1;}
    const index=Math.round(local*89);
    const transition=scene>0 ? smooth(local/.12):0;
    requests=[];
    queue(scene,index);
    if(scene>0&&local<.12)queue(scene-1,89);
    if(local>.85&&scene<3)queue(scene+1,0);
    pump();
    const image=nearest(scene,index),previous=scene>0?nearest(scene-1,89):null;
    const key=`${scene}:${index}:${transition.toFixed(3)}:${image?.src}:${previous?.src}`;
    if(key!==renderKey){
      // Circular lens bridge between separately generated scenes, not a hard cut.
      if(previous&&scene>0&&local<.12){
        cover(previous,1+transition*.22);
        if(image)cover(image,1+(1-transition)*.08,1,Math.max(1,Math.hypot(canvas.width,canvas.height)*transition));
      }else if(image)cover(image);
      renderKey=key;
    }
    const chrome=smooth((p-.1)/.04)*(1-exit);
    story.querySelector('.story-top').style.opacity=String(chrome);
    story.querySelector('.story-bottom').style.opacity=String(chrome);
    filmCaption.style.opacity=String(chrome*.7);
    shade.style.opacity=String(chrome*.65);
    stage.style.setProperty('--progress',clamp((p-.12)/.75));
    document.getElementById('chapter-count').textContent=`0${scene+1} — 04`;
    chapters.forEach((chapter,i)=>{
      const enter=smooth((local-.08)/.16);
      const leave=scene===3?1:1-smooth((local-.76)/.16);
      const opacity=i===scene&&p>.12?enter*leave*(1-smooth(exit/.65)):0;
      chapter.classList.toggle('active',opacity>.01);
      chapter.style.opacity=String(opacity);
      chapter.style.transform=`translateY(${(1-enter)*24-exit*30}px)`;
      chapter.inert=opacity<.1;
      chapter.setAttribute('aria-hidden',String(opacity<.1));
      chapter.querySelectorAll('.word-mask>span').forEach((word,n)=>{
        const reveal=smooth((local-.1-n*.012)/.14);
        word.style.transform=`translateY(${(1-reveal)*105}%)`;
        word.style.opacity=String(reveal);
      });
    });
  }
  function tick(time){
    raf=0;
    if(document.hidden)return;
    const dt=Math.min(64,time-(last||time-16));last=time;
    displayed += (target-displayed)*(1-Math.exp(-dt/75));
    if(Math.abs(target-displayed)<.00015)displayed=target;
    visuals(displayed);
    if(Math.abs(target-displayed)>.00015)raf=requestAnimationFrame(tick);
  }
  function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(tick);}
  function updateTarget(){
    const rect=story.getBoundingClientRect();
    target=clamp(-rect.top/Math.max(1,story.offsetHeight-stage.offsetHeight));
    inView=rect.bottom>0&&rect.top<innerHeight;
    wake();
  }
  function resize(){
    const dpr=Math.min(devicePixelRatio||1,1.25);
    canvas.width=Math.round(stage.clientWidth*dpr);canvas.height=Math.round(stage.clientHeight*dpr);
    renderKey='';updateTarget();
  }
  window.addEventListener('scroll',updateTarget,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  reduced.addEventListener('change',()=>{displayed=target;resize();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else updateTarget();});
  resize();
})();
