/**
 * SalonHub Landing Page — V2
 * GSAP ScrollTrigger + Lenis Smooth Scroll
 */

document.addEventListener('DOMContentLoaded', () => {

  // ================================
  // GSAP PLUGIN REGISTRATION
  // ================================
  gsap.registerPlugin(ScrollTrigger);

  // ================================
  // LENIS SMOOTH SCROLL
  // ================================
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 2,
  });

  // Connect Lenis to GSAP ticker (preferred method)
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Also keep ScrollTrigger in sync
  lenis.on('scroll', ScrollTrigger.update);

  // ================================
  // HEADER SCROLL EFFECT
  // ================================
  const header = document.getElementById('header');

  ScrollTrigger.create({
    start: 'top -60',
    onUpdate: (self) => {
      if (self.scroll() > 60) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    }
  });

  // ================================
  // MOBILE NAVIGATION
  // ================================
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navActions = document.querySelector('.nav-actions');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isActive = navToggle.classList.toggle('active');
      navMenu?.classList.toggle('open', isActive);
      navActions?.classList.toggle('open', isActive);
      document.body.style.overflow = isActive ? 'hidden' : '';
    });

    // Close on nav link click
    navMenu?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('open');
        navActions?.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ================================
  // HERO ENTRANCE ANIMATIONS
  // ================================
  const heroContent = document.querySelector('[data-anim="hero"]');
  const heroImg = document.querySelector('[data-anim="hero-img"]');

  if (heroContent) {
    gsap.fromTo(heroContent,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.15,
      }
    );
  }

  if (heroImg) {
    gsap.fromTo(heroImg,
      { opacity: 0, y: 30, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.4,
      }
    );
  }

  // ================================
  // SCROLL-TRIGGERED FADE ANIMATIONS
  // ================================
  document.querySelectorAll('[data-anim="fade"]').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) * 0.13;

    gsap.fromTo(el,
      { opacity: 0, y: 32 },
      {
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power3.out',
        delay,
      }
    );
  });

  // ================================
  // INTERFACE SLIDER
  // ================================
  const slides = document.querySelectorAll('.interface-slide');
  const dots = document.querySelectorAll('.idot');
  let currentSlide = 0;
  let slideTimer = null;

  function goToSlide(index) {
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    dots[currentSlide]?.classList.remove('active');
    currentSlide = ((index % slides.length) + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide]?.classList.add('active');
  }

  function startSlider() {
    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 4000);
  }

  function resetSlider() {
    clearInterval(slideTimer);
    startSlider();
  }

  if (slides.length > 0) {
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToSlide(parseInt(dot.dataset.i, 10));
        resetSlider();
      });
    });
    startSlider();
  }

  // ================================
  // FAQ ACCORDION
  // ================================
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      if (!item) return;
      const isOpen = item.classList.contains('active');

      // Close all open items
      document.querySelectorAll('.faq-item.active').forEach(i => {
        i.classList.remove('active');
        const ans = i.querySelector('.faq-a');
        if (ans) gsap.to(ans, { height: 0, duration: 0.3, ease: 'power2.inOut', overwrite: true });
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('active');
        const ans = item.querySelector('.faq-a');
        if (ans) {
          // Measure natural height
          gsap.set(ans, { height: 'auto' });
          const fullH = ans.offsetHeight;
          gsap.fromTo(ans,
            { height: 0 },
            { height: fullH, duration: 0.35, ease: 'power2.out', overwrite: true }
          );
        }
      }
    });
  });

  // ================================
  // ANIMATED COUNTERS (stats bar)
  // ================================
  document.querySelectorAll('.testi-stat__num').forEach(el => {
    const text = el.textContent.trim();
    const numMatch = text.match(/[\d.]+/);
    if (!numMatch) return;

    const target = parseFloat(numMatch[0]);
    const prefix = text.slice(0, text.indexOf(numMatch[0]));
    const suffix = text.slice(text.indexOf(numMatch[0]) + numMatch[0].length);
    const isDecimal = numMatch[0].includes('.');
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 1.8,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = prefix + (isDecimal ? counter.val.toFixed(1) : Math.round(counter.val)) + suffix;
          }
        });
      }
    });
  });

  // ================================
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ================================
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80, duration: 1.2 });
      }
    });
  });

  // ================================
  // NEWSLETTER FORM (EmailJS)
  // ================================
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      const email = emailInput?.value;
      if (!email) return;

      if (typeof emailjs !== 'undefined') {
        emailjs.send('default_service', 'template_newsletter', {
          email,
          message: `Nouvelle inscription newsletter: ${email}`,
        }).then(() => {
          if (emailInput) emailInput.value = '';
          const btn = newsletterForm.querySelector('button');
          if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }, 2500);
          }
        }).catch(() => { /* silently fail */ });
      }
    });
  }

  // ================================
  // HERO ORBS — subtle mouse parallax
  // ================================
  const orb1 = document.querySelector('.hero-glow--1');
  const orb2 = document.querySelector('.hero-glow--2');

  if ((orb1 || orb2) && window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      if (orb1) gsap.to(orb1, { x: x * 20, y: y * 14, duration: 2, ease: 'power2.out' });
      if (orb2) gsap.to(orb2, { x: x * -14, y: y * -10, duration: 2, ease: 'power2.out' });
    });
  }

  // ================================
  // SECTOR CARDS — stagger on scroll
  // ================================
  const sectorCards = document.querySelectorAll('.sector-card');
  if (sectorCards.length > 0) {
    gsap.fromTo(sectorCards,
      { opacity: 0, y: 40, scale: 0.96 },
      {
        scrollTrigger: {
          trigger: '.sectors-grid',
          start: 'top 85%',
          once: true,
        },
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.1,
      }
    );
  }

  // ================================
  // PRICING CARDS — stagger on scroll
  // ================================
  const priceCards = document.querySelectorAll('.price-card');
  if (priceCards.length > 0) {
    gsap.fromTo(priceCards,
      { opacity: 0, y: 36 },
      {
        scrollTrigger: {
          trigger: '.pricing-grid',
          start: 'top 85%',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
        stagger: 0.12,
      }
    );
  }

  // ================================
  // FEATURE CARDS — stagger on scroll
  // ================================
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length > 0) {
    gsap.fromTo(featureCards,
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: '.features-grid',
          start: 'top 88%',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.12,
      }
    );
  }

  // ================================
  // STEP CARDS — stagger on scroll
  // ================================
  const stepCards = document.querySelectorAll('.step-card');
  if (stepCards.length > 0) {
    gsap.fromTo(stepCards,
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: '.steps-row',
          start: 'top 88%',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.15,
      }
    );
  }

});
