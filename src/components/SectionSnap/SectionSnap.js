(function (Site) {
  // CSS scroll snapping (base.css / layout.css) locks touch and keyboard scrolling onto sections, but a mouse
  // wheel only moves ~100px per notch, so CSS alone snaps it back to where it started. This makes one wheel
  // or trackpad gesture move exactly one section in its direction. A section taller than the screen scrolls
  // normally inside and only moves on at its edge.
  const QUIET_MS = 220;  // a gesture has ended once no wheel event arrives for this long
  const MIN_DELTA = 12;  // ignore tiny accidental nudges

  function initSectionSnap() {
    const sections = [...document.querySelectorAll('main > section')];
    if (sections.length < 2) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let busy = false, quietTimer;

    const topOf = s => Math.round(s.getBoundingClientRect().top + scrollY);
    // the section whose area contains the top of the screen
    const current = () => {
      const y = scrollY + 1;
      let found = sections[0];
      for (const s of sections) if (topOf(s) <= y) found = s;
      return found;
    };

    addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // pinch-zoom or sideways
      if (busy) {
        // absorb the rest of this gesture (wheel spin, trackpad momentum) until it goes quiet
        e.preventDefault();
        clearTimeout(quietTimer);
        quietTimer = setTimeout(() => { busy = false; }, QUIET_MS);
        return;
      }
      if (Math.abs(e.deltaY) < MIN_DELTA) return;

      const dir = Math.sign(e.deltaY);
      const sec = current();
      const r = sec.getBoundingClientRect();
      // tall section: let it scroll normally until its edge reaches the screen edge
      if (dir > 0 && r.bottom > innerHeight + 2) return;
      if (dir < 0 && r.top < -2) return;

      const i = sections.indexOf(sec);
      const next = sections[i + dir];
      if (!next) return;

      e.preventDefault();
      busy = true;
      clearTimeout(quietTimer);
      quietTimer = setTimeout(() => { busy = false; }, reduce ? QUIET_MS : 700);
      scrollTo({ top: topOf(next), behavior: reduce ? 'auto' : 'smooth' });
    }, { passive: false });
  }

  Object.assign(Site, { initSectionSnap });
})(window.Site = window.Site || {});
