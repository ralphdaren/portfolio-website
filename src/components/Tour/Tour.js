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
   * Wires a section's tour. It never autoplays: the section's `.tour-btn` starts it. The first time a visitor
   * reaches the section, a spotlight dims the page and highlights that button with a Skip option (once per section).
   * The button reads "Take the tour" until the tour has been taken, then "Replay tour".
   * `?tour=reset` in the URL forgets both.
   * @param {{ section: Element, id: string, steps: object[], onEnd?: () => void }} options
   */
  function initSectionTour({ section, id, steps, onEnd }) {
    // the tour was taken from its button (named 'taken', not 'seen', so flags left by the old autoplay don't count)
    const seenKey = `tour-taken:${id}`;
    const introKey = `tour-intro:${id}`; // the spotlight was shown
    const tour = createTour({ id, steps });
    if (new URLSearchParams(location.search).get('tour') === 'reset') { storage.remove(seenKey); storage.remove(introKey); }

    const btn = section.querySelector('.tour-btn');
    if (btn) {
      const setLabel = seen => { btn.querySelector('span').textContent = seen ? 'Replay tour' : 'Take the tour'; };
      setLabel(storage.get(seenKey) === '1');
      btn.addEventListener('click', e => { e.stopPropagation(); closeSpotlight(); tour.start(); });
      document.addEventListener('tour:start', e => {
        if (e.detail !== id) return;
        storage.set(seenKey, '1');
        setLabel(true);
      });
      if (storage.get(seenKey) !== '1' && storage.get(introKey) !== '1') spotlightOnce(section, btn, introKey);
    }
    if (onEnd) document.addEventListener('tour:end', e => e.detail === id && onEnd());
    return tour;
  }

  let spot = null; // the spotlight currently showing
  const closeSpotlight = () => spot && spot.close();

  // Shows the spotlight once, when the section is mostly on screen and scrolling has settled.
  // Waits for its next visit if a tour or another spotlight is showing at that moment.
  function spotlightOnce(section, btn, introKey) {
    // "mostly on screen": 60%, or less when the section is taller than the screen (e.g. stacked on a phone)
    const threshold = Math.min(0.6, (innerHeight / Math.max(section.offsetHeight, 1)) * 0.8);
    let timer;
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (!e.isIntersecting) return;
      timer = setTimeout(() => {
        if (active || spot) return;
        io.disconnect();
        storage.set(introKey, '1');
        openSpotlight(btn);
      }, 700);
    }, { threshold });
    io.observe(section);
  }

  // Dims the page and lifts the tour button above it, with a small card offering Skip.
  // Never blocks scrolling; Skip, Esc, a click on the dimmed area, or scrolling the button away all close it.
  function openSpotlight(btn) {
    const dim = document.createElement('div');
    dim.className = 'tour-dim';
    const card = document.createElement('div');
    card.className = 'tour-callout';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Section tour');
    card.innerHTML = '<p>New here? Take a quick tour of this section.</p><button type="button" class="tour-callout__skip">Skip</button>';
    document.body.append(dim, card);
    btn.classList.add('is-spotlit');

    const place = () => {
      const r = btn.getBoundingClientRect();
      const w = card.offsetWidth;
      card.style.top = `${r.bottom + 12}px`;
      card.style.left = `${Math.max(12, Math.min(r.right - w, innerWidth - w - 12))}px`;
    };
    place();
    requestAnimationFrame(() => { dim.classList.add('on'); card.classList.add('on'); });
    btn.focus({ preventScroll: true });

    const away = new IntersectionObserver(([e]) => { if (!e.isIntersecting) close(); });
    away.observe(btn);
    const onKey = e => { if (e.key === 'Escape') close(); };
    addEventListener('scroll', place, { passive: true });
    addEventListener('resize', place, { passive: true });
    addEventListener('keydown', onKey);
    dim.addEventListener('click', close);
    card.querySelector('button').addEventListener('click', close);

    function close() {
      if (spot !== self) return;
      spot = null;
      away.disconnect();
      removeEventListener('scroll', place);
      removeEventListener('resize', place);
      removeEventListener('keydown', onKey);
      btn.classList.remove('is-spotlit');
      dim.classList.remove('on');
      card.classList.remove('on');
      setTimeout(() => { dim.remove(); card.remove(); }, 300);
    }
    const self = { close };
    spot = self;
  }

  Object.assign(Site, { createTour, initSectionTour });
})(window.Site = window.Site || {});
