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
});
