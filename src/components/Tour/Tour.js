import { storage } from '../../utils/storage.js';

const INPUT_EVENTS = ['mousemove', 'wheel', 'touchstart', 'keydown', 'pointerdown'];

/**
 * Guided tour: a fake cursor glides to each step's target, optionally clicks it, and shows a chat bubble.
 * Real visitor input stops it; a tour started with { manual: true } (e.g. from a replay button)
 * ignores mouse movement, since the visitor naturally moves away from the button they clicked.
 *
 * @param {{ id: string, steps: { target: string, text: string, click?: boolean }[], who?: string }} options
 * @returns {{ start: (opts?: { manual?: boolean }) => Promise<void>, stop: () => void }}
 * Fires `tour:start` and `tour:end` on document, with the tour id as `detail`.
 */
export function createTour({ id, steps, who = 'Ralph' }) {
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
  let run = 0, x = 0, y = 0, moved = 0, last = null;
  let listening = INPUT_EVENTS;
  const alive = token => token === run;
  const sleep = (ms, token) => new Promise((ok, no) => setTimeout(() => alive(token) ? ok() : no('stopped'), ms));

  function place(nx, ny, ms) {
    cursor.style.transition = `opacity .3s, transform ${reduce ? 0 : ms}ms cubic-bezier(.65,0,.35,1)`;
    cursor.style.transform = `translate(${nx}px, ${ny}px)`;
    x = nx; y = ny;
  }

  // Positioned from the finished message, so the bubble grows away from the cursor while typing.
  async function showBubble(text, token) {
    const out = bubble.querySelector('.tour-bubble__text');
    bubble.classList.remove('on', 'typing');
    out.textContent = text;
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    const flip = x + 22 + w > innerWidth - 12;
    bubble.classList.toggle('flip-x', flip);
    bubble.style.left = flip ? 'auto' : x + 22 + 'px';
    bubble.style.right = flip ? innerWidth - x + 6 + 'px' : 'auto';
    bubble.style.top = Math.min(y + 26, innerHeight - h - 12) + 'px';
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

  // the tour's own el.click() calls aren't `isTrusted`, so they don't stop it
  function onInput(e) {
    if (!e.isTrusted || !run) return;
    if (e.type === 'mousemove') {
      if (last) moved += Math.hypot(e.clientX - last[0], e.clientY - last[1]);
      last = [e.clientX, e.clientY];
      if (moved < 30) return;
    }
    stop();
  }

  async function start({ manual = false } = {}) {
    stop();
    const token = ++run; moved = 0; last = null;
    listening = manual ? INPUT_EVENTS.filter(t => t !== 'mousemove') : INPUT_EVENTS;
    document.dispatchEvent(new CustomEvent('tour:start', { detail: id }));
    setTimeout(() => alive(token) && listening.forEach(t => addEventListener(t, onInput, { passive: true })), 250);
    place(innerWidth * 0.72, innerHeight * 0.88, 0);
    cursor.classList.add('on');
    try {
      await sleep(350, token);
      for (const step of steps) {
        const el = document.querySelector(step.target);
        if (!el || !el.getClientRects().length) continue; // missing or hidden: skip
        const r = el.getBoundingClientRect();
        const tx = r.left + Math.min(r.width * 0.55, 140), ty = r.top + r.height * 0.6;
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
      document.dispatchEvent(new CustomEvent('tour:end', { detail: id }));
    } catch { /* stopped by the visitor */ }
  }

  function stop() {
    run = 0;
    cursor.classList.remove('on');
    bubble.classList.remove('on');
    listening.forEach(t => removeEventListener(t, onInput));
  }

  return { start, stop };
}

// Plays a tour once per visitor, when its section is mostly on screen and scrolling has settled.
// Skipped on touch devices, where the fake cursor makes no sense.
export function autoplayOnce(section, tour, key) {
  if (storage.get(key) === '1' || matchMedia('(pointer: coarse)').matches) return;
  let timer;
  const io = new IntersectionObserver(([e]) => {
    clearTimeout(timer);
    if (!e.isIntersecting) return;
    timer = setTimeout(() => {
      io.disconnect();
      storage.set(key, '1');
      tour.start();
    }, 900);
  }, { threshold: 0.6 });
  io.observe(section);
}
