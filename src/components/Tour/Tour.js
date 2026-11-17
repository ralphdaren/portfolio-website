(function (Site) {
  const { storage } = Site;

  let active = null; // the tour currently playing, so two never overlap

  /**
   * Guided tour: a fake cursor glides to each step's target, optionally clicks it, and shows a chat bubble.
   * Once started it plays to the end: mouse, touch and scrolling don't stop it (the cursor and bubble
   * follow their target when the page scrolls). Esc is the only way out, for keyboard users.
   *
   * @param {{ id: string, steps: { target: string, text: string, click?: boolean }[], who?: string }} options
   * @returns {{ start: () => Promise<void>, stop: () => void }}
   * Fires `tour:start` and `tour:end` on document (the latter also when stopped early), with the tour id as `detail`.
   */
  function createTour({ id, steps, who = 'Ralph' }) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cursor = document.createElement('div');
    cursor.className = 'tour-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 26 26"><path d="M4 3l17 9.5-7.4 1.7-3.6 6.8z" fill="#1E1E1E" stroke="#FDFCF9" stroke-width="1.6" stroke-linejoin="round"/></svg>';

    const bubble = document.createElement('div');
    bubble.className = 'tour-bubble';
    bubble.setAttribute('role', 'status');
    bubble.setAttribute('aria-live', 'polite');
    bubble.innerHTML = '<span class="tour-bubble__who"></span><span class="tour-bubble__dots"><i></i><i></i><i></i></span><span class="tour-bubble__text"></span>';
    bubble.querySelector('.tour-bubble__who').textContent = who;
    document.body.append(cursor, bubble);

    // `run` is a token: each start() bumps it, and pending sleeps reject once it changes
    let run = 0, x = 0, y = 0, target = null;
    const alive = token => token === run;
    const sleep = (ms, token) => new Promise((ok, no) => setTimeout(() => alive(token) ? ok() : no('stopped'), ms));
    const pointOn = el => {
      const r = el.getBoundingClientRect();
      return [r.left + Math.min(r.width * 0.55, 140), r.top + r.height * 0.6];
    };

    function place(nx, ny, ms) {
      cursor.style.transition = `opacity .3s, transform ${reduce ? 0 : ms}ms cubic-bezier(.65,0,.35,1)`;
      cursor.style.transform = `translate(${nx}px, ${ny}px)`;
      x = nx; y = ny;
    }

    // Placed from the finished message, so the bubble grows away from the cursor while typing.
    function positionBubble() {
      const w = bubble.offsetWidth, h = bubble.offsetHeight;
      const flip = x + 22 + w > innerWidth - 12;
      bubble.classList.toggle('flip-x', flip);
      bubble.style.left = flip ? 'auto' : x + 22 + 'px';
      bubble.style.right = flip ? innerWidth - x + 6 + 'px' : 'auto';
      bubble.style.top = Math.min(y + 26, innerHeight - h - 12) + 'px';
    }

    async function showBubble(text, token) {
      const out = bubble.querySelector('.tour-bubble__text');
      bubble.classList.remove('on', 'typing');
      out.textContent = text;
      positionBubble();
      out.textContent = '';
      bubble.classList.add('typing');
      requestAnimationFrame(() => bubble.classList.add('on'));
      if (reduce) { bubble.classList.remove('typing'); out.textContent = text; return; }
      await sleep(650, token);
      bubble.classList.remove('typing');
      for (let i = 1; i <= text.length; i++) {
        out.textContent = text.slice(0, i);
        await sleep(/[ ,.]/.test(text[i - 1]) ? 45 : 24, token);
      }
    }

    function ripple() {
      if (reduce) return;
      const r = document.createElement('span');
      r.className = 'tour-ripple';
      r.style.left = x + 4 + 'px';
      r.style.top = y + 3 + 'px';
      document.body.append(r);
      setTimeout(() => r.remove(), 700);
    }

    // the cursor is position: fixed, so keep it (and the bubble) on the target while the page scrolls
    function follow() {
      if (!run || !target) return;
      const [tx, ty] = pointOn(target);
      place(tx, ty, 0);
      if (bubble.classList.contains('on')) positionBubble();
    }
    const onKey = e => { if (e.key === 'Escape') stop(); };

    async function start() {
      if (active && active !== api) active.stop();
      stop();
      active = api;
      const token = ++run;
      target = null;
      addEventListener('scroll', follow, { passive: true });
      addEventListener('resize', follow, { passive: true });
      addEventListener('keydown', onKey);
      document.dispatchEvent(new CustomEvent('tour:start', { detail: id }));
      place(innerWidth * 0.72, innerHeight * 0.88, 0);
      cursor.classList.add('on');
      try {
        await sleep(350, token);
        for (const step of steps) {
          const el = document.querySelector(step.target);
          if (!el || !el.getClientRects().length) continue; // missing or hidden: skip
          target = el;
          // on small screens the next step is often below the fold: bring it into view first
          const box = el.getBoundingClientRect();
          if (box.top < 0 || box.bottom > innerHeight) {
            el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
            await sleep(reduce ? 50 : 650, token);
          }
          const [tx, ty] = pointOn(el);
          const ms = Math.max(500, Math.min(1100, Math.hypot(tx - x, ty - y) * 1.3));
          bubble.classList.remove('on');
          place(tx, ty, ms);
          await sleep((reduce ? 0 : ms) + 120, token);
          if (step.click) {
            cursor.classList.add('press');
            ripple();
            await sleep(130, token);
            cursor.classList.remove('press');
            el.click();
          }
          await showBubble(step.text, token);
          await sleep(1000 + step.text.length * 16, token);
        }
        await sleep(200, token);
        stop();
      } catch { /* stopped early (Esc, or another tour took over) */ }
    }

    function stop() {
      const wasRunning = run !== 0;
      run = 0;
      target = null;
      if (active === api) active = null;
      cursor.classList.remove('on');
      bubble.classList.remove('on');
      removeEventListener('scroll', follow);
      removeEventListener('resize', follow);
      removeEventListener('keydown', onKey);
      if (wasRunning) document.dispatchEvent(new CustomEvent('tour:end', { detail: id }));
    }

    const api = { start, stop };
    return api;
  }

  /**
   * Wires a section's tour: autoplays once per visitor, and the section's `.tour-btn`
   * reads "Take the tour" / "Replay tour" and replays it. `?tour=reset` in the URL forgets it was seen.
   * @param {{ section: Element, id: string, steps: object[], onEnd?: () => void }} options
   */
  function initSectionTour({ section, id, steps, onEnd }) {
    const key = `tour-seen:${id}`;
    const tour = createTour({ id, steps });
    if (new URLSearchParams(location.search).get('tour') === 'reset') storage.remove(key);
    autoplayOnce(section, tour, key);

    const btn = section.querySelector('.tour-btn');
    if (btn) {
      const setLabel = seen => { btn.querySelector('span').textContent = seen ? 'Replay tour' : 'Take the tour'; };
      setLabel(storage.get(key) === '1');
      btn.addEventListener('click', e => { e.stopPropagation(); tour.start(); });
      document.addEventListener('tour:start', e => e.detail === id && setLabel(true));
    }
    if (onEnd) document.addEventListener('tour:end', e => e.detail === id && onEnd());
    return tour;
  }

  // Plays a tour once per visitor (desktop, phone or tablet), when its section is mostly on screen
  // and scrolling has settled. If another tour is still playing, it waits for that one to finish first.
  function autoplayOnce(section, tour, key) {
    if (storage.get(key) === '1') return;
    // "mostly on screen": 60%, or less when the section is taller than the screen (e.g. stacked on a phone)
    const threshold = Math.min(0.6, (innerHeight / Math.max(section.offsetHeight, 1)) * 0.8);
    let visible = false, timer;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      clearTimeout(timer);
      if (visible) timer = setTimeout(tryStart, 900);
    }, { threshold });
    function tryStart() {
      if (!visible) return;
      if (active) {
        document.addEventListener('tour:end', () => { clearTimeout(timer); timer = setTimeout(tryStart, 600); }, { once: true });
        return;
      }
      io.disconnect();
      storage.set(key, '1');
      tour.start();
    }
    io.observe(section);
  }

  Object.assign(Site, { createTour, initSectionTour, autoplayOnce });
})(window.Site = window.Site || {});
