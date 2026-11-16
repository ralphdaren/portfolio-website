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
