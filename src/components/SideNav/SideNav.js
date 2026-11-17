(function (Site) {
  function initSideNav() {
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

    // a section is "in view" when it crosses the middle of the screen
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  Object.assign(Site, { initSideNav });
})(window.Site = window.Site || {});
