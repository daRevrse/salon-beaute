document.addEventListener('DOMContentLoaded', () => { lucide.createIcons(); });
/**
 * SalonHub Landing Page — V2.5
 * GSAP ScrollTrigger + Lenis Smooth Scroll
 * Enhanced animations, parallax, crossfade slider
 */

document.addEventListener('DOMContentLoaded', () => {

  // ================================
  // GUARD: Only run if GSAP & Lenis are loaded
  // (sector pages include this script but don't load GSAP/Lenis)
  // ================================
  if (typeof gsap === 'undefined' || typeof Lenis === 'undefined') {
    // Fallback: reveal hidden elements for non-GSAP pages
    document.querySelectorAll('[data-anim]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

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

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);

  const isMobile = window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // HERO ENTRANCE — GSAP TIMELINE
  // ================================
  if (!prefersReducedMotion) {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const heroPill = document.querySelector('.hero-pill');
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-desc');
    const heroCtas = document.querySelector('.hero-ctas');
    const heroTrust = document.querySelector('.hero-trust');
    const heroFloats = document.querySelectorAll('.hero-float');
    const heroContent = document.querySelector('[data-anim="hero"]');
    const heroImg = document.querySelector('[data-anim="hero-img"]');
    const heroCollage = document.querySelector('.hero-collage');
    const heroMetrics = document.querySelector('.hero-metrics');
    const collageMain = document.querySelector('.hero-collage__main');
    const collageSecondary = document.querySelector('.hero-collage__secondary');
    const collageTertiary = document.querySelector('.hero-collage__tertiary');
    const collageFourth = document.querySelector('.hero-collage__fourth');

    // Set initial state
    if (heroContent) gsap.set(heroContent, { opacity: 1, y: 0 });
    if (heroImg) gsap.set(heroImg, { opacity: 1, y: 0, rotateX: 0 });

    if (heroPill) heroTl.from(heroPill, { opacity: 0, y: 24, duration: 0.6 });
    if (heroTitle) heroTl.from(heroTitle, { opacity: 0, y: 36, duration: 0.9 }, '-=0.3');
    if (heroDesc) heroTl.from(heroDesc, { opacity: 0, y: 24, duration: 0.7 }, '-=0.5');
    if (heroCtas) heroTl.from(heroCtas, { opacity: 0, y: 20, duration: 0.6 }, '-=0.4');
    if (heroTrust) heroTl.from(heroTrust, { opacity: 0, y: 16, duration: 0.5 }, '-=0.3');
    if (heroMetrics) heroTl.from(heroMetrics.children, { opacity: 0, y: 16, stagger: 0.1, duration: 0.5 }, '-=0.2');

    // Collage images — staggered entrance
    if (collageMain) {
      heroTl.from(collageMain, {
        opacity: 0, scale: 0.9, y: 40,
        duration: 1, ease: 'power3.out'
      }, '-=0.3');
    }
    if (collageSecondary) {
      heroTl.from(collageSecondary, {
        opacity: 0, scale: 0.85, x: 40, rotate: 8,
        duration: 0.9, ease: 'power3.out'
      }, '-=0.7');
    }
    if (collageTertiary) {
      heroTl.from(collageTertiary, {
        opacity: 0, scale: 0.85, y: 30, rotate: -6,
        duration: 0.9, ease: 'power3.out'
      }, '-=0.6');
    }
    if (collageFourth) {
      heroTl.from(collageFourth, {
        opacity: 0, scale: 0.8, y: 20,
        duration: 0.8, ease: 'power3.out'
      }, '-=0.5');
    }

    if (heroFloats.length > 0 && !isMobile) {
      heroTl.from(heroFloats, {
        opacity: 0, scale: 0.7,
        stagger: 0.15, duration: 0.6,
        ease: 'back.out(1.7)'
      }, '-=0.4');
    }

    // ================================
    // FLOATING CARDS — CONTINUOUS ANIMATION
    // ================================
    if (!isMobile && heroFloats.length > 0) {
      gsap.to('.hero-float--1', {
        y: -10, duration: 2.5, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      gsap.to('.hero-float--2', {
        y: 12, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.5
      });
      gsap.to('.hero-float--3', {
        y: -8, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1
      });
    }

    // ================================
    // HERO COLLAGE PARALLAX ON SCROLL
    // ================================
    if (!isMobile && heroCollage) {
      gsap.to(heroCollage, {
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: 60,
        scale: 0.97,
        opacity: 0.7,
      });
    }
  }

  // ================================
  // SCROLL-TRIGGERED FADE ANIMATIONS
  // ================================
  if (!prefersReducedMotion) {
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
          duration: 0.8,
          ease: 'power3.out',
          delay,
        }
      );
    });
  }

  // ================================
  // INTERFACE SLIDER — GSAP CROSSFADE
  // ================================
  const slides = document.querySelectorAll('.interface-slide');
  const dots = document.querySelectorAll('.idot');
  const captions = document.querySelectorAll('.interface-caption');
  let currentSlide = 0;
  let slideTimer = null;
  let isAnimating = false;

  function goToSlide(index) {
    if (slides.length === 0 || index === currentSlide || isAnimating) return;
    isAnimating = true;

    const oldSlide = slides[currentSlide];
    const newIndex = ((index % slides.length) + slides.length) % slides.length;
    const newSlide = slides[newIndex];

    // Update dots and captions
    dots[currentSlide]?.classList.remove('active');
    dots[newIndex]?.classList.add('active');
    captions[currentSlide]?.classList.remove('active');
    captions[newIndex]?.classList.add('active');

    // Fix layout jump: immediately take old slide out of document flow
    oldSlide.style.position = 'absolute';
    newSlide.style.position = 'relative';
    newSlide.style.visibility = 'visible';

    // Crossfade
    gsap.to(oldSlide, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        oldSlide.classList.remove('active');
        oldSlide.style.visibility = 'hidden';
      }
    });
    gsap.fromTo(newSlide,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          newSlide.classList.add('active');
          currentSlide = newIndex;
          isAnimating = false;
        }
      }
    );
  }

  function startSlider() {
    slideTimer = setInterval(() => goToSlide(currentSlide + 1), 4500);
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
    captions.forEach(cap => {
      cap.addEventListener('click', () => {
        goToSlide(parseInt(cap.dataset.i, 10));
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
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        const ans = i.querySelector('.faq-a');
        if (ans) gsap.to(ans, { height: 0, duration: 0.3, ease: 'power2.inOut', overwrite: true });
      });

      // Open clicked if it was closed
      if (!isOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        const ans = item.querySelector('.faq-a');
        if (ans) {
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
  // ANIMATED COUNTERS
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
          },
          onComplete: () => {
            // Subtle scale bounce on completion
            gsap.fromTo(el, { scale: 1 }, { scale: 1.08, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });
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
  // HERO ORBS — MOUSE PARALLAX
  // ================================
  const orb1 = document.querySelector('.hero-glow--1');
  const orb2 = document.querySelector('.hero-glow--2');

  if ((orb1 || orb2) && !isMobile) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      if (orb1) gsap.to(orb1, { x: x * 24, y: y * 16, duration: 2.5, ease: 'power2.out' });
      if (orb2) gsap.to(orb2, { x: x * -16, y: y * -12, duration: 2.5, ease: 'power2.out' });
    });
  }

  // ================================
  // SECTION REVEAL ANIMATIONS
  // ================================
  if (!prefersReducedMotion) {

    // Bento Cards — stagger slide-up
    const bentoCards = document.querySelectorAll('.bento-card');
    if (bentoCards.length > 0) {
      gsap.fromTo(bentoCards,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: '.bento-grid',
            start: 'top 88%',
            once: true,
          },
          opacity: 1, y: 0, scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
        }
      );
    }

    // Legacy Feature Cards — stagger slide-up (for sector pages)
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
      gsap.fromTo(featureCards,
        { opacity: 0, y: 40, x: -10 },
        {
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 88%',
            once: true,
          },
          opacity: 1, y: 0, x: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
        }
      );
    }

    // Step Cards — stagger
    const stepCards = document.querySelectorAll('.step-card');
    if (stepCards.length > 0) {
      gsap.fromTo(stepCards,
        { opacity: 0, y: 36 },
        {
          scrollTrigger: {
            trigger: '.steps-row',
            start: 'top 88%',
            once: true,
          },
          opacity: 1, y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.18,
        }
      );
    }

    // Sector Cards — stagger with scale
    const sectorCards = document.querySelectorAll('.sector-card');
    if (sectorCards.length > 0) {
      gsap.fromTo(sectorCards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: '.sectors-grid',
            start: 'top 85%',
            once: true,
          },
          opacity: 1, y: 0, scale: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.1,
        }
      );
    }

    // Pricing Cards — stagger with popular emphasis
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
          opacity: 1, y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        }
      );
    }

    // Social Proof Items — stagger
    const proofItems = document.querySelectorAll('.proof-item');
    if (proofItems.length > 0) {
      gsap.fromTo(proofItems,
        { opacity: 0, y: 20, scale: 0.95 },
        {
          scrollTrigger: {
            trigger: '.social-proof__row',
            start: 'top 90%',
            once: true,
          },
          opacity: 1, y: 0, scale: 1,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.1,
        }
      );
    }

    // FAQ Items — stagger slide from right
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
      gsap.fromTo(faqItems,
        { opacity: 0, x: 24 },
        {
          scrollTrigger: {
            trigger: '.faq-list',
            start: 'top 88%',
            once: true,
          },
          opacity: 1, x: 0,
          duration: 0.6,
          ease: 'power3.out',
          stagger: 0.08,
        }
      );
    }
  }

  // ================================
  // TESTIMONIAL SLIDER
  // ================================
  const testiSlides = document.querySelectorAll('.testi-slide');
  const testiDots = document.querySelectorAll('.testi-dot');
  const testiPrev = document.getElementById('testiPrev');
  const testiNext = document.getElementById('testiNext');
  const testiStatEl = document.getElementById('testiStat');
  let currentTesti = 0;
  let testiTimer = null;
  let testiAnimating = false;

  function goToTesti(index) {
    if (testiSlides.length === 0 || index === currentTesti || testiAnimating) return;
    testiAnimating = true;

    const oldSlide = testiSlides[currentTesti];
    const newIndex = ((index % testiSlides.length) + testiSlides.length) % testiSlides.length;
    const newSlide = testiSlides[newIndex];
    const newStat = newSlide.getAttribute('data-stat') || '+45%';

    // Update dots
    testiDots[currentTesti]?.classList.remove('active');
    testiDots[newIndex]?.classList.add('active');

    // Update stat card number
    if (testiStatEl) {
      gsap.to(testiStatEl, {
        opacity: 0, y: -10, duration: 0.2,
        onComplete: () => {
          testiStatEl.textContent = newStat;
          gsap.to(testiStatEl, { opacity: 1, y: 0, duration: 0.3 });
        }
      });
    }

    // Fix layout jump
    oldSlide.style.position = 'absolute';
    newSlide.style.position = 'relative';
    newSlide.style.visibility = 'visible';

    // Crossfade slides
    gsap.to(oldSlide, {
      opacity: 0, duration: 0.35, ease: 'power2.inOut',
      onComplete: () => {
        oldSlide.classList.remove('active');
        oldSlide.style.visibility = 'hidden';
      }
    });
    gsap.fromTo(newSlide, { opacity: 0 }, {
      opacity: 1, duration: 0.35, ease: 'power2.inOut',
      onComplete: () => {
        newSlide.classList.add('active');
        currentTesti = newIndex;
        testiAnimating = false;
      }
    });
  }

  function startTestiTimer() {
    testiTimer = setInterval(() => goToTesti(currentTesti + 1), 6000);
  }
  function resetTestiTimer() {
    clearInterval(testiTimer);
    startTestiTimer();
  }

  if (testiSlides.length > 0) {
    testiPrev?.addEventListener('click', () => { goToTesti(currentTesti - 1); resetTestiTimer(); });
    testiNext?.addEventListener('click', () => { goToTesti(currentTesti + 1); resetTestiTimer(); });
    testiDots.forEach(dot => {
      dot.addEventListener('click', () => {
        goToTesti(parseInt(dot.dataset.i, 10));
        resetTestiTimer();
      });
    });
    startTestiTimer();
  }

  // ================================
  // PRICING TOGGLE (Monthly / Annual) - REMOVED PER USER REQUEST
  // ================================

  // ================================
  // CTA PARTICLES
  // ================================
  const particlesContainer = document.getElementById('ctaParticles');
  if (particlesContainer && !isMobile && !prefersReducedMotion) {
    for (let i = 0; i < 20; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        position:absolute;
        width:${2 + Math.random() * 4}px;
        height:${2 + Math.random() * 4}px;
        background:rgba(255,255,255,${0.05 + Math.random() * 0.1});
        border-radius:50%;
        top:${Math.random() * 100}%;
        left:${Math.random() * 100}%;
      `;
      particlesContainer.appendChild(dot);

      gsap.to(dot, {
        y: -30 - Math.random() * 60,
        x: -20 + Math.random() * 40,
        opacity: 0,
        duration: 3 + Math.random() * 4,
        repeat: -1,
        delay: Math.random() * 3,
        ease: 'none',
      });
    }
  }

  // ================================
  // MAGNETIC BUTTONS
  // ================================
  if (!isMobile && !prefersReducedMotion) {
    const magneticBtns = document.querySelectorAll('.btn, .nav-btn, .testi-arrow');
    magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)', overwrite: 'auto' });
      });
    });
  }

  // ================================
  // IMAGE REVEAL EFFECTS
  // ================================
  if (!prefersReducedMotion) {
    const images = document.querySelectorAll('.sector-card__img, .hero-collage img');
    images.forEach(img => {
      gsap.fromTo(img,
        { scale: 1.15, opacity: 0 },
        {
          scrollTrigger: {
            trigger: img.parentElement,
            start: 'top 90%',
            once: true,
          },
          scale: 1,
          opacity: 1,
          duration: 1.2,
          ease: 'power3.out'
        }
      );
    });
  }

  // ================================
  // NEW SECTION ANIMATIONS
  // ================================
  if (!prefersReducedMotion) {
    // Mobile App section
    const appLayout = document.querySelector('.mobile-app__layout');
    if (appLayout) {
      const appContent = appLayout.querySelector('.mobile-app__content');
      const appVisual = appLayout.querySelector('.mobile-app__visual');
      if (appContent) {
        gsap.fromTo(appContent, { opacity: 0, x: -40 }, {
          scrollTrigger: { trigger: appLayout, start: 'top 85%', once: true },
          opacity: 1, x: 0, duration: 0.8, ease: 'power3.out'
        });
      }
      if (appVisual) {
        gsap.fromTo(appVisual, { opacity: 0, x: 40, scale: 0.95 }, {
          scrollTrigger: { trigger: appLayout, start: 'top 85%', once: true },
          opacity: 1, x: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.15
        });
      }
      // Store badges stagger
      const storeBadges = document.querySelectorAll('.store-badge');
      if (storeBadges.length > 0) {
        gsap.fromTo(storeBadges, { opacity: 0, y: 16 }, {
          scrollTrigger: { trigger: '.mobile-app__stores', start: 'top 90%', once: true },
          opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.12
        });
      }
    }

    // Developer API section
    const apiLayout = document.querySelector('.developer-api__layout');
    if (apiLayout) {
      const apiContent = apiLayout.querySelector('.developer-api__content');
      const apiCode = apiLayout.querySelector('.developer-api__code');
      if (apiContent) {
        gsap.fromTo(apiContent, { opacity: 0, x: -40 }, {
          scrollTrigger: { trigger: apiLayout, start: 'top 85%', once: true },
          opacity: 1, x: 0, duration: 0.8, ease: 'power3.out'
        });
      }
      if (apiCode) {
        gsap.fromTo(apiCode, { opacity: 0, x: 40 }, {
          scrollTrigger: { trigger: apiLayout, start: 'top 85%', once: true },
          opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', delay: 0.15
        });
      }
      // API feature items stagger
      const apiFeatures = document.querySelectorAll('.api-features li');
      if (apiFeatures.length > 0) {
        gsap.fromTo(apiFeatures, { opacity: 0, x: -16 }, {
          scrollTrigger: { trigger: '.api-features', start: 'top 90%', once: true },
          opacity: 1, x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08
        });
      }
    }
  }

  // ================================
  // LANGUAGE SWITCHER (FR/EN)
  // ================================
  const translations = {
    fr: {
      // Nav
      nav_features: 'Fonctionnalités',
      nav_pricing: 'Tarifs',
      nav_api: 'API',
      nav_faq: 'FAQ',
      nav_login: 'Connexion',
      nav_cta: 'Essai gratuit',
      // Hero
      hero_pill: '+500 professionnels nous font confiance',
      hero_title: 'Votre activite,<br><span class="gradient-text">sous controle.</span>',
      hero_desc: 'Rendez-vous, clients, paiements et analyses — la plateforme tout-en-un qui libere votre temps et booste votre chiffre d\'affaires.',
      hero_cta1: 'Demarrer gratuitement',
      hero_cta2: 'Voir la demo',
      hero_trust: 'Plus de <strong>500</strong> professionnels actifs',
      // Features
      feat_tag: 'Fonctionnalites',
      // Interface
      intf_tag: 'Interface',
      intf_title: 'Interface <span class="gradient-text">intuitive</span>',
      intf_desc: 'Un tableau de bord clair et efficace, concu pour vous faire gagner du temps au quotidien.',
      // Pricing
      price_tag: 'Tarifs',
      price_title: 'Tarifs simples et <span class="gradient-text">transparents</span>',
      price_desc: '14 jours d\'essai gratuit. Sans carte bancaire. Sans engagement.',
      // Testimonials
      testi_tag: 'Temoignages',
      testi_title: 'Ils nous font <span class="gradient-text">confiance</span>',
      testi_role1: 'Salon de beaute',
      testi_role2: 'Restaurant',
      testi_role3: 'Cabinet medical',
      // Mobile App
      app_tag: 'Application Mobile',
      app_title: 'Bientot sur <span class="gradient-text">mobile</span>',
      app_desc: 'Gerez votre activite ou que vous soyez. L\'application SalonHub arrive bientot sur iOS et Android.',
      app_store_soon: 'Bientot sur',
      app_notify_btn: 'Me prevenir',
      app_coming: 'Bientot disponible',
      // Developer API
      api_tag: 'Developpeurs',
      api_title: 'API <span class="gradient-text">ouverte</span>',
      api_desc: 'Integrez SalonHub dans vos outils avec notre API RESTful. Documentation complete, webhooks et SDKs disponibles.',
      api_f1: 'Authentification OAuth 2.0',
      api_f2: 'Webhooks en temps reel',
      api_f3: 'Reponses JSON structurees',
      api_f4: 'Documentation interactive',
      api_cta: 'Explorer la documentation',
      // FAQ
      faq_tag: 'FAQ',
      faq_title: 'Une question ?<br><span class="gradient-text">On a la reponse</span>',
      // CTA
      cta_title: 'Pret a transformer<br><span class="gradient-text-white">votre quotidien ?</span>',
      cta_desc: 'Rejoignez les professionnels qui gagnent 5h par semaine avec SalonHub.',
      // Footer
      footer_nav: 'Navigation',
      footer_location: 'Europe',
    },
    en: {
      // Nav
      nav_features: 'Features',
      nav_pricing: 'Pricing',
      nav_api: 'API',
      nav_faq: 'FAQ',
      nav_login: 'Log in',
      nav_cta: 'Free trial',
      // Hero
      hero_pill: '+500 professionals trust us',
      hero_title: 'Your business,<br><span class="gradient-text">under control.</span>',
      hero_desc: 'Appointments, clients, payments and analytics — the all-in-one platform that frees your time and boosts your revenue.',
      hero_cta1: 'Start for free',
      hero_cta2: 'Watch demo',
      hero_trust: 'Over <strong>500</strong> active professionals',
      // Features
      feat_tag: 'Features',
      // Interface
      intf_tag: 'Interface',
      intf_title: 'Intuitive <span class="gradient-text">interface</span>',
      intf_desc: 'A clean and efficient dashboard, designed to save you time every day.',
      // Pricing
      price_tag: 'Pricing',
      price_title: 'Simple and <span class="gradient-text">transparent</span> pricing',
      price_desc: '14-day free trial. No credit card. No commitment.',
      // Testimonials
      testi_tag: 'Testimonials',
      testi_title: 'They <span class="gradient-text">trust</span> us',
      testi_role1: 'Beauty salon',
      testi_role2: 'Restaurant',
      testi_role3: 'Medical office',
      // Mobile App
      app_tag: 'Mobile App',
      app_title: 'Coming soon on <span class="gradient-text">mobile</span>',
      app_desc: 'Manage your business from anywhere. The SalonHub app is coming soon to iOS and Android.',
      app_store_soon: 'Coming soon on',
      app_notify_btn: 'Notify me',
      app_coming: 'Coming soon',
      // Developer API
      api_tag: 'Developers',
      api_title: 'Open <span class="gradient-text">API</span>',
      api_desc: 'Integrate SalonHub into your tools with our RESTful API. Complete documentation, webhooks and SDKs available.',
      api_f1: 'OAuth 2.0 Authentication',
      api_f2: 'Real-time Webhooks',
      api_f3: 'Structured JSON Responses',
      api_f4: 'Interactive Documentation',
      api_cta: 'Explore the docs',
      // FAQ
      faq_tag: 'FAQ',
      faq_title: 'Got a question?<br><span class="gradient-text">We have the answer</span>',
      // CTA
      cta_title: 'Ready to transform<br><span class="gradient-text-white">your daily routine?</span>',
      cta_desc: 'Join the professionals saving 5 hours per week with SalonHub.',
      // Footer
      footer_nav: 'Navigation',
      footer_location: 'Europe',
    }
  };

  // Placeholder translations
  const placeholders = {
    fr: { app_email_placeholder: 'Votre email pour etre notifie' },
    en: { app_email_placeholder: 'Your email to get notified' }
  };

  function setLanguage(lang) {
    const dict = translations[lang];
    const phDict = placeholders[lang];
    if (!dict) return;

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        el.innerHTML = dict[key];
      }
    });

    // Update placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (phDict && phDict[key] !== undefined) {
        el.placeholder = phDict[key];
      }
    });

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update active button state
    document.querySelectorAll('.lang-switch__btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Persist
    try { localStorage.setItem('salonhub_lang', lang); } catch (e) { }

    // Re-init lucide icons in case innerHTML replaced icon placeholders
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Language switcher click handlers
  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-switch__btn');
      if (!btn || btn.classList.contains('active')) return;
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });

    // Restore saved language or detect browser language
    let savedLang = null;
    try { savedLang = localStorage.getItem('salonhub_lang'); } catch (e) { }
    if (savedLang && translations[savedLang]) {
      if (savedLang !== 'fr') setLanguage(savedLang);
    } else {
      const browserLang = (navigator.language || '').substring(0, 2).toLowerCase();
      if (browserLang === 'en') setLanguage('en');
    }
  }

});
