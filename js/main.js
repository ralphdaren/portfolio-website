document.addEventListener('DOMContentLoaded', () => {
  // ---- Hero: stagger the word/picture entrance
  document.querySelectorAll('.hero__headline .w, .hero__headline .pic')
    .forEach((el, i) => { el.style.animationDelay = `${300 + i * 60}ms`; });

  // ---- Side nav: highlight the section currently in view
  const links = [...document.querySelectorAll('.sidenav a')];
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function setActive(id) {
    links.forEach(a => {
      if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  // A section counts as "in view" when it crosses the middle of the screen
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-50% 0px -50% 0px' });

  sections.forEach(s => observer.observe(s));

  // ---- About: GitHub contributions for the last year, drawn as dots
  loadContributions();

  // ---- Projects
  initProjects();

  // ---- Stack
  initStack();
});

// Public contributions API (no token needed). One column per week, Sunday on
// top, so the grid starts on a Sunday 52 weeks back and the last column ends today.
async function loadContributions() {
  const grid = document.getElementById('contrib-grid');
  const totalEl = document.getElementById('contrib-total');
  if (!grid || !totalEl) return;

  const WEEKS = 53;
  const days = (WEEKS - 1) * 7 + new Date().getDay() + 1;
  // build with DOM methods (not innerHTML) since the data comes from a third-party API
  const render = cells => {
    grid.replaceChildren(...cells.map(c => {
      const dot = document.createElement('i');
      dot.dataset.l = String(Math.min(4, Math.max(0, Number(c.level) || 0)));
      dot.title = `${c.date}: ${c.count}`;
      return dot;
    }));
  };

  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/ralphdaren?y=last');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { contributions } = await res.json();
    const today = new Date().toISOString().slice(0, 10);
    const recent = contributions.filter(c => c.date <= today).slice(-days);
    render(recent);
    totalEl.textContent = recent.reduce((sum, c) => sum + c.count, 0);
  } catch {
    // API down or offline: keep the layout with a faded, labelled sample
    render(Array.from({ length: days }, (_, i) => ({ level: (i * 7 + i % 5) % 5, date: 'sample', count: 0 })));
    grid.classList.add('is-sample');
    totalEl.textContent = 'Sample:';
  }
}

// ---- Stack: category tabs. Clicking one opens its hint underneath and shows its tools.
function initStack() {
  const tabs = [...document.querySelectorAll('#stack [role="tab"]')];
  if (!tabs.length) return;

  function select(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    // Arrow keys move between categories (standard tab pattern)
    tab.addEventListener('keydown', e => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1
        : step ? (i + step + tabs.length) % tabs.length : null;
      if (to === null) return;
      e.preventDefault();
      tabs[to].focus();
      select(tabs[to]);
    });
  });
}

// ---- Projects: project list, the visitors/underneath flip, and the guided tour
function initProjects() {
  // Projects: pick a project, then flip between what visitors see and what runs underneath
  const work = document.querySelector('.work');
  if (!work) return;
  const frame = work.querySelector('.frame');
  const tabs = work.querySelectorAll('[role="tab"]');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    frame.querySelectorAll('[data-p]').forEach(el => el.toggleAttribute('hidden', el.dataset.p !== t.dataset.p));
    work.querySelector('.viewer__url').textContent = t.dataset.url;
    // links follow the selected project; "Visit site" hides when there's no live URL yet
    const live = work.querySelector('.plink--live'), code = work.querySelector('.plink--code');
    live.hidden = !t.dataset.live; if (t.dataset.live) live.href = t.dataset.live;
    code.hidden = !t.dataset.code; if (t.dataset.code) code.href = t.dataset.code;
  }));
  const flips = work.querySelectorAll('.flip button');
  flips.forEach(b => b.addEventListener('click', () => {
    frame.dataset.side = b.dataset.side;
    flips.forEach(x => x.setAttribute('aria-pressed', x === b));
  }));

  // Projects tour
  const projectsTour = createTour({
    id: 'projects',
    steps: [
      { target: '#projects .plist button:nth-of-type(2)', text: 'Pick any project from this list.' },
      { target: '#projects .flip button[data-side="front"]', text: 'Click here to see how the website looks.', click: true },
      { target: '#projects .flip button[data-side="back"]', text: 'Click here to see how it was built and how it runs.', click: true },
      { target: '#projects .plink--live', text: 'Click here to visit the live version of the website.' },
      { target: '#projects .plink--code', text: 'Click here to read the code behind it.' },
    ],
  });
  const TOUR_KEY = 'tour-seen:projects';
  if (new URLSearchParams(location.search).get('tour') === 'reset') { try { localStorage.removeItem(TOUR_KEY); } catch (_) {} }
  autoplayOnce(document.querySelector('#projects'), projectsTour, TOUR_KEY);
  const tourBtn = document.querySelector('#projects .tour-btn');
  let tourSeen = false; try { tourSeen = localStorage.getItem(TOUR_KEY) === '1'; } catch (_) {}
  const setTourLabel = done => tourBtn.querySelector('span').textContent = done ? 'Replay tour' : 'Take the tour';
  setTourLabel(tourSeen);
  tourBtn.addEventListener('click', e => { e.stopPropagation(); projectsTour.start({ manual: true }); });
  document.addEventListener('tour:start', e => e.detail === 'projects' && setTourLabel(true));
  // after the tour, put the frame back on the screenshot
  document.addEventListener('tour:end', e => e.detail === 'projects' && document.querySelector('#projects .flip button[data-side="front"]').click());
}

// ---- Guided tour
// createTour({ id, steps }) -> { start, stop }. Each step: { target: selector, text, click?: true }.
// A fake cursor glides to each target, optionally clicks it, and shows a bubble. Any real
// input from the visitor (mouse movement, scroll, click, key, touch) stops it right away,
// except mouse movement when the tour was started on purpose (start({ manual: true })).
function createTour({ id, steps, who = 'Ralph' }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cursor = document.createElement('div');
  cursor.className = 'tour-cursor'; cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML = '<svg viewBox="0 0 26 26"><path d="M4 3l17 9.5-7.4 1.7-3.6 6.8z" fill="#1E1E1E" stroke="#FDFCF9" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const bubble = document.createElement('div');
  bubble.className = 'tour-bubble'; bubble.setAttribute('role', 'status'); bubble.setAttribute('aria-live', 'polite');
  bubble.innerHTML = `<span class="tour-bubble__who"></span><span class="tour-bubble__dots"><i></i><i></i><i></i></span><span class="tour-bubble__text"></span>`;
  bubble.querySelector('.tour-bubble__who').textContent = who;
  document.body.append(cursor, bubble);

  let run = 0, x = 0, y = 0, moved = 0, last = null;
  const alive = token => token === run;
  const sleep = (ms, token) => new Promise((ok, no) => setTimeout(() => alive(token) ? ok() : no('stopped'), ms));

  function place(nx, ny, ms) {
    cursor.style.transition = `opacity .3s, transform ${reduce ? 0 : ms}ms cubic-bezier(.65,0,.35,1)`;
    cursor.style.transform = `translate(${nx}px, ${ny}px)`;
    x = nx; y = ny;
  }
  // Pops the bubble in, shows typing dots, then types the message out.
  // Position is worked out from the finished message, so the bubble grows away from the cursor.
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
    r.className = 'tour-ripple'; r.style.left = x + 4 + 'px'; r.style.top = y + 3 + 'px';
    document.body.append(r); setTimeout(() => r.remove(), 700);
  }

  // stop on real visitor input (synthetic clicks from the tour are not "trusted")
  function onInput(e) {
    if (!e.isTrusted || !run) return;
    if (e.type === 'mousemove') {
      if (last) moved += Math.hypot(e.clientX - last[0], e.clientY - last[1]);
      last = [e.clientX, e.clientY];
      if (moved < 30) return;
    }
    stop();
  }
  const events = ['mousemove', 'wheel', 'touchstart', 'keydown', 'pointerdown'];
  let listening = events;

  // start({ manual: true }) is for tours the visitor asked for (e.g. a replay button): they
  // will naturally move the mouse away from the button, so only scroll/click/key/touch stop it.
  async function start({ manual = false } = {}) {
    stop();
    const token = ++run; moved = 0; last = null;
    listening = manual ? events.filter(t => t !== 'mousemove') : events;
    document.dispatchEvent(new CustomEvent('tour:start', { detail: id }));
    setTimeout(() => alive(token) && listening.forEach(t => addEventListener(t, onInput, { passive: true })), 250);
    place(innerWidth * 0.72, innerHeight * 0.88, 0);
    cursor.classList.add('on');
    try {
      await sleep(350, token);
      for (const step of steps) {
        const el = document.querySelector(step.target);
        if (!el || !el.getClientRects().length) continue; // missing or hidden: skip this stop
        const r = el.getBoundingClientRect();
        const tx = r.left + Math.min(r.width * 0.55, 140), ty = r.top + r.height * 0.6;
        const ms = Math.max(500, Math.min(1100, Math.hypot(tx - x, ty - y) * 1.3));
        bubble.classList.remove('on');
        place(tx, ty, ms);
        await sleep((reduce ? 0 : ms) + 120, token);
        if (step.click) {
          cursor.classList.add('press'); ripple();
          await sleep(130, token);
          cursor.classList.remove('press'); el.click();
        }
        await showBubble(step.text, token);
        await sleep(1000 + step.text.length * 16, token);
      }
      await sleep(200, token);
      stop();
      document.dispatchEvent(new CustomEvent('tour:end', { detail: id }));
    } catch (_) { /* stopped by the visitor */ }
  }
  function stop() {
    run = 0;
    cursor.classList.remove('on'); bubble.classList.remove('on');
    listening.forEach(t => removeEventListener(t, onInput));
  }
  return { start, stop };
}

// Plays a tour once, the first time its section is mostly on screen and scrolling has settled.
function autoplayOnce(section, tour, key) {
  let seen = false;
  try { seen = localStorage.getItem(key) === '1'; } catch (_) {}
  if (seen || matchMedia('(pointer: coarse)').matches) return;
  let timer;
  const io = new IntersectionObserver(([e]) => {
    clearTimeout(timer);
    if (!e.isIntersecting) return;
    timer = setTimeout(() => {
      io.disconnect();
      try { localStorage.setItem(key, '1'); } catch (_) {}
      tour.start();
    }, 900);
  }, { threshold: 0.6 });
  io.observe(section);
}
