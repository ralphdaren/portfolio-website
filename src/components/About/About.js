(function (Site) {
  const GITHUB_USER = 'ralphdaren';
  const WEEKS = 53;

  function initAbout() {
    loadContributions();
  }

  // One column per week, Sunday on top: the grid starts on a Sunday 52 weeks back and ends today.
  async function loadContributions() {
    const grid = document.getElementById('contrib-grid');
    const totalEl = document.getElementById('contrib-total');
    if (!grid || !totalEl) return;

    const days = (WEEKS - 1) * 7 + new Date().getDay() + 1;
    // DOM methods instead of innerHTML, since the data comes from a third-party API
    const render = cells => {
      grid.replaceChildren(...cells.map(c => {
        const dot = document.createElement('i');
        dot.dataset.l = String(Math.min(4, Math.max(0, Number(c.level) || 0)));
        dot.title = `${c.date}: ${c.count}`;
        return dot;
      }));
    };

    try {
      const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`);
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

  Object.assign(Site, { initAbout });
})(window.Site = window.Site || {});
