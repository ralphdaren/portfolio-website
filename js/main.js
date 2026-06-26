document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =========================================================
  // Hero panel switcher
  // =========================================================
  const pills  = [...document.querySelectorAll('[data-hero]')];
  const panels = [...document.querySelectorAll('[data-hero-panel]')];

  function setActivePanel(num) {
    panels.forEach(p => {
      p.classList.toggle('hero-panel--hidden', p.dataset.heroPanel !== num);
    });
    pills.forEach(p => {
      p.classList.toggle('hero-pill--active', p.dataset.hero === num);
    });
    // Re-run reveal in case new panel elements haven't been checked yet
    checkReveal();
  }

  pills.forEach(p => p.addEventListener('click', () => setActivePanel(p.dataset.hero)));

  // =========================================================
  // Scroll reveal
  // =========================================================
  function initRevealElement(el, index) {
    const delay = el.dataset.delay !== undefined
      ? Number(el.dataset.delay)
      : (index % 6) * 55;

    el.style.opacity = '0';
    el.style.transform = 'translateY(28px)';
    el.style.transition = reducedMotion
      ? 'none'
      : `opacity .7s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${delay}ms`;
  }

  function reveal(el) {
    el.setAttribute('data-shown', '1');
    el.style.opacity = '1';
    el.style.transform = 'none';
    // Lock the final state so re-paints never flicker
    setTimeout(() => {
      el.style.transition = 'none';
      el.style.opacity    = '1';
      el.style.transform  = 'none';
    }, 1200);
  }

  function fillBar(el) {
    el.style.width = el.dataset.level;
    el.setAttribute('data-filled', '1');
    setTimeout(() => {
      el.style.transition = 'none';
      el.style.width = el.dataset.level;
    }, 1300);
  }

  // Initialise hidden state for every reveal element
  document.querySelectorAll('[data-reveal]').forEach(initRevealElement);

  function checkReveal() {
    const vh = window.innerHeight || 800;

    document.querySelectorAll('[data-reveal]:not([data-shown])').forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.9) reveal(el);
    });

    document.querySelectorAll('[data-level]:not([data-filled])').forEach(el => {
      if (el.getBoundingClientRect().top < vh * 0.96) fillBar(el);
    });
  }

  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal);
  checkReveal();
  requestAnimationFrame(checkReveal);

  // Safety fallback: force-reveal anything still hidden after 5 s
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not([data-shown])').forEach(reveal);
    document.querySelectorAll('[data-level]:not([data-filled])').forEach(el => {
      el.style.width = el.dataset.level;
    });
  }, 5000);

  // =========================================================
  // Smooth anchor scroll (offset accounts for fixed nav)
  // =========================================================
  document.querySelectorAll('a[data-nav]').forEach(a => {
    a.addEventListener('click', ev => {
      const href = a.getAttribute('href');
      if (!href || href[0] !== '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      ev.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    });
  });

  // =========================================================
  // Project screenshot carousels
  // =========================================================
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track   = carousel.querySelector('.carousel__track');
    const imgs    = carousel.querySelectorAll('.carousel__img');
    const prev    = carousel.querySelector('.carousel__btn--prev');
    const next    = carousel.querySelector('.carousel__btn--next');
    const current = carousel.querySelector('.carousel__current');
    let index = 0;

    function goTo(n) {
      index = (n + imgs.length) % imgs.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      if (current) current.textContent = index + 1;
    }

    prev.addEventListener('click', () => goTo(index - 1));
    next.addEventListener('click', () => goTo(index + 1));
  });
});
