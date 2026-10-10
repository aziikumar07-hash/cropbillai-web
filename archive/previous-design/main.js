// Waitlist form: validates input and submits to Netlify Forms without a page reload.
(function () {
  // === SPOTLIGHT CURSOR REVEAL ===
  const spotlight = document.getElementById('spotlightLayer');
  if (spotlight) {
    document.addEventListener('mousemove', (e) => {
      // Soft feathering radius (260px as requested)
      const x = e.pageX;
      const y = e.pageY;
      spotlight.style.webkitMaskImage = `radial-gradient(circle 260px at ${x}px ${y}px, black 30%, transparent 100%)`;
      spotlight.style.maskImage = `radial-gradient(circle 260px at ${x}px ${y}px, black 30%, transparent 100%)`;
    });
    document.addEventListener('mouseleave', () => {
       spotlight.style.webkitMaskImage = `radial-gradient(circle 0px at center, black 100%, transparent 100%)`;
       spotlight.style.maskImage = `radial-gradient(circle 0px at center, black 100%, transparent 100%)`;
    });
  }

  // === CANVAS SCROLL SCRUBBING ===
  gsap.registerPlugin(ScrollTrigger);
  const canvas = document.getElementById("scrollVideoCanvas");
  if (canvas) {
    const context = canvas.getContext("2d");
    
    // Set canvas dimensions
    canvas.width = 1280;
    canvas.height = 720;
    
    // We extracted 241 frames using the python script
    const frameCount = 241;
    const currentFrame = index => (
      `assets/frames/frame_${(index + 1).toString().padStart(4, '0')}.jpg`
    );
    
    const images = [];
    const airpods = { frame: 0 };
    
    // Preload all images
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = currentFrame(i);
      images.push(img);
    }
    
    // Draw the first frame when loaded
    images[0].onload = render;
    
    function render() {
      // Draw image filling the canvas (object-fit: cover equivalent in JS)
      const img = images[airpods.frame];
      if (!img) return;
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
    }
    
    // ScrollTrigger to animate the frame index based on scroll position
    gsap.to(airpods, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      scrollTrigger: {
        trigger: ".scroll-canvas-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5, // 0.5 seconds of smoothing (the cinematic lerp effect)
      },
      onUpdate: render // Render canvas on every frame change
    });
  }
  // Intersection Observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.card, .hero-text, .phone, .section h2, .cta').forEach(el => {
    // Add base class if not already there, except for things we want staggered
    if (!el.classList.contains('animate-up')) {
       el.classList.add('animate-up');
       // Set default opacity to 0 in JS so it doesn't blink
       el.style.opacity = '0';
    }
    observer.observe(el);
  });

  const form = document.querySelector('form.waitlist');

  // Cursor Spotlight Reveal Effect
  const heroSection = document.getElementById('waitlist');
  const revealLayer = document.getElementById('reveal-layer');
  
  if (heroSection && revealLayer) {
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHovering = false;
    
    // Smooth lerp for the cursor movement
    function animateMask() {
      if (isHovering) {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        
        // Spotlight size: 260px radius. 
        // We use rgba(0,0,0,1) for the bright spotlight, and rgba(0,0,0, 0.15) for the dim background.
        // This makes the whole image slightly visible, but bright and clear under the cursor.
        const maskStyle = `radial-gradient(circle 260px at ${currentX}px ${currentY}px, rgba(0,0,0,1) 40%, rgba(0,0,0,0.15) 100%)`;
        revealLayer.style.webkitMaskImage = maskStyle;
        revealLayer.style.maskImage = maskStyle;
        
        requestAnimationFrame(animateMask);
      }
    }

    heroSection.addEventListener('mouseenter', (e) => {
      isHovering = true;
      revealLayer.classList.add('is-hovered');
      const rect = heroSection.getBoundingClientRect();
      // Instantly set position on enter to avoid flying in from corner
      currentX = targetX = e.clientX - rect.left;
      currentY = targetY = e.clientY - rect.top;
      animateMask();
    });

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    });

    heroSection.addEventListener('mouseleave', () => {
      isHovering = false;
      revealLayer.classList.remove('is-hovered');
      // Reset the mask so it falls back to the dim base state uniformly
      revealLayer.style.webkitMaskImage = 'none';
      revealLayer.style.maskImage = 'none';
    });
  }
  const input = document.getElementById('contact');
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[type="submit"]');

  document.getElementById('year').textContent = new Date().getFullYear();

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Phone: optional +, then 10-15 digits (spaces, dashes allowed).
  const PHONE = /^\+?[\d\s-]{10,18}$/;

  function isValid(value) {
    const v = value.trim();
    if (EMAIL.test(v)) return true;
    return PHONE.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15;
  }

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.remove('is-success', 'is-error');
    if (type) status.classList.add('is-' + type);
  }

  input.addEventListener('input', () => input.removeAttribute('aria-invalid'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!isValid(input.value)) {
      input.setAttribute('aria-invalid', 'true');
      setStatus('Please enter a valid email or a phone number with at least 10 digits.', 'error');
      input.focus();
      return;
    }

    button.disabled = true;
    setStatus('Adding you to the list...');

    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      form.reset();
      setStatus("You're on the list. We'll reach out when early access opens.", 'success');
    } catch (err) {
      setStatus('Something went wrong. Please try again in a moment.', 'error');
    } finally {
      button.disabled = false;
    }
  });
})();
