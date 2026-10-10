(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const reveal = document.querySelector('.hero-reveal');
  let pointerFrame = 0;
  let pointerInside = false;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  function followPointer() {
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    reveal.style.setProperty('--mx', currentX + 'px');
    reveal.style.setProperty('--my', currentY + 'px');
    pointerFrame = 0;
    if (pointerInside && (Math.abs(targetX-currentX) > .5 || Math.abs(targetY-currentY) > .5)) pointerFrame = requestAnimationFrame(followPointer);
  }
  hero.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches || document.hidden) return;
    const rect = hero.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    targetY = event.clientY - rect.top;
    if (!pointerInside) { currentX = targetX; currentY = targetY; }
    pointerInside = true;
    hero.classList.add('pointer-inside');
    if (!pointerFrame) pointerFrame = requestAnimationFrame(followPointer);
  });
  function leavePointer() {
    pointerInside = false;
    hero.classList.remove('pointer-inside');
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
  }
  hero.addEventListener('pointerleave', leavePointer);

  /* Legacy single-scene implementation retained only as source history.
  const story = document.querySelector('.story');
  const stage = document.querySelector('.story-stage');
  const canvas = document.getElementById('farm-canvas');
  const context = canvas.getContext('2d');
  const chapters = [...document.querySelectorAll('.chapter')];
  const cache = new Map();
  const pending = new Set();
  const failed = new Set();
  let frame = 0, drawnFrame = -1, activeChapter = -1, scheduled = 0;
  let visible = false;
  let progress = 0;
  const frameCount = 241;
  function draw() {
    let image = cache.get(frame);
    let imageFrame = frame;
    if (!image) {
      let distance = Infinity;
      for (const [index, candidate] of cache) {
        if (Math.abs(index-frame) < distance) { image = candidate; imageFrame = index; distance = Math.abs(index-frame); }
      }
    }
    if (!image || drawnFrame === imageFrame) return;
    const ratio = Math.max(canvas.width/image.naturalWidth, canvas.height/image.naturalHeight);
    const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
    context.drawImage(image, (canvas.width-w)/2, (canvas.height-h)/2, w, h);
    drawnFrame = imageFrame;
  }
  function loadNearby() {
    if (!visible || reducedMotion.matches || document.hidden) return;
    // Prioritize the exact scroll frame, then its immediate neighbors.
    const order = [frame];
    for (let delta = 1; delta <= 10; delta++) order.push(frame+delta,frame-delta);
    for (const index of order) {
      if (pending.size >= 4) break;
      if (index < 0 || index >= frameCount || cache.has(index) || pending.has(index) || failed.has(index)) continue;
      pending.add(index);
      const image = new Image();
      image.onload = () => {
        pending.delete(index);
        cache.set(index,image);
        if (cache.size > 26) {
          const distant = [...cache.keys()].sort((a,b) => Math.abs(b-frame)-Math.abs(a-frame));
          while (cache.size > 26) cache.delete(distant.shift());
        }
        if (visible && !reducedMotion.matches && !document.hidden) { draw(); loadNearby(); }
      };
      image.onerror = () => { pending.delete(index); failed.add(index); loadNearby(); };
      image.src = `assets/frames/frame_${String(index+1).padStart(4,'0')}.jpg`;
    }
    draw();
  }
  function update() {
    scheduled = 0;
    if (document.hidden) return;
    if (reducedMotion.matches) {
      chapters.forEach(chapter => { chapter.removeAttribute('aria-hidden'); chapter.inert = false; });
      return;
    }
    const rect = story.getBoundingClientRect();
    progress = Math.max(0, Math.min(1, -rect.top / Math.max(1,story.offsetHeight-stage.offsetHeight)));
    // Reserve a little breathing room on the final frame.
    frame = Math.round(Math.min(1,progress/.92)*(frameCount-1));
    const chapterIndex = Math.min(3,Math.floor(progress*4));
    if (chapterIndex !== activeChapter) {
      activeChapter = chapterIndex;
      chapters.forEach((chapter,index) => {
        chapter.classList.toggle('active',index === chapterIndex);
        chapter.setAttribute('aria-hidden',String(index !== chapterIndex));
        chapter.inert = index !== chapterIndex;
      });
      document.getElementById('chapter-count').textContent = `0${chapterIndex+1} — 04`;
    }
    stage.style.setProperty('--progress',progress);
    loadNearby();
  }
  function scheduleUpdate() { if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(update); }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1,1.5);
    canvas.width = Math.round(stage.clientWidth*dpr);
    canvas.height = Math.round(stage.clientHeight*dpr);
    drawnFrame = -1;
    scheduleUpdate();
  }
  window.addEventListener('scroll',scheduleUpdate,{passive:true});
  window.addEventListener('resize',resize,{passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) scheduleUpdate();
    },{rootMargin:'300px'}).observe(story);
  } else { visible = true; }
  reducedMotion.addEventListener('change',() => { leavePointer(); activeChapter = -1; scheduleUpdate(); });
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) { leavePointer(); cancelAnimationFrame(scheduled); scheduled = 0; }
    else scheduleUpdate();
  });
  resize();
  */

  const crops = {
    wheat: {name:'Wheat',season:'RABI',sales:80800,costs:[12000,9800,6500,4300]},
    rice: {name:'Rice',season:'KHARIF',sales:105000,costs:[18500,14200,8200,6100]},
    cotton: {name:'Cotton',season:'KHARIF',sales:92000,costs:[21000,12800,9400,5800]}
  };
  const currency = value => '₹' + new Intl.NumberFormat('en-IN').format(value);
  function selectCrop(key) {
    const data = crops[key];
    const expenses = data.costs.reduce((sum,value) => sum+value,0);
    document.getElementById('crop-name').textContent = data.name;
    document.getElementById('crop-season').textContent = data.season + ' · SAMPLE SEASON';
    document.getElementById('profit-value').textContent = currency(data.sales-expenses);
    document.getElementById('sales-value').textContent = currency(data.sales);
    document.getElementById('expenses-value').textContent = currency(expenses);
    const bars = document.getElementById('cost-bars');
    bars.replaceChildren();
    data.costs.forEach((value,index) => {
      const row = document.createElement('div');
      row.className = 'cost-row';
      const label = document.createElement('span');
      label.textContent = ['Labour','Fertilizer','Seeds','Diesel'][index];
      const track = document.createElement('div');
      track.className = 'bar-track';
      const bar = document.createElement('i');
      bar.style.width = (value/Math.max(...data.costs)*100) + '%';
      track.append(bar);
      const amount = document.createElement('b');
      amount.textContent = currency(value);
      row.append(label,track,amount);
      bars.append(row);
    });
    document.querySelectorAll('[data-crop]').forEach(button => {
      const selected = button.dataset.crop === key;
      button.classList.toggle('selected',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
  }
  document.querySelectorAll('[data-crop]').forEach(button => button.addEventListener('click',() => selectCrop(button.dataset.crop)));
  selectCrop('wheat');

  document.getElementById('year').textContent = new Date().getFullYear();
  const form = document.querySelector('form[name="waitlist"]');
  const contact = document.getElementById('contact');
  const status = document.getElementById('form-status');
  const submit = form.querySelector('button');
  function setStatus(message,type='') { status.textContent = message; status.className = type; }
  contact.addEventListener('input',() => contact.removeAttribute('aria-invalid'));
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const value = contact.value.trim();
    const digits = value.replace(/\D/g,'');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) || (/^\+?[\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15);
    if (!valid) { contact.setAttribute('aria-invalid','true'); setStatus('Enter a valid email or a phone number with 10–15 digits.','error'); contact.focus(); return; }
    if (location.protocol === 'file:' || ['localhost','127.0.0.1'].includes(location.hostname)) {
      setStatus('This is a local preview. Waitlist signup needs a deployed Netlify Forms endpoint; nothing has been submitted.','error'); return;
    }
    submit.disabled = true;
    contact.value = value;
    setStatus('Submitting your details…');
    try {
      const response = await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form)).toString()});
      if (!response.ok) throw new Error('Submission failed');
      form.reset();
      setStatus("You're on the list. We'll keep you updated.",'success');
    } catch { setStatus('We could not submit your details. Please try again later.','error'); }
    finally { submit.disabled = false; }
  });
})();
